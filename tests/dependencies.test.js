import React from 'react';
import { mount } from 'enzyme';
import Form, { Field } from '../src';
import timeout from './common/timeout';
import InfoField, { Input } from './common/InfoField';
import { changeValue, matchError, getField } from './common';

describe('Form.Dependencies', () => {
  it('touched', async () => {
    let form = null;

    const wrapper = mount(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
        >
          <InfoField name="field_1" />
          <InfoField name="field_2" rules={[{ required: true }]} dependencies={['field_1']} />
        </Form>
      </div>,
    );

    // Not trigger if not touched
    await changeValue(getField(wrapper, 0), '');
    matchError(getField(wrapper, 1), false);

    // Trigger if touched
    form.setFields([{ name: 'field_2', touched: true }]);
    await changeValue(getField(wrapper, 0), '');
    matchError(getField(wrapper, 1), true);
  });

  it('nest dependencies', async () => {
    let form = null;
    let rendered = false;

    const wrapper = mount(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
        >
          <Field name="field_1">
            <Input />
          </Field>
          <Field name="field_2" dependencies={['field_1']}>
            <Input />
          </Field>
          <Field name="field_3" dependencies={['field_2']}>
            {control => {
              rendered = true;
              return <Input {...control} />;
            }}
          </Field>
        </Form>
      </div>,
    );

    form.setFields([
      { name: 'field_1', touched: true },
      { name: 'field_2', touched: true },
      { name: 'field_3', touched: true },
    ]);

    rendered = false;
    await changeValue(getField(wrapper), '1');

    expect(rendered).toBeTruthy();
  });

  it('should work when field is dirty', async () => {
    let pass = false;

    const wrapper = mount(
      <Form>
        <InfoField
          name="field_1"
          rules={[
            {
              validator: () => {
                if (pass) {
                  return Promise.resolve();
                }
                return Promise.reject('You should not pass');
              },
            },
          ]}
          dependencies={['field_2']}
        />

        <InfoField name="field_2" />

        <Field shouldUpdate>
          {(_, __, { resetFields }) => (
            <button
              type="button"
              onClick={() => {
                resetFields();
              }}
            />
          )}
        </Field>
      </Form>,
    );

    wrapper.find('form').simulate('submit');
    await timeout();
    wrapper.update();
    matchError(getField(wrapper, 0), 'You should not pass');

    // Mock new validate
    pass = true;
    await changeValue(getField(wrapper, 1), 'bamboo');
    matchError(getField(wrapper, 0), false);

    // Should not validate after reset
    pass = false;
    wrapper.find('button').simulate('click');
    await changeValue(getField(wrapper, 1), 'light');
    matchError(getField(wrapper, 0), false);
  });

  it('should work as a shortcut when name is not provided', async () => {
    const spy = jest.fn();
    const wrapper = mount(
      <Form>
        <Field dependencies={['field_1']}>
          {() => {
            spy();
            return 'gogogo';
          }}
        </Field>
        <Field name="field_1">
          <Input />
        </Field>
        <Field name="field_2">
          <Input />
        </Field>
      </Form>,
    );
    expect(spy).toHaveBeenCalledTimes(1);
    await changeValue(getField(wrapper, 2), 'value2');
    // sync start
    //   valueUpdate -> not rerender
    //   depsUpdate  -> not rerender
    // sync end
    // async start
    //   validateFinish -> not rerender
    // async end
    expect(spy).toHaveBeenCalledTimes(1);
    await changeValue(getField(wrapper, 1), 'value1');
    // sync start
    //   valueUpdate -> not rerender
    //   depsUpdate  -> rerender by deps
    //   [ react rerender once -> 2 ]
    // sync end
    // async start
    //   validateFinish -> not rerender
    // async end
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("shouldn't work when shouldUpdate is set", async () => {
    const spy = jest.fn();
    const wrapper = mount(
      <Form>
        <Field dependencies={['field_1']} shouldUpdate={() => true}>
          {() => {
            spy();
            return 'gogogo';
          }}
        </Field>
        <Field name="field_1">
          <Input />
        </Field>
        <Field name="field_2">
          <Input />
        </Field>
      </Form>,
    );
    expect(spy).toHaveBeenCalledTimes(1);
    await changeValue(getField(wrapper, 2), 'value2');
    // sync start
    //   valueUpdate -> rerender by shouldUpdate
    //   depsUpdate  -> rerender by deps
    //   [ react rerender once -> 2 ]
    // sync end
    // async start
    //   validateFinish -> rerender by shouldUpdate
    //   [ react rerender once -> 3 ]
    // async end
    expect(spy).toHaveBeenCalledTimes(3);
    await changeValue(getField(wrapper, 1), 'value1');
    // sync start
    //   valueUpdate -> rerender by shouldUpdate
    //   depsUpdate  -> rerender by deps
    //   [ react rerender once -> 4 ]
    // sync end
    // async start
    //   validateFinish -> rerender by shouldUpdate
    //   [ react rerender once -> 5 ]
    // async end
    expect(spy).toHaveBeenCalledTimes(5);
  });
});

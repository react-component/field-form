import React from 'react';
import type { FormInstance } from '../src';
import Form, { Field } from '../src';
import timeout from './common/timeout';
import InfoField, { Input } from './common/InfoField';
import { changeValue, matchError, getInput } from './common';
import { fireEvent, render } from '@testing-library/react';

describe('Form.Dependencies', () => {
  it('touched', async () => {
    const form = React.createRef<FormInstance>();

    const { container } = render(
      <div>
        <Form ref={form}>
          <InfoField name="field_1" />
          <InfoField name="field_2" rules={[{ required: true }]} dependencies={['field_1']} />
        </Form>
      </div>,
    );

    // Not trigger if not touched
    await changeValue(getInput(container, 0), ['bamboo', '']);
    matchError(getInput(container, 1, true), false);

    // Trigger if touched
    form.current?.setFields([{ name: 'field_2', touched: true }]);
    await changeValue(getInput(container, 0), ['bamboo', '']);
    matchError(getInput(container, 1, true), true);
  });

  describe('initialValue', () => {
    function test(name: string, formProps = {}, fieldProps = {}) {
      it(name, async () => {
        let validated = false;

        const { container } = render(
          <div>
            <Form {...formProps}>
              <InfoField name="field_1" />
              <InfoField
                name="field_2"
                rules={[
                  {
                    validator: async () => {
                      validated = true;
                    },
                  },
                ]}
                dependencies={['field_1']}
                {...fieldProps}
              />
            </Form>
          </div>,
        );

        // Not trigger if not touched
        await changeValue(getInput(container, 0), 'bamboo');
        expect(validated).toBeTruthy();
      });
    }

    test('form level', { initialValues: { field_2: 'bamboo' } });
    test('field level', null, { initialValue: 'little' });
  });

  it('nest dependencies', async () => {
    const form = React.createRef<FormInstance>();
    let rendered = false;

    const { container } = render(
      <div>
        <Form ref={form}>
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

    form.current?.setFields([
      { name: 'field_1', touched: true },
      { name: 'field_2', touched: true },
      { name: 'field_3', touched: true },
    ]);

    rendered = false;
    await changeValue(getInput(container), '1');

    expect(rendered).toBeTruthy();
  });

  it('should work when field is dirty', async () => {
    let pass = false;

    const { container } = render(
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

    fireEvent.submit(container.querySelector('form')!);
    await timeout();
    // wrapper.update();
    matchError(getInput(container, 0, true), 'You should not pass');

    // Mock new validate
    pass = true;
    await changeValue(getInput(container, 1), 'bamboo');
    matchError(getInput(container, 0, true), false);

    // Should not validate after reset
    pass = false;
    fireEvent.click(container.querySelector('button')!);
    await changeValue(getInput(container, 1), 'light');
    matchError(getInput(container, 0, true), false);
  });

  it('should work as a shortcut when name is not provided', async () => {
    const spy = jest.fn();
    const { container } = render(
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
    await changeValue(getInput(container, 1), 'value2');
    // sync start
    //   valueUpdate -> not rerender
    //   depsUpdate  -> not rerender
    // sync end
    // async start
    //   validateFinish -> not rerender
    // async end
    expect(spy).toHaveBeenCalledTimes(1);
    await changeValue(getInput(container, 0), 'value1');
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
    const { container } = render(
      <Form>
        <Field dependencies={['field_2']} shouldUpdate={() => true}>
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
    await changeValue(getInput(container, 0), 'value1');
    // sync start
    //   valueUpdate -> rerender by shouldUpdate
    //   depsUpdate  -> rerender by deps
    //   [ react rerender once -> 2 ]
    // sync end
    expect(spy).toHaveBeenCalledTimes(2);

    await changeValue(getInput(container, 1), 'value2');
    // sync start
    //   valueUpdate -> rerender by shouldUpdate
    //   depsUpdate  -> rerender by deps
    //   [ react rerender once -> 3 ]
    // sync end
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('shouldUpdate false should not update', () => {
    let counter = 0;
    const formRef = React.createRef<FormInstance>();

    const renderDemo = (showField: boolean) => (
      <Form ref={formRef}>
        {showField && (
          <Field name="little" preserve={false} initialValue="bamboo">
            <Input />
          </Field>
        )}
        <Field shouldUpdate={() => false}>
          {() => {
            counter += 1;
            return null;
          }}
        </Field>
      </Form>
    );

    const { container, rerender } = render(renderDemo(true));
    expect(counter).toEqual(1);
    expect(container.querySelector('input')).toHaveValue('bamboo');

    // hide should not re-render
    rerender(renderDemo(false));
    expect(counter).toEqual(1);
  });
});

/* eslint-disable no-template-curly-in-string, arrow-body-style */
import React from 'react';
import { mount } from 'enzyme';
import Form, { FormInstance } from '../src';
import InfoField from './common/InfoField';
import timeout from './common/timeout';

describe('Form.Preserve', () => {
  const Demo = ({
    removeField,
    formPreserve,
    fieldPreserve,
    onFinish,
  }: {
    removeField: boolean;
    formPreserve?: boolean;
    fieldPreserve?: boolean;
    onFinish: (values: object) => void;
  }) => (
    <Form onFinish={onFinish} initialValues={{ keep: 233, remove: 666 }} preserve={formPreserve}>
      <InfoField name="keep" />
      {!removeField && <InfoField name="remove" preserve={fieldPreserve} />}
    </Form>
  );

  it('field', async () => {
    const onFinish = jest.fn();
    const wrapper = mount(<Demo removeField={false} onFinish={onFinish} fieldPreserve={false} />);

    async function matchTest(removeField: boolean, match: object) {
      onFinish.mockReset();
      wrapper.setProps({ removeField });
      wrapper.find('form').simulate('submit');
      await timeout();
      expect(onFinish).toHaveBeenCalledWith(match);
    }

    await matchTest(false, { keep: 233, remove: 666 });
    await matchTest(true, { keep: 233 });
    await matchTest(false, { keep: 233 });
  });

  it('form', async () => {
    const onFinish = jest.fn();
    const wrapper = mount(<Demo removeField={false} onFinish={onFinish} formPreserve={false} />);

    async function matchTest(removeField: boolean, match: object) {
      onFinish.mockReset();
      wrapper.setProps({ removeField });
      wrapper.find('form').simulate('submit');
      await timeout();
      expect(onFinish).toHaveBeenCalledWith(match);
    }

    await matchTest(false, { keep: 233, remove: 666 });
    await matchTest(true, { keep: 233 });
    await matchTest(false, { keep: 233 });
  });

  it('form perishable but field !perishable', async () => {
    const onFinish = jest.fn();
    const wrapper = mount(
      <Demo removeField={false} onFinish={onFinish} formPreserve={false} fieldPreserve />,
    );

    async function matchTest(removeField: boolean, match: object) {
      onFinish.mockReset();
      wrapper.setProps({ removeField });
      wrapper.find('form').simulate('submit');
      await timeout();
      expect(onFinish).toHaveBeenCalledWith(match);
    }

    await matchTest(true, { keep: 233 });
    await matchTest(false, { keep: 233, remove: 666 });
  });

  it('form perishable should not crash Form.List', async () => {
    let form: FormInstance;

    const wrapper = mount(
      <Form
        initialValues={{ list: ['light', 'bamboo', 'little'] }}
        preserve={false}
        ref={instance => {
          form = instance;
        }}
      >
        <Form.List name="list">
          {(fields, { remove }) => {
            return (
              <div>
                {fields.map(field => (
                  <Form.Field {...field}>
                    <input />
                  </Form.Field>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    remove(0);
                  }}
                />
              </div>
            );
          }}
        </Form.List>
      </Form>,
    );

    wrapper.find('button').simulate('click');
    wrapper.update();

    expect(form.getFieldsValue()).toEqual({ list: ['bamboo', 'little'] });
  });

  it('warning when Form.List use preserve', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mount(
      <Form initialValues={{ list: ['bamboo'] }}>
        <Form.List name="list">
          {fields =>
            fields.map(field => (
              <Form.Field {...field} preserve={false}>
                <input />
              </Form.Field>
            ))
          }
        </Form.List>
      </Form>,
    );

    expect(errorSpy).toHaveBeenCalledWith(
      'Warning: `preserve` should not apply on Form.List fields.',
    );

    errorSpy.mockRestore();
  });

  it('nest render props should not clean full store', () => {
    let form: FormInstance;

    const wrapper = mount(
      <Form
        preserve={false}
        ref={instance => {
          form = instance;
        }}
      >
        <Form.Field name="light">
          <input />
        </Form.Field>
        <Form.Field shouldUpdate>
          {(_, __, { getFieldValue }) =>
            getFieldValue('light') === 'bamboo' ? <Form.Field>{() => null}</Form.Field> : null
          }
        </Form.Field>
      </Form>,
    );

    wrapper.find('input').simulate('change', { target: { value: 'bamboo' } });
    expect(form.getFieldsValue()).toEqual({ light: 'bamboo' });

    wrapper.find('input').simulate('change', { target: { value: 'little' } });
    expect(form.getFieldsValue()).toEqual({ light: 'little' });

    wrapper.unmount();
  });
});
/* eslint-enable no-template-curly-in-string */

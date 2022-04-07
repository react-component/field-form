import React from 'react';
import { mount } from 'enzyme';
import type { FormInstance } from '../src';
import Form, { Field } from '../src';
import timeout from './common/timeout';

describe('useWatch', () => {
  let staticForm: FormInstance<any> = null;
  it('field initialValue', async () => {
    const Demo = () => {
      const [form] = Form.useForm();
      const values = Form.useWatch({ form, dependencies: ['name'] });

      return (
        <div>
          <Form form={form}>
            <Field name="name" initialValue="bamboo" />
          </Form>
          <div className="values">{JSON.stringify(values)}</div>
        </div>
      );
    };
    const wrapper = mount(<Demo />);
    await timeout();
    expect(wrapper.find('.values').at(0).getDOMNode().innerHTML).toBe(
      JSON.stringify({ name: 'bamboo' }),
    );
  });
  it('form initialValue', async () => {
    const Demo = () => {
      const [form] = Form.useForm();
      const values = Form.useWatch({ form, dependencies: ['name'] });

      return (
        <div>
          <Form form={form} initialValues={{ name: 'bamboo', other: 'other' }}>
            <Field name="name" />
          </Form>
          <div className="values">{JSON.stringify(values)}</div>
        </div>
      );
    };
    const wrapper = mount(<Demo />);
    await timeout();
    expect(wrapper.find('.values').at(0).getDOMNode().innerHTML).toBe(
      JSON.stringify({ name: 'bamboo' }),
    );
  });
  it('change name', async () => {
    const Demo = () => {
      const [form] = Form.useForm();
      const values = Form.useWatch({ form, dependencies: ['name'] });

      return (
        <div>
          <Form
            form={form}
            ref={instance => {
              staticForm = instance;
            }}
          >
            <Field name="name" />
          </Form>
          <div className="values">{JSON.stringify(values)}</div>
        </div>
      );
    };
    const wrapper = mount(<Demo />);
    await timeout();
    staticForm.setFields([{ name: 'name', value: 'setFields' }]);
    expect(wrapper.find('.values').at(0).getDOMNode().innerHTML).toBe(
      JSON.stringify({ name: 'setFields' }),
    );
    staticForm.setFieldsValue({ name: 'setFieldsValue' });
    expect(wrapper.find('.values').at(0).getDOMNode().innerHTML).toBe(
      JSON.stringify({ name: 'setFieldsValue' }),
    );
    staticForm.resetFields();
    expect(wrapper.find('.values').at(0).getDOMNode().innerHTML).toBe(
      JSON.stringify({ name: undefined }),
    );
  });
});

import React from 'react';
import { mount } from 'enzyme';
import type { FormInstance } from '../src';
import Form, { Field } from '../src';
import timeout from './common/timeout';
import { act } from 'react-dom/test-utils';
import { Input } from './common/InfoField';

describe('useWatch', () => {
  let staticForm: FormInstance<any> = null;
  it('field initialValue', async () => {
    const Demo = () => {
      const [form] = Form.useForm();
      const values = Form.useWatch({ form, dependencies: ['name'] });

      return (
        <div>
          <Form form={form}>
            <Field name="name" initialValue="bamboo">
              <Input />
            </Field>
          </Form>
          <div className="values">{JSON.stringify(values)}</div>
        </div>
      );
    };
    await act(async () => {
      const wrapper = mount(<Demo />);
      await timeout();
      expect(wrapper.find('.values').at(0).getDOMNode().innerHTML).toBe(
        JSON.stringify({ name: 'bamboo' }),
      );
    });
  });
  it('form initialValue', async () => {
    const Demo = () => {
      const [form] = Form.useForm();
      const values = Form.useWatch({ form, dependencies: ['name'] });

      return (
        <div>
          <Form form={form} initialValues={{ name: 'bamboo', other: 'other' }}>
            <Field name="name">
              <Input />
            </Field>
          </Form>
          <div className="values">{JSON.stringify(values)}</div>
        </div>
      );
    };
    await act(async () => {
      const wrapper = mount(<Demo />);
      await timeout();
      expect(wrapper.find('.values').at(0).getDOMNode().innerHTML).toBe(
        JSON.stringify({ name: 'bamboo' }),
      );
    });
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
            <Field name="name">
              <Input />
            </Field>
          </Form>
          <div className="values">{JSON.stringify(values)}</div>
        </div>
      );
    };
    await act(async () => {
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
  it('unmount', async () => {
    const Demo = ({ visible }: { visible: boolean }) => {
      const [form] = Form.useForm();
      const values = Form.useWatch({ form, dependencies: ['name'] });

      return (
        <div>
          <Form form={form} initialValues={{ name: 'bamboo' }}>
            {visible && (
              <Field name="name">
                <Input />
              </Field>
            )}
          </Form>
          <div className="values">{JSON.stringify(values)}</div>
        </div>
      );
    };
    await act(async () => {
      const wrapper = mount(<Demo visible />);
      await timeout();
      wrapper.setProps({ visible: false });
      expect(wrapper.find('.values').at(0).getDOMNode().innerHTML).toBe(
        JSON.stringify({ name: undefined }),
      );
      wrapper.setProps({ visible: true });
      await timeout();
      expect(wrapper.find('.values').at(0).getDOMNode().innerHTML).toBe(
        JSON.stringify({ name: 'bamboo' }),
      );
    });
  });
  it('unmount useWatch', async () => {
    const DemoWatch = ({ form }: { form: FormInstance }) => {
      Form.useWatch({ form, dependencies: ['name'] });

      return (
        <Field name="name">
          <Input />
        </Field>
      );
    };

    const Demo = ({ visible }: { visible: boolean }) => {
      const [form] = Form.useForm();
      const values = Form.useWatch({ form, dependencies: ['name'] });

      return (
        <div>
          <Form form={form} initialValues={{ name: 'bamboo' }}>
            {visible && <DemoWatch form={form} />}
          </Form>
          <div className="values">{JSON.stringify(values)}</div>
        </div>
      );
    };
    await act(async () => {
      const wrapper = mount(<Demo visible />);
      await timeout();
      wrapper.setProps({ visible: false });
      expect(wrapper.find('.values').at(0).getDOMNode().innerHTML).toBe(
        JSON.stringify({ name: undefined }),
      );
      wrapper.setProps({ visible: true });
      await timeout();
      expect(wrapper.find('.values').at(0).getDOMNode().innerHTML).toBe(
        JSON.stringify({ name: 'bamboo' }),
      );
    });
  });
});

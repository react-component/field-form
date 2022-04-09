import React from 'react';
import { mount } from 'enzyme';
import type { FormInstance } from '../src';
import { List } from '../src';
import Form, { Field } from '../src';
import timeout from './common/timeout';
import { act } from 'react-dom/test-utils';
import { Input } from './common/InfoField';

describe('useWatch', () => {
  let staticForm: FormInstance<any> = null;
  it('field initialValue', async () => {
    const Demo = () => {
      const [form] = Form.useForm();
      const values = Form.useWatch(['name'], form);

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
      const values = Form.useWatch(['name'], form);

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
        JSON.stringify({ name: 'bamboo', other: 'other' }),
      );
    });
  });
  it('change name', async () => {
    const Demo = () => {
      const [form] = Form.useForm();
      const values = Form.useWatch(['name'], form);

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
      const values = Form.useWatch(['name'], form);

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
    const DemoWatch = () => {
      Form.useWatch(['name']);

      return (
        <Field name="name">
          <Input />
        </Field>
      );
    };

    const Demo = ({ visible }: { visible: boolean }) => {
      const [form] = Form.useForm();
      const values = Form.useWatch(['name'], form);

      return (
        <div>
          <Form form={form} initialValues={{ name: 'bamboo' }}>
            {visible && <DemoWatch />}
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
  it('list', async () => {
    const Demo = () => {
      const [form] = Form.useForm();
      const list = Form.useWatch(['users'], form);
      const values = Form.useWatch(
        list?.users?.map((_, index) => ['users', index]) || ['users'],
        form,
      );

      return (
        <Form form={form} style={{ border: '1px solid red', padding: 15 }}>
          <div className="values">{JSON.stringify(values)}</div>
          <List name="users" initialValue={['bamboo', 'light']}>
            {(fields, { remove }) => {
              return (
                <div>
                  {fields.map((field, index) => (
                    <Field {...field} rules={[{ required: true }]}>
                      {control => (
                        <div>
                          <Input {...control} />
                          <a className="remove" onClick={() => remove(index)}>
                            Remove
                          </a>
                        </div>
                      )}
                    </Field>
                  ))}
                </div>
              );
            }}
          </List>
        </Form>
      );
    };
    await act(async () => {
      const wrapper = mount(<Demo />);
      await timeout();
      expect(wrapper.find('.values').at(0).getDOMNode().innerHTML).toBe(
        JSON.stringify({ users: ['bamboo', 'light'] }),
      );
      wrapper.find('.remove').at(0).simulate('click');
      await timeout();
      expect(wrapper.find('.values').at(0).getDOMNode().innerHTML).toBe(
        JSON.stringify({ users: ['light'] }),
      );
    });
  });
});

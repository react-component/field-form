import React from 'react';
import { mount } from 'enzyme';
import type { FormInstance } from '../src';
import { List } from '../src';
import Form, { Field } from '../src';
import timeout from './common/timeout';
import { act } from 'react-dom/test-utils';
import { Input } from './common/InfoField';

describe('useWatch', () => {
  let staticForm: FormInstance<any>;

  it('field initialValue', async () => {
    const Demo = () => {
      const [form] = Form.useForm();
      const nameValue = Form.useWatch<string>('name', form);

      return (
        <div>
          <Form form={form}>
            <Field name="name" initialValue="bamboo">
              <Input />
            </Field>
          </Form>
          <div className="values">{nameValue}</div>
        </div>
      );
    };
    await act(async () => {
      const wrapper = mount(<Demo />);
      await timeout();
      expect(wrapper.find('.values').text()).toEqual('bamboo');
    });
  });

  it('form initialValue', async () => {
    const Demo = () => {
      const [form] = Form.useForm();
      const nameValue = Form.useWatch<string>(['name'], form);

      return (
        <div>
          <Form form={form} initialValues={{ name: 'bamboo', other: 'other' }}>
            <Field name="name">
              <Input />
            </Field>
          </Form>
          <div className="values">{nameValue}</div>
        </div>
      );
    };
    await act(async () => {
      const wrapper = mount(<Demo />);
      await timeout();
      expect(wrapper.find('.values').text()).toEqual('bamboo');
    });
  });

  it('change value with form api', async () => {
    const Demo = () => {
      const [form] = Form.useForm();
      const nameValue = Form.useWatch<string>(['name'], form);

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
          <div className="values">{nameValue}</div>
        </div>
      );
    };
    await act(async () => {
      const wrapper = mount(<Demo />);
      await timeout();
      staticForm.setFields([{ name: 'name', value: 'little' }]);
      expect(wrapper.find('.values').text()).toEqual('little');

      staticForm.setFieldsValue({ name: 'light' });
      expect(wrapper.find('.values').text()).toEqual('light');

      staticForm.resetFields();
      expect(wrapper.find('.values').text()).toEqual('');
    });
  });

  describe('unmount', () => {
    it('basic', async () => {
      const Demo = ({ visible }: { visible: boolean }) => {
        const [form] = Form.useForm();
        const nameValue = Form.useWatch<string>(['name'], form);

        return (
          <div>
            <Form form={form} initialValues={{ name: 'bamboo' }}>
              {visible && (
                <Field name="name">
                  <Input />
                </Field>
              )}
            </Form>
            <div className="values">{nameValue}</div>
          </div>
        );
      };

      await act(async () => {
        const wrapper = mount(<Demo visible />);
        await timeout();

        expect(wrapper.find('.values').text()).toEqual('bamboo');

        wrapper.setProps({ visible: false });
        expect(wrapper.find('.values').text()).toEqual('');

        wrapper.setProps({ visible: true });
        expect(wrapper.find('.values').text()).toEqual('bamboo');
      });
    });

    it('nest children component', async () => {
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
        const nameValue = Form.useWatch<string>(['name'], form);

        return (
          <div>
            <Form form={form} initialValues={{ name: 'bamboo' }}>
              {visible && <DemoWatch />}
            </Form>
            <div className="values">{nameValue}</div>
          </div>
        );
      };

      await act(async () => {
        const wrapper = mount(<Demo visible />);
        await timeout();

        expect(wrapper.find('.values').text()).toEqual('bamboo');

        wrapper.setProps({ visible: false });
        expect(wrapper.find('.values').text()).toEqual('');

        wrapper.setProps({ visible: true });
        expect(wrapper.find('.values').text()).toEqual('bamboo');
      });
    });
  });

  it('list', async () => {
    const Demo = () => {
      const [form] = Form.useForm();
      const users = Form.useWatch<string[]>(['users'], form) || [];

      return (
        <Form form={form} style={{ border: '1px solid red', padding: 15 }}>
          <div className="values">{JSON.stringify(users)}</div>
          <List name="users" initialValue={['bamboo', 'light']}>
            {(fields, { remove }) => {
              return (
                <div>
                  {fields.map((field, index) => (
                    <Field {...field} key={field.key} rules={[{ required: true }]}>
                      {control => (
                        <div>
                          <Input {...control} />
                          <a className="remove" onClick={() => remove(index)} />
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
      expect(wrapper.find('.values').text()).toEqual(JSON.stringify(['bamboo', 'light']));

      wrapper.find('.remove').at(0).simulate('click');
      await timeout();
      expect(wrapper.find('.values').text()).toEqual(JSON.stringify(['light']));
    });
  });

  it('warning if not provide form', () => {
    const errorSpy = jest.spyOn(console, 'error');

    const Demo = () => {
      Form.useWatch([]);
      return null;
    };

    mount(<Demo />);

    expect(errorSpy).toHaveBeenCalledWith(
      'Warning: useWatch requires a form instance since it can not auto detect from context.',
    );
  });

  it('no more render time', () => {
    let renderTime = 0;

    const Demo = () => {
      const [form] = Form.useForm();
      const name = Form.useWatch<string>('name', form);

      renderTime += 1;

      return (
        <Form form={form}>
          <Field name="name">
            <Input />
          </Field>
          <Field name="age">
            <Input />
          </Field>
          <div className="value">{name}</div>
        </Form>
      );
    };

    const wrapper = mount(<Demo />);
    expect(renderTime).toEqual(1);

    wrapper
      .find('input')
      .first()
      .simulate('change', {
        target: {
          value: 'bamboo',
        },
      });
    expect(renderTime).toEqual(2);

    wrapper
      .find('input')
      .last()
      .simulate('change', {
        target: {
          value: '123',
        },
      });
    expect(renderTime).toEqual(2);

    wrapper
      .find('input')
      .last()
      .simulate('change', {
        target: {
          value: '123456',
        },
      });
    expect(renderTime).toEqual(2);
  });
});

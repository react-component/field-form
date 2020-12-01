import React from 'react';
import { mount } from 'enzyme';
import Form, { Field } from '../src';

describe('Form.Field', () => {
  it('field remount should trigger constructor again', () => {
    const Demo = ({ visible }: { visible: boolean }) => {
      const [form] = Form.useForm();

      const fieldNode = <Field name="light" initialValue="bamboo" />;

      return <Form form={form}>{visible ? fieldNode : null}</Form>;
    };

    // First mount
    const wrapper = mount(<Demo visible />);
    const instance = wrapper.find('Field').instance() as any;
    expect(instance.cancelRegisterFunc).toBeTruthy();

    // Hide
    wrapper.setProps({ visible: false });
    expect(instance.cancelRegisterFunc).toBeFalsy();

    // Mount again
    wrapper.setProps({ visible: true });
    expect(instance.cancelRegisterFunc).toBeFalsy();
    expect((wrapper.find('Field').instance() as any).cancelRegisterFunc).toBeTruthy();
  });
  describe('trigger', () => {
    const Input = ({ value = '', ...props }: any) => {
      return <input value={value} {...props} />;
    };

    const Demo = ({
      trigger,
      onValuesChange,
      onChange,
    }: {
      trigger?: string;
      onValuesChange?: jest.Mock<any, any>;
      onChange?: jest.Mock<any, any>;
    }) => {
      const [form] = Form.useForm();

      return (
        <Form onValuesChange={onValuesChange} form={form}>
          <Field name="light" trigger={trigger}>
            <Input onChange={onChange} placeholder="light" />
          </Field>
        </Form>
      );
    };

    it('default is onChange', () => {
      const onValuesChange = jest.fn();
      const wrapper = mount(<Demo onValuesChange={onValuesChange} />);

      const input = wrapper.find('input');
      input.simulate('change', {
        target: {
          value: '123',
        },
      });
      expect(onValuesChange.mock.calls[0][0]).toMatchObject({
        light: '123',
      });
    });
    it('onBlur should work correctly', () => {
      const onValuesChange = jest.fn();
      const originOnChange = jest.fn();
      const wrapper = mount(
        <Demo onChange={originOnChange} trigger="onBlur" onValuesChange={onValuesChange} />,
      );
      const input = wrapper.find('input');
      input.simulate('change', {
        target: {
          value: '123',
        },
      });
      expect(onValuesChange).not.toHaveBeenCalled();
      // origin onChange should be called
      expect(originOnChange).toHaveBeenCalledTimes(1);
      expect(originOnChange.mock.calls[0][0]).toMatchObject({
        target: {
          value: '123',
        },
      });

      input.simulate('blur', {
        target: {
          value: '234',
        },
      });
      expect(onValuesChange).toHaveBeenCalledTimes(1);
      expect(onValuesChange.mock.calls[0][0]).toMatchObject({
        light: '234',
      });
    });
  });
});

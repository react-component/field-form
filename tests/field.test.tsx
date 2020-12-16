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
});

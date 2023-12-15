import React from 'react';
import Form, { Field } from '../src';
import type { FormInstance } from '../src';
import { render } from '@testing-library/react';

describe('Form.Field', () => {
  it('field remount should trigger constructor again', () => {
    let formRef: FormInstance;

    const Demo = ({ visible }: { visible: boolean }) => {
      const [form] = Form.useForm();
      formRef = form;

      const fieldNode = <Field name="light" initialValue="bamboo" />;

      return <Form form={form}>{visible ? fieldNode : null}</Form>;
    };

    // First mount
    const { rerender } = render(<Demo visible />);

    // ZombieJ: testing lib can not access instance
    // const instance = wrapper.find('Field').instance() as any;
    // expect(instance.cancelRegisterFunc).toBeTruthy();
    expect(formRef.getFieldsValue()).toEqual({ light: 'bamboo' });

    // Hide
    // wrapper.setProps({ visible: false });
    // expect(instance.cancelRegisterFunc).toBeFalsy();
    rerender(<Demo visible={false} />);
    expect(formRef.getFieldsValue()).toEqual({});

    // Mount again
    // wrapper.setProps({ visible: true });
    rerender(<Demo visible />);
    // expect(instance.cancelRegisterFunc).toBeFalsy();
    // expect((wrapper.find('Field').instance() as any).cancelRegisterFunc).toBeTruthy();
    expect(formRef.getFieldsValue()).toEqual({ light: 'bamboo' });
  });
});

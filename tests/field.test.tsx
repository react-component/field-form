import React from 'react';
import { render, act } from './test-utils';
import Form, { Field } from '../src';

describe('Form.Field', () => {
  it('field remount should trigger constructor again', () => {
    let fieldRef;
    const Demo = ({ visible }: { visible: boolean }) => {
      const [form] = Form.useForm();
      fieldRef = React.useRef(null);

      const fieldNode = <Field ref={fieldRef} name="light" initialValue="bamboo" />;

      return <Form form={form}>{visible ? fieldNode : null}</Form>;
    };

    // // First mount
    const { rerender } = render(<Demo visible />);
    const instance = fieldRef.current;
    expect(instance.cancelRegisterFunc).toBeTruthy();

    // Hide
    act(() => {
      rerender(<Demo visible={false} />);
    });
    expect(instance.cancelRegisterFunc).toBeFalsy();

    // Mount again
    rerender(<Demo visible />);

    expect(instance.cancelRegisterFunc).toBeFalsy();
    expect(fieldRef.current.cancelRegisterFunc).toBeTruthy();
  });
});

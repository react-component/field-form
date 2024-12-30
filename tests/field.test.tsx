import React from 'react';
import Form, { Field } from '../src';
import type { FormInstance } from '../src';
import { act, fireEvent, render } from '@testing-library/react';
import { Input } from './common/InfoField';
import { getInput } from './common';
import timeout from './common/timeout';

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

  // https://github.com/ant-design/ant-design/issues/51611
  it('date type as change', async () => {
    const onValuesChange = jest.fn();

    const MockDateInput = (props: { onChange?: (val: Date) => void }) => (
      <button
        onClick={() => {
          props.onChange?.(new Date());
        }}
      >
        Mock
      </button>
    );

    const { container } = render(
      <Form onValuesChange={onValuesChange}>
        <Field name="date">
          <MockDateInput />
        </Field>
      </Form>,
    );

    // Trigger
    for (let i = 0; i < 3; i += 1) {
      fireEvent.click(container.querySelector('button'));
      await act(async () => {
        await timeout();
      });
      expect(onValuesChange).toHaveBeenCalled();
      onValuesChange.mockReset();
    }
  });
});

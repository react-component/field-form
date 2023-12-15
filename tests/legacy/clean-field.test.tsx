import React from 'react';
import { render } from '@testing-library/react';
import type { FormInstance } from '../../src';
import Form, { Field } from '../../src';
import { Input } from '../common/InfoField';

describe('legacy.clean-field', () => {
  // https://github.com/ant-design/ant-design/issues/12560
  it('clean field if did update removed', async () => {
    const form = React.createRef<FormInstance>();

    const Test: React.FC<any> = ({ show }) => (
      <Form ref={form}>
        {show ? (
          <Field name="age" rules={[{ required: true }]}>
            <Input />
          </Field>
        ) : (
          <Field name="name" rules={[{ required: true }]}>
            <Input />
          </Field>
        )}
      </Form>
    );

    const { rerender } = render(<Test show />);

    try {
      await form.current?.validateFields();
      throw new Error('should not pass');
    } catch ({ errorFields }) {
      expect(errorFields.length).toBe(1);
      expect(errorFields[0].name).toEqual(['age']);
    }

    rerender(<Test show={false} />);

    try {
      await form.current?.validateFields();
      throw new Error('should not pass');
    } catch ({ errorFields }) {
      expect(errorFields.length).toBe(1);
      expect(errorFields[0].name).toEqual(['name']);
    }
  });
});

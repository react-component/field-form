import React from 'react';
import { render } from '@testing-library/react';
import type { FormInstance } from '../../src';
import Form, { Field } from '../../src';
import { Input } from '../common/InfoField';

describe('legacy.form', () => {
  // https://github.com/ant-design/ant-design/issues/8386
  it('should work even set with undefined name', async () => {
    const form = React.createRef<FormInstance>();
    render(
      <div>
        <Form ref={form} initialValues={{ normal: '1' }}>
          <Field name="normal">
            <Input />
          </Field>
        </Form>
      </div>,
    );
    form.current?.setFieldsValue({ normal: '2', notExist: 'oh' });
    expect(form.current?.getFieldValue('normal')).toBe('2');
  });
});

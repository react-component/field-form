import React from 'react';
import Form, { Field } from 'rc-field-form';
import Input from './components/Input';

export default () => {
  const [form] = Form.useForm(null);

  return (
    <Form form={form} preserve={false}>
      <Field name="name">
        <Input />
      </Field>
    </Form>
  );
};

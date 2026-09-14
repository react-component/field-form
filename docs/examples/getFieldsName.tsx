import Form, { Field } from 'rc-field-form';
import React from 'react';
import Input from './components/Input';

export default () => {
  const [form] = Form.useForm();

  return (
    <Form form={form}>
      <Field name="username">
        <Input placeholder="Username" />
      </Field>
      <Field name={['profile', 'email']}>
        <Input placeholder="profile.email" />
      </Field>
      <Field shouldUpdate>
        {() => (
          <pre style={{ marginTop: 16, fontSize: 12 }}>
            {JSON.stringify(form.getFieldsName(), null, 2)}
          </pre>
        )}
      </Field>
    </Form>
  );
};

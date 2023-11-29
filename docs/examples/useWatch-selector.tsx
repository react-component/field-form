import React from 'react';
import Form, { Field } from 'rc-field-form';
import Input from './components/Input';

type FieldType = {
  name?: string;
  age?: number;
};

export default () => {
  const [form] = Form.useForm<FieldType>();
  const values = Form.useWatch(values => ({ newName: values.name }), form);
  console.log('values', values);
  return (
    <>
      <Form form={form}>
        name
        <Field name="name">
          <Input />
        </Field>
        age
        <Field name="age">
          <Input />
        </Field>
      </Form>
    </>
  );
};

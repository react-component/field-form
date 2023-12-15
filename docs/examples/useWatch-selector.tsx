import React from 'react';
import Form, { Field } from 'rc-field-form';
import Input from './components/Input';

type FieldType = {
  init?: string;
  name?: string;
  age?: number;
};

export default () => {
  const [form] = Form.useForm<FieldType>();
  const values = Form.useWatch(
    values => ({ init: values.init, newName: values.name, newAge: values.age }),
    { form, preserve: true },
  );
  console.log('values', values);
  return (
    <>
      <Form form={form} initialValues={{ init: 'init', name: 'aaa' }}>
        name
        <Field name="name">
          <Input />
        </Field>
        age
        <Field name="age">
          <Input />
        </Field>
        no-watch
        <Field name="no-watch">
          <Input />
        </Field>
        values:{JSON.stringify(values)}
      </Form>
    </>
  );
};

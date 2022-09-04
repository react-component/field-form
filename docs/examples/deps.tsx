import React from 'react';
import Form, { Field, useForm } from 'rc-field-form';
import Input from './components/Input';

let x = 0;

export default function Demo() {
  const [form] = useForm();
  const handleSetField = () => {
    form.setFields([{ name: 'field_1', value: '2' }]);
  };
  return (
    <Form form={form}>
      <Field dependencies={['field_1']}>
        {() => {
          x += 1;
          return `gogogo${x}`;
        }}
      </Field>
      <Field name="field_1">
        <Input />
      </Field>
      <Field name="field_2">
        <Input />
      </Field>
      <br />
      <button type="button" onClick={() => handleSetField()}>
        手动触发 form.setFields
      </button>
    </Form>
  );
}

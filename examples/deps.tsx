import React from 'react';
import Form, { Field } from '../src';
import Input from './components/Input';

let x = 0;

export default function Demo() {
  return (
    <Form>
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
    </Form>
  );
}

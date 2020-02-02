import React from 'react';
import Form, { Field, useForm } from '../src';
import Input from './components/Input';

export default () => {
  const [form] = useForm();
  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        event.stopPropagation();
        form
          .validateFields()
          .then(values => {
            console.log(values);
          }) // Do nothing about submit catch
          .catch(e => e);
      }}
    >
      <Form component={false} form={form}>
        <Field name="username">
          <Input placeholder="Username" />
        </Field>
        <Field name="password">
          <Input placeholder="Password" />
        </Field>
      </Form>
      <button type="submit">submit</button>
    </form>
  );
};

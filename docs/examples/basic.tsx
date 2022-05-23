import Form, { Field } from 'rc-field-form';
import React from 'react';
import Input from './components/Input';

export default () => {
  const [form] = Form.useForm();

  return (
    <Form form={form} preserve={false}>
      <Field name="name">
        <Input placeholder="Username" />
      </Field>

      <Field dependencies={['name']}>
        {() => {
          return form.getFieldValue('name') === '1' ? (
            <Field name="password">
              <Input placeholder="Password" />
            </Field>
          ) : null;
        }}
      </Field>

      <Field dependencies={['password']}>
        {() => {
          const password = form.getFieldValue('password');
          console.log('>>>', password);
          return password ? (
            <Field name="password2">
              <Input placeholder="Password 2" />
            </Field>
          ) : null;
        }}
      </Field>
    </Form>
  );
};

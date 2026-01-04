import Form, { Field, Screen } from 'rc-field-form';
import React, { useState } from 'react';
import Input from './components/Input';

type FormData = {
  name?: string;
  password?: string;
};

export default () => {
  const [form] = Form.useForm<FormData>();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Form form={form}>
      <Field name="name">
        <Input placeholder="Username" />
      </Field>

      <button type="button" onClick={() => setShowPassword(!showPassword)}>
        {showPassword ? 'Hide' : 'Show'} Password Field
      </button>

      <Screen visible={showPassword}>
        <Field name="password">
          <Input placeholder="Password" />
        </Field>
      </Screen>

      <button type="submit">Submit</button>
    </Form>
  );
};

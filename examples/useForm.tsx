import React from 'react';
import Form from '../src';
import Input from './components/Input';

const { Field, useForm } = Form;

const list = new Array(0).fill(() => undefined);

interface FormValues {
  username?: string;
  password?: string;
  path1?: {
    path2?: string;
  };
}

export default () => {
  const [form] = useForm<FormValues>();

  return (
    <div>
      <h3>useForm ({list.length} inputs)</h3>

      <button
        type="button"
        onClick={() => {
          form.setFieldsValue({
            username: 'light',
            password: 'bamboo',
          });
        }}
      >
        Fill Values
      </button>

      <Form form={form}>
        <React.Fragment>
          <Field name="username">
            <Input placeholder="Username" />
          </Field>
          <Field name="password">
            <Input placeholder="Password" />
          </Field>
          <Field name="username">
            <Input placeholder="Shadow of Username" />
          </Field>
          <Field name={['path1', 'path2']}>
            <Input placeholder="nest" />
          </Field>

          {list.map((_, index) => (
            <Field key={index} name={`field_${index}`}>
              <Input placeholder={`field_${index}`} />
            </Field>
          ))}
        </React.Fragment>
      </Form>
    </div>
  );
};

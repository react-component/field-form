/* eslint-disable react/prop-types */
import React from 'react';
import Form from '../src';
import Input from './components/Input';

const { Field } = Form;

function Item({ children, ...restProps }) {
  return (
    <Field {...restProps}>
      {(control, meta) => (
        <div>
          <div>{React.cloneElement(children, { ...control })}</div>

          {meta.touched && 'touched!'}
          {meta.validating && 'validating!'}
          {meta.errors}
        </div>
      )}
    </Field>
  );
}

const Demo = () => {
  const [form] = Form.useForm();
  return (
    <div>
      <h3>Reset / Set Form</h3>
      <Form form={form} initialValues={{ username: 'strange', path1: { path2: '233' } }}>
        <Item name="username" rules={[{ required: true }]}>
          <Input placeholder="Username" />
        </Item>
        <Item name="password" rules={[{ required: true }]}>
          <Input placeholder="Password" />
        </Item>
        <Item name={['path1', 'path2']} rules={[{ required: true }]}>
          <Input placeholder="nest" />
        </Item>
        <button
          type="button"
          onClick={() => {
            form.resetFields(['password']);
          }}
        >
          Reset Password
        </button>
        <button
          type="button"
          onClick={() => {
            form.resetFields();
          }}
        >
          Reset All
        </button>
        <button
          type="button"
          onClick={() => {
            form.setFields([
              {
                name: 'password',
                value: 'ERROR ME',
                touched: false,
                errors: ['Good for you!', 'Good for me!'],
              },
            ]);
          }}
        >
          Set Password with Errors
        </button>
      </Form>
    </div>
  );
};

export default Demo;

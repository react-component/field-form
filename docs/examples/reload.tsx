import Form, { Field } from 'rc-field-form';
import React, { useState } from 'react';
import Input from './components/Input';

export default () => {
  const [load, setLoad] = useState(false);
  const [count, setCount] = useState(0);

  const [form] = Form.useForm(undefined, {
    onFormLoad: () => {
      console.log('load');
      form.resetFields();
    },
  });

  return (
    <>
      <button
        onClick={() => {
          if (load) {
            setCount(c => c + 1);
          }
          setLoad(c => !c);
        }}
      >
        load
      </button>
      {load && (
        <Form form={form} initialValues={{ count }}>
          <Field name="count">
            <Input placeholder="count" />
          </Field>
          <button type="submit">Submit</button>
        </Form>
      )}
    </>
  );
};

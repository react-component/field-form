import Form, { Field } from 'rc-field-form';
import React, { useState } from 'react';
import Input from './components/Input';

export default () => {
  const [load, setLoad] = useState(false);
  const [count, setCount] = useState(0);

  const [form] = Form.useForm(undefined);

  return (
    <>
      <button
        onClick={() => {
          setCount(c => c + 1);
          setLoad(c => !c);
        }}
      >
        load
      </button>

      <button
        onClick={() => {
          console.log(form.getFieldsValue(true));
        }}
      >
        values
      </button>
      {load && (
        <Form form={form} initialValues={{ count }} clearOnDestroy>
          <Field name="count">
            <Input placeholder="count" />
          </Field>
          <button type="submit">Submit</button>
        </Form>
      )}
    </>
  );
};

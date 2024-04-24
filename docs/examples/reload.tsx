import Form, { Field } from 'rc-field-form';
import React, { useState } from 'react';
import Input from './components/Input';

export default () => {
  const [load, setLoad] = useState(false);
  const [count, setCount] = useState(0);

  const [form] = Form.useForm(undefined, {
    // useForm 增加 onLoad 还是 Form 增加 onLoad
    onFormLoad: () => {
      // form.resetFields();
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

      <button
        onClick={() => {
          form.resetFields();
          console.log(form.getFieldsValue(true));
        }}
      >
        values
      </button>
      {load && (
        <Form
          form={form}
          // 或者 Form 增加 onLoad？
          onLoad={() => form.resetFields()}
          initialValues={{ count }}
        >
          <Field name="count">
            <Input placeholder="count" />
          </Field>
          <button type="submit">Submit</button>
        </Form>
      )}
    </>
  );
};

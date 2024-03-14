import React from 'react';
import Form, { Field } from 'rc-field-form';
import Input from './components/Input';

export default () => {
  const [form] = Form.useForm();
  return (
    <>
      <Form
        form={form}
        initialValues={{ range: 'aa' }}
        onFinish={v => console.log('submit values', v)}
      >
        <Field name="range">
          <Input />
        </Field>
        <button type="submit">submit</button>
      </Form>
      <button
        onClick={() => {
          console.log('values', form.getFieldsValue());
          console.log('values all', form.getFieldsValue(true));
        }}
      >
        getFieldsValue
      </button>
      <button
        onClick={() => {
          form.setFields([
            { name: 'name', value: 'name' },
            { name: 'age', value: 'age' },
          ]);
        }}
      >
        setFields
      </button>
      <button onClick={() => form.resetFields()}>resetFields</button>
      <button onClick={() => form.setFieldsValue({ name: `${form.getFieldValue('name') || ''}1` })}>
        setFieldsValue
      </button>
    </>
  );
};

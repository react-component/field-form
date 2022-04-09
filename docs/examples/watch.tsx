import React, { useState } from 'react';
import Form, { Field } from 'rc-field-form';
import Input from './components/Input';

let x = 0;

const Demo = React.memo(() => {
  const values = Form.useWatch(['demo']);
  console.log('demo watch', values);
  return (
    <Field name="demo">
      <Input />
    </Field>
  );
});
const Demo2 = React.memo(() => {
  const values = Form.useWatch(['demo2']);
  console.log('demo2 watch', values);
  return (
    <Field name="demo2">
      <Input />
    </Field>
  );
});

export default () => {
  const [form] = Form.useForm(null);
  const [visible, setVisible] = useState(true);
  const [visible2, setVisible2] = useState(true);
  const values = Form.useWatch(['name'], form);
  console.log('main watch', values);
  return (
    <>
      <Form form={form} initialValues={{ id: 1, name: 'default' }}>
        no render
        <Field name="main">
          <Input />
        </Field>
        name
        {visible && (
          <Field name="name">
            <Input />
          </Field>
        )}
        name 改变，组件 render 这里也 render
        <Field dependencies={['field_1']}>
          {() => {
            x += 1;
            return ` count ${x}`;
          }}
        </Field>
        <br />
        demo1
        <Demo />
        demo2
        {visible2 && <Demo2 />}
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
          const values = form.getFieldsValue(true);
          form.setFields([
            { name: 'name', value: `${values.name || ''}1` },
            { name: 'main', value: `main` },
          ]);
        }}
      >
        setFields
      </button>
      <button onClick={() => form.resetFields()}>resetFields</button>
      <button onClick={() => form.setFieldsValue({ name: `${form.getFieldValue('name') || ''}1` })}>
        setFieldsValue
      </button>
      <button onClick={() => setVisible(c => !c)}>isShow name</button>
      <button onClick={() => setVisible2(c => !c)}>isShow demo2</button>
    </>
  );
};
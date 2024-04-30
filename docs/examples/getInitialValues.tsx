import Form, { Field } from 'rc-field-form';
import React, { useContext } from 'react';
import Input from './components/Input';
import FieldContext from 'rc-field-form/es/FieldContext';

const Demo = () => {
  const form = useContext(FieldContext);

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      origin name:{form.getInitialValues().name}
      <Field name="name">
        <Input placeholder="Username" />
      </Field>
    </div>
  );
};

export default () => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      preserve={false}
      initialValues={{ name: 'zhangsan' }}
      onFieldsChange={fields => {
        console.error('fields:', fields);
      }}
    >
      <Demo />

      <button type="submit">Submit</button>
    </Form>
  );
};

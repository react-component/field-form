import Form, { Field } from 'rc-field-form';
import React from 'react';
import Input from './components/Input';

export default function App() {
  const [form] = Form.useForm();
  const [keyName, setKeyName] = React.useState(true);

  // const val = Form.useWatch(keyName ? 'name' : 'age', form);
  const val = Form.useWatch(values => values[keyName ? 'name' : 'age'], form);

  return (
    <Form form={form}>
      <button
        onClick={() => {
          setKeyName(!keyName);
        }}
      >
        Switch {String(keyName)}
      </button>
      <Field name="name" initialValue="bamboo">
        <Input />
      </Field>
      <Field name="age" initialValue="light">
        <Input />
      </Field>
      {val}
    </Form>
  );
}

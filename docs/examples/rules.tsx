import Form, { Field } from 'rc-field-form';
import React, { useState } from 'react';
import Input from './components/Input';

export default () => {
  const [form] = Form.useForm();
  const [ruleValue, setRuleValue] = useState('');

  return (
    <Form form={form} initialValues={{ name: 'aaa' }}>
      <Field
        name="name"
        getValueProps={value => ({ value: `${value}__` })}
        rules={[
          {
            validator: (rule, value) => {
              setRuleValue(value);
              return Promise.resolve();
            },
          },
        ]}
      >
        <Input placeholder="Username" />
      </Field>
      <button type="submit">Submit</button>
      {ruleValue}
    </Form>
  );
};

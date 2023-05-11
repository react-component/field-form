/* eslint-disable react/prop-types, @typescript-eslint/consistent-type-imports */

import React from 'react';
import Form from 'rc-field-form';
import Input from './components/Input';
import LabelField from './components/LabelField';

export default () => {
  const [form] = Form.useForm();

  const onValidateOnly = async () => {
    const result = await form.validateFields({
      // validateOnly: true,
    });
    console.log('Validate:', result);
  };

  return (
    <>
      <Form form={form}>
        <LabelField
          name="name"
          label="Name"
          rules={[
            { validator: () => Promise.reject('Error Name!') },
            { warningOnly: true, validator: () => Promise.reject('Warn Name!') },
          ]}
        >
          <Input />
        </LabelField>
        <LabelField
          name="age"
          label="Age"
          rules={[
            { validator: () => Promise.reject('Error Age!') },
            { warningOnly: true, validator: () => Promise.reject('Warn Age!') },
          ]}
        >
          <Input />
        </LabelField>
        <button type="reset">Reset</button>
        <button type="submit">Submit</button>
      </Form>
      <button type="button" onClick={onValidateOnly}>
        Validate Without UI update
      </button>
    </>
  );
};

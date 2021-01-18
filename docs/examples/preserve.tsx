/* eslint-disable react/prop-types */

import React from 'react';
import Form from 'rc-field-form';
import Input from './components/Input';

const { Field } = Form;

export default () => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      initialValues={{ test: 'bamboo' }}
      onFinish={values => {
        console.log('Submit:', values);
      }}
    >
      <Field shouldUpdate>
        {() => (
          <>
            <Field name="test" preserve={false}>
              <Input />
            </Field>
            {/* <Field name="test">
                <Input />
              </Field> */}
          </>
        )}
      </Field>
      <button type="submit">Submit</button>
      <button
        type="button"
        onClick={() => {
          form.resetFields();
        }}
      >
        Reset
      </button>
    </Form>
  );
};

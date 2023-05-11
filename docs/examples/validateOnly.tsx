/* eslint-disable react/prop-types, @typescript-eslint/consistent-type-imports */

import React from 'react';
import Form from 'rc-field-form';
import type { FormInstance } from 'rc-field-form';
import Input from './components/Input';
import LabelField from './components/LabelField';

function useSubmittable(form: FormInstance) {
  const [submittable, setSubmittable] = React.useState(false);
  const store = Form.useWatch([], form);

  React.useEffect(() => {
    form
      .validateFields({
        validateOnly: true,
      })
      .then(
        () => {
          setSubmittable(true);
        },
        () => {
          setSubmittable(false);
        },
      );
  }, [store]);

  return submittable;
}

export default () => {
  const [form] = Form.useForm();

  const canSubmit = useSubmittable(form);

  const onValidateOnly = async () => {
    const result = await form.validateFields({
      validateOnly: true,
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
            { required: true },
            // { warningOnly: true, validator: () => Promise.reject('Warn Name!') },
          ]}
        >
          <Input />
        </LabelField>
        <LabelField
          name="age"
          label="Age"
          rules={[
            { required: true },
            // { warningOnly: true, validator: () => Promise.reject('Warn Age!') },
          ]}
        >
          <Input />
        </LabelField>
        <button type="reset">Reset</button>
        <button type="submit" disabled={!canSubmit}>
          Submit
        </button>
      </Form>
      <button type="button" onClick={onValidateOnly}>
        Validate Without UI update
      </button>
    </>
  );
};

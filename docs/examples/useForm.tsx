import React from 'react';
import Form from 'rc-field-form';
import Input from './components/Input';

const { Field, useForm } = Form;

const list = new Array(0).fill(() => undefined);

interface FormValues {
  username?: string;
  password?: string;
  path1?: {
    path2?: string;
  };
}

const Select = ({ value, defaultValue }: {value?: string[], defaultValue?: string[]}) => {
  return <div>{(value || defaultValue || []).toString()}</div>
};

export default () => {
  const [formInstance] = Form.useForm();

  React.useEffect(() => {
    formInstance.setFieldsValue({ selector: ["K1", "K2"] });
  }, [formInstance]);

  return (
    <Form form={formInstance}>
      <Field initialValue="K1" name="selector">
        <Select />
      </Field>
    </Form>
  );
};

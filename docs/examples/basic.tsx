import Form, { Field } from 'rc-field-form';
import React from 'react';
import Input from './components/Input';

type FormData = {
  name?: string;
  password?: string;
  password2?: string;
};

export default () => {
  const [form] = Form.useForm();

  const [loading, setLoading] = React.useState<boolean>(false);
  const [initialValues, setInitialValues] = React.useState<FormData | null>(null);

  React.useEffect(() => {
    setTimeout(() => {
      setInitialValues({
        name: '1',
        password: '2',
        password2: '3',
      });
    }, 2000);
  }, []);

  return (
    <Form
      loading={loading}
      initialValues={initialValues}
      form={form}
      preserve={false}
      onFieldsChange={fields => {
        console.error('fields:', fields);
      }}
    >
      <Input
        value={loading}
        onChange={() => {
          setLoading(!loading);
        }}
      />
      {form.loading ? <div>loading...</div> : null}
      <Field<FormData> name="name">
        <Input placeholder="Username" />
      </Field>

      <Field<FormData> dependencies={['name']}>
        {() => {
          return form.getFieldValue('name') === '1' ? (
            <Field name="password">
              <Input placeholder="Password" />
            </Field>
          ) : null;
        }}
      </Field>

      <Field dependencies={['password']}>
        {() => {
          const password = form.getFieldValue('password');
          console.log('>>>', password);
          return password ? (
            <Field<FormData> name={['password2']}>
              <Input placeholder="Password 2" />
            </Field>
          ) : null;
        }}
      </Field>

      <button type="submit">Submit</button>
      <button
        onClick={() => {
          form.reset();
        }}
      >
        Reset
      </button>
      <div>{JSON.stringify(form, null, 2)}</div>
    </Form>
  );
};

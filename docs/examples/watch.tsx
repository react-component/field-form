/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-shadow */
import React from 'react';
import Form, { Field } from 'rc-field-form';
import Input from './components/Input';

let x = 0;

const Demo = React.memo((props: any) => {
  const { form } = props;
  const values = Form.useWatch({ form });

  console.log('demo watch', values);

  return (
    <Field name="demo">
      <Input />
    </Field>
  );
});
const Demo2 = React.memo((props: any) => {
  const { form } = props;
  const values = Form.useWatch({ form });

  console.log('demo2 watch', values);

  return (
    <Field name="demo2">
      <Input />
    </Field>
  );
});

export default () => {
  const [form] = Form.useForm(null);

  // console.log('watch', form.watch('name'));
  const values = Form.useWatch({ form });
  // console.log('v', values);
  console.log('main', values);

  return (
    <Form form={form}>
      <Field name="name">
        <Input />
      </Field>
      <Field dependencies={['field_1']}>
        {() => {
          x += 1;
          return `gogogo${x}`;
        }}
      </Field>
      <Demo form={form} />
      <Demo2 form={form} />

      <button
        onClick={() => {
          form.getFieldsValue();
        }}
      >
        submit
      </button>
      <button
        onClick={() => {
          const values = form.getFieldsValue(true);
          form.setFields([{ name: 'name', value: `${values.name || ''}1` }]);
        }}
      >
        setFields
      </button>
    </Form>
  );
};

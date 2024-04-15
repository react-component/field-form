import Form, { Field } from 'rc-field-form';
import React from 'react';
import Input from './components/Input';

const RangeInput = ({
  value = [],
  onChange,
}: {
  value?: string[];
  onChange?: (value: string[]) => void;
}) => {
  const [one, two] = Array.isArray(value) ? value : [];

  return (
    <div style={{ display: 'flex' }}>
      <Input style={{ padding: 0 }} value={one} onChange={e => onChange([e.target.value, two])} />
      <Input style={{ padding: 0 }} value={two} onChange={e => onChange([one, e.target.value])} />
      {JSON.stringify(value)}
    </div>
  );
};

export default () => {
  const [form] = Form.useForm();
  // form.setFields([{ name: 'aa', value: 'aa' }]);
  return (
    <Form
      form={form}
      // onValuesChange={(value, values) => {
      //   console.log(JSON.stringify(value, null, 2));
      //   console.log('values', values);
      // }}
      initialValues={{ start: '1', end: '2' }}
      onFinish={values => {
        console.log('values', values);
      }}
      onFinishFailed={error => {
        console.log('error', error);
      }}
    >
      <Field names={['start', 'end']}>
        <RangeInput />
      </Field>
      <button type="submit">Submit</button>
    </Form>
  );
};

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
  return (
    <Form
      form={form}
      // onValuesChange={values => {
      //   console.log(JSON.stringify(values, null, 2));
      // }}
      initialValues={{ start: '1', end: '2' }}
    >
      <Field
        // name="start"
        names={['start', 'end']}
        // getValueProps={value => {
        //   return { value: [value] };
        // }}
        // getValueFromEvent={value => {
        //   return value;
        // }}
        // getValuesFromEvent={value => {
        //   const [start, end] = value || [];
        //   return { start, end };
        // }}
      >
        <RangeInput />
      </Field>
      <button type="submit">Submit</button>
    </Form>
  );
};

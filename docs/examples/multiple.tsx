import React from 'react';
import Form, { Field } from 'rc-field-form';
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
type FieldType = { one?: string; two?: string; name?: string };

export default () => {
  const [form] = Form.useForm();
  return (
    <>
      <Form
        form={form}
        initialValues={{ one: '11', two: '22' }}
        onFinish={v => console.log('submit values', v)}
        onFinishFailed={v => console.log('submit values', v)}
      >
        <Field<FieldType>
          names={['one', 'two']}
          // name={['one']}
          // rules={[{ required: true }]}
          rules={[
            {
              validator(rule, value, callback) {
                console.log('value', value);
                return Promise.resolve();
              },
            },
          ]}
        >
          <RangeInput />
        </Field>
        <Field<FieldType> name="name">
          <Input />
        </Field>
        <button type="submit">submit</button>
      </Form>
      <button
        onClick={() => {
          console.log('values', form.getFieldsValue());
          console.log('values all', form.getFieldsValue(true));
        }}
      >
        getFieldsValue
      </button>
      <button
        onClick={() => {
          form.setFields([
            { name: 'name', value: 'name' },
            { name: 'age', value: 'age' },
          ]);
        }}
      >
        setFields
      </button>
      <button onClick={() => form.resetFields()}>resetFields</button>
      <button onClick={() => form.setFieldsValue({ name: `${form.getFieldValue('name') || ''}1` })}>
        setFieldsValue
      </button>
    </>
  );
};

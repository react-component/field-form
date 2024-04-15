import Form, { Field, FieldContext } from 'rc-field-form';
import React from 'react';
import Input from './components/Input';
import type { FieldProps } from '@/Field';

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

export const MyField = (
  props: FieldProps & { names?: FieldProps<Record<string, any>>['name'][] },
) => {
  const fieldContext = React.useContext(FieldContext);

  const { names, getValueProps, getValueFromEvent, ...rest } = props;
  const [firstNames, ...resetNames] = names;
  return (
    <>
      <Field
        name={firstNames}
        getValueProps={() => {
          const values = names.map(name => fieldContext.getFieldValue(name));
          if (getValueProps) {
            return getValueProps(values);
          }
          return { value: values };
        }}
        getValueFromEvent={value => {
          let values = value;
          if (getValueFromEvent) {
            values = getValueFromEvent(value);
          }
          fieldContext.setFields(names.map((name, index) => ({ name, value: values[index] })));
          return value[0];
        }}
        getValidateValue={() => {
          const values = names.map(name => fieldContext.getFieldValue(name));
          return values;
        }}
        {...rest}
      />
      {resetNames.map(name => (
        <Field key={name.toString()} name={name}>
          {() => undefined}
        </Field>
      ))}
    </>
  );
};

export default () => {
  const [form] = Form.useForm();
  return (
    <Form
      form={form}
      initialValues={{ start: '1', end: '2' }}
      onFinish={values => {
        console.log('values', values);
      }}
      onFinishFailed={error => {
        console.log('error', error);
      }}
    >
      <MyField
        names={['start', 'end']}
        getValueProps={value => {
          return { value: value };
        }}
        getValueFromEvent={value => {
          return value;
        }}
        rules={[
          {
            validator(rule, value) {
              console.log('v', value);
              return Promise.resolve();
            },
          },
        ]}
      >
        <RangeInput />
      </MyField>
      <button type="submit">Submit</button>
    </Form>
  );
};

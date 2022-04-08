import React from 'react';
import Form, { Field } from 'rc-field-form';
import Input from './components/Input';

const { List, useForm } = Form;

const Demo = () => {
  const [form] = useForm();
  const list = Form.useWatch(['users'], form);
  const values = Form.useWatch(list?.users?.map((_, index) => ['users', index]) || ['users'], form);

  console.log('values', values);

  return (
    <div>
      <Form form={form} style={{ border: '1px solid red', padding: 15 }}>
        list length:{list?.users.length}
        <br />
        values: {JSON.stringify(values, null, 2)}
        <List name="users" initialValue={['bamboo', 'light']}>
          {(fields, { add, remove }) => {
            return (
              <div>
                {fields.map((field, index) => (
                  <Field {...field} rules={[{ required: true }]}>
                    {control => (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {index + 1}
                        <Input {...control} />
                        <a onClick={() => remove(index)}>Remove</a>
                      </div>
                    )}
                  </Field>
                ))}
                <button type="button" onClick={() => add()}>
                  + New User
                </button>
              </div>
            );
          }}
        </List>
      </Form>
    </div>
  );
};

export default Demo;

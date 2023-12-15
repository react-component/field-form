import React from 'react';
import Form, { Field } from 'rc-field-form';
import Input from './components/Input';

const { List, useForm } = Form;

const Demo = () => {
  const [form] = useForm();
  const users = Form.useWatch(['users'], form) || [];

  console.log('values', users);

  return (
    <div>
      <Form form={form} style={{ border: '1px solid red', padding: 15 }}>
        list length:{users.length}
        <br />
        Users: {JSON.stringify(users, null, 2)}
        <Field name="main">
          <Input />
        </Field>
        <List name="users" initialValue={['bamboo', 'light']}>
          {(fields, { add, remove }) => {
            return (
              <div>
                {fields.map((field, index) => (
                  <Field key={field.key} {...field} rules={[{ required: true }]}>
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

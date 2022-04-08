import React from 'react';
import Form from 'rc-field-form';
import Input from './components/Input';
import LabelField from './components/LabelField';

const { List, useForm } = Form;

const Demo = () => {
  const [form] = useForm();
  const list = Form.useWatch({ form, dependencies: ['users'] });
  const values = Form.useWatch({
    form,
    dependencies: list?.users?.map((_, index) => ['users', index]) || ['users'],
  });

  console.log('values', values);

  return (
    <div>
      <Form form={form} style={{ border: '1px solid red', padding: 15 }}>
        list length:{list?.users.length}
        <br />
        values: {JSON.stringify(values, null, 2)}
        <List name="users" initialValue={['bamboo', 'light']}>
          {(fields, { add, remove }, { errors }) => {
            return (
              <div>
                {fields.map((field, index) => (
                  <LabelField {...field} rules={[{ required: true }]}>
                    {control => (
                      <div style={{ position: 'relative' }}>
                        <Input {...control} />
                        <a
                          style={{ position: 'absolute', top: 12, right: -300 }}
                          onClick={() => {
                            remove(index);
                          }}
                        >
                          Remove
                        </a>
                      </div>
                    )}
                  </LabelField>
                ))}

                <ul>
                  {errors.map(err => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>

                <button type="button" onClick={() => add()}>
                  + New User
                </button>
                <button type="button" onClick={() => remove(1)}>
                  Remove index: 1
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

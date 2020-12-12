/* eslint-disable react/prop-types */

import React from 'react';
import Form from 'rc-field-form';
import Input from './components/Input';
import LabelField from './components/LabelField';

const { List, useForm } = Form;

const Demo = () => {
  const [form] = useForm();

  return (
    <div>
      <h3>List of Form</h3>
      <p>You can set Field as List</p>

      <Form
        form={form}
        onValuesChange={(changedValues, allValues) => {
          console.log('values:', changedValues, allValues);
        }}
        onFinish={(values) => {
          console.log('values:', values);
        }}
        style={{ border: '1px solid red', padding: 15 }}
        preserve={false}
      // initialValues={{
      //   users: ['little'],
      // }}
      >
        <Form.Field shouldUpdate>{() => JSON.stringify(form.getFieldsValue(), null, 2)}</Form.Field>

        <List
          name="users"
          initialValue={[]}
          rules={[
            {
              message: 'Must have at least 2 user!',
              validator: async (_, value) => {
                if (value.length < 2) {
                  throw new Error();
                }
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => {
            console.log('Demo Fields:', fields);
            return (
              <div>
                <h4>List of `users`</h4>
                {fields.map((field, index) => (
                  <>
                    <div>
                      <div style={{ width: '50%', display: 'inline-block' }}>
                        <LabelField {...field} rules={[{ required: true }]}  >
                          {control => (
                            <div style={{ position: 'relative' }}>
                              <Input {...control} />

                            </div>
                          )}
                        </LabelField>
                      </div>

                      <List
                        name={[field.name, "nicknames"]}
                        rules={[
                          {
                            message: 'Must have at least 2 nicknames!',
                            validator: async (_, value) => {
                              if (value.length < 2) {
                                throw new Error();
                              }
                            },
                          },
                        ]}
                      >
                        {(nicknames, { add, remove }) => {
                          return (
                            <div style={{ width: '30%', display: 'inline-block' }}>
                              {nicknames.map(nickname => (
                                <>
                                  <LabelField {...nickname} rules={[{ required: true }]}  >
                                    {control => (
                                      <div style={{ position: 'relative' }}>
                                        <Input {...control} />

                                      </div>
                                    )}
                                  </LabelField>

                                  <button
                                    onClick={() => {
                                      remove(index);
                                    }}
                                  >
                                    Remove nickname
                                  </button>
                                </>
                              ))}
                              <button
                                onClick={() => {
                                  add();
                                }}
                              >
                                add nickname
                          </button>
                            </div>
                          )
                        }}
                      </List>


                      <a
                        onClick={() => {
                          remove(index);
                        }}
                      >
                        Remove
                          </a>
                    </div>

                  </>
                ))}

                <ul>
                  {errors.map(err => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => {
                    add();
                  }}
                >
                  + New User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    remove(1);
                  }}
                >
                  Remove index: 1
                </button>
              </div>
            );
          }}
        </List>
      </Form>

      <div style={{ border: '1px solid #000', padding: 15 }}>
        <h4>Out Of Form</h4>
        <button
          type="button"
          onClick={() => {
            form.setFieldsValue({
              users: ['light', 'bamboo'],
            });
          }}
        >
          Set List Value
        </button>

        <button
          type="button"
          onClick={() => {
            console.log('`users` touched:', form.isFieldTouched('users'));
          }}
        >
          Is List touched
        </button>
      </div>
    </div>
  );
};

export default Demo;

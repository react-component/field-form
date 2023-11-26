/* eslint-disable react/prop-types */

import React, { useState } from 'react';
import Form from 'rc-field-form';
import Input from './components/Input';

const { Field, List } = Form;

const formValue = {
  test: "test",
  users: [{ first: "aaa", last: "bbb" }]
};

export default () => {
  const [form] = Form.useForm();
  const [show, setShow] = useState<boolean>(false);

  return (
    <>
      <button onClick={() => setShow((prev) => !prev)}>switch show</button>
      {show && (
        <Form
          form={form}
          initialValues={formValue}
          preserve={false}
          onFinish={values => {
            console.log('Submit:', values);
          }}
        >
          <Field shouldUpdate>
            {() => (
              <Field name="test" preserve={false}>
                <Input/>
              </Field>
            )}
          </Field>
          <List name="users">
            {(fields) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <>
                    <Field
                      {...restField}
                      name={[name, "first"]}
                      rules={[
                        { required: true, message: "Missing first name" }
                      ]}
                    >
                      <Input placeholder="First Name" />
                    </Field>
                    <Field
                      {...restField}
                      name={[name, "last"]}
                      rules={[{ required: true, message: "Missing last name" }]}
                    >
                      <Input placeholder="Last Name" />
                    </Field>
                  </>
                ))}
              </>
            )}
          </List>
        </Form>
      )}
    </>
  );
};

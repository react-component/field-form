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
  const [show, setShow] = useState<boolean>(true);

  return (
    <>
      <button onClick={() => setShow((prev) => !prev)}>switch show</button>
      <button  onClick={() => form.submit()}>submit</button>
      <div>
       {form.isSubmitting ? <h2>Loading...</h2> : null}
      </div>
      {show && (
        <Form
          form={form}
          initialValues={formValue}
          preserve={false}
          onFinish={ async (values) => {
            console.log(3);
            await new Promise((resolve) =>
              setTimeout(() => {
                resolve(values);
              }, 1000),
            );
            console.log(2);
            await new Promise((resolve) =>
              setTimeout(() => {
                resolve(values);
              }, 1000),
            );
            console.log(1);
            await new Promise((resolve) =>
              setTimeout(() => {
                resolve(values);
              }, 1000),
            );
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
                {fields.map(({ key, name, ...restField },idx) => (
                  <div key={idx}>
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
                  </div>
                ))}
              </>
            )}
          </List>
        </Form>
      )}
    </>
  );
};

/* eslint-disable react/prop-types */

import React from 'react';
import Form from '../src';
import Input from './components/Input';

const { Field } = Form;

const Error = ({ children }) => (
  <ul style={{ color: 'red' }}>
    {children.map(error => (
      <li>{error}</li>
    ))}
  </ul>
);

const FieldState = ({ form, name }) => {
  const touched = form.isFieldTouched(name);
  const validating = form.isFieldValidating(name);

  return (
    <div
      style={{
        color: 'green',
        position: 'absolute',
        marginTop: -35,
        left: 200,
      }}
    >
      {touched ? <span>Touched!</span> : null}
      {validating ? <span>Validating!</span> : null}
    </div>
  );
};

export default class Demo extends React.Component {
  onFinish = values => {
    console.log('Finish:', values);
  };

  render() {
    return (
      <div>
        <h3>Validate Form</h3>
        <Form style={{ padding: 16 }} onFinish={this.onFinish}>
          {(values, form) => {
            const usernameError = form.getFieldError('username');
            const passwordError = form.getFieldError('password');
            const password2Error = form.getFieldError('password2');
            const errors = form.getFieldsError();
            if (errors) {
              console.log('Render with Errors:', values, form.getFieldsError());
            }

            return (
              <React.Fragment>
                <Field name="username" rules={[{ required: true }]}>
                  <Input
                    placeholder="Username"
                    onChange={({ target: { value } }) => {
                      console.log('Username change:', value);
                    }}
                  />
                </Field>
                <FieldState form={form} name="username" />
                <Error>{usernameError}</Error>

                <Field
                  name="password"
                  rules={[
                    { required: true },
                    context => ({
                      validator(_, __, callback) {
                        if (context.isFieldTouched('password2')) {
                          context.validateFields(['password2']);
                          callback();
                          return;
                        }
                        callback();
                      },
                    }),
                  ]}
                >
                  <Input placeholder="Password" />
                </Field>
                <FieldState form={form} name="password" />
                <Error>{passwordError}</Error>

                <Field
                  name="password2"
                  rules={[
                    { required: true },
                    context => ({
                      validator(rule, value, callback) {
                        const { password } = context.getFieldsValue(true);
                        if (password !== value) {
                          callback('Not Same as password1!!!');
                        }
                        callback();
                      },
                    }),
                  ]}
                >
                  <Input placeholder="Password 2" />
                </Field>
                <FieldState form={form} name="password2" />
                <Error>{password2Error}</Error>

                <Field name="renderProps" rules={[{ required: true }]}>
                  {(control, meta) => (
                    <div>
                      Use Meta:
                      <Input {...control} placeholder="render props" />
                      <FieldState form={form} name="renderProps" />
                      <Error>{meta.errors}</Error>
                    </div>
                  )}
                </Field>

                <Field
                  name="validateTrigger"
                  validateTrigger={['onSubmit', 'onChange']}
                  rules={[
                    { required: true, validateTrigger: 'onSubmit' },
                    {
                      validator(rule, value, callback) {
                        setTimeout(() => {
                          if (Number(value).toString() === value) {
                            callback();
                          }
                          callback('Integer number only!');
                        }, 1000);
                      },
                      validateTrigger: 'onChange',
                    },
                  ]}
                >
                  {(control, meta) => (
                    <div>
                      Multiple `validateTrigger`:
                      <ul>
                        <li>Required check on submit</li>
                        <li>Number check on change</li>
                      </ul>
                      <Input {...control} placeholder="validateTrigger" />
                      <FieldState form={form} name="validateTrigger" />
                      <Error>{meta.errors}</Error>
                    </div>
                  )}
                </Field>

                <br />

                <button
                  type="button"
                  onClick={() => {
                    form.validateFields();
                  }}
                >
                  Validate All
                </button>

                <button type="submit">Submit</button>
              </React.Fragment>
            );
          }}
        </Form>
      </div>
    );
  }
}

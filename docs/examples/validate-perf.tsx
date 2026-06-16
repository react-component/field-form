/* eslint-disable react/prop-types, @typescript-eslint/consistent-type-imports */

import React from 'react';
import Form, { Field } from 'rc-field-form';
import type { FormInstance, FormProps } from 'rc-field-form';
import Input from './components/Input';
import LabelField from './components/LabelField';
import type { ValidateMessages } from '@/interface';

const myMessages: ValidateMessages = {
  default: '${name} 看起来怪怪的……',
  required: '你需要一个 ${displayName}',
  types: {
    number: '嗨，这个 ${name} 不是一个合格的 ${type}',
  },
  enum: '${name} 不在 ${enum} 中呢',
  whitespace: '${name} 不可以是空的啦',
  pattern: {
    mismatch: '${name} 并不符合格式：${pattern}',
  },
};

const Demo: React.FC = () => {
  const formRef = React.useRef<FormInstance>(null);

  const onFinish = (values: { password: string }) => {
    console.log('Finish:', values);
  };

  const onFinishFailed: FormProps['onFinishFailed'] = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  const onPasswordError = ({ errors }: { errors: string[] }) => {
    console.log('🐞 Password Error:', errors);
  };

  return (
    <div>
      <h3>High Perf Validate Form</h3>
      <Form
        ref={formRef}
        style={{ padding: 16 }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        validateMessages={myMessages}
        initialValues={{ remember: true }}
      >
        <LabelField
          name="password"
          messageVariables={{ displayName: '密码' }}
          rules={[
            { required: true },
            {
              warningOnly: true,
              validator: async (_, value: string = '') => {
                if (value.length < 6) {
                  throw new Error('你的 ${displayName} 太短了……');
                }
              },
            },
          ]}
          onMetaChange={onPasswordError}
        >
          <Input placeholder="password" />
        </LabelField>
        <LabelField
          initialValue="123"
          name="password2"
          dependencies={['password']}
          messageVariables={{ displayName: '密码2' }}
          rules={[
            { required: true },
            ({ getFieldValue }) => ({
              async validator(_, value) {
                if (getFieldValue('password') !== value) {
                  return Promise.reject('password2 is not same as password');
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <Input placeholder="password 2" />
        </LabelField>
        <LabelField
          name="field"
          label="Full of rules"
          messageVariables={{ displayName: '字段' }}
          rules={[
            { required: true },
            { required: true, message: <h1>我是 ReactNode</h1> },
            { type: 'number' },
            { type: 'enum', enum: ['aaa', 'bbb'] },
            { type: 'date' },
            { whitespace: true },
            { pattern: /^\w{3}$/ },
          ]}
        >
          <Input />
        </LabelField>
        <div>
          <Field name="remember" valuePropName="checked">
            <input type="checkbox" />
          </Field>
          Remember Me
        </div>
        <Field shouldUpdate>
          {(_, __, { getFieldsError, isFieldsTouched }) => {
            const isAllTouched = isFieldsTouched(['password', 'password2'], true);
            const hasErrors = !!getFieldsError().filter(({ errors }) => errors.length).length;
            return (
              <button type="submit" disabled={!isAllTouched || hasErrors}>
                Submit
              </button>
            );
          }}
        </Field>
        <button
          type="button"
          onClick={() => {
            formRef.current?.resetFields();
          }}
        >
          Reset
        </button>
        <button type="reset">Reset Native</button>
      </Form>
    </div>
  );
};

export default Demo;

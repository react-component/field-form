/* eslint-disable react/prop-types */

import React from 'react';
import StateForm, { FormInstance } from '../src';
import Input from './components/Input';
import LabelField from './components/LabelField';

const formStyle: React.CSSProperties = {
  padding: '10px 15px',
  flex: 'auto',
};

const Form1 = () => {
  const [form] = StateForm.useForm();

  return (
    <StateForm form={form} style={{ ...formStyle, border: '1px solid #000' }}>
      <h4>Form 1</h4>
      <LabelField name="username" rules={[{ required: true }]}>
        <Input placeholder="password" />
      </LabelField>
      <LabelField name="password" rules={[{ required: true }]}>
        <Input placeholder="password" />
      </LabelField>

      <button type="submit">Submit</button>
    </StateForm>
  );
};

const Form2 = () => {
  const [form] = StateForm.useForm();

  return (
    <StateForm form={form} style={{ ...formStyle, border: '1px solid #F00' }}>
      <h4>Form 2</h4>
      <LabelField name="username" rules={[{ required: true }]}>
        <Input placeholder="password" />
      </LabelField>
      <LabelField name="password" rules={[{ required: true }]}>
        <Input placeholder="password" />
      </LabelField>

      <button type="submit">Submit</button>
    </StateForm>
  );
};

const Demo = () => {
  return (
    <div>
      <h3>Form Context</h3>
      <p>Support global `validateMessages` config and communication between forms.</p>
      <div style={{ display: 'flex', width: '100%' }}>
        <Form1 />
        <Form2 />
      </div>
    </div>
  );
};

export default Demo;

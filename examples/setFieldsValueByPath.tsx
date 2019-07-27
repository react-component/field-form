import React from 'react';
import Form, { Field, FormInstance } from '../src';
import Input from './components/Input';

const list = new Array(1111).fill(() => null);

export default class Demo extends React.Component {
  public state = {};

  public form: FormInstance;

  setFieldsValueByPath = () => {
    const fieldsValue = {
      [['children', 1, 'level'].join('.')]: 'High',
    };
    this.form.setFieldsValueByPath(fieldsValue);
  };

  public render() {
    return (
      <div>
        <h3>State Form ({list.length} inputs)</h3>
        <Form
          ref={inst => {
            this.form = inst;
          }}
          initialValues={{
            children: [{ language: 'java' }],
          }}
        >
          <Field name={['children', 0, 'language']}>
            <Input placeholder="input language" />
          </Field>
          <Field name={['children', 1, 'level']}>
            <Input placeholder="input level" />
          </Field>
        </Form>
        <br />
        <br />
        <button type="button" onClick={this.setFieldsValueByPath}>
          setFieldsValueByPath
        </button>
      </div>
    );
  }
}

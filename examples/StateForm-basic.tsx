import React from 'react';
import StateForm, { Field } from '../src/';
import Input from './components/Input';


const list = new Array(1111).fill(() => null);

export default class Demo extends React.Component {
  public state = {};

  public render() {
    return (
      <div>
        <h3>State Form ({list.length} inputs)</h3>
        <StateForm>
          <Field name="username">
            <Input placeholder="Username" />
          </Field>
          <Field name="password">
            <Input placeholder="Password" />
          </Field>
          <Field name="username">
            <Input placeholder="Shadow of Username" />
          </Field>
          <Field name={['path1', 'path2']}>
            <Input placeholder="nest" />
          </Field>
          <Field name={['renderProps']}>
            {control => (
              <div>
                I am render props
                <Input {...control} placeholder="render props" />
              </div>
            )}
          </Field>

          <h4>Show additional field when `username` is `111`</h4>
          <Field dependencies={['username']}>
            {(control, meta, context) => {
              const { username } = context.getFieldsValue();
              console.log('my render!', username);
              return username === '111' && <Input {...control} placeholder="I am secret!" />;
            }}
          </Field>

          {list.map((_, index) => (
            <Field key={index} name={`field_${index}`}>
              <Input placeholder={`field_${index}`} />
            </Field>
          ))}
        </StateForm>
      </div>
    );
  }
}

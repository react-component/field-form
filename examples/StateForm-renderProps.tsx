/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import Form from '../src';
import Input from './components/Input';

const { Field } = Form;

const list = new Array(1111).fill(() => undefined);

export default class Demo extends React.Component {
  state = {};

  render() {
    return (
      <div>
        <h3>Render Props ({list.length} inputs)</h3>
        <p>Render Props is easy to use but bad performance</p>
        <Form>
          {(values) => {
            return (
              <React.Fragment>
                {JSON.stringify(values, null, 2)}
                <Field name="field_1">
                  <Input placeholder="Field 1" />
                </Field>
                <Field name="field_1">
                  <Input placeholder="Shadow of Field 1" />
                </Field>
                <Field name="field_2">
                  <Input placeholder="Field 2" />
                </Field>

                <h4>Show additional field when field 1 is `222`</h4>
                {values.field_1 === '222' ? (
                  <Field name="secret">
                    <Input placeholder="Field Secret!" />
                  </Field>
                ) : 'Nothing yet...'}

                <Field name="bad">
                  {(control) => {
                    return (
                      <div>
                        Field Render Props: <Input {...control} />
                      </div>
                    );
                  }}
                </Field>

                {list.map((_, index) => (
                  <Field key={index} name={`list_field_${index}`}>
                    <Input placeholder={`list_field_${index}`} />
                  </Field>
                ))}
              </React.Fragment>
            );
          }}
        </Form>
      </div>
    );
  }
}

/* eslint-disable react/prop-types */

import React from 'react';
import { connect, Provider } from 'react-redux';
import { createStore } from 'redux';
import Form from 'rc-field-form';
import Input from './components/Input';
import LabelField from './components/LabelField';

function formReducer(fields = [], action: any) {
  switch (action.type) {
    case 'updateFields':
      return [...action.fields];
    default:
      return fields;
  }
}

const store = createStore(formReducer);

let App: any = ({ dispatch, fields }) => {
  console.log('=>', fields);

  return (
    <Form
      fields={fields}
      onValuesChange={(changedValues, allValues) => {
        console.log('Value Change:', changedValues, allValues);
      }}
      onFieldsChange={(changedFields, allFields) => {
        console.log('Field Change:', changedFields, allFields);
        dispatch({
          type: 'updateFields',
          fields: allFields,
        });
      }}
    >
      <h3>Redux Form</h3>
      <p>It is no need to put data into redux store. But you can still do this.</p>

      <LabelField name="field">
        <Input />
      </LabelField>

      <LabelField name="required" rules={[{ required: true }]}>
        <Input placeholder="required" />
      </LabelField>

      <button
        type="button"
        onClick={() => {
          dispatch({
            type: 'updateFields',
            fields: [
              {
                name: 'field',
                value: 'redux it!',
                touched: false,
                validating: true,
              },
              {
                name: 'required',
                value: 'HAS VALUE',
                touched: false,
                validating: false,
                errors: ['Have a good time!'],
              },
            ],
          });
        }}
      >
        dispatch to change
      </button>
    </Form>
  );
};
App = connect((fields: any) => ({ fields }))(App);

const Demo = () => (
  <Provider store={store}>
    <App />
  </Provider>
);

export default Demo;

import React from 'react';
import get from 'lodash/get';

import Form, { Field } from 'rc-field-form';
import Input from './components/Input';

const Child = ({ name, remove }: { name: any; remove: () => void }) => {
  // console.log('22', name);
  const nameValue = Form.useWatch(values => {
    console.log('name', name);
    return get(values, ['list', name, 'name']);
  });
  // const nameValue2 = Form.useWatch(['list', name, 'name']);

  return (
    <div style={{ display: 'flex' }}>
      <Field name={[name, 'name']}>
        <Input />
      </Field>
      <div>当前值：{nameValue}</div>
      {/* <div>当前值2：{nameValue2}</div> */}
      <button onClick={() => remove()}>删除</button>
    </div>
  );
};

const Demo = () => {
  return (
    <Form initialValues={{ list: [{ name: 'a' }, { name: 'b' }] }}>
      <Form.List name="list">
        {(fields, { remove }) => (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {fields.map(field => (
              <Child name={field.name} key={field.key} remove={() => remove(field.name)} />
            ))}
          </div>
        )}
      </Form.List>
    </Form>
  );
};

export default Demo;

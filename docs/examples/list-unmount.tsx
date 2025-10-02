import React, { useState } from 'react';
import Form from 'rc-field-form';
import Input from './components/Input';
import LabelField from './components/LabelField';

const Demo = () => {
  const [form] = Form.useForm();
  const [isShow, setIsShow] = useState(true);

  return (
    <div>
      <Form
        form={form}
        onFinish={values => {
          console.log(JSON.stringify(values, null, 2));
          console.log(JSON.stringify(form.getFieldsValue({ strict: true }), null, 2));
        }}
        initialValues={{
          users: [
            { name: 'a', age: '1' },
            { name: 'b', age: '2' },
          ],
        }}
      >
        <Form.Field shouldUpdate>{() => JSON.stringify(form.getFieldsValue(), null, 2)}</Form.Field>

        <Form.List name="users">
          {fields => {
            return (
              <div>
                {fields.map(field => (
                  <div key={field.key} style={{ display: 'flex', gap: 10 }}>
                    <LabelField name={[field.name, 'name']}>
                      <Input />
                    </LabelField>
                    {isShow && (
                      <LabelField name={[field.name, 'age']}>
                        <Input />
                      </LabelField>
                    )}
                  </div>
                ))}
              </div>
            );
          }}
        </Form.List>
        <button type="button" onClick={() => setIsShow(c => !c)}>
          隐藏
        </button>
        <button type="submit">Submit</button>
      </Form>
    </div>
  );
};

export default Demo;

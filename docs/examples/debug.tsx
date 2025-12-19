import Form, { Field } from 'rc-field-form';
import React from 'react';
import Input from './components/Input';

export default function App() {
  const [form] = Form.useForm();
  const names = Form.useWatch('names', form);

  console.log('[Antd V6] names:', names);

  return (
    <div
      style={{
        padding: 24,
        border: '2px solid #1890ff',
        borderRadius: 8,
        marginBottom: 24,
      }}
    >
      <h2 style={{ color: '#1890ff' }}>Antd V6 - useWatch + Form.List</h2>

      <Form form={form} style={{ maxWidth: 600 }} initialValues={{
        names: [
          'aaa',
          'bbb'
        ]
      }}>
        <Form.List name="names">
          {(fields, { add, remove }) => {
            return (
              <>
                {fields.map(({key, ...field}, index) => (
                  <div key={key}>
                    <Field {...field}>
                      <Input placeholder="用户名" style={{ width: 200 }} />
                    </Field>
                    <button type="button" onClick={() => remove(index)}>
                      删除
                    </button>
                  </div>
                ))}

                  <div>
                    <button type="button" onClick={() => add()}>
                      + 添加用户
                    </button>
                    <button onClick={() => remove(1)}>删除索引 1</button>
                  </div>
              </>
            );
          }}
        </Form.List>
      </Form>
    </div>
  );
}

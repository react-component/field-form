import React from 'react';
import Form from 'rc-field-form';

export default () => {

  const [form] = Form.useForm();
  const [, forceUpdate] = React.useState({});

  return (
    <div>
      <Form
        form={form}
        style={{ padding: 20 }}
        initialValues={{
          usename: '123',
          list: [
            {},
          ],
        }}
      >
        <Form.Field name="username">
          <input />
        </Form.Field>
        <div style={{ paddingLeft: 20 }}>
          <Form.List name="list">
            {(fields, { add }) => (
              <>
                {
                  fields.map((field) => {
                    return (
                      <div key={field.key}>
                        <div>
                          <Form.Field name={[field.name, 'field1']}>
                            <input placeholder="field1" />
                          </Form.Field>
                        </div>
                        <div>
                          <Form.Field name={[field.name, 'field2']}>
                            <input placeholder="field2" />
                          </Form.Field>
                        </div>
                      </div>
                    );
                  })
                }
                <button onClick={() => add()}>add</button>
              </>
            )}
          </Form.List>
        </div>
        <div>
          <button
            onClick={() => {
              forceUpdate({});
            }}
          >forceUpdate</button>
          <button
            onClick={() => form.resetFields()}
          >reset</button>
        </div>
        <div>form.isFieldsTouched(true): {`${form.isFieldsTouched(true)}`}</div>
        <div>{`form.isFieldsTouched(['list'], true)`}: {`${form.isFieldsTouched(['list'], true)}`}</div>
      </Form>
    </div>
  );
}
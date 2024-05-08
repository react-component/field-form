import React from 'react';
import Form from 'rc-field-form';
import Input from './components/Input';
import { isEqual } from 'lodash';

const ChildrenContent = (props: { name: number }) => {

  const { name } = props;

  const scopedForm = Form.useFormInstance({ scope: true });
  const college = Form.useWatch([name, 'college'], scopedForm);
  const location = Form.useWatch([name, 'location'], { scope: true });
  const [, forceUpdate] = React.useState({});

  React.useEffect(() => {
    scopedForm.setFieldValue([name, 'nonexistent'], 'nonexistent');
  }, [scopedForm, name]);

  return (
    <div style={{ marginBottom: 16 }}>
      <div>
        <Form.Field
          name={[name, 'college']}
          rules={[
            {
              required: true,
              message: 'college is required',
            },
          ]}
        >
          <Input placeholder="College" />
        </Form.Field>
        <span>{college}</span>
      </div>
      <div>
        <Form.Field
          name={[name, 'location']}
          rules={[
            { required: true, message: 'location is required' },
          ]}
        >
          <Input placeholder="Location" />
        </Form.Field>
        <span>{location}</span>
      </div>
      <div>
        <Form.Field
          name={[name, 'field0']}
          valuePropName="checked"
        >
          <input type="checkbox" />
        </Form.Field>
        Checked
      </div>
      <div>
        <Form.Field
          shouldUpdate
        >
          {
            () => {
              if (scopedForm.getFieldValue([name, 'field0'])) {
                return (
                  <Form.Field
                    name={[name, 'field1']}
                  >
                    <input type="text" />
                  </Form.Field>
                );
              }
              return null;
            }
          }
        </Form.Field>
      </div>
      <div>
        <button onClick={() => forceUpdate({})}>forceUpdate</button>
        <button onClick={() => scopedForm.resetFields()}>reset scoped form</button>
      </div>
      <div>
        <span>{`scopedForm.getFieldsValue({strict: true })：`}</span>
        <span>{`${JSON.stringify(scopedForm.getFieldsValue({ strict: true }))}`}</span>
      </div>
      <div>
        <span>scopedForm.getFieldsValue()：</span>
        <span>{`${JSON.stringify(scopedForm.getFieldsValue())}`}</span>
      </div>
      <div>
        <span>{`scopedForm.getFieldValue([name, 'location'])：`}</span>
        <span>{`${JSON.stringify(scopedForm.getFieldValue([name, 'location']))}`}</span>
      </div>
      <div>
        <span>{`scopedForm.getFieldValue([name, 'nonexistent'])：`}</span>
        <span>{`${JSON.stringify(scopedForm.getFieldValue([name, 'nonexistent']))}`}</span>
      </div>
      <div>
        <span>{`scopedForm.getFieldsValue({ strict: true, filter: meta => isEqual(meta.name, [name, 'location']) })：`}</span>
        <span>{`${JSON.stringify(scopedForm.getFieldsValue({ strict: true, filter: meta => isEqual(meta.name, [name, 'location']) }))}`}</span>
      </div>
      <div>
        <span>{`scopedForm.getFieldsValue(true, meta => isEqual(meta.name, [name, 'location']))：`}</span>
        <span>{`${JSON.stringify(scopedForm.getFieldsValue(true, meta => isEqual(meta.name, [name, 'location'])))}`}</span>
      </div>
      <div>
        <span>{`scopedForm.isFieldsTouched(true)：`}</span>
        <span>{`${JSON.stringify(scopedForm.isFieldsTouched(true))}`}</span>
      </div>
      <div>
        <span>{`scopedForm.isFieldsTouched()：`}</span>
        <span>{`${JSON.stringify(scopedForm.isFieldsTouched())}`}</span>
      </div>
    </div>
  );
};

export default () => {
  const [form] = Form.useForm();
  console.log('rootForm', form);

  return (
    <div>
      <Form
        form={form}
        initialValues={{
          educations: [
            {
              college: 'Ant Design',
            },
          ],
        }}
      >
        <>
          <Form.Field name="name">
            <Input placeholder="Name" />
          </Form.Field>
          <Form.Field name="age">
            <Input placeholder="Age" />
          </Form.Field>
          <Form.List
            name="educations"
          >
            {
              (fields, { add }) => (
                <div style={{ paddingLeft: 16 }}>
                  <h2 style={{ marginBottom: 8 }}>Colleges</h2>
                  {
                    fields.map(field => {
                      return (
                        <ChildrenContent key={field.key} name={field.name} />
                      );
                    })
                  }
                  <button
                    onClick={() => add()}
                  >Add education</button>
                </div>
              )
            }
          </Form.List>
        </>
      </Form>
    </div>
  );
};

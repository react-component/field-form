import React from 'react';
import Form, { Field, FormInstance } from 'rc-field-form';
import Input from './components/Input';

export default () => {
  const [form] = Form.useForm();
  const [show, setShow] = React.useState(true);
  const [timeoutShow, setTimeoutShow] = React.useState(show);

  React.useEffect(() => {
    if (show) {
      console.log(
        'show',
      );
      form.setFieldsValue({
        name: '123',
      });
    }

    const id = setTimeout(() =>{
      setTimeoutShow(show);
    }, 300);

    return () => clearTimeout(id);
  }, [show]);



  return (
    <>
      <button onClick={() =>{
        setShow(!show);
      }}>Trigger</button>
      {
        timeoutShow && <Form form={form}>
          <Form.Field name="name">
            <Input />
          </Form.Field>
        </Form>
      }
    </>
  );
};

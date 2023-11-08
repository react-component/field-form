import Form, { Field } from 'rc-field-form';
import React from 'react';
import Input from './components/Input';

const Divider = (props: React.PropsWithChildren) => (
  <div
    style={{
      background: '#999',
      color: "#fff",
      textAlign: 'center',
    }}
  >
    <span>🔽🔽🔽</span>
    {props.children}
    <span>🔽🔽🔽</span>
  </div>
)

interface CustomValue {
  timestamp: number,
  date: Date,
  formatted: string,
}

type FormData = {
  // Input
  text?: string; // default

  // ========== 🔽 event.target.checked
  checkbox?: boolean;
  radio?: boolean;
  // ========== 🔽 event.target.valueAsNumber
  number?: number;
  range?: number;
  // ========== 🔽 event.target.files
  file?: FileList;

  // ========== 🔽 event.target.value（default）!!!
  password?: string;
  search?: string;
  email?: string;
  url?: string;
  tel?: string;
  date?: number;
  time?: string;
  dateTimeLocal?: string;
  week?: string;
  month?: string;
  color?: string;

  // Select
  select?: string;
  // Textarea
  textarea?: string;

  // Custom
  custom?: CustomValue;
};


function App() {
  const [form] = Form.useForm();

  const initialValues: FormData = {
    url: 'https://github.com/react-component/field-form',
    email: 'wxh16144@users.noreply.github.com',
  }

  return (
    <Form
      form={form}
      preserve={false}
      initialValues={initialValues}
      onFinish={values => {
        console.log('Finish:', values);
      }}
      onFieldsChange={fields => {
        console.error('fields:', fields);
      }}
    >
      <Field<FormData> name="text">
        <Input type="text" placeholder='Text' />
      </Field>


      <Divider>event.target.checked</Divider>

      <Field<FormData> name="checkbox">
        <Input type="checkbox" placeholder='Checkbox' />
      </Field>

      <Field<FormData> name="radio">
        <Input type="radio" placeholder='Radio' />
      </Field>

      <Divider>event.target.valueAsNumber</Divider>

      <Field<FormData> name="number">
        <Input type="number" placeholder='Number' />
      </Field>

      <Field<FormData> name="range">
        <Input type="range" placeholder='Range' />
      </Field>

      <Divider>event.target.files</Divider>

      <Field<FormData> name="file">
        <Input type="file" placeholder='File' />
      </Field>

      <Divider>event.target.value <span style={{ color: 'red' }}>default</span>!!!</Divider>

      <Field<FormData> name="password">
        <Input type="password" placeholder='Password' />
      </Field>

      <Field<FormData> name="search">
        <Input type="search" placeholder='Search' />
      </Field>

      <Field<FormData> name="email">
        <Input type="email" placeholder='Email' />
      </Field>

      <Field<FormData> name="url">
        <Input type="url" placeholder='Url' />
      </Field>

      <Field<FormData> name="tel">
        <Input type="tel" placeholder='Tel' />
      </Field>

      <Field<FormData> name="date">
        <Input type="date" placeholder='Date' />
      </Field>

      <Field<FormData> name="dateTimeLocal">
        <Input type="datetime-local" placeholder='DatetimeLocal' />
      </Field>

      <Field<FormData> name="time">
        <Input type="time" placeholder='Time' />
      </Field>

      <Field<FormData> name="week">
        <Input type="week" placeholder='Week' />
      </Field>

      <Field<FormData> name="month">
        <Input type="month" placeholder='Month' />
      </Field>

      <Field<FormData> name="color">
        <Input type="color" placeholder='Color' />
      </Field>

      {/* Select */}
      <Field<FormData> name="select">
        <select style={{ width: 180 }}>
          <option value="1">1</option>
          <option value="2">2</option>
        </select>
      </Field>

      <br />

      {/* Textarea */}
      <Field<FormData> name="textarea">
        <textarea placeholder="Textarea" />
      </Field>

      <Divider>Custom</Divider>

      <Field<FormData>
        name="custom"
        getValueFromEvent={(...[event]) => {
          return {
            timestamp: event.target.valueAsNumber,
            date: event.target.valueAsDate,
            formatted: event.target.value,
          } as CustomValue
        }}
        getValueProps={(value: CustomValue) => ({
          value: value?.formatted
        })}
      >
        <Input type="datetime-local" placeholder='DatetimeLocal' />
      </Field>

      <br />
      <button type="submit">Submit</button>
    </Form>
  );
}

export default App

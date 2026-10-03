import Form, { Field as OriginField } from 'rc-field-form';
import React from 'react';
import Input from './components/Input';
import type { FieldProps } from '../../src/Field';

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

function commonGetValueFromEvent(...args: any[]) {
  const event = args[0];

  /**
   * `target` is the element that triggered the event (e.g., the user clicked on)
   * `currentTarget` is the element that the event listener is attached to.
   */
  const nodeName = (event?.target?.nodeName ?? '').toLowerCase();

  if (nodeName === 'input') {
    const type = (event.target.type ?? 'text').toLowerCase();

    if (['checkbox', 'radio'].includes(type)) {
      return event.target.checked;
    }

    // `datetime` Obsolete
    if (['number', 'range'].includes(type)) {
      // https://caniuse.com/?search=valueAsNumber, support IE11+
      return event.target.valueAsNumber ?? event.target.value;
    }

    /**
     * Problems with backfilling the data collected, so it is not processed here
     * @see https://devlog.willcodefor.beer/pages/use-valueasnumber-and-valueasdate-on-inputs/
     * `datetime` Obsolete
     */
    // if (['date', 'datetime-local'].includes(type)) {
    //   const _value = {
    //     timestamp: event.target.valueAsNumber,
    //     date: event.target.valueAsDate,
    //     formatted: event.target.value,
    //   }
    // }

    // if (type === 'file') {
    //   return event.target.files;
    // }

    /**
     * text password search email url week month tel color time
     * [submit, reset, button, image, hidden] ?? i dont care :)
     */
    return event.target.value; // valuePropName default is 'value'
  }

  if (['textarea', 'select'].includes(nodeName)) {
    return event.target.value;
  }

  return event;
}

function Field<Values = any>(props: FieldProps<Values>) {
  return (
    <OriginField<Values>
      getValueFromEvent={commonGetValueFromEvent}
      {...props}
    />
  )
}


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

      <Divider>event.target.value</Divider>

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

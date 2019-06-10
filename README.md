# rc-field-form

React Performance First Form Component.

[![NPM version][npm-image]][npm-url]
[![build status][circleci-image]][circleci-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![node version][node-image]][node-url]
[![npm download][download-image]][download-url]

[npm-image]: http://img.shields.io/npm/v/rc-field-form.svg?style=flat-square
[npm-url]: http://npmjs.org/package/rc-field-form
[circleci-image]: https://img.shields.io/circleci/build/github/react-component/field-form/master.svg?style=flat-square
[circleci-url]: https://circleci.com/gh/react-component/field-form/tree/master
[coveralls-image]: https://img.shields.io/codecov/c/github/react-component/field-form/master.svg?style=flat-square
[coveralls-url]: https://codecov.io/gh/react-component/field-form
[node-image]: https://img.shields.io/badge/node.js-%3E=_6.0-green.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[download-image]: https://img.shields.io/npm/dm/rc-field-form.svg?style=flat-square
[download-url]: https://npmjs.org/package/rc-field-form

## Development

```bash
npm install
npm start
open http://localhost:9001/
```

## Feature

- Support react.js and even react-native
- Validate fields with [async-validator](https://github.com/yiminghe/async-validator/)

## Install

[![rc-field-form](https://nodei.co/npm/rc-field-form.png)](https://npmjs.org/package/rc-field-form)

## Usage

```js
import Form, { Field } from 'rc-field-form';

<StateForm
  onFinish={values => {
    console.log('Finish:', values);
  }}
>
  <Field name="username">
    <Input placeholder="Username" />
  </Field>
  <Field name="password">
    <Input placeholder="Password" />
  </Field>

  <button>Submit</button>
</StateForm>;

export default Demo;
```

# API

We use typescript to create the Type definition. You can view directly in IDE.
But you can still check the type definition [here](https://github.com/react-component/field-form/blob/master/src/interface.ts).

## Form

| Prop           | Description                                        | Type                             | Default          |
| -------------- | -------------------------------------------------- | -------------------------------- | ---------------- |
| fields         | Control Form fields status. Only use when in Redux | FieldData[]                      | -                |
| form           | Set form instance created by `useForm`             | FormInstance                     | `Form.useForm()` |
| initialValues  | Initial value of Form                              | Object                           | -                |
| onFieldsChange | Trigger when any value of Field changed            | (changedFields, allFields): void | -                |
| onValuesChange | Trigger when any value of Field changed            | (changedValues, values): void    | -                |

## Field

| Prop            | Description                             | Type                                     | Default  |
| --------------- | --------------------------------------- | ---------------------------------------- | -------- |
| name            | Field name path                         | string \| number \| (string \| number)[] | -        |
| rules           | Validate rules                          | Rule[]                                   | -        |
| shouldUpdate    | Check if Field should update            | (prevValues, nextValues): boolean        | -        |
| trigger         | Collect value update by event trigger   | string                                   | onChange |
| validateTrigger | Config trigger point with rule validate | string \| string[]                       | onChange |

## List

| Prop     | Description                     | Type                                                         | Default |
| -------- | ------------------------------- | ------------------------------------------------------------ | ------- |
| name     | List field name path            | string \| number \| (string \| number)[]                     | -       |
| children | Render props for listing fields | (fields: ListField[], operations: ListOperations): ReactNode | -       |

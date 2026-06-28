<div align="center">
  <h1>@rc-component/form</h1>
  <p><sub><img alt="Ant Design" height="14" src="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg" style="vertical-align: -0.125em;" /> Ant Design 生态的一部分。</sub></p>
  <p>📝 面向 React 的高性能表单状态管理组件。</p>

  <p>
    <a href="https://npmjs.org/package/@rc-component/form"><img alt="NPM version" src="https://img.shields.io/npm/v/@rc-component/form.svg?style=flat-square"></a>
    <a href="https://npmjs.org/package/@rc-component/form"><img alt="npm downloads" src="https://img.shields.io/npm/dm/@rc-component/form.svg?style=flat-square"></a>
    <a href="https://github.com/react-component/field-form/actions/workflows/main.yml"><img alt="build status" src="https://github.com/react-component/field-form/actions/workflows/main.yml/badge.svg"></a>
    <a href="https://codecov.io/gh/react-component/field-form/branch/master"><img alt="Codecov" src="https://img.shields.io/codecov/c/github/react-component/field-form/master.svg?style=flat-square"></a>
    <a href="https://bundlephobia.com/package/@rc-component/form"><img alt="bundle size" src="https://img.shields.io/bundlephobia/minzip/@rc-component/form?style=flat-square"></a>
    <a href="https://github.com/umijs/dumi"><img alt="dumi" src="https://img.shields.io/badge/docs%20by-dumi-blue?style=flat-square"></a>
  </p>
</div>

<p align="center"><a href="./README.md">English</a> | 简体中文</p>


## 特性

| 范围 | 支持 |
| ---------- | ------------------------------------------------------------------ |
| 状态      | 字段级订阅、受控字段和初始值       |
| 验证 | 由 `@rc-component/async-validator` 支持的基于规则的验证   |
| 结构  | 嵌套名称、列表、依赖和保留控制        |
| 接口       | `Form`、`Field`、`List`、`FormProvider`、`useForm` 和 `useWatch` |
| 运行时    | 兼容 React DOM 和 React Native 的表单状态模型               |

## 安装

```bash
npm install @rc-component/form
```

该包过去以 `rc-field-form` 名称记录；新安装请使用 `@rc-component/form`。

## 使用

```tsx | pure
import Form, { Field } from '@rc-component/form';

const Input = ({ value = '', ...props }) => <input value={value} {...props} />;

const Demo = () => {
  return (
    <Form
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
    </Form>
  );
};

export default Demo;
```

## 示例

运行本地 dumi 站点：

```bash
npm install
npm start
```

然后打开 `http://localhost:8000`。

## 🔥 API

我们使用 TypeScript 生成类型定义，可直接在 IDE 中查看，也可以查看[这里](https://github.com/react-component/field-form/blob/master/src/interface.ts)的类型定义。

### Form

| 属性 | 说明 | 类型 | 默认值 |
| ---------------- | -------------------------------------------------- | -------------------------------------------- | ---------------- |
| component        | 自定义表单渲染组件                    | string \| Component \| false                 | form             |
| fields           | 控制 Form 字段状态，仅在 Redux 等外部状态场景使用 | [FieldData](#fielddata)[]                    | -                |
| form             | 设置由 `useForm` 创建的表单实例             | [FormInstance](#useform)                     | `Form.useForm()` |
| initialValues    | 表单初始值                              | Object                                       | -                |
| name             | 配合 [FormProvider](#formprovider) 使用的表单名称     | string                                       | -                |
| preserve         | 删除字段后保留值                  | boolean                                      | false            |
| validateMessages | 设置验证消息模板                      | [ValidateMessages](#validatemessages)        | -                |
| onFieldsChange   | 任意字段状态变化时触发            | (changedFields, allFields) => void           | -                |
| onFinish         | 表单提交成功时触发               | (values) => void                             | -                |
| onFinishFailed   | 表单提交失败时触发                | ({ values, errorFields, outOfDate }) => void | -                |
| onValuesChange   | 任意字段值变化时触发            | (changedValues, values) => void              | -                |

### Field

| 属性 | 说明 | 类型 | 默认值 |
| ----------------- | ----------------------------------------------------------------------------- | ---------------------------------------------- | -------- |
| dependencies      | 如果依赖项发生变化，将重新渲染                                        | [NamePath](#namepath)[]                        | -        |
| getValueFromEvent | 指定如何从事件中获取值                                           | (..args: any[]) => any                         | -        |
| getValueProps     | 基于值自定义额外 props。该属性会禁用 `valuePropName` | (value) => any                                 | -        |
| initialValue      | 字段初始值                                                           | any                                            | -        |
| name              | 字段名称路径                                                               | [NamePath](#namepath)                          | -        |
| normalize         | 更新前标准化值                                                 | (value, prevValue, prevValues) => any          | -        |
| preserve          | 删除字段后保留值                                             | boolean                                        | false    |
| rules             | 验证规则                                                                | [Rule](#rule)[]                                | -        |
| shouldUpdate      | 检查字段是否应该更新                                                  | boolean \| (prevValues, nextValues) => boolean | -        |
| trigger           | 通过事件触发收集值更新                                         | string                                         | onChange |
| validateTrigger   | 使用规则验证配置触发点                                       | string \| string[]                             | onChange |
| valuePropName     | 配置元素中映射值的 prop                                        | string                                         | value    |

### List

| 属性 | 说明 | 类型 | 默认值 |
| -------- | ------------------------------- | ------------------------------------------------------------------------------------------------------- | ------- |
| name     | 列表字段名称路径            | [NamePath](#namepath)[]                                                                                 | -       |
| children | 列表字段的渲染函数 | (fields: { name: [NamePath](#namepath) }[], operations: [ListOperations](#listoperations)) => ReactNode | -       |

### useForm

Form 组件默认通过 `Form.useForm` 创建表单实例。你也可以手动创建实例并传给 Form，从而直接调用表单实例上的方法。

```jsx | pure
const Demo = () => {
  const [form] = Form.useForm();
  return <Form form={form} />;
};
```

对于类组件用户，可以使用 `ref` 来获取表单实例：

```jsx | pure
class Demo extends React.Component {
  setRef = form => {
    // Form instance here
  };
  render() {
    return <Form ref={this.setRef} />;
  }
}
```

| 属性              | 说明                                | 类型                                                                       |
| ----------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| getFieldValue     | 通过名称路径获取字段值               | (name: [NamePath](#namepath)) => any                                       |
| getFieldsValue    | 按名称路径列表获取字段值列表 | (nameList?: ([NamePath](#namepath)[]) => any) \| true                      |
| getFieldError     | 按名称路径获取字段错误              | (name: [NamePath](#namepath)) => string[]                                  |
| getFieldsError    | 按名称路径列表获取字段错误列表 | (nameList?: [NamePath](#namepath)[]) => FieldError[]                       |
| isFieldsTouched   | 检查字段列表是否被触及        | (nameList?: [NamePath](#namepath)[], allTouched?: boolean) => boolean      |
| isFieldTouched    | 检查某个字段是否被触摸                | (name: [NamePath](#namepath)) => boolean                                   |
| isFieldValidating | 检查字段是否正在校验             | (name: [NamePath](#namepath)) => boolean                                   |
| resetFields       | 重置字段状态                        | (fields?: [NamePath](#namepath)[]) => void                                 |
| setFields         | 设置字段状态                          | (fields: FieldData[]) => void                                              |
| setFieldsValue    | 设置字段值                           | (values) => void                                                           |
| submit            | 触发表单提交                        | () => void                                                                 |
| validateFields    | 触发字段进行验证                 | (nameList?: [NamePath](#namepath)[], options?: ValidateOptions) => Promise |

### FormProvider

| 属性 | 说明 | 类型 | 默认值 |
| ---------------- | ----------------------------------------- | ---------------------------------------- | ------- |
| validateMessages | 配置全局`validateMessages`模板 | [ValidateMessages](#validatemessages)    | -       |
| onFormChange     | 命名表单字段变化时触发       | (name, { changedFields, forms }) => void | -       |
| onFormFinish     | 命名表单提交完成时触发       | (name, { values, forms }) => void        | -       |

## 📋 Interface

### NamePath

| 类型                                     |
| ---------------------------------------- |
| 字符串\|数字\| (字符串\|数字)[] |

### FieldData

| 属性       | 类型                                     |
| ---------- | ---------------------------------------- |
| touched    | boolean                                  |
| validating | boolean                                  |
| errors     | string[]                                 |
| name       | 字符串\|数字\| (字符串\|数字)[] |
| value      | any                                      |

### Rule

| 属性            | 类型                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------- |
| enum            | any[]                                                                                           |
| len             | number                                                                                          |
| max             | number                                                                                          |
| message         | string                                                                                          |
| min             | number                                                                                          |
| pattern         | RegExp                                                                                          |
| required        | boolean                                                                                         |
| transform       | (value) => any                                                                                  |
| type            | string                                                                                          |
| validator       | ([rule](#rule), value, callback: (error?: string) => void, [form](#useform)) => Promise \| void |
| whitespace      | boolean                                                                                         |
| validateTrigger | string \| string[]                                                                              |

#### validator

为了与 `validator` 的 `rc-form` 旧用法保持同步，我们仍然提供 `callback` 来触发验证完成。但在 `rc-field-form` 中，我们强烈建议返回 Promise。

### ListOperations

| 属性   | 类型                     |
| ------ | ------------------------ |
| add    | (initValue: any) => void |
| remove | (index: number) => void |

### ValidateMessages

验证消息提供错误模板列表。您可以参考[此处](https://github.com/react-component/field-form/blob/master/src/utils/messages.ts)以获得完全默认的模板。

| 属性    | 说明         |
| ------- | ------------------- |
| enum    | Rule 的 `enum` 属性    |
| len     | Rule 的 `len` 属性     |
| max     | Rule 的 `max` 属性     |
| min     | Rule 的 `min` 属性     |
| name    | 字段名称          |
| pattern | Rule 的 `pattern` 属性 |
| type    | Rule 的 `type` 属性    |

## 与 `rc-form` 的差异

`rc-field-form` 尝试在 api 级别与 `rc-form` 保持同步，但仍有一些需要更改的地方：

### 1. 未操作过的 Field 不会再与 `initialValues` 保持同步

在 `rc-form` 中，如果用户不对其进行操作，字段值将从 `initialValues` 获取。
这是一个错误，但用户将其用作一项功能，这使得修复将是一个重大更改，我们必须保留它。
在 Field Form 中，这个问题不再存在。如果要更改字段值，请改用 `setFieldsValue`。

### 2. 移除 Field 不会清理对应值

过去我们在 Field 删除时清理对应值。但根据用户反馈，清理已有值会给条件字段保留值的场景增加额外成本。

### 3. 嵌套 name 使用数组而不是字符串

在 `rc-form` 中，我们支持像 `user.name` 这样的名称并将值转换为 `{ user: { name: 'Bamboo' } }`。这使得“.”始终是变量的路径，这使得开发人员必须做额外的工作，如果名称是真实的，其中包含像 `app.config.start` 这样的点，则必须在提交时解析回该点。

Field Form 只会将 `['user', 'name']` 转换为 `{ user: { name: 'Bamboo' } }`，而 `user.name` 会转换为 `{ ['user.name']: 'Bamboo' }`。

### 4. 移除 `validateFieldsAndScroll`

由于 `findDomNode` 在 [StrictMode](https://reactjs.org/docs/strict-mode.html#warning-about-deprecated-finddomnode-usage) 中被标记为警告。这已经超出了 Form 组件本身的控制范围。
我们决定删除 `validateFieldsAndScroll` 方法，您应该用自己的逻辑处理它：

```jsx | pure
<Form>
  <Field name="username">
    <input ref={this.inputRef} />
  </Field>
</Form>
```

### 5. `getFieldsError` 始终返回数组

当没有错误发生时，`rc-form` 返回`null`。这使得用户必须执行一些额外的代码，例如：

```js | pure
(form.getFieldsError('fieldName') || []).forEach(() => {
  // Do something...
});
```

现在如果没有错误，`getFieldsError` 将返回 `[]`。

### 6. 移除 `validateFields` 的 `callback`

由于 ES8 支持 `async/await`，所以没有理由不使用它。现在您可以轻松处理您的验证逻辑：

```js | pure
async function() {
  try {
    const values = await form.validateFields();
    console.log(values);
  } catch (errorList) {
    errorList.forEach(({ name, errors }) => {
      // Do something...
    });
  }
}
```

**注意：现在，如果您的验证器返回 `Error(message)`，则不需要通过 `e => e.message` 获得错误。 FieldForm 将处理这个问题。**

### 7. `preserve` 默认值为 false

在 `rc-form` 中，您应该使用 `preserve` 来保留值，因为表单会自动从删除的字段中删除值。无论字段被删除，字段表单将始终将值保留在表单中。但您仍然可以使用 `preserve=false` 来禁用自 `1.5.0` 以来的值保留。

### 8. `setFields` 不触发 `onFieldsChange`，`setFieldsValue` 不触发 `onValuesChange`

在 `rc-form` 中，我们希望通过设置使 redux 调度更容易来帮助用户自动触发更改事件，但这不是一个好的设计，因为它使代码逻辑耦合。

此外，用户控制更新触发`onFieldsChange`和`onValuesChange`事件具有潜在的死循环风险。

## 本地开发

```bash
npm install
npm start
npm test
npm run lint
npm run tsc
npm run compile
npm run build
```

dumi 站点默认运行在 `http://localhost:8000`。

## 发布

```bash
npm run prepublishOnly
```

包构建完成后，发布流程由 `@rc-component/np` 通过 `rc-np` 命令处理。

## 许可证

@rc-component/form 基于 [MIT](./LICENSE) 许可证发布。

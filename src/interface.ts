import { ReactElement } from 'react';
import { ReducerAction } from './useForm';

export type InternalNamePath = (string | number)[];
export type NamePath = string | number | InternalNamePath;

export type BaseFormProps = Omit<
  React.FormHTMLAttributes<HTMLFormElement>,
  'onSubmit'
>;

export type RenderProps = (
  values: Store,
  form: FormInstance,
) => JSX.Element | React.ReactNode;

export interface FormProps extends BaseFormProps {
  initialValues?: Store;
  form?: FormInstance;
  children?: RenderProps | React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: false | string | React.FC<any> | React.ComponentClass<any>;
  fields?: FieldData[];
  name?: string;
  validateMessages?: ValidateMessages;
  onValuesChange?: Callbacks['onValuesChange'];
  onFieldsChange?: Callbacks['onFieldsChange'];
  onFinish?: Callbacks['onFinish'];
  onFinishFailed?: Callbacks['onFinishFailed'];
}

export type StoreValue = any;
export interface Store {
  [name: string]: StoreValue;
}

export interface Forms {
  [name: string]: FormInstance;
}

export interface FormChangeInfo {
  changedFields: FieldData[];
  forms: Forms;
}

export interface FormFinishInfo {
  values: Store;
  forms: Forms;
}

export interface FormProviderProps {
  validateMessages?: ValidateMessages;
  onFormChange?: (name: string, info: FormChangeInfo) => void;
  onFormFinish?: (name: string, info: FormFinishInfo) => void;
}

export interface FormContextProps extends FormProviderProps {
  triggerFormChange: (name: string, changedFields: FieldData[]) => void;
  triggerFormFinish: (name: string, values: Store) => void;
  registerForm: (name: string, form: FormInstance) => void;
  unregisterForm: (name: string) => void;
}

export interface ListField {
  name: number;
  key: number;
}

export interface ListOperations {
  add: () => void;
  remove: (index: number) => void;
  move: (from: number, to: number) => void;
}

export interface ListProps {
  name: NamePath;
  children?: (
    fields: ListField[],
    operations: ListOperations,
  ) => JSX.Element | React.ReactNode;
}

export interface ChildProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [name: string]: any;
}

export interface FieldProps {
  children?:
    | React.ReactElement
    | ((
        control: ChildProps,
        meta: Meta,
        form: FormInstance,
      ) => React.ReactNode);
  /**
   * Set up `dependencies` field.
   * When dependencies field update and current field is touched,
   * will trigger validate rules and render.
   */
  dependencies?: NamePath[];
  getValueFromEvent?: (...args: EventArgs) => StoreValue;
  name?: NamePath;
  normalize?: (
    value: StoreValue,
    prevValue: StoreValue,
    allValues: Store,
  ) => StoreValue;
  rules?: Rule[];
  shouldUpdate?:
    | true
    | ((
        prevValues: Store,
        nextValues: Store,
        info: { source?: string },
      ) => boolean);
  trigger?: string;
  validateTrigger?: string | string[] | false;
  valuePropName?: string;
  onReset?: () => void;
}

export interface FieldState {
  reset: boolean;
}

export interface Meta {
  touched: boolean;
  validating: boolean;
  errors: string[];
  name: InternalNamePath;
}

/**
 * Used by `setFields` config
 */
export interface FieldData extends Partial<Omit<Meta, 'name'>> {
  name: NamePath;
  value?: StoreValue;
}

export type RuleType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'method'
  | 'regexp'
  | 'integer'
  | 'float'
  | 'object'
  | 'enum'
  | 'date'
  | 'url'
  | 'hex'
  | 'email';

type Validator = (
  rule: RuleObject,
  value: StoreValue,
  callback: (error?: string) => void,
) => Promise<void> | void;

export type RuleRender = (form: FormInstance) => RuleObject;

interface BaseRule {
  enum?: StoreValue[];
  len?: number;
  max?: number;
  message?: string | ReactElement;
  min?: number;
  pattern?: RegExp;
  required?: boolean;
  transform?: (value: StoreValue) => StoreValue;
  type?: RuleType;
  validator?: Validator;
  whitespace?: boolean;

  /** Customize rule level `validateTrigger`. Must be subset of Field `validateTrigger` */
  validateTrigger?: string | string[];
}

interface ArrayRule extends Omit<BaseRule, 'type'> {
  type: 'array';
  defaultField?: RuleObject;
}

export type RuleObject = BaseRule | ArrayRule;

export type Rule = RuleObject | RuleRender;

export interface ValidateErrorEntity {
  values: Store;
  errorFields: { name: InternalNamePath; errors: string[] };
  outOfDate: boolean;
}

export interface FieldEntity {
  onStoreChange: (
    store: Store,
    namePathList: InternalNamePath[] | null,
    info: NotifyInfo,
  ) => void;
  isFieldTouched: () => boolean;
  isFieldValidating: () => boolean;
  validateRules: (options?: ValidateOptions) => Promise<string[]>;
  getMeta: () => Meta;
  getNamePath: () => InternalNamePath;
  getErrors: () => string[];
  props: {
    name?: NamePath;
    rules?: Rule[];
    dependencies?: NamePath[];
  };
}

export interface FieldError {
  name: InternalNamePath;
  errors: string[];
}

export interface ValidateOptions {
  triggerName?: string;
  validateMessages?: ValidateMessages;
}

export type InternalValidateFields = (
  nameList?: NamePath[],
  options?: ValidateOptions,
) => Promise<Store>;
export type ValidateFields = (nameList?: NamePath[]) => Promise<Store>;

interface ValueUpdateInfo {
  type: 'valueUpdate';
  source: 'internal' | 'external';
}

export type NotifyInfo =
  | ValueUpdateInfo
  | {
      type: 'validateFinish' | 'reset';
    }
  | {
      type: 'setField';
      data: FieldData;
    }
  | {
      type: 'dependenciesUpdate';
      /**
       * Contains all the related `InternalNamePath[]`.
       * a <- b <- c : change `a`
       * relatedFields=[a, b, c]
       */
      relatedFields: InternalNamePath[];
    };

export interface Callbacks {
  onValuesChange?: (changedValues: Store, values: Store) => void;
  onFieldsChange?: (changedFields: FieldData[], allFields: FieldData[]) => void;
  onFinish?: (values: Store) => void;
  onFinishFailed?: (errorInfo: ValidateErrorEntity) => void;
}

export interface InternalHooks {
  dispatch: (action: ReducerAction) => void;
  registerField: (entity: FieldEntity) => () => void;
  useSubscribe: (subscribable: boolean) => void;
  setInitialValues: (values: Store, init: boolean) => void;
  setCallbacks: (callbacks: Callbacks) => void;
  getFields: (namePathList?: InternalNamePath[]) => FieldData[];
  setValidateMessages: (validateMessages: ValidateMessages) => void;
}

export interface FormInstance {
  // Origin Form API
  getFieldValue: (name: NamePath) => StoreValue;
  getFieldsValue: (nameList?: NamePath[]) => Store;
  getFieldError: (name: NamePath) => string[];
  getFieldsError: (nameList?: NamePath[]) => FieldError[];
  isFieldsTouched(nameList?: NamePath[], allFieldsTouched?: boolean): boolean;
  isFieldsTouched(allFieldsTouched?: boolean): boolean;
  isFieldTouched: (name: NamePath) => boolean;
  isFieldValidating: (name: NamePath) => boolean;
  isFieldsValidating: (nameList: NamePath[]) => boolean;
  resetFields: (fields?: NamePath[]) => void;
  setFields: (fields: FieldData[]) => void;
  setFieldsValue: (value: Store) => void;
  validateFields: ValidateFields;

  // New API
  submit: () => void;
}

export type InternalFormInstance = Omit<FormInstance, 'validateFields'> & {
  validateFields: InternalValidateFields;

  /**
   * Passed by field context props
   */
  prefixName?: InternalNamePath;

  /**
   * Form component should register some content into store.
   * We pass the `HOOK_MARK` as key to avoid user call the function.
   */
  getInternalHooks: (secret: string) => InternalHooks | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventArgs = any[];

type ValidateMessage = string | (() => string);
export interface ValidateMessages {
  default?: ValidateMessage;
  required?: ValidateMessage;
  enum?: ValidateMessage;
  whitespace?: ValidateMessage;
  date?: {
    format?: ValidateMessage;
    parse?: ValidateMessage;
    invalid?: ValidateMessage;
  };
  types?: {
    string?: ValidateMessage;
    method?: ValidateMessage;
    array?: ValidateMessage;
    object?: ValidateMessage;
    number?: ValidateMessage;
    date?: ValidateMessage;
    boolean?: ValidateMessage;
    integer?: ValidateMessage;
    float?: ValidateMessage;
    regexp?: ValidateMessage;
    email?: ValidateMessage;
    url?: ValidateMessage;
    hex?: ValidateMessage;
  };
  string?: {
    len?: ValidateMessage;
    min?: ValidateMessage;
    max?: ValidateMessage;
    range?: ValidateMessage;
  };
  number?: {
    len?: ValidateMessage;
    min?: ValidateMessage;
    max?: ValidateMessage;
    range?: ValidateMessage;
  };
  array?: {
    len?: ValidateMessage;
    min?: ValidateMessage;
    max?: ValidateMessage;
    range?: ValidateMessage;
  };
  pattern?: {
    mismatch?: ValidateMessage;
  };
}

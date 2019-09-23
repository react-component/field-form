import { ReactElement } from 'react';
import { ReducerAction } from './useForm';

export type InternalNamePath = (string | number)[];
export type NamePath = string | number | InternalNamePath;

export type StoreValue = any;
export interface Store {
  [name: string]: StoreValue;
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
  onStoreChange: (store: Store, namePathList: InternalNamePath[] | null, info: NotifyInfo) => void;
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

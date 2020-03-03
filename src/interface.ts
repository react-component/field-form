import { ReactElement } from 'react';
import { ReducerAction } from './useForm';

export type InternalNamePath = (string | number)[];
export type NamePath = string | number | InternalNamePath;

export type FormValue = unknown;
export type FormValues<T = FormValue> = Record<string, T>;
export type Store<T extends FormValues> = Partial<T>;
export type AnyFormValues = FormValues<unknown>;

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
  value?: FormValue;
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
  value: FormValue,
  callback: (error?: string) => void,
) => Promise<void> | void;

export type RuleRender<T extends FormValues> = (form: FormInstance<T>) => RuleObject;

interface BaseRule {
  enum?: unknown[];
  len?: number;
  max?: number;
  message?: string | ReactElement;
  min?: number;
  pattern?: string;
  required?: boolean;
  transform?: (value: FormValue) => FormValue;
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

export type Rule<T extends FormValues> = RuleObject | RuleRender<T>;

export interface ValidateErrorEntity<T extends FormValues> {
  values: T;
  errorFields: { name: InternalNamePath; errors: string[] }[];
  outOfDate: boolean;
}
export interface InvalidateFieldEntity {
  INVALIDATE_NAME_PATH: InternalNamePath;
}

export interface FieldEntity<T extends FormValues = AnyFormValues> {
  onStoreChange: (
    store: Store<T>,
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
    rules?: Rule<T>[];
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

export type InternalValidateFields<FormValues> = (
  nameList?: NamePath[],
  options?: ValidateOptions,
) => Promise<Partial<FormValues>>;
export type ValidateFields<FormValues> = (nameList?: NamePath[]) => Promise<FormValues>;

export interface ValueUpdateInfo {
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

export interface Callbacks<T extends FormValues> {
  onValuesChange?: (changedValues: Partial<T>, values: Partial<T>) => void;
  onFieldsChange?: (changedFields: FieldData[], allFields: FieldData[]) => void;
  onFinish?: (values: Partial<T>) => void;
  onFinishFailed?: (errorInfo: ValidateErrorEntity<T>) => void;
}

export interface InternalHooks<T extends FormValues> {
  dispatch: (action: ReducerAction) => void;
  registerField: (entity: FieldEntity<T>) => () => void;
  useSubscribe: (subscribable: boolean) => void;
  setInitialValues: (values: Partial<T>, init: boolean) => void;
  setCallbacks: (callbacks: Callbacks<T>) => void;
  getFields: (namePathList?: InternalNamePath[]) => FieldData[];
  setValidateMessages: (validateMessages: ValidateMessages) => void;
}

export interface FormInstance<T extends FormValues> {
  // Origin Form API
  getFieldValue: (name: NamePath) => FormValue;
  getFieldsValue: (
    nameList?: NamePath[] | true,
    filterFunc?: (meta: Meta) => boolean,
  ) => Partial<T>;
  getFieldError: (name: NamePath) => string[];
  getFieldsError: (nameList?: NamePath[]) => FieldError[];
  isFieldsTouched(nameList?: NamePath[], allFieldsTouched?: boolean): boolean;
  isFieldsTouched(allFieldsTouched?: boolean): boolean;
  isFieldTouched: (name: NamePath) => boolean;
  isFieldValidating: (name: NamePath) => boolean;
  isFieldsValidating: (nameList: NamePath[]) => boolean;
  resetFields: (fields?: NamePath[]) => void;
  setFields: (fields: FieldData[]) => void;
  setFieldsValue: (value: T) => void;
  validateFields: ValidateFields<T>;

  // New API
  submit: () => void;
}

export type InternalFormInstance<T extends FormValues> = Omit<FormInstance<T>, 'validateFields'> & {
  validateFields: InternalValidateFields<T>;

  /**
   * Passed by field context props
   */
  prefixName?: InternalNamePath;

  /**
   * Form component should register some content into store.
   * We pass the `HOOK_MARK` as key to avoid user call the function.
   */
  getInternalHooks: (secret: string) => InternalHooks<T>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventArgs = any[];

export type ValidateMessage = string | (() => string);
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

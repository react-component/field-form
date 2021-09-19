import type { ReactElement } from 'react';
import type { ReducerAction } from './useForm';

export type InternalNamePath = (string | number)[];
export type NamePath = string | number | InternalNamePath;

export type StoreValue = any;
export type Store = Record<string, StoreValue>;

export interface Meta {
  touched: boolean;
  validating: boolean;
  errors: string[];
  warnings: string[];
  name: InternalNamePath;
}

export interface InternalFieldData extends Meta {
  value: StoreValue;
}

/**
 * Used by `setFields` config
 */
export interface FieldData extends Partial<Omit<InternalFieldData, 'name'>> {
  name: NamePath;
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
) => Promise<void | any> | void;

export type RuleRender = (form: FormInstance) => RuleObject;

export interface ValidatorRule {
  warningOnly?: boolean;
  message?: string | ReactElement;
  validator: Validator;
}

interface BaseRule {
  warningOnly?: boolean;
  enum?: StoreValue[];
  len?: number;
  max?: number;
  message?: string | ReactElement;
  min?: number;
  pattern?: RegExp;
  required?: boolean;
  transform?: (value: StoreValue) => StoreValue;
  type?: RuleType;
  whitespace?: boolean;

  /** Customize rule level `validateTrigger`. Must be subset of Field `validateTrigger` */
  validateTrigger?: string | string[];
}

type AggregationRule = BaseRule & Partial<ValidatorRule>;

interface ArrayRule extends Omit<AggregationRule, 'type'> {
  type: 'array';
  defaultField?: RuleObject;
}

export type RuleObject = AggregationRule | ArrayRule;

export type Rule = RuleObject | RuleRender;

export interface ValidateErrorEntity<Values = any> {
  values: Values;
  errorFields: { name: InternalNamePath; errors: string[] }[];
  outOfDate: boolean;
}

export interface FieldEntity {
  onStoreChange: (
    store: Store,
    namePathList: InternalNamePath[] | null,
    info: ValuedNotifyInfo,
  ) => void;
  isFieldTouched: () => boolean;
  isFieldDirty: () => boolean;
  isFieldValidating: () => boolean;
  isListField: () => boolean;
  isList: () => boolean;
  isPreserve: () => boolean;
  validateRules: (options?: ValidateOptions) => Promise<RuleError[]>;
  getMeta: () => Meta;
  getNamePath: () => InternalNamePath;
  getErrors: () => string[];
  getWarnings: () => string[];
  props: {
    name?: NamePath;
    rules?: Rule[];
    dependencies?: NamePath[];
    initialValue?: any;
  };
}

export interface FieldError {
  name: InternalNamePath;
  errors: string[];
  warnings: string[];
}

export interface RuleError {
  errors: string[];
  rule: RuleObject;
}

export interface ValidateOptions {
  triggerName?: string;
  validateMessages?: ValidateMessages;
  /**
   * Recursive validate. It will validate all the name path that contains the provided one.
   * e.g. ['a'] will validate ['a'] , ['a', 'b'] and ['a', 1].
   */
  recursive?: boolean;
}

export type InternalValidateFields<Values = any> = (
  nameList?: NamePath[],
  options?: ValidateOptions,
) => Promise<Values>;
export type ValidateFields<Values = any> = (nameList?: NamePath[]) => Promise<Values>;

// >>>>>> Info
interface ValueUpdateInfo {
  type: 'valueUpdate';
  source: 'internal' | 'external';
}

interface ValidateFinishInfo {
  type: 'validateFinish';
}

interface ResetInfo {
  type: 'reset';
}

interface SetFieldInfo {
  type: 'setField';
  data: FieldData;
}

interface DependenciesUpdateInfo {
  type: 'dependenciesUpdate';
  /**
   * Contains all the related `InternalNamePath[]`.
   * a <- b <- c : change `a`
   * relatedFields=[a, b, c]
   */
  relatedFields: InternalNamePath[];
}

export type NotifyInfo =
  | ValueUpdateInfo
  | ValidateFinishInfo
  | ResetInfo
  | SetFieldInfo
  | DependenciesUpdateInfo;

export type ValuedNotifyInfo = NotifyInfo & {
  store: Store;
};

export interface Callbacks<Values = any> {
  onValuesChange?: (changedValues: any, values: Values) => void;
  onFieldsChange?: (changedFields: FieldData[], allFields: FieldData[]) => void;
  onFinish?: (values: Values) => void;
  onFinishFailed?: (errorInfo: ValidateErrorEntity<Values>) => void;
}

export interface InternalHooks {
  dispatch: (action: ReducerAction) => void;
  initEntityValue: (entity: FieldEntity) => void;
  registerField: (entity: FieldEntity) => () => void;
  useSubscribe: (subscribable: boolean) => void;
  setInitialValues: (values: Store, init: boolean) => void;
  setCallbacks: (callbacks: Callbacks) => void;
  getFields: (namePathList?: InternalNamePath[]) => FieldData[];
  setValidateMessages: (validateMessages: ValidateMessages) => void;
  setPreserve: (preserve?: boolean) => void;
  getInitialValue: (namePath: InternalNamePath) => StoreValue;
}

/** Only return partial when type is not any */
type RecursivePartial<T> = T extends Record<string, any>
  ? {
      [P in keyof T]?: T[P] extends (infer U)[]
        ? RecursivePartial<U>[]
        : T[P] extends Record<string, any>
        ? RecursivePartial<T[P]>
        : T[P];
    }
  : T extends string | number | boolean | undefined | null
  ? T
  : any;

type IfElseType<TrueType, FalseType, MatchingType, ExaminedType> = MatchingType extends ExaminedType
  ? TrueType
  : FalseType;

type RcFilterFunc = ((meta: any) => boolean) | undefined;

type FormFieldNamePath<K extends string = string> =
  | [K | number, ...(K | number)[]]
  | (K | number)[]
  | K
  | number;

type GetLeafValueByNamePath<
  O extends Record<string, any>,
  P extends FormFieldNamePath,
> = P extends [infer F, ...infer Rest]
  ? F extends keyof O
    ? O[F] extends Record<string, any>
      ? Rest extends (string | number)[]
        ? GetLeafValueByNamePath<O[F], Rest>
        : any
      : O[F]
    : any
  : P extends keyof O
  ? O[P]
  : O;

type GetObjectWithNamePath<O extends Record<string, any>, P extends FormFieldNamePath> = P extends [
  infer F,
  ...infer Rest
]
  ? F extends keyof O
    ? O[F] extends Record<string, any>
      ? Rest extends (string | number)[]
        ? Record<F, GetObjectWithNamePath<O[F], Rest>>
        : any
      : Record<F, O[F]>
    : any
  : P extends keyof O
  ? Record<P, O[P]>
  : O;

type GetObjectWithNamePathList<
  O extends Record<string, any>,
  P extends FormFieldNamePath[],
> = P extends [infer F, ...infer Rest]
  ? F extends FormFieldNamePath
    ? Rest extends FormFieldNamePath[]
      ? GetObjectWithNamePath<O, F> & GetObjectWithNamePathList<O, Rest>
      : unknown
    : unknown
  : unknown;

type IsNeverSubset<T> = T extends never ? true : false;
type IsAny<T> = IsNeverSubset<T> extends false ? false : true;

type FlattenedKeys<O extends Record<string, any>> = IsAny<O> extends true
  ? string
  : O extends (infer E)[]
  ? E extends Record<string, any>
    ? Exclude<keyof E, number | symbol> | FlattenedKeys<E[keyof E]>
    : never
  : O extends (...args: any[]) => any
  ? never
  : O extends Record<string, any>
  ? Exclude<keyof O, number | symbol> | FlattenedKeys<O[keyof O]>
  : never;

type FormFlattenedFieldsPath<T = any> = FormFieldNamePath<FlattenedKeys<T>>;

type GetFieldValue1stArgu<T = any> = FormFlattenedFieldsPath<T>;

export type GetFieldsValue1stArgu<T = any> =
  | undefined
  | true
  | [FormFlattenedFieldsPath<T>, ...FormFlattenedFieldsPath<T>[]]
  | FormFlattenedFieldsPath<T>[];

export type GetFieldsValue2ndArgu = RcFilterFunc;

export type GetFieldsValueReturnType<
  Values = any,
  T extends GetFieldsValue1stArgu<Values> = undefined,
  F extends GetFieldsValue2ndArgu = undefined,
  U = IfElseType<unknown, T, T, undefined>,
> = IfElseType<
  Partial<
    IfElseType<
      Values,
      IfElseType<GetObjectWithNamePathList<Values, Exclude<T, boolean>>, Partial<Values>, U, any[]>,
      U,
      true
    >
  >,
  IfElseType<
    Values,
    IfElseType<GetObjectWithNamePathList<Values, Exclude<T, boolean>>, Partial<Values>, U, any[]>,
    U,
    true
  >,
  IfElseType<unknown, F, F, undefined>,
  (...args: any[]) => any
>;

export interface FormInstance<Values = any> {
  // Origin Form API
  getFieldValue: <T extends GetFieldValue1stArgu<Values>>(
    name: T,
  ) => GetLeafValueByNamePath<Values, T>;
  getFieldsValue: <
    T extends GetFieldsValue1stArgu<Values> = undefined,
    F extends GetFieldsValue2ndArgu = undefined,
    U = IfElseType<unknown, T, T, undefined>,
  >(
    name?: T,
    filterFunc?: F,
  ) => GetFieldsValueReturnType<Values, T, F, U>;

  getFieldError: (name: NamePath) => string[];
  getFieldsError: (nameList?: NamePath[]) => FieldError[];
  getFieldWarning: (name: NamePath) => string[];
  isFieldsTouched(nameList?: NamePath[], allFieldsTouched?: boolean): boolean;
  isFieldsTouched(allFieldsTouched?: boolean): boolean;
  isFieldTouched: (name: NamePath) => boolean;
  isFieldValidating: (name: NamePath) => boolean;
  isFieldsValidating: (nameList: NamePath[]) => boolean;
  resetFields: (fields?: NamePath[]) => void;
  setFields: (fields: FieldData[]) => void;
  setFieldsValue: (values: RecursivePartial<Values>) => void;
  validateFields: ValidateFields<Values>;

  // New API
  submit: () => void;
}

export type InternalFormInstance = Omit<FormInstance, 'validateFields'> & {
  validateFields: InternalValidateFields;

  /**
   * Passed by field context props
   */
  prefixName?: InternalNamePath;

  validateTrigger?: string | string[] | false;

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

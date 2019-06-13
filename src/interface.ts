import { ReducerAction } from './useForm';

export type InternalNamePath = (string | number)[];
export type NamePath = string | number | InternalNamePath;

export interface Store {
  [name: string]: any;
}

export interface Meta {
  touched: boolean;
  validating: boolean;
  errors: string[];
}

/**
 * Used by `setFields` config
 */
export interface FieldData extends Partial<Meta> {
  name: NamePath;
  value?: any;
}

export type RuleType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'method'
  | 'regexp'
  | 'integer'
  | 'float'
  | 'array'
  | 'object'
  | 'enum'
  | 'date'
  | 'url'
  | 'hex'
  | 'email';

export interface Rule {
  enum?: any[];
  len?: number;
  max?: number;
  message?: any;
  min?: number;
  pattern?: RegExp;
  required?: boolean;
  transform?: (value: any) => any;
  type?: RuleType;
  validator?: (
    rule: Rule,
    value: any,
    callback: (error?: string) => void,
    context: FormInstance, // TODO: Maybe not good place to export this?
  ) => Promise<void> | void;
  whitespace?: boolean;

  /** Customize rule level `validateTrigger`. Must be subset of Field `validateTrigger` */
  validateTrigger?: string | string[];
}

export interface FieldEntity {
  onStoreChange: (store: any, namePathList: InternalNamePath[] | null, info: NotifyInfo) => void;
  isFieldTouched: () => boolean;
  isFieldValidating: () => boolean;
  validateRules: (options?: ValidateOptions) => Promise<any>;
  getMeta: () => Meta;
  getNamePath: () => InternalNamePath;
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
) => Promise<any>;
export type ValidateFields = (nameList?: NamePath[]) => Promise<any>;

export type NotifyInfo =
  | {
      type: 'valueUpdate' | 'errorUpdate' | 'reset';
      source?: 'internal' | 'external';
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
}

export interface InternalHooks {
  dispatch: (action: ReducerAction) => void;
  registerField: (entity: FieldEntity) => () => void;
  useSubscribe: (subscribable: boolean) => void;
  setInitialValues: (values: Store) => void;
  setCallbacks: (callbacks: Callbacks) => void;
  getFields: (namePathList?: InternalNamePath[]) => FieldData[];
  setValidateMessages: (validateMessages: ValidateMessages) => void;
}

export interface FormInstance {
  // Origin Form API
  getFieldValue: (name: NamePath) => any;
  getFieldsValue: (nameList?: NamePath[]) => any;
  getFieldError: (name: NamePath) => string[];
  getFieldsError: (nameList?: NamePath[]) => FieldError[];
  isFieldsTouched: (nameList?: NamePath[]) => boolean;
  isFieldTouched: (name: NamePath) => boolean;
  isFieldValidating: (name: NamePath) => boolean;
  isFieldsValidating: (nameList: NamePath[]) => boolean;
  resetFields: (fields?: NamePath[]) => void;
  setFields: (fields: FieldData[]) => void;
  setFieldsValue: (value: Store) => void;
  validateFields: ValidateFields;
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

export interface ValidateMessages {
  default?: string;
  required?: string;
  enum?: string;
  whitespace?: string;
  date?: {
    format?: string;
    parse?: string;
    invalid?: string;
  };
  types?: {
    string?: string;
    method?: string;
    array?: string;
    object?: string;
    number?: string;
    date?: string;
    boolean?: string;
    integer?: string;
    float?: string;
    regexp?: string;
    email?: string;
    url?: string;
    hex?: string;
  };
  string?: {
    len?: string;
    min?: string;
    max?: string;
    range?: string;
  };
  number?: {
    len?: string;
    min?: string;
    max?: string;
    range?: string;
  };
  array?: {
    len?: string;
    min?: string;
    max?: string;
    range?: string;
  };
  pattern?: {
    mismatch?: string;
  };
}

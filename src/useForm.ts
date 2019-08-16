import * as React from 'react';
import warning from 'warning';
import {
  Callbacks,
  FieldData,
  FieldEntity,
  FieldError,
  InternalNamePath,
  InternalHooks,
  NamePath,
  NotifyInfo,
  Store,
  ValidateOptions,
  FormInstance,
  ValidateMessages,
  InternalValidateFields,
  InternalFormInstance,
  ValidateErrorEntity,
  StoreValue,
} from './interface';
import { HOOK_MARK } from './FieldContext';
import { allPromiseFinish } from './utils/asyncUtil';
import NameMap from './utils/NameMap';
import { defaultValidateMessages } from './utils/messages';
import {
  cloneByNamePathList,
  containsNamePath,
  getNamePath,
  getValue,
  setValue,
  setValues,
} from './utils/valueUtil';

interface UpdateAction {
  type: 'updateValue';
  namePath: InternalNamePath;
  value: StoreValue;
}

interface ValidateAction {
  type: 'validateField';
  namePath: InternalNamePath;
  triggerName: string;
}

export type ReducerAction = UpdateAction | ValidateAction;

export class FormStore {
  private forceRootUpdate: () => void;

  private subscribable: boolean = true;

  private store: Store = {};

  private fieldEntities: FieldEntity[] = [];

  private initialValues: Store = {};

  private callbacks: Callbacks = {};

  private validateMessages: ValidateMessages = null;

  private lastValidatePromise: Promise<FieldError[]> = null;

  constructor(forceRootUpdate: () => void) {
    this.forceRootUpdate = forceRootUpdate;
  }

  public getForm = (): InternalFormInstance => ({
    getFieldValue: this.getFieldValue,
    getFieldsValue: this.getFieldsValue,
    getFieldError: this.getFieldError,
    getFieldsError: this.getFieldsError,
    isFieldsTouched: this.isFieldsTouched,
    isFieldTouched: this.isFieldTouched,
    isFieldValidating: this.isFieldValidating,
    isFieldsValidating: this.isFieldsValidating,
    resetFields: this.resetFields,
    setFields: this.setFields,
    setFieldsValue: this.setFieldsValue,
    validateFields: this.validateFields,
    submit: this.submit,

    getInternalHooks: this.getInternalHooks,
  });

  // ======================== Internal Hooks ========================
  private getInternalHooks = (key: string): InternalHooks | null => {
    if (key === HOOK_MARK) {
      return {
        dispatch: this.dispatch,
        registerField: this.registerField,
        useSubscribe: this.useSubscribe,
        setInitialValues: this.setInitialValues,
        setCallbacks: this.setCallbacks,
        setValidateMessages: this.setValidateMessages,
        getFields: this.getFields,
      };
    }

    warning(false, '`getInternalHooks` is internal usage. Should not call directly.');
    return null;
  };

  private useSubscribe = (subscribable: boolean) => {
    this.subscribable = subscribable;
  };

  /**
   * First time `setInitialValues` should update store with initial value
   */
  private setInitialValues = (initialValues: Store, init: boolean) => {
    this.initialValues = initialValues || {};
    if (init) {
      this.store = setValues({}, initialValues, this.store);
    }
  };

  private getInitialValue = (namePath: InternalNamePath) => getValue(this.initialValues, namePath);

  private setCallbacks = (callbacks: Callbacks) => {
    this.callbacks = callbacks;
  };

  private setValidateMessages = (validateMessages: ValidateMessages) => {
    this.validateMessages = validateMessages;
  };

  // ============================ Fields ============================
  /**
   * Get registered field entities.
   * @param pure Only return field which has a `name`. Default: false
   */
  private getFieldEntities = (pure: boolean = false) => {
    if (!pure) {
      return this.fieldEntities;
    }

    return this.fieldEntities.filter(field => field.getNamePath().length);
  };

  private getFieldsMap = (pure: boolean = false) => {
    const cache: NameMap<FieldEntity> = new NameMap();
    this.getFieldEntities(pure).forEach(field => {
      const namePath = field.getNamePath();
      cache.set(namePath, field);
    });
    return cache;
  };

  private getFieldsValue = (nameList?: NamePath[]) => {
    if (!nameList) {
      return this.store;
    }

    return cloneByNamePathList(this.store, nameList.map(getNamePath));
  };

  private getFieldValue = (name: NamePath) => {
    const namePath: InternalNamePath = getNamePath(name);
    return getValue(this.store, namePath);
  };

  private getFieldsError = (nameList?: NamePath[]) => {
    let fieldEntities = this.getFieldEntities(true);

    if (nameList) {
      const cache = this.getFieldsMap(true);

      fieldEntities = nameList.map(name => {
        const namePath = getNamePath(name);
        return cache.get(namePath);
      });
    }

    return fieldEntities.map((entity, index) => {
      if (entity) {
        return {
          name: entity.getNamePath(),
          errors: entity.getErrors(),
        };
      }

      return {
        name: getNamePath(nameList[index]),
        errors: [],
      };
    });
  };

  private getFieldError = (name: NamePath): string[] => {
    const namePath = getNamePath(name);
    const fieldError = this.getFieldsError([namePath])[0];
    return fieldError.errors;
  };

  private isFieldsTouched = (...args) => {
    const [arg0, arg1] = args;
    let namePathList: InternalNamePath[] | null;
    let isAllFieldsTouched = false;

    if (args.length === 0) {
      namePathList = null;
    } else if (args.length === 1) {
      if (Array.isArray(arg0)) {
        namePathList = arg0.map(getNamePath);
        isAllFieldsTouched = false;
      } else {
        namePathList = null;
        isAllFieldsTouched = arg0;
      }
    } else {
      namePathList = arg0.map(getNamePath);
      isAllFieldsTouched = arg1;
    }

    const testTouched = (field: FieldEntity) => {
      // Not provide `nameList` will check all the fields
      if (!namePathList) {
        return field.isFieldTouched();
      }

      const fieldNamePath = field.getNamePath();
      if (containsNamePath(namePathList, fieldNamePath)) {
        return field.isFieldTouched();
      }
      return isAllFieldsTouched;
    };

    return isAllFieldsTouched
      ? this.getFieldEntities(true).every(testTouched)
      : this.getFieldEntities(true).some(testTouched);
  };

  private isFieldTouched = (name: NamePath) => this.isFieldsTouched([name]);

  private isFieldsValidating = (nameList?: NamePath[]) => {
    const fieldEntities = this.getFieldEntities();
    if (!nameList) {
      return fieldEntities.some(testField => testField.isFieldValidating());
    }

    const namePathList: InternalNamePath[] = nameList.map(getNamePath);
    return fieldEntities.some(testField => {
      const fieldNamePath = testField.getNamePath();
      return containsNamePath(namePathList, fieldNamePath) && testField.isFieldValidating();
    });
  };

  private isFieldValidating = (name: NamePath) => this.isFieldsValidating([name]);

  private resetFields = (nameList?: NamePath[]) => {
    const prevStore = this.store;
    if (!nameList) {
      this.store = setValues({}, this.initialValues);
      this.notifyObservers(prevStore, null, { type: 'reset' });
      return;
    }

    // Reset by `nameList`
    const namePathList: InternalNamePath[] = nameList.map(getNamePath);
    namePathList.forEach(namePath => {
      const initialValue = this.getInitialValue(namePath);
      this.store = setValue(this.store, namePath, initialValue);
    });
    this.notifyObservers(prevStore, namePathList, { type: 'reset' });
  };

  private setFields = (fields: FieldData[]) => {
    const prevStore = this.store;

    fields.forEach((fieldData: FieldData) => {
      const { name, errors, ...data } = fieldData;
      const namePath = getNamePath(name);

      // Value
      if ('value' in data) {
        this.store = setValue(this.store, namePath, data.value);
      }

      this.notifyObservers(prevStore, [namePath], { type: 'setField', data: fieldData });
    });
  };

  private getFields = (): FieldData[] =>
    this.getFieldEntities(true).map(
      (field: FieldEntity): FieldData => {
        const namePath = field.getNamePath();
        const meta = field.getMeta();
        return {
          ...meta,
          name: namePath,
          value: this.getFieldValue(namePath),
        };
      },
    );

  // =========================== Observer ===========================
  private registerField = (entity: FieldEntity) => {
    this.fieldEntities.push(entity);

    return () => {
      this.fieldEntities = this.fieldEntities.filter(item => item !== entity);
    };
  };

  private dispatch = (action: ReducerAction) => {
    switch (action.type) {
      case 'updateValue': {
        const { namePath, value } = action;
        this.updateValue(namePath, value);
        break;
      }
      case 'validateField': {
        const { namePath, triggerName } = action;
        this.validateFields([namePath], { triggerName });
        break;
      }
      default:
      // Currently we don't have other action. Do nothing.
    }
  };

  private notifyObservers = (
    prevStore: Store,
    namePathList: InternalNamePath[] | null,
    info: NotifyInfo,
  ) => {
    if (this.subscribable) {
      this.getFieldEntities().forEach(({ onStoreChange }) => {
        onStoreChange(prevStore, namePathList, info);
      });
    } else {
      this.forceRootUpdate();
    }
  };

  private updateValue = (name: NamePath, value: StoreValue) => {
    const namePath = getNamePath(name);
    const prevStore = this.store;
    this.store = setValue(this.store, namePath, value);

    this.notifyObservers(prevStore, [namePath], { type: 'valueUpdate', source: 'internal' });

    // Notify dependencies children with parent update
    const childrenFields = this.getDependencyChildrenFields(namePath);
    this.validateFields(childrenFields);

    this.notifyObservers(prevStore, childrenFields, {
      type: 'dependenciesUpdate',
      relatedFields: [namePath, ...childrenFields],
    });

    // trigger callback function
    const { onValuesChange } = this.callbacks;

    if (onValuesChange) {
      const changedValues = cloneByNamePathList(this.store, [namePath]);
      onValuesChange(changedValues, this.store);
    }

    this.triggerOnFieldsChange([namePath, ...childrenFields]);
  };

  // Let all child Field get update.
  private setFieldsValue = (store: Store) => {
    const prevStore = this.store;

    if (store) {
      this.store = setValues(this.store, store);
    }

    this.notifyObservers(prevStore, null, { type: 'valueUpdate', source: 'external' });
  };

  private getDependencyChildrenFields = (rootNamePath: InternalNamePath): InternalNamePath[] => {
    const children: Set<FieldEntity> = new Set();
    const childrenFields: InternalNamePath[] = [];

    const dependencies2fields: NameMap<Set<FieldEntity>> = new NameMap();

    /**
     * Generate maps
     * Can use cache to save perf if user report performance issue with this
     */
    this.getFieldEntities().forEach(field => {
      const { dependencies } = field.props;
      (dependencies || []).forEach(dependency => {
        const dependencyNamePath = getNamePath(dependency);
        dependencies2fields.update(dependencyNamePath, (fields = new Set()) => {
          fields.add(field);
          return fields;
        });
      });
    });

    const fillChildren = (namePath: InternalNamePath) => {
      const fields = dependencies2fields.get(namePath) || new Set();
      fields.forEach(field => {
        if (!children.has(field)) {
          children.add(field);

          const fieldNamePath = field.getNamePath();
          if (field.isFieldTouched() && fieldNamePath.length) {
            childrenFields.push(fieldNamePath);
            fillChildren(fieldNamePath);
          }
        }
      });
    };

    fillChildren(rootNamePath);

    return childrenFields;
  };

  private triggerOnFieldsChange = (namePathList: InternalNamePath[]) => {
    const { onFieldsChange } = this.callbacks;

    if (onFieldsChange) {
      const fields = this.getFields();
      const changedFields = fields.filter(({ name: fieldName }) =>
        containsNamePath(namePathList, fieldName as InternalNamePath),
      );
      onFieldsChange(changedFields, fields);
    }
  };

  // =========================== Validate ===========================
  private validateFields: InternalValidateFields = (
    nameList?: NamePath[],
    options?: ValidateOptions,
  ) => {
    const provideNameList = !!nameList;
    const namePathList: InternalNamePath[] | undefined = provideNameList
      ? nameList.map(getNamePath)
      : [];

    // Collect result in promise list
    const promiseList: Promise<{
      name: InternalNamePath;
      errors: string[];
    }>[] = [];

    this.getFieldEntities().forEach((field: FieldEntity) => {
      // Add field if not provide `nameList`
      if (!provideNameList) {
        namePathList.push(field.getNamePath());
      }

      // Skip if without rule
      if (!field.props.rules || !field.props.rules.length) {
        return;
      }

      const fieldNamePath = field.getNamePath();

      // Add field validate rule in to promise list
      if (!provideNameList || containsNamePath(namePathList, fieldNamePath)) {
        const promise = field.validateRules({
          validateMessages: {
            ...defaultValidateMessages,
            ...this.validateMessages,
          },
          ...options,
        });

        // Wrap promise with field
        promiseList.push(
          promise
            .then(() => ({ name: fieldNamePath, errors: [] }))
            .catch(errors =>
              Promise.reject({
                name: fieldNamePath,
                errors,
              }),
            ),
        );
      }
    });

    const summaryPromise = allPromiseFinish(promiseList);
    this.lastValidatePromise = summaryPromise;

    // Notify fields with rule that validate has finished and need update
    summaryPromise
      .catch(results => results)
      .then((results: FieldError[]) => {
        const resultNamePathList: InternalNamePath[] = results.map(({ name }) => name);
        this.notifyObservers(this.store, resultNamePathList, { type: 'validateFinish' });
        this.triggerOnFieldsChange(resultNamePathList);
      });

    const returnPromise: Promise<Store | ValidateErrorEntity | string[]> = summaryPromise
      .then(
        (): Promise<Store | string[]> => {
          if (this.lastValidatePromise === summaryPromise) {
            return Promise.resolve(this.getFieldsValue(namePathList));
          }
          return Promise.reject<string[]>([]);
        },
      )
      .catch((results: { name: InternalNamePath; errors: string[] }[]) => {
        const errorList = results.filter(result => result && result.errors.length);
        return Promise.reject({
          values: this.getFieldsValue(namePathList),
          errorFields: errorList,
          outOfDate: this.lastValidatePromise !== summaryPromise,
        });
      });

    // Do not throw in console
    returnPromise.catch<ValidateErrorEntity>(e => e);

    return returnPromise as Promise<Store>;
  };

  // ============================ Submit ============================
  private submit = () => {
    this.validateFields()
      .then(values => {
        const { onFinish } = this.callbacks;
        if (onFinish) {
          onFinish(values);
        }
      })
      .catch(e => {
        const { onFinishFailed } = this.callbacks;
        if (onFinishFailed) {
          onFinishFailed(e);
        }
      });
  };
}

function useForm(form?: FormInstance): [FormInstance] {
  const formRef = React.useRef<FormInstance>();
  const [, forceUpdate] = React.useState();

  if (!formRef.current) {
    if (form) {
      formRef.current = form;
    } else {
      // Create a new FormStore if not provided
      const forceReRender = () => {
        forceUpdate({});
      };

      const formStore: FormStore = new FormStore(forceReRender);

      formRef.current = formStore.getForm();
    }
  }

  return [formRef.current];
}

export default useForm;

import warning from 'rc-util/lib/warning';
import * as React from 'react';
import { HOOK_MARK } from './FieldContext';
import type {
  Callbacks,
  FieldData,
  FieldEntity,
  FieldError,
  FormInstance,
  InternalFieldData,
  InternalFormInstance,
  InternalHooks,
  InternalNamePath,
  InternalValidateFields,
  Meta,
  NamePath,
  NotifyInfo,
  RuleError,
  Store,
  StoreValue,
  ValidateErrorEntity,
  ValidateMessages,
  ValidateOptions,
  ValuedNotifyInfo,
  WatchCallBack,
} from './interface';
import { allPromiseFinish } from './utils/asyncUtil';
import cloneDeep from './utils/cloneDeep';
import { defaultValidateMessages } from './utils/messages';
import NameMap from './utils/NameMap';
import {
  cloneByNamePathList,
  containsNamePath,
  getNamePath,
  getValue,
  matchNamePath,
  setValue,
  setValues,
} from './utils/valueUtil';

type InvalidateFieldEntity = { INVALIDATE_NAME_PATH: InternalNamePath };

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
  private formHooked: boolean = false;

  private forceRootUpdate: () => void;

  private subscribable: boolean = true;

  private store: Store = {};

  private fieldEntities: FieldEntity[] = [];

  private initialValues: Store = {};

  private callbacks: Callbacks = {};

  private validateMessages: ValidateMessages = null;

  private preserve?: boolean = null;

  private lastValidatePromise: Promise<FieldError[]> = null;

  constructor(forceRootUpdate: () => void) {
    this.forceRootUpdate = forceRootUpdate;
  }

  public getForm = (): InternalFormInstance => ({
    getFieldValue: this.getFieldValue,
    getFieldsValue: this.getFieldsValue,
    getFieldError: this.getFieldError,
    getFieldWarning: this.getFieldWarning,
    getFieldsError: this.getFieldsError,
    isFieldsTouched: this.isFieldsTouched,
    isFieldTouched: this.isFieldTouched,
    isFieldValidating: this.isFieldValidating,
    isFieldsValidating: this.isFieldsValidating,
    resetFields: this.resetFields,
    setFields: this.setFields,
    setFieldValue: this.setFieldValue,
    setFieldsValue: this.setFieldsValue,
    validateFields: this.validateFields,
    submit: this.submit,
    _init: true,

    getInternalHooks: this.getInternalHooks,
  });

  // ======================== Internal Hooks ========================
  private getInternalHooks = (key: string): InternalHooks | null => {
    if (key === HOOK_MARK) {
      this.formHooked = true;

      return {
        dispatch: this.dispatch,
        initEntityValue: this.initEntityValue,
        registerField: this.registerField,
        useSubscribe: this.useSubscribe,
        setInitialValues: this.setInitialValues,
        destroyForm: this.destroyForm,
        setCallbacks: this.setCallbacks,
        setValidateMessages: this.setValidateMessages,
        getFields: this.getFields,
        setPreserve: this.setPreserve,
        getInitialValue: this.getInitialValue,
        registerWatch: this.registerWatch,
      };
    }

    warning(false, '`getInternalHooks` is internal usage. Should not call directly.');
    return null;
  };

  private useSubscribe = (subscribable: boolean) => {
    this.subscribable = subscribable;
  };

  /**
   * Record prev Form unmount fieldEntities which config preserve false.
   * This need to be refill with initialValues instead of store value.
   */
  private prevWithoutPreserves: NameMap<boolean> | null = null;

  /**
   * First time `setInitialValues` should update store with initial value
   */
  private setInitialValues = (initialValues: Store, init: boolean) => {
    this.initialValues = initialValues || {};
    if (init) {
      let nextStore = setValues({}, initialValues, this.store);

      // We will take consider prev form unmount fields.
      // When the field is not `preserve`, we need fill this with initialValues instead of store.
      // eslint-disable-next-line array-callback-return
      this.prevWithoutPreserves?.map(({ key: namePath }) => {
        nextStore = setValue(nextStore, namePath, getValue(initialValues, namePath));
      });
      this.prevWithoutPreserves = null;

      this.updateStore(nextStore);
    }
  };

  private destroyForm = () => {
    const prevWithoutPreserves = new NameMap<boolean>();
    this.getFieldEntities(true).forEach(entity => {
      if (!this.isMergedPreserve(entity.isPreserve())) {
        prevWithoutPreserves.set(entity.getNamePath(), true);
      }
    });

    this.prevWithoutPreserves = prevWithoutPreserves;
  };

  private getInitialValue = (namePath: InternalNamePath) => {
    const initValue = getValue(this.initialValues, namePath);

    // Not cloneDeep when without `namePath`
    return namePath.length ? cloneDeep(initValue) : initValue;
  };

  private setCallbacks = (callbacks: Callbacks) => {
    this.callbacks = callbacks;
  };

  private setValidateMessages = (validateMessages: ValidateMessages) => {
    this.validateMessages = validateMessages;
  };

  private setPreserve = (preserve?: boolean) => {
    this.preserve = preserve;
  };

  // ============================= Watch ============================
  private watchList: WatchCallBack[] = [];

  private registerWatch: InternalHooks['registerWatch'] = callback => {
    this.watchList.push(callback);

    return () => {
      this.watchList = this.watchList.filter(fn => fn !== callback);
    };
  };

  private notifyWatch = (namePath: InternalNamePath[] = []) => {
    // No need to cost perf when nothing need to watch
    if (this.watchList.length) {
      const values = this.getFieldsValue();

      this.watchList.forEach(callback => {
        callback(values, namePath);
      });
    }
  };

  // ========================== Dev Warning =========================
  private timeoutId: any = null;

  private warningUnhooked = () => {
    if (process.env.NODE_ENV !== 'production' && !this.timeoutId && typeof window !== 'undefined') {
      this.timeoutId = setTimeout(() => {
        this.timeoutId = null;

        if (!this.formHooked) {
          warning(
            false,
            'Instance created by `useForm` is not connected to any Form element. Forget to pass `form` prop?',
          );
        }
      });
    }
  };

  // ============================ Store =============================
  private updateStore = (nextStore: Store) => {
    this.store = nextStore;
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

  private getFieldEntitiesForNamePathList = (
    nameList?: NamePath[],
  ): (FieldEntity | InvalidateFieldEntity)[] => {
    if (!nameList) {
      return this.getFieldEntities(true);
    }
    const cache = this.getFieldsMap(true);
    return nameList.map(name => {
      const namePath = getNamePath(name);
      return cache.get(namePath) || { INVALIDATE_NAME_PATH: getNamePath(name) };
    });
  };

  private getFieldsValue = (nameList?: NamePath[] | true, filterFunc?: (meta: Meta) => boolean) => {
    this.warningUnhooked();

    if (nameList === true && !filterFunc) {
      return this.store;
    }

    const fieldEntities = this.getFieldEntitiesForNamePathList(
      Array.isArray(nameList) ? nameList : null,
    );

    const filteredNameList: NamePath[] = [];
    fieldEntities.forEach((entity: FieldEntity | InvalidateFieldEntity) => {
      const namePath =
        'INVALIDATE_NAME_PATH' in entity ? entity.INVALIDATE_NAME_PATH : entity.getNamePath();

      // Ignore when it's a list item and not specific the namePath,
      // since parent field is already take in count
      if (!nameList && (entity as FieldEntity).isListField?.()) {
        return;
      }

      if (!filterFunc) {
        filteredNameList.push(namePath);
      } else {
        const meta: Meta = 'getMeta' in entity ? entity.getMeta() : null;
        if (filterFunc(meta)) {
          filteredNameList.push(namePath);
        }
      }
    });

    return cloneByNamePathList(this.store, filteredNameList.map(getNamePath));
  };

  private getFieldValue = (name: NamePath) => {
    this.warningUnhooked();

    const namePath: InternalNamePath = getNamePath(name);
    return getValue(this.store, namePath);
  };

  private getFieldsError = (nameList?: NamePath[]) => {
    this.warningUnhooked();

    const fieldEntities = this.getFieldEntitiesForNamePathList(nameList);

    return fieldEntities.map((entity, index) => {
      if (entity && !('INVALIDATE_NAME_PATH' in entity)) {
        return {
          name: entity.getNamePath(),
          errors: entity.getErrors(),
          warnings: entity.getWarnings(),
        };
      }

      return {
        name: getNamePath(nameList[index]),
        errors: [],
        warnings: [],
      };
    });
  };

  private getFieldError = (name: NamePath): string[] => {
    this.warningUnhooked();

    const namePath = getNamePath(name);
    const fieldError = this.getFieldsError([namePath])[0];
    return fieldError.errors;
  };

  private getFieldWarning = (name: NamePath): string[] => {
    this.warningUnhooked();

    const namePath = getNamePath(name);
    const fieldError = this.getFieldsError([namePath])[0];
    return fieldError.warnings;
  };

  private isFieldsTouched = (...args) => {
    this.warningUnhooked();

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

    const fieldEntities = this.getFieldEntities(true);
    const isFieldTouched = (field: FieldEntity) => field.isFieldTouched();

    // ===== Will get fully compare when not config namePathList =====
    if (!namePathList) {
      return isAllFieldsTouched
        ? fieldEntities.every(isFieldTouched)
        : fieldEntities.some(isFieldTouched);
    }

    // Generate a nest tree for validate
    const map = new NameMap<FieldEntity[]>();
    namePathList.forEach(shortNamePath => {
      map.set(shortNamePath, []);
    });

    fieldEntities.forEach(field => {
      const fieldNamePath = field.getNamePath();

      // Find matched entity and put into list
      namePathList.forEach(shortNamePath => {
        if (shortNamePath.every((nameUnit, i) => fieldNamePath[i] === nameUnit)) {
          map.update(shortNamePath, list => [...list, field]);
        }
      });
    });

    // Check if NameMap value is touched
    const isNamePathListTouched = (entities: FieldEntity[]) => entities.some(isFieldTouched);

    const namePathListEntities = map.map(({ value }) => value);

    return isAllFieldsTouched
      ? namePathListEntities.every(isNamePathListTouched)
      : namePathListEntities.some(isNamePathListTouched);
  };

  private isFieldTouched = (name: NamePath) => {
    this.warningUnhooked();
    return this.isFieldsTouched([name]);
  };

  private isFieldsValidating = (nameList?: NamePath[]) => {
    this.warningUnhooked();

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

  private isFieldValidating = (name: NamePath) => {
    this.warningUnhooked();

    return this.isFieldsValidating([name]);
  };

  /**
   * Reset Field with field `initialValue` prop.
   * Can pass `entities` or `namePathList` or just nothing.
   */
  private resetWithFieldInitialValue = (
    info: {
      entities?: FieldEntity[];
      namePathList?: InternalNamePath[];
      /** Skip reset if store exist value. This is only used for field register reset */
      skipExist?: boolean;
    } = {},
  ) => {
    // Create cache
    const cache: NameMap<Set<{ entity: FieldEntity; value: any }>> = new NameMap();

    const fieldEntities = this.getFieldEntities(true);
    fieldEntities.forEach(field => {
      const { initialValue } = field.props;
      const namePath = field.getNamePath();

      // Record only if has `initialValue`
      if (initialValue !== undefined) {
        const records = cache.get(namePath) || new Set();
        records.add({ entity: field, value: initialValue });

        cache.set(namePath, records);
      }
    });

    // Reset
    const resetWithFields = (entities: FieldEntity[]) => {
      entities.forEach(field => {
        const { initialValue } = field.props;

        if (initialValue !== undefined) {
          const namePath = field.getNamePath();
          const formInitialValue = this.getInitialValue(namePath);

          if (formInitialValue !== undefined) {
            // Warning if conflict with form initialValues and do not modify value
            warning(
              false,
              `Form already set 'initialValues' with path '${namePath.join(
                '.',
              )}'. Field can not overwrite it.`,
            );
          } else {
            const records = cache.get(namePath);
            if (records && records.size > 1) {
              // Warning if multiple field set `initialValue`and do not modify value
              warning(
                false,
                `Multiple Field with path '${namePath.join(
                  '.',
                )}' set 'initialValue'. Can not decide which one to pick.`,
              );
            } else if (records) {
              const originValue = this.getFieldValue(namePath);
              // Set `initialValue`
              if (!info.skipExist || originValue === undefined) {
                this.updateStore(setValue(this.store, namePath, [...records][0].value));
              }
            }
          }
        }
      });
    };

    let requiredFieldEntities: FieldEntity[];
    if (info.entities) {
      requiredFieldEntities = info.entities;
    } else if (info.namePathList) {
      requiredFieldEntities = [];

      info.namePathList.forEach(namePath => {
        const records = cache.get(namePath);
        if (records) {
          requiredFieldEntities.push(...[...records].map(r => r.entity));
        }
      });
    } else {
      requiredFieldEntities = fieldEntities;
    }

    resetWithFields(requiredFieldEntities);
  };

  private resetFields = (nameList?: NamePath[]) => {
    this.warningUnhooked();

    const prevStore = this.store;
    if (!nameList) {
      this.updateStore(setValues({}, this.initialValues));
      this.resetWithFieldInitialValue();
      this.notifyObservers(prevStore, null, { type: 'reset' });
      this.notifyWatch();
      return;
    }

    // Reset by `nameList`
    const namePathList: InternalNamePath[] = nameList.map(getNamePath);
    namePathList.forEach(namePath => {
      const initialValue = this.getInitialValue(namePath);
      this.updateStore(setValue(this.store, namePath, initialValue));
    });
    this.resetWithFieldInitialValue({ namePathList });
    this.notifyObservers(prevStore, namePathList, { type: 'reset' });
    this.notifyWatch(namePathList);
  };

  private setFields = (fields: FieldData[]) => {
    this.warningUnhooked();

    const prevStore = this.store;

    const namePathList: InternalNamePath[] = [];

    fields.forEach((fieldData: FieldData) => {
      const { name, errors, ...data } = fieldData;
      const namePath = getNamePath(name);
      namePathList.push(namePath);

      // Value
      if ('value' in data) {
        this.updateStore(setValue(this.store, namePath, data.value));
      }

      this.notifyObservers(prevStore, [namePath], {
        type: 'setField',
        data: fieldData,
      });
    });

    this.notifyWatch(namePathList);
  };

  private getFields = (): InternalFieldData[] => {
    const entities = this.getFieldEntities(true);

    const fields = entities.map((field: FieldEntity): InternalFieldData => {
      const namePath = field.getNamePath();
      const meta = field.getMeta();
      const fieldData = {
        ...meta,
        name: namePath,
        value: this.getFieldValue(namePath),
      };

      Object.defineProperty(fieldData, 'originRCField', {
        value: true,
      });

      return fieldData;
    });

    return fields;
  };

  // =========================== Observer ===========================
  /**
   * This only trigger when a field is on constructor to avoid we get initialValue too late
   */
  private initEntityValue = (entity: FieldEntity) => {
    const { initialValue } = entity.props;

    if (initialValue !== undefined) {
      const namePath = entity.getNamePath();
      const prevValue = getValue(this.store, namePath);

      if (prevValue === undefined) {
        this.updateStore(setValue(this.store, namePath, initialValue));
      }
    }
  };

  private isMergedPreserve = (fieldPreserve?: boolean) => {
    const mergedPreserve = fieldPreserve !== undefined ? fieldPreserve : this.preserve;
    return mergedPreserve ?? true;
  };

  private registerField = (entity: FieldEntity) => {
    this.fieldEntities.push(entity);
    const namePath = entity.getNamePath();
    this.notifyWatch([namePath]);

    // Set initial values
    if (entity.props.initialValue !== undefined) {
      const prevStore = this.store;
      this.resetWithFieldInitialValue({ entities: [entity], skipExist: true });
      this.notifyObservers(prevStore, [entity.getNamePath()], {
        type: 'valueUpdate',
        source: 'internal',
      });
    }

    // un-register field callback
    return (isListField?: boolean, preserve?: boolean, subNamePath: InternalNamePath = []) => {
      this.fieldEntities = this.fieldEntities.filter(item => item !== entity);

      // Clean up store value if not preserve
      if (!this.isMergedPreserve(preserve) && (!isListField || subNamePath.length > 1)) {
        const defaultValue = isListField ? undefined : this.getInitialValue(namePath);

        if (
          namePath.length &&
          this.getFieldValue(namePath) !== defaultValue &&
          this.fieldEntities.every(
            field =>
              // Only reset when no namePath exist
              !matchNamePath(field.getNamePath(), namePath),
          )
        ) {
          const prevStore = this.store;
          this.updateStore(setValue(prevStore, namePath, defaultValue, true));

          // Notify that field is unmount
          this.notifyObservers(prevStore, [namePath], { type: 'remove' });

          // Dependencies update
          this.triggerDependenciesUpdate(prevStore, namePath);
        }
      }

      this.notifyWatch([namePath]);
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
      const mergedInfo: ValuedNotifyInfo = {
        ...info,
        store: this.getFieldsValue(true),
      };
      this.getFieldEntities().forEach(({ onStoreChange }) => {
        onStoreChange(prevStore, namePathList, mergedInfo);
      });
    } else {
      this.forceRootUpdate();
    }
  };

  /**
   * Notify dependencies children with parent update
   * We need delay to trigger validate in case Field is under render props
   */
  private triggerDependenciesUpdate = (prevStore: Store, namePath: InternalNamePath) => {
    const childrenFields = this.getDependencyChildrenFields(namePath);
    if (childrenFields.length) {
      this.validateFields(childrenFields);
    }

    this.notifyObservers(prevStore, childrenFields, {
      type: 'dependenciesUpdate',
      relatedFields: [namePath, ...childrenFields],
    });

    return childrenFields;
  };

  private updateValue = (name: NamePath, value: StoreValue) => {
    const namePath = getNamePath(name);
    const prevStore = this.store;
    this.updateStore(setValue(this.store, namePath, value));

    this.notifyObservers(prevStore, [namePath], {
      type: 'valueUpdate',
      source: 'internal',
    });
    this.notifyWatch([namePath]);

    // Dependencies update
    const childrenFields = this.triggerDependenciesUpdate(prevStore, namePath);

    // trigger callback function
    const { onValuesChange } = this.callbacks;

    if (onValuesChange) {
      const changedValues = cloneByNamePathList(this.store, [namePath]);
      onValuesChange(changedValues, this.getFieldsValue());
    }

    this.triggerOnFieldsChange([namePath, ...childrenFields]);
  };

  // Let all child Field get update.
  private setFieldsValue = (store: Store) => {
    this.warningUnhooked();

    const prevStore = this.store;

    if (store) {
      const nextStore = setValues(this.store, store);
      this.updateStore(nextStore);
    }

    this.notifyObservers(prevStore, null, {
      type: 'valueUpdate',
      source: 'external',
    });
    this.notifyWatch();
  };

  private setFieldValue = (name: NamePath, value: any) => {
    this.setFields([
      {
        name,
        value,
      },
    ]);
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
          if (field.isFieldDirty() && fieldNamePath.length) {
            childrenFields.push(fieldNamePath);
            fillChildren(fieldNamePath);
          }
        }
      });
    };

    fillChildren(rootNamePath);

    return childrenFields;
  };

  private triggerOnFieldsChange = (
    namePathList: InternalNamePath[],
    filedErrors?: FieldError[],
  ) => {
    const { onFieldsChange } = this.callbacks;

    if (onFieldsChange) {
      const fields = this.getFields();

      /**
       * Fill errors since `fields` may be replaced by controlled fields
       */
      if (filedErrors) {
        const cache = new NameMap<string[]>();
        filedErrors.forEach(({ name, errors }) => {
          cache.set(name, errors);
        });

        fields.forEach(field => {
          // eslint-disable-next-line no-param-reassign
          field.errors = cache.get(field.name) || field.errors;
        });
      }

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
    this.warningUnhooked();

    const provideNameList = !!nameList;
    const namePathList: InternalNamePath[] | undefined = provideNameList
      ? nameList.map(getNamePath)
      : [];

    // Collect result in promise list
    const promiseList: Promise<FieldError>[] = [];

    this.getFieldEntities(true).forEach((field: FieldEntity) => {
      // Add field if not provide `nameList`
      if (!provideNameList) {
        namePathList.push(field.getNamePath());
      }

      /**
       * Recursive validate if configured.
       * TODO: perf improvement @zombieJ
       */
      if (options?.recursive && provideNameList) {
        const namePath = field.getNamePath();
        if (
          // nameList[i] === undefined 说明是以 nameList 开头的
          // ['name'] -> ['name','list']
          namePath.every((nameUnit, i) => nameList[i] === nameUnit || nameList[i] === undefined)
        ) {
          namePathList.push(namePath);
        }
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
            .then<any, RuleError>(() => ({ name: fieldNamePath, errors: [], warnings: [] }))
            .catch((ruleErrors: RuleError[]) => {
              const mergedErrors: string[] = [];
              const mergedWarnings: string[] = [];

              ruleErrors.forEach(({ rule: { warningOnly }, errors }) => {
                if (warningOnly) {
                  mergedWarnings.push(...errors);
                } else {
                  mergedErrors.push(...errors);
                }
              });

              if (mergedErrors.length) {
                return Promise.reject({
                  name: fieldNamePath,
                  errors: mergedErrors,
                  warnings: mergedWarnings,
                });
              }

              return {
                name: fieldNamePath,
                errors: mergedErrors,
                warnings: mergedWarnings,
              };
            }),
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
        this.notifyObservers(this.store, resultNamePathList, {
          type: 'validateFinish',
        });
        this.triggerOnFieldsChange(resultNamePathList, results);
      });

    const returnPromise: Promise<Store | ValidateErrorEntity | string[]> = summaryPromise
      .then((): Promise<Store | string[]> => {
        if (this.lastValidatePromise === summaryPromise) {
          return Promise.resolve(this.getFieldsValue(namePathList));
        }
        return Promise.reject<string[]>([]);
      })
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
    this.warningUnhooked();

    this.validateFields()
      .then(values => {
        const { onFinish } = this.callbacks;
        if (onFinish) {
          try {
            onFinish(values);
          } catch (err) {
            // Should print error if user `onFinish` callback failed
            console.error(err);
          }
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

function useForm<Values = any>(form?: FormInstance<Values>): [FormInstance<Values>] {
  const formRef = React.useRef<FormInstance>();
  const [, forceUpdate] = React.useState({});

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

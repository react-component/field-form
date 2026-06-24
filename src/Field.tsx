import { isEqual, toArray as toChildrenArray, warning } from '@rc-component/util';
import * as React from 'react';
import FieldContext, { HOOK_MARK } from './FieldContext';
import type {
  EventArgs,
  FieldEntity,
  FormInstance,
  InternalFormInstance,
  InternalNamePath,
  InternalValidateOptions,
  Meta,
  NamePath,
  NotifyInfo,
  Rule,
  RuleError,
  RuleObject,
  Store,
  StoreValue,
} from './interface';
import ListContext from './ListContext';
import { toArray } from './utils/typeUtil';
import { validateRules } from './utils/validateUtil';
import {
  containsNamePath,
  defaultGetValueFromEvent,
  getNamePath as getNamePathByName,
  getValue as getValueByNamePath,
} from './utils/valueUtil';
import delayFrame from './utils/delayUtil';

const EMPTY_ERRORS: any[] = [];
const EMPTY_WARNINGS: any[] = [];

export type ShouldUpdate<Values = any> =
  | boolean
  | ((prevValues: Values, nextValues: Values, info: { source?: string }) => boolean);

function requireUpdate(
  shouldUpdate: ShouldUpdate,
  prev: StoreValue,
  next: StoreValue,
  prevValue: StoreValue,
  nextValue: StoreValue,
  info: NotifyInfo,
): boolean {
  if (typeof shouldUpdate === 'function') {
    return shouldUpdate(prev, next, 'source' in info ? { source: info.source } : {});
  }
  return prevValue !== nextValue;
}

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
interface ChildProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [name: string]: any;
}

export type MetaEvent = Meta & { destroy?: boolean };

export interface InternalFieldProps<Values = any> {
  children?:
    | React.ReactElement
    | ((control: ChildProps, meta: Meta, form: FormInstance<Values>) => React.ReactNode);
  /**
   * Set up `dependencies` field.
   * When dependencies field update and current field is touched,
   * will trigger validate rules and render.
   */
  dependencies?: NamePath[];
  getValueFromEvent?: (...args: EventArgs) => StoreValue;
  name?: InternalNamePath;
  normalize?: (value: StoreValue, prevValue: StoreValue, allValues: Store) => StoreValue;
  rules?: Rule[];
  shouldUpdate?: ShouldUpdate<Values>;
  trigger?: string;
  validateTrigger?: string | string[] | false;
  /**
   * Trigger will after configured milliseconds.
   */
  validateDebounce?: number;
  validateFirst?: boolean | 'parallel';
  valuePropName?: string;
  getValueProps?: (value: StoreValue) => Record<string, unknown>;
  messageVariables?: Record<string, string>;
  initialValue?: any;
  onReset?: () => void;
  onMetaChange?: (meta: MetaEvent) => void;
  preserve?: boolean;

  /** @private Passed by Form.List props. Do not use since it will break by path check. */
  isListField?: boolean;

  /** @private Passed by Form.List props. Do not use since it will break by path check. */
  isList?: boolean;
}

export interface FieldProps<Values = any> extends Omit<InternalFieldProps<Values>, 'name'> {
  name?: NamePath<Values>;
}

export interface FieldState {
  resetCount: number;
}

type CancelRegisterFunc = (
  isListField?: boolean,
  preserve?: boolean,
  namePath?: InternalNamePath,
) => void;

interface FieldEntityInstance extends FieldEntity {
  props: InternalFieldProps;
  cancelRegister: () => void;
  reRender: () => void;
  refresh: () => void;
  triggerMetaEvent: (destroy?: boolean) => void;
  getRules: () => RuleObject[];
  getValue: (store?: Store) => StoreValue;
  getControlled: (childProps?: ChildProps) => ChildProps;
  getOnlyChild: (
    children:
      | React.ReactNode
      | ((control: ChildProps, meta: Meta, context: FormInstance) => React.ReactNode),
  ) => { child: React.ReactNode | null; isFunction: boolean };
}

const Field: React.FC<InternalFieldProps> = props => {
  const {
    children,
    dependencies,
    getValueFromEvent,
    getValueProps,
    initialValue,
    isList: isListProp,
    isListField: isListFieldProp,
    name,
    normalize,
    onMetaChange,
    onReset,
    preserve,
    rules,
    shouldUpdate,
    trigger = 'onChange',
    validateTrigger,
    valuePropName = 'value',
  } = props;

  const fieldContext = React.useContext(FieldContext);
  const [resetCount, setResetCount] = React.useState(0);
  const [, forceUpdate] = React.useReducer(value => value + 1, 0);

  const cancelRegisterFuncRef = React.useRef<CancelRegisterFunc | null>(null);
  const mountedRef = React.useRef(false);
  const touchedRef = React.useRef(false);
  const dirtyRef = React.useRef(false);
  const validatePromiseRef = React.useRef<Promise<any[]> | null | undefined>(undefined);
  const prevValidatingRef = React.useRef(false);
  const errorsRef = React.useRef<string[]>(EMPTY_ERRORS);
  const warningsRef = React.useRef<string[]>(EMPTY_WARNINGS);
  const metaCacheRef = React.useRef<MetaEvent>(null);
  const fieldRef = React.useRef<FieldEntityInstance>(null);
  const initializedRef = React.useRef(false);

  if (!fieldRef.current) {
    fieldRef.current = {} as FieldEntityInstance;
  }

  const getNamePath = React.useCallback((): InternalNamePath => {
    const { prefixName = [] }: InternalFormInstance = fieldContext;
    return name !== undefined ? [...prefixName, ...name] : [];
  }, [fieldContext, name]);

  const getRules = React.useCallback((): RuleObject[] => {
    const mergedRules = rules || [];
    return mergedRules.map((rule: Rule): RuleObject => {
      if (typeof rule === 'function') {
        return rule(fieldContext);
      }
      return rule;
    });
  }, [fieldContext, rules]);

  const reRender = React.useCallback(() => {
    if (!mountedRef.current) {
      return;
    }
    forceUpdate();
  }, []);

  const refresh = React.useCallback(() => {
    if (!mountedRef.current) {
      return;
    }
    /**
     * Clean up current node.
     */
    setResetCount(count => count + 1);
  }, []);

  const getValue = React.useCallback(
    (store?: Store) => {
      const { getFieldsValue }: FormInstance = fieldContext;
      const namePath = getNamePath();
      return getValueByNamePath(store || getFieldsValue(true), namePath);
    },
    [fieldContext, getNamePath],
  );

  const isFieldValidating = React.useCallback(() => !!validatePromiseRef.current, []);

  const isFieldTouched = React.useCallback(() => touchedRef.current, []);

  const isFieldDirty = React.useCallback(() => {
    // Touched or validate or has initialValue
    if (dirtyRef.current || initialValue !== undefined) {
      return true;
    }

    // Form set initialValue
    const { getInitialValue } = fieldContext.getInternalHooks(HOOK_MARK);
    if (getInitialValue(getNamePath()) !== undefined) {
      return true;
    }

    return false;
  }, [fieldContext, getNamePath, initialValue]);

  const getErrors = React.useCallback(() => errorsRef.current, []);

  const getWarnings = React.useCallback(() => warningsRef.current, []);

  const isListField = React.useCallback(() => isListFieldProp, [isListFieldProp]);

  const isList = React.useCallback(() => isListProp, [isListProp]);

  const isPreserve = React.useCallback(() => preserve, [preserve]);

  const getMeta = React.useCallback((): Meta => {
    // Make error & validating in cache to save perf
    prevValidatingRef.current = isFieldValidating();

    const meta: Meta = {
      touched: isFieldTouched(),
      validating: prevValidatingRef.current,
      errors: errorsRef.current,
      warnings: warningsRef.current,
      name: getNamePath(),
      validated: validatePromiseRef.current === null,
    };

    return meta;
  }, [getNamePath, isFieldTouched, isFieldValidating]);

  // Event should only trigger when meta changed
  const triggerMetaEvent = React.useCallback(
    (destroy?: boolean) => {
      if (onMetaChange) {
        const meta = { ...getMeta(), destroy };

        if (!isEqual(metaCacheRef.current, meta)) {
          onMetaChange(meta);
        }

        metaCacheRef.current = meta;
      } else {
        metaCacheRef.current = null;
      }
    },
    [getMeta, onMetaChange],
  );

  const validateRulesHandler = React.useCallback(
    (options?: InternalValidateOptions): Promise<RuleError[]> => {
      // We should fixed namePath & value to avoid developer change then by form function
      const namePath = getNamePath();
      const currentValue = getValue();

      const { triggerName, validateOnly = false, delayFrame: showDelayFrame } = options || {};

      // Force change to async to avoid rule OOD under renderProps field
      const rootPromise = Promise.resolve().then(async (): Promise<any[]> => {
        if (!mountedRef.current) {
          return [];
        }

        const currentField = fieldRef.current;
        const { validateFirst = false, messageVariables, validateDebounce } = currentField?.props;

        // Should wait for the frame render,
        // since developer may `useWatch` value in the rules.
        if (showDelayFrame) {
          await delayFrame();
        }

        // Start validate
        let filteredRules = currentField?.getRules();
        if (triggerName) {
          filteredRules = filteredRules
            .filter(rule => rule)
            .filter((rule: RuleObject) => {
              const { validateTrigger: ruleValidateTrigger } = rule;
              if (!ruleValidateTrigger) {
                return true;
              }
              const triggerList = toArray(ruleValidateTrigger);
              return triggerList.includes(triggerName);
            });
        }

        // Wait for debounce. Skip if no `triggerName` since its from `validateFields / submit`
        if (validateDebounce && triggerName) {
          await new Promise(resolve => {
            setTimeout(resolve, validateDebounce);
          });

          // Skip since out of date
          if (validatePromiseRef.current !== rootPromise) {
            return [];
          }
        }

        const promise = validateRules(
          namePath,
          currentValue,
          filteredRules,
          options,
          validateFirst,
          messageVariables,
        );

        promise
          .catch(e => e)
          .then((ruleErrors: RuleError[] = EMPTY_ERRORS) => {
            if (validatePromiseRef.current === rootPromise) {
              validatePromiseRef.current = null;

              // Get errors & warnings
              const nextErrors: string[] = [];
              const nextWarnings: string[] = [];
              ruleErrors.forEach?.(({ rule: { warningOnly }, errors = EMPTY_ERRORS }) => {
                if (warningOnly) {
                  nextWarnings.push(...errors);
                } else {
                  nextErrors.push(...errors);
                }
              });

              errorsRef.current = nextErrors;
              warningsRef.current = nextWarnings;
              currentField?.triggerMetaEvent();
              currentField?.reRender();
            }
          });

        return promise;
      });

      if (validateOnly) {
        return rootPromise;
      }

      validatePromiseRef.current = rootPromise;
      dirtyRef.current = true;
      errorsRef.current = EMPTY_ERRORS;
      warningsRef.current = EMPTY_WARNINGS;
      fieldRef.current?.triggerMetaEvent();

      // Force trigger re-render since we need sync renderProps with new meta
      fieldRef.current?.reRender();

      return rootPromise;
    },
    [getNamePath, getValue],
  );

  const cancelRegister = React.useCallback(() => {
    if (cancelRegisterFuncRef.current) {
      cancelRegisterFuncRef.current(isListFieldProp, preserve, getNamePathByName(name));
    }
    cancelRegisterFuncRef.current = null;
  }, [isListFieldProp, name, preserve]);

  // Trigger by store update. Check if need update the component
  const onStoreChange = React.useCallback<FieldEntity['onStoreChange']>(
    (prevStore, namePathList, info) => {
      const mergedDependencies = dependencies || [];
      const { store } = info;
      const namePath = getNamePath();
      const prevValue = getValue(prevStore);
      const curValue = getValue(store);

      const namePathMatch = namePathList && containsNamePath(namePathList, namePath);

      // `setFieldsValue` is a quick access to update related status
      if (
        info.type === 'valueUpdate' &&
        info.source === 'external' &&
        !isEqual(prevValue, curValue)
      ) {
        touchedRef.current = true;
        dirtyRef.current = true;
        validatePromiseRef.current = null;
        errorsRef.current = EMPTY_ERRORS;
        warningsRef.current = EMPTY_WARNINGS;
        triggerMetaEvent();
      }

      switch (info.type) {
        case 'reset':
          if (!namePathList || namePathMatch) {
            // Clean up state
            touchedRef.current = false;
            dirtyRef.current = false;
            validatePromiseRef.current = undefined;
            errorsRef.current = EMPTY_ERRORS;
            warningsRef.current = EMPTY_WARNINGS;
            triggerMetaEvent();

            onReset?.();

            refresh();
            return;
          }
          break;

        /**
         * In case field with `preserve = false` nest deps like:
         * - A = 1 => show B
         * - B = 1 => show C
         * - Reset A, need clean B, C
         */
        case 'remove': {
          if (
            shouldUpdate &&
            requireUpdate(shouldUpdate, prevStore, store, prevValue, curValue, info)
          ) {
            reRender();
            return;
          }
          break;
        }

        case 'setField': {
          const { data } = info;
          if (namePathMatch) {
            if ('touched' in data) {
              touchedRef.current = data.touched;
            }
            if ('validating' in data && !('originRCField' in data)) {
              validatePromiseRef.current = data.validating ? Promise.resolve([]) : null;
            }
            if ('errors' in data) {
              errorsRef.current = data.errors || EMPTY_ERRORS;
            }
            if ('warnings' in data) {
              warningsRef.current = data.warnings || EMPTY_WARNINGS;
            }
            dirtyRef.current = true;

            triggerMetaEvent();

            reRender();
            return;
          } else if ('value' in data && containsNamePath(namePathList, namePath, true)) {
            // Contains path with value should also check
            reRender();
            return;
          }

          // Handle update by `setField` with `shouldUpdate`
          if (
            shouldUpdate &&
            !namePath.length &&
            requireUpdate(shouldUpdate, prevStore, store, prevValue, curValue, info)
          ) {
            reRender();
            return;
          }
          break;
        }

        case 'dependenciesUpdate': {
          /**
           * Trigger when marked `dependencies` updated. Related fields will all update
           */
          const dependencyList = mergedDependencies.map(getNamePathByName);
          // No need for `namePathMath` check and `shouldUpdate` check, since `valueUpdate` will be
          // emitted earlier and they will work there
          // If set it may cause unnecessary twice rerendering
          if (dependencyList.some(dependency => containsNamePath(info.relatedFields, dependency))) {
            reRender();
            return;
          }
          break;
        }

        default:
          // 1. If `namePath` exists in `namePathList`, means it's related value and should update
          //      For example <List name="list"><Field name={['list', 0]}></List>
          //      If `namePathList` is [['list']] (List value update), Field should be updated
          //      If `namePathList` is [['list', 0]] (Field value update), List shouldn't be updated
          // 2.
          //   2.1 If `dependencies` is set, `name` is not set and `shouldUpdate` is not set,
          //       don't use `shouldUpdate`. `dependencies` is view as a shortcut if `shouldUpdate`
          //       is not provided
          //   2.2 If `shouldUpdate` provided, use customize logic to update the field
          //       else to check if value changed
          if (
            namePathMatch ||
            ((!mergedDependencies.length || namePath.length || shouldUpdate) &&
              requireUpdate(shouldUpdate, prevStore, store, prevValue, curValue, info))
          ) {
            reRender();
            return;
          }
          break;
      }

      if (shouldUpdate === true) {
        reRender();
      }
    },
    [
      dependencies,
      getNamePath,
      getValue,
      onReset,
      reRender,
      refresh,
      shouldUpdate,
      triggerMetaEvent,
    ],
  );

  const getControlled = React.useCallback(
    (childProps: ChildProps = {}) => {
      const mergedValidateTrigger =
        validateTrigger !== undefined ? validateTrigger : fieldContext.validateTrigger;

      const namePath = getNamePath();
      const { getInternalHooks, getFieldsValue }: InternalFormInstance = fieldContext;
      const { dispatch } = getInternalHooks(HOOK_MARK);
      const value = getValue();
      const mergedGetValueProps =
        getValueProps || ((val: StoreValue) => ({ [valuePropName]: val }));

      const originTriggerFunc = childProps[trigger];

      const valueProps = name !== undefined ? mergedGetValueProps(value) : {};

      // warning when prop value is function
      if (process.env.NODE_ENV !== 'production' && valueProps) {
        Object.keys(valueProps).forEach(key => {
          warning(
            typeof valueProps[key] !== 'function',
            `It's not recommended to generate dynamic function prop by \`getValueProps\`. Please pass it to child component directly (prop: ${key})`,
          );
        });
      }

      const control = {
        ...childProps,
        ...valueProps,
      };

      // Add trigger
      control[trigger] = (...args: EventArgs) => {
        // Mark as touched
        touchedRef.current = true;
        dirtyRef.current = true;

        triggerMetaEvent();

        let newValue: StoreValue;
        if (getValueFromEvent) {
          newValue = getValueFromEvent(...args);
        } else {
          newValue = defaultGetValueFromEvent(valuePropName, ...args);
        }

        if (normalize) {
          newValue = normalize(newValue, value, getFieldsValue(true));
        }
        if (newValue !== value) {
          dispatch({ type: 'updateValue', namePath, value: newValue });
        }
        if (originTriggerFunc) {
          originTriggerFunc(...args);
        }
      };

      // Add validateTrigger
      const validateTriggerList: string[] = toArray(mergedValidateTrigger || []);

      validateTriggerList.forEach((triggerName: string) => {
        // Wrap additional function of component, so that we can get latest value from store
        const originTrigger = control[triggerName];
        control[triggerName] = (...args: EventArgs) => {
          if (originTrigger) {
            originTrigger(...args);
          }

          // Always use latest rules
          if (rules && rules.length) {
            // We dispatch validate to root,
            // since it will update related data with other field with same name
            dispatch({
              type: 'validateField',
              namePath,
              triggerName,
            });
          }
        };
      });

      return control;
    },
    [
      fieldContext,
      getNamePath,
      getValue,
      getValueFromEvent,
      getValueProps,
      name,
      normalize,
      rules,
      trigger,
      triggerMetaEvent,
      validateTrigger,
      valuePropName,
    ],
  );

  const getOnlyChild = React.useCallback(
    (
      childrenNode:
        | React.ReactNode
        | ((control: ChildProps, meta: Meta, context: FormInstance) => React.ReactNode),
    ): { child: React.ReactNode | null; isFunction: boolean } => {
      // Support render props
      if (typeof childrenNode === 'function') {
        const meta = getMeta();

        return {
          ...getOnlyChild(childrenNode(getControlled(), meta, fieldContext)),
          isFunction: true,
        };
      }

      // Filed element only
      const childList = toChildrenArray(childrenNode as any);

      if (childList.length !== 1 || !React.isValidElement(childList[0])) {
        return { child: childList as React.ReactNode, isFunction: false };
      }

      return { child: childList[0], isFunction: false };
    },
    [fieldContext, getControlled, getMeta],
  );

  const field = fieldRef.current;

  field.props = props;
  field.getNamePath = getNamePath;
  field.getRules = getRules;
  field.reRender = reRender;
  field.refresh = refresh;
  field.triggerMetaEvent = triggerMetaEvent;
  field.onStoreChange = onStoreChange;
  field.validateRules = validateRulesHandler;
  field.isFieldValidating = isFieldValidating;
  field.isFieldTouched = isFieldTouched;
  field.isFieldDirty = isFieldDirty;
  field.getErrors = getErrors;
  field.getWarnings = getWarnings;
  field.isListField = isListField;
  field.isList = isList;
  field.isPreserve = isPreserve;
  field.getMeta = getMeta;
  field.getOnlyChild = getOnlyChild;
  field.getValue = getValue;
  field.getControlled = getControlled;
  field.cancelRegister = cancelRegister;

  // Register on init
  if (!initializedRef.current) {
    const { getInternalHooks }: InternalFormInstance = fieldContext;
    const { initEntityValue } = getInternalHooks(HOOK_MARK);
    initEntityValue(field);
    initializedRef.current = true;
  }

  React.useLayoutEffect(() => {
    mountedRef.current = true;

    // Register on init
    if (fieldContext) {
      const { getInternalHooks }: InternalFormInstance = fieldContext;
      const { registerField } = getInternalHooks(HOOK_MARK);
      cancelRegisterFuncRef.current = registerField(field);
    }

    // One more render for component in case fields not ready
    if (shouldUpdate === true) {
      reRender();
    }

    return () => {
      field.cancelRegister();
      field.triggerMetaEvent(true);
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { child, isFunction } = getOnlyChild(children);

  // Not need to `cloneElement` since user can handle this in render function self
  let returnChildNode: React.ReactNode;
  if (isFunction) {
    returnChildNode = child;
  } else if (React.isValidElement<any>(child)) {
    returnChildNode = React.cloneElement(child, getControlled(child.props));
  } else {
    warning(!child, '`children` of Field is not validate ReactElement.');
    returnChildNode = child;
  }

  return <React.Fragment key={resetCount}>{returnChildNode}</React.Fragment>;
};

function WrapperField<Values = any>({ name, ...restProps }: FieldProps<Values>) {
  const listContext = React.useContext(ListContext);

  const namePath = React.useMemo(
    () => (name !== undefined ? getNamePathByName(name) : undefined),
    [name],
  );

  const isMergedListField = restProps.isListField ?? !!listContext;

  let key: string = 'keep';
  if (!isMergedListField) {
    key = `_${(namePath || []).join('_')}`;
  }

  // Warning if it's a directly list field.
  // We can still support multiple level field preserve.
  if (
    process.env.NODE_ENV !== 'production' &&
    restProps.preserve === false &&
    isMergedListField &&
    namePath &&
    namePath.length <= 1
  ) {
    warning(false, '`preserve` should not apply on Form.List fields.');
  }

  return <Field key={key} name={namePath} isListField={isMergedListField} {...restProps} />;
}

export default WrapperField;

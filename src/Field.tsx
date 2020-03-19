import toChildrenArray from 'rc-util/lib/Children/toArray';
import warning from 'rc-util/lib/warning';
import * as React from 'react';
import {
  FieldEntity,
  FormInstance,
  InternalNamePath,
  Meta,
  NamePath,
  NotifyInfo,
  Rule,
  Store,
  ValidateOptions,
  InternalFormInstance,
  RuleObject,
  FormValue,
  FormValues,
  EventArgs,
  AnyFormValues,
} from './interface';
import FieldContext, { HOOK_MARK } from './FieldContext';
import { toArray } from './utils/typeUtil';
import { validateRules } from './utils/validateUtil';
import {
  containsNamePath,
  defaultGetValueFromEvent,
  getNamePath,
  getValue,
} from './utils/valueUtil';

export type ShouldUpdate =
  | true
  | ((
      prevValues: Partial<FormValues>,
      nextValues: Partial<FormValues>,
      info: { source?: string },
    ) => boolean);

function requireUpdate(
  shouldUpdate: ShouldUpdate,
  prev: Partial<FormValues>,
  next: Partial<FormValues>,
  prevValue: FormValue,
  nextValue: FormValue,
  info: NotifyInfo,
): boolean {
  if (typeof shouldUpdate === 'function') {
    return shouldUpdate(prev, next, 'source' in info ? { source: info.source } : {});
  }
  return prevValue !== nextValue;
}

interface ChildProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [name: string]: any;
}

export interface FieldProps<T extends FormValues = AnyFormValues> {
  /**
   * Set up `dependencies` field.
   * When dependencies field update and current field is touched,
   * will trigger validate rules and render.
   */
  dependencies?: NamePath[];
  getValueFromEvent?: (...args: EventArgs) => FormValue;
  name?: NamePath;
  normalize?: (value: FormValue, prevValue: FormValue, allValues: Partial<T>) => FormValue;
  rules?: Rule<T>[];
  shouldUpdate?: ShouldUpdate;
  trigger?: string;
  validateTrigger?: string | string[] | false;
  validateFirst?: boolean;
  valuePropName?: string;
  messageVariables?: Record<string, string>;
  onReset?: () => void;
}

export interface FieldState {
  resetCount: number;
}

// We use Class instead of Hooks here since it will cost much code by using Hooks.
class Field<T extends FormValues = AnyFormValues> extends React.Component<FieldProps<T>, FieldState>
  implements FieldEntity<T> {
  public static contextType = FieldContext;

  public static defaultProps = {
    trigger: 'onChange',
    validateTrigger: 'onChange',
    valuePropName: 'value',
  };

  public state = {
    resetCount: 0,
  };

  private cancelRegisterFunc: (() => void) | null = null;

  private destroy = false;

  /**
   * Follow state should not management in State since it will async update by React.
   * This makes first render of form can not get correct state value.
   */
  private touched: boolean = false;

  private validatePromise: Promise<string[]> | null = null;

  private prevValidating: boolean = false;

  private errors: string[] = [];

  // ============================== Subscriptions ==============================
  public componentDidMount() {
    const { getInternalHooks }: InternalFormInstance<T> = this.context;
    const { registerField } = getInternalHooks(HOOK_MARK);
    this.cancelRegisterFunc = registerField(this);
  }

  public componentWillUnmount() {
    this.cancelRegister();
    this.destroy = true;
  }

  public cancelRegister = () => {
    if (this.cancelRegisterFunc) {
      this.cancelRegisterFunc();
    }
    this.cancelRegisterFunc = null;
  };

  // ================================== Utils ==================================
  public getNamePath = (): InternalNamePath => {
    const { name } = this.props;
    const { prefixName = [] }: InternalFormInstance<T> = this.context;
    const namePath = getNamePath(name);

    return 'name' in this.props ? [...prefixName, ...namePath] : [];
  };

  public getRules = (): RuleObject[] => {
    const { rules = [] } = this.props;

    return rules.map(
      (rule: Rule<T>): RuleObject => {
        if (typeof rule === 'function') {
          return rule(this.context);
        }
        return rule;
      },
    );
  };

  public reRender() {
    if (this.destroy) return;
    this.forceUpdate();
  }

  public refresh = () => {
    if (this.destroy) return;

    /**
     * Clean up current node.
     */
    this.setState(({ resetCount }) => ({
      resetCount: resetCount + 1,
    }));
  };

  // ========================= Field Entity Interfaces =========================
  // Trigger by store update. Check if need update the component
  public onStoreChange: FieldEntity<T>['onStoreChange'] = (prevStore, namePathList, info) => {
    const { shouldUpdate, dependencies = [], onReset } = this.props;
    const { getFieldsValue }: FormInstance<T> = this.context;
    const values = getFieldsValue(true);
    const namePath = this.getNamePath();
    const prevValue = this.getValue(prevStore);
    const curValue = this.getValue();

    const namePathMatch = namePathList && containsNamePath(namePathList, namePath);

    // `setFieldsValue` is a quick access to update related status
    if (info.type === 'valueUpdate' && info.source === 'external' && prevValue !== curValue) {
      this.touched = true;
      this.validatePromise = null;
      this.errors = [];
    }

    switch (info.type) {
      case 'reset':
        if (!namePathList || namePathMatch) {
          // Clean up state
          this.touched = false;
          this.validatePromise = null;
          this.errors = [];

          if (onReset) {
            onReset();
          }

          this.refresh();
          return;
        }
        break;

      case 'setField': {
        if (namePathMatch) {
          const { data } = info;
          if ('touched' in data) {
            this.touched = !!data.touched;
          }
          if ('validating' in data) {
            this.validatePromise = data.validating ? Promise.resolve([]) : null;
          }
          if ('errors' in data) {
            this.errors = data.errors || [];
          }

          this.reRender();
          return;
        }

        // Handle update by `setField` with `shouldUpdate`
        if (
          shouldUpdate &&
          !namePath.length &&
          requireUpdate(shouldUpdate, prevStore, values, prevValue, curValue, info)
        ) {
          this.reRender();
          return;
        }
        break;
      }

      case 'dependenciesUpdate': {
        /**
         * Trigger when marked `dependencies` updated. Related fields will all update
         */
        const dependencyList = dependencies.map(getNamePath);
        if (
          namePathMatch ||
          dependencyList.some(dependency => containsNamePath(info.relatedFields, dependency))
        ) {
          this.reRender();
          return;
        }
        break;
      }

      default:
        /**
         * - If `namePath` exists in `namePathList`, means it's related value and should update.
         * - If `dependencies` exists in `namePathList`, means upstream trigger update.
         * - If `shouldUpdate` provided, use customize logic to update the field
         *   - else to check if value changed
         */
        if (
          namePathMatch ||
          dependencies.some(dependency =>
            containsNamePath(namePathList as InternalNamePath[], getNamePath(dependency)),
          ) ||
          requireUpdate(shouldUpdate as ShouldUpdate, prevStore, values, prevValue, curValue, info)
        ) {
          this.reRender();
          return;
        }
        break;
    }

    if (shouldUpdate === true) {
      this.reRender();
    }
  };

  public validateRules = (options: ValidateOptions = {}) => {
    const { validateFirst = false, messageVariables } = this.props;
    const { triggerName } = options;
    const namePath = this.getNamePath();

    let filteredRules = this.getRules();
    if (triggerName) {
      filteredRules = filteredRules.filter((rule: RuleObject) => {
        const { validateTrigger } = rule;
        if (!validateTrigger) {
          return true;
        }
        const triggerList = toArray(validateTrigger);
        return triggerList.includes(triggerName);
      });
    }

    const promise = validateRules(
      namePath,
      this.getValue(),
      filteredRules,
      options,
      validateFirst,
      messageVariables,
    );
    this.validatePromise = promise;
    this.errors = [];

    promise
      .catch(e => e)
      .then((errors: string[] = []) => {
        if (this.validatePromise === promise) {
          this.validatePromise = null;
          this.errors = errors;
          this.reRender();
        }
      });

    return promise;
  };

  public isFieldValidating = () => !!this.validatePromise;

  public isFieldTouched = () => this.touched;

  public getErrors = () => this.errors;

  // ============================= Child Component =============================
  public getMeta = (): Meta => {
    // Make error & validating in cache to save perf
    this.prevValidating = this.isFieldValidating();

    const meta: Meta = {
      touched: this.isFieldTouched(),
      validating: this.prevValidating,
      errors: this.errors,
      name: this.getNamePath(),
    };

    return meta;
  };

  // Only return validate child node. If invalidate, will do nothing about field.
  public getOnlyChild = (
    children:
      | React.ReactNode
      | ((control: ChildProps, meta: Meta, context: FormInstance<T>) => React.ReactNode),
  ): { child: React.ReactNode | null; isFunction: boolean } => {
    // Support render props
    if (typeof children === 'function') {
      const meta = this.getMeta();

      return {
        ...this.getOnlyChild(children(this.getControlled(), meta, this.context)),
        isFunction: true,
      };
    }

    // Filed element only
    const childList = toChildrenArray(children);
    if (childList.length !== 1 || !React.isValidElement(childList[0])) {
      return { child: childList, isFunction: false };
    }

    return { child: childList[0], isFunction: false };
  };

  // ============================== Field Control ==============================
  public getValue = (store?: Store<T>) => {
    const { getFieldsValue }: FormInstance<T> = this.context;
    const namePath = this.getNamePath();
    return getValue(store || getFieldsValue(true), namePath);
  };

  public getControlled = (childProps: ChildProps = {}) => {
    const { trigger, validateTrigger, getValueFromEvent, normalize, valuePropName } = this.props;
    const namePath = this.getNamePath();
    const { getInternalHooks, getFieldsValue }: InternalFormInstance<T> = this.context;
    const { dispatch } = getInternalHooks(HOOK_MARK);
    const value = this.getValue();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originTriggerFunc: any = childProps[trigger as string];

    const control = {
      ...childProps,
      [valuePropName as string]: value,
    };

    // Add trigger
    control[trigger as string] = (...args: EventArgs) => {
      // Mark as touched
      this.touched = true;

      let newValue: FormValue;
      if (getValueFromEvent) {
        newValue = getValueFromEvent(...args);
      } else {
        newValue = defaultGetValueFromEvent(valuePropName as string, ...args);
      }

      if (normalize) {
        newValue = normalize(newValue, value, getFieldsValue(true));
      }

      dispatch({
        type: 'updateValue',
        namePath,
        value: newValue,
      });

      if (originTriggerFunc) {
        originTriggerFunc(...args);
      }
    };

    // Add validateTrigger
    const validateTriggerList: string[] = toArray(validateTrigger || []);

    validateTriggerList.forEach((triggerName: string) => {
      // Wrap additional function of component, so that we can get latest value from store
      const originTrigger = control[triggerName];
      control[triggerName] = (...args: EventArgs) => {
        if (originTrigger) {
          originTrigger(...args);
        }

        // Always use latest rules
        const { rules } = this.props;
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
  };

  public render() {
    const { resetCount } = this.state;
    const { children } = this.props;

    const { child, isFunction } = this.getOnlyChild(children);

    // Not need to `cloneElement` since user can handle this in render function self
    let returnChildNode: React.ReactNode;
    if (isFunction) {
      returnChildNode = child;
    } else if (React.isValidElement(child)) {
      returnChildNode = React.cloneElement(
        child as React.ReactElement,
        this.getControlled((child as React.ReactElement).props),
      );
    } else {
      warning(!child, '`children` of Field is not validate ReactElement.');
      returnChildNode = child;
    }

    return <React.Fragment key={resetCount}>{returnChildNode}</React.Fragment>;
  }
}

export default Field;

import toChildrenArray from 'rc-util/lib/Children/toArray';
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
} from './interface';
import FieldContext, { HOOK_MARK } from './FieldContext';
import { toArray } from './utils/typeUtil';
import { validateRules } from './utils/validateUtil';
import {
  containsNamePath,
  defaultGetValueFromEvent,
  getNamePath,
  getValue,
  isSimilar,
} from './utils/valueUtil';

interface ChildProps {
  value?: any;
  onChange?: (...args: any[]) => void;
  onFocus?: (...args: any[]) => void;
  onBlur?: (...args: any[]) => void;
}

export interface FieldProps {
  children?:
    | React.ReactElement
    | ((control: ChildProps, meta: Meta, form: FormInstance) => React.ReactNode);
  /**
   * Set up `dependencies` field.
   * When dependencies field update and current field is touched,
   * will trigger validate rules and render.
   */
  dependencies?: NamePath[];
  getValueFromEvent?: (...args: any[]) => any;
  name?: NamePath;
  normalize?: (value: any, prevValue: any, allValues: any) => any;
  rules?: Rule[];
  shouldUpdate?: (prevValues: any, nextValues: any, info: { source?: string }) => boolean;
  trigger?: string;
  validateTrigger?: string | string[] | false;
}

export interface FieldState {
  reset: boolean;
}

// We use Class instead of Hooks here since it will cost much code by using Hooks.
class Field extends React.Component<FieldProps, FieldState> implements FieldEntity {
  public static contextType = FieldContext;

  public static defaultProps = {
    trigger: 'onChange',
    validateTrigger: 'onChange',
  };

  public state = {
    reset: false,
  };

  private cancelRegisterFunc: () => void | null = null;

  private destroy: boolean = false;

  /**
   * Follow state should not management in State since it will async update by React.
   * This makes first render of form can not get correct state value.
   */
  private touched: boolean = false;

  private validatePromise: Promise<any> | null = null;

  // We reuse the promise to check if is `validating`
  private prevErrors: string[];

  private prevValidating: boolean;

  // ============================== Subscriptions ==============================
  public componentDidMount() {
    const { getInternalHooks }: InternalFormInstance = this.context;
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
    const { prefixName = [] }: InternalFormInstance = this.context;

    return [...prefixName, ...getNamePath(name)];
  };

  public getRules = (): RuleObject[] => {
    const { rules = [] } = this.props;

    return rules.map(
      (rule: Rule): RuleObject => {
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
     * We update `reset` state twice to clean up current node.
     * Which helps to reset value without define the type.
     */
    this.setState(
      {
        reset: true,
      },
      () => {
        this.setState({ reset: false });
      },
    );
  };

  // ========================= Field Entity Interfaces =========================
  // Trigger by store update. Check if need update the component
  public onStoreChange = (
    prevStore: any,
    namePathList: InternalNamePath[] | null,
    info: NotifyInfo,
  ) => {
    const { shouldUpdate, dependencies = [] } = this.props;
    const { getFieldsValue, getFieldError }: FormInstance = this.context;
    const values = getFieldsValue();
    const namePath = this.getNamePath();
    const prevValue = this.getValue(prevStore);
    const curValue = this.getValue();

    switch (info.type) {
      case 'reset':
        if (!namePathList || (namePathList && containsNamePath(namePathList, namePath))) {
          // Clean up state
          this.touched = false;
          this.validatePromise = null;

          this.refresh();
        }
        break;

      case 'setField': {
        if (namePathList && containsNamePath(namePathList, namePath)) {
          const { data } = info;
          if ('touched' in data) {
            this.touched = data.touched;
          }
          if ('validating' in data) {
            this.validatePromise = data.validating ? Promise.resolve() : null;
          }

          this.refresh();
        }
        break;
      }

      case 'errorUpdate': {
        const errors = getFieldError(namePath);
        const validating = this.isFieldValidating();

        if (this.prevValidating !== validating || !isSimilar(this.prevErrors, errors)) {
          this.reRender();
        }
        break;
      }

      case 'dependenciesUpdate': {
        /**
         * Trigger when marked `dependencies` updated. Related fields will all update
         */
        const dependencyList = dependencies.map(getNamePath);
        if (
          (namePathList && containsNamePath(namePathList, namePath)) ||
          dependencyList.some(dependency => containsNamePath(info.relatedFields, dependency))
        ) {
          this.reRender();
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
          (namePathList && containsNamePath(namePathList, namePath)) ||
          dependencies.some(dependency =>
            containsNamePath(namePathList, getNamePath(dependency)),
          ) ||
          (shouldUpdate ? shouldUpdate(prevStore, values, info) : prevValue !== curValue)
        ) {
          this.reRender();
        }
        break;
    }
  };

  public isFieldTouched = () => this.touched;

  public validateRules = (options?: ValidateOptions) => {
    const { triggerName } = (options || {}) as ValidateOptions;
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

    const promise = validateRules(namePath, this.getValue(), filteredRules, options);
    this.validatePromise = promise;

    promise
      .catch(e => e)
      .then(() => {
        if (this.validatePromise === promise) {
          this.validatePromise = null;
        }
      });

    return promise;
  };

  public isFieldValidating = () => !!this.validatePromise;

  // ============================= Child Component =============================
  public getMeta = (): Meta => {
    const { getFieldError } = this.context;
    // Make error & validating in cache to save perf
    this.prevValidating = this.isFieldValidating();
    this.prevErrors = getFieldError(this.getNamePath());

    const meta: Meta = {
      touched: this.isFieldTouched(),
      validating: this.prevValidating,
      errors: this.prevErrors,
    };

    return meta;
  };

  // Only return validate child node. If invalidate, will do nothing about field.
  public getOnlyChild = (
    children:
      | React.ReactNode
      | ((control: ChildProps, meta: Meta, context: any) => React.ReactNode),
  ): { child: React.ReactElement | null; isFunction: boolean } => {
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
      return { child: null, isFunction: false };
    }

    return { child: childList[0], isFunction: false };
  };

  // ============================== Field Control ==============================
  public getValue = (store?: Store) => {
    const { getFieldsValue }: FormInstance = this.context;
    const namePath = this.getNamePath();
    return getValue(store || getFieldsValue(), namePath);
  };

  public getControlled = (childProps: ChildProps = {}) => {
    const { trigger, validateTrigger, getValueFromEvent, normalize } = this.props;
    const namePath = this.getNamePath();
    const { getInternalHooks, validateFields, getFieldsValue }: InternalFormInstance = this.context;
    const { dispatch } = getInternalHooks(HOOK_MARK);
    const value = this.getValue();

    const originTriggerFunc: any = childProps[trigger];

    const control = {
      ...childProps,
      value,
    };

    // Add trigger
    control[trigger] = (...args: any[]) => {
      let newValue = (getValueFromEvent || defaultGetValueFromEvent)(...args);

      if (normalize) {
        newValue = normalize(newValue, value, getFieldsValue());
      }

      dispatch({
        type: 'updateValue',
        namePath,
        value: newValue,
      });

      // Mark as touched
      this.touched = true;

      if (originTriggerFunc) {
        originTriggerFunc(...args);
      }
    };

    // Add validateTrigger
    const validateTriggerList: string[] = toArray(validateTrigger || []);

    validateTriggerList.forEach((triggerName: string) => {
      // Wrap additional function of component, so that we can get latest value from store
      const originTrigger = control[triggerName];
      control[triggerName] = (...args: any[]) => {
        if (originTrigger) {
          originTrigger(...args);
        }

        // Always use latest rules
        const { rules } = this.props;
        if (rules && rules.length) {
          // We dispatch validate to root,
          // since it will update related data with other field with same name
          // TODO: use dispatch instead
          validateFields([namePath], { triggerName });
        }
      };
    });

    return control;
  };

  public render() {
    const { reset } = this.state;
    const { children } = this.props;

    const { child, isFunction } = this.getOnlyChild(children);
    if (!child) {
      // Return origin `children` if is not a function
      return isFunction ? child : children;
    }

    // Not need to `cloneElement` since user can handle this in render function self
    const returnChildNode = isFunction
      ? child
      : React.cloneElement(child, this.getControlled(child.props));

    // Force render a new component to reset all the data
    if (reset) {
      return React.createElement(() => returnChildNode);
    }

    return returnChildNode;
  }
}

export default Field;

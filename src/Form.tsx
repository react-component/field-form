import * as React from 'react';
import type {
  Store,
  FormInstance,
  FieldData,
  ValidateMessages,
  Callbacks,
  InternalFormInstance,
} from './interface';
import isEqual from 'rc-util/lib/isEqual';
import useForm from './useForm';
import FieldContext, { HOOK_MARK } from './FieldContext';
import type { FormContextProps } from './FormContext';
import FormContext from './FormContext';
import { isSimilar } from './utils/valueUtil';
import ListContext from './ListContext';

type BaseFormProps = Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'children'>;

type RenderProps = (values: Store, form: FormInstance) => JSX.Element | React.ReactNode;

export interface FormProps<Values = any> extends BaseFormProps {
  /**
   * Values to be loaded into the form when started
   * if `undefined`, the form will be shown empty
   *
   *  If the initial value is `null`, the form will go into `loading` mode
   * expecting data. If no data is received after `loadingTimeout` milliseconds
   * the form will be shown empty
   *
   * If any other object is passed, the object will be used to fill in the form
   */
  initialValues?: Store | null;
  form?: FormInstance<Values>;
  children?: RenderProps | React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: false | string | React.FC<any> | React.ComponentClass<any>;
  fields?: FieldData[];
  name?: string;
  validateMessages?: ValidateMessages;
  onValuesChange?: Callbacks<Values>['onValuesChange'];
  onFieldsChange?: Callbacks<Values>['onFieldsChange'];
  onFinish?: Callbacks<Values>['onFinish'];
  onFinishFailed?: Callbacks<Values>['onFinishFailed'];
  onBeforeSubmit?: Callbacks<Values>['onBeforeSubmit'];
  onFinishSuccess?: Callbacks<Values>['onFinishSuccess'];
  onFinishError?: Callbacks<Values>['onFinishError'];
  onFinishFinally?: Callbacks<Values>['onFinishFinally'];
  /**
   * Set the form to read only mode (not editable)
   */
  readOnly?: boolean;
  /**
   * Force the form in to loading mode
   */
  loading?: boolean;
  /**
   * Timeout in milliseconds before the form is comes out of loading mode
   * This is used when initial values are expected to be loaded from a remote source
   * @default 3000
   * */
  loadingTimeout?: number;
  warnOnUnsavedChanges?: boolean;
  validateTrigger?: string | string[] | false;
  preserve?: boolean;
}

const Form: React.ForwardRefRenderFunction<FormInstance, FormProps> = (
  {
    name,
    initialValues,
    fields,
    form,
    preserve,
    children,
    component: Component = 'form',
    validateMessages,
    validateTrigger = 'onChange',
    onValuesChange,
    onFieldsChange,
    onBeforeSubmit,
    onFinish,
    onFinishFailed,
    onFinishSuccess,
    onFinishError,
    onFinishFinally,
    readOnly,
    loading,
    loadingTimeout = 3000,
    ...restProps
  }: FormProps,
  ref,
) => {
  const formContext: FormContextProps = React.useContext(FormContext);

  // We customize handle event since Context will makes all the consumer re-render:
  // https://reactjs.org/docs/context.html#contextprovider
  const [formInstance] = useForm(form);
  const {
    useSubscribe,
    setInitialValues,
    setCallbacks,
    setValidateMessages,
    setPreserve,
    setReadOnly,
    setLoading,
    setLoadingTimeout,
    destroyForm,
  } = (formInstance as InternalFormInstance).getInternalHooks(HOOK_MARK);

  // Pass ref with form instance
  React.useImperativeHandle(ref, () => formInstance);

  // Register form into Context
  React.useEffect(() => {
    formContext.registerForm(name, formInstance);
    return () => {
      formContext.unregisterForm(name);
    };
  }, [formContext, formInstance, name]);

/**
 * Pass props to store
 */
  React.useEffect(() => {
    setValidateMessages({
      ...formContext.validateMessages,
      ...validateMessages,
    });
  }, [formContext.validateMessages, setValidateMessages, validateMessages]);
  React.useEffect(() => {
    setReadOnly(readOnly);
  }, [readOnly, setReadOnly]);
  React.useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);
  React.useEffect(() => {
    setLoadingTimeout(loadingTimeout);
  }, [loadingTimeout, setLoadingTimeout]);
  React.useEffect(() => {
    setCallbacks({
      onValuesChange,
      onFieldsChange: (changedFields: FieldData[], ...rest) => {
        formContext.triggerFormChange(name, changedFields);

        if (onFieldsChange) {
          onFieldsChange(changedFields, ...rest);
        }
      },
      onFinish: async (values: Store) => {
        formContext.triggerFormFinish(name, values);
        return onFinish?.(values);
      },
      onBeforeSubmit,
      onFinishFinally,
      onFinishError,
      onFinishSuccess,
      onFinishFailed,
      onReset: restProps.onReset,
    });
  }, [
    formContext,
    name,
    onBeforeSubmit,
    onFieldsChange,
    onFinish,
    onFinishError,
    onFinishFailed,
    onFinishFinally,
    onFinishSuccess,
    onValuesChange,
    restProps.onReset,
    setCallbacks,
  ]);
  React.useEffect(() => {
    setPreserve(preserve);
  }, [preserve, setPreserve]);

  // Set initial value, init store value when first mount
  const mountRef = React.useRef(false);
  React.useEffect(() => {
    if (!mountRef.current) {
      mountRef.current = setInitialValues(initialValues, mountRef.current);
    }
  }, [initialValues, setInitialValues]);

  // Destroy form on unmount
  React.useEffect(
    () => destroyForm,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const childrenRenderProps = typeof children === 'function';

  // Prepare children by `children` type
  const childrenNode: React.ReactNode = React.useMemo(() => {
    if (childrenRenderProps) {
      const values = formInstance.getFieldsValue(true);
      return (children as RenderProps)(values, formInstance);
    } else {
      return children;
    }
  }, [children, childrenRenderProps, formInstance]);

  // Not use subscribe when using render props
  useSubscribe(!childrenRenderProps);

  // Listen if fields provided. We use ref to save prev data here to avoid additional render
  const prevFieldsRef = React.useRef<FieldData[] | undefined>();
  React.useEffect(() => {
    if (!isSimilar(prevFieldsRef.current || [], fields || [])) {
      formInstance.setFields(fields || []);
    }
    prevFieldsRef.current = fields;
  }, [fields, formInstance]);

  const formContextValue = React.useMemo(
    () => ({
      ...(formInstance as InternalFormInstance),
      validateTrigger,
    }),
    [formInstance, validateTrigger],
  );

  const wrapperNode = (
    <ListContext.Provider value={null}>
      <FieldContext.Provider value={formContextValue}>{childrenNode}</FieldContext.Provider>
    </ListContext.Provider>
  );

  if (Component === false) {
    return wrapperNode;
  }

  if(!mountRef.current && !isEqual(initialValues, form.initialValues)) return null;

  return (
    <Component
      {...restProps}
      onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();

        formInstance.submit();
      }}
      onReset={(event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        formInstance.reset(event);
      }}
    >
      {wrapperNode}
    </Component>
  );
};

export default Form;

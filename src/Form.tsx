import * as React from 'react';
import {
  Store,
  FormInstance,
  FieldData,
  ValidateMessages,
  Callbacks,
  InternalFormInstance,
} from './interface';
import useForm from './useForm';
import FieldContext, { HOOK_MARK } from './FieldContext';

type BaseFormProps = Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'>;

export interface StateFormProps extends BaseFormProps {
  initialValues?: Store;
  form?: FormInstance;
  children?: (() => JSX.Element | React.ReactNode) | React.ReactNode;
  fields?: FieldData[];
  validateMessages?: ValidateMessages;
  onValuesChange?: Callbacks['onValuesChange'];
  onFieldsChange?: Callbacks['onFieldsChange'];
  onFinish?: (values: Store) => void;
}

const StateForm: React.FunctionComponent<StateFormProps> = (
  {
    initialValues,
    fields,
    form,
    children,
    validateMessages,
    onValuesChange,
    onFieldsChange,
    onFinish,
    ...restProps
  }: StateFormProps,
  ref,
) => {
  // We customize handle event since Context will makes all the consumer re-render:
  // https://reactjs.org/docs/context.html#contextprovider
  const [formInstance] = useForm(form);
  const {
    useSubscribe,
    setInitialValues,
    setCallbacks,
    setValidateMessages,
  } = (formInstance as InternalFormInstance).getInternalHooks(HOOK_MARK);

  // Pass props to store
  setValidateMessages(validateMessages);
  setCallbacks({
    onValuesChange,
    onFieldsChange,
  });

  // Initial store value when first mount
  const mountRef = React.useRef(null);
  if (!mountRef.current) {
    mountRef.current = true;
    setInitialValues(initialValues);
  }

  // Prepare children by `children` type
  let childrenNode = children;
  const childrenRenderProps = typeof children === 'function';
  if (childrenRenderProps) {
    const values = formInstance.getFieldsValue();
    childrenNode = (children as any)(values, formInstance);
  }
  // Not use subscribe when using render props
  useSubscribe(!childrenRenderProps);

  // Pass ref with form instance
  React.useImperativeHandle(ref, () => formInstance);

  // Listen if fields provided. We use ref to save prev data here to avoid additional render
  const prevFieldsRef = React.useRef<FieldData[] | undefined>();
  if (prevFieldsRef.current !== fields) {
    formInstance.setFields(fields || []);
  }
  prevFieldsRef.current = fields;

  return (
    <form
      {...restProps}
      onSubmit={event => {
        event.preventDefault();
        event.stopPropagation();

        formInstance
          .validateFields()
          .then(values => {
            if (onFinish) {
              onFinish(values);
            }
          })
          // Do nothing about submit catch
          .catch(e => e);
      }}
    >
      <FieldContext.Provider value={formInstance as InternalFormInstance}>
        {childrenNode}
      </FieldContext.Provider>
    </form>
  );
};

export default StateForm;

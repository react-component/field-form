import * as React from 'react';
import { Callbacks, FieldData, Store } from './interface';
import FieldContext, { FormInstance, HOOK_MARK } from './FieldContext';
import Field from './Field';
import List from './List';
import useForm from './useForm';
import { Omit } from './utils/typeUtil';

type BaseFormProps = Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'>;

export interface StateFormProps extends BaseFormProps {
  initialValues?: Store;
  form?: FormInstance;
  children?: (() => JSX.Element | React.ReactNode) | React.ReactNode;
  fields?: FieldData[];
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
  const { useSubscribe, setInitialValues, setCallbacks } = formInstance.getInternalHooks(HOOK_MARK);

  // Pass props callback to store
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
      <FieldContext.Provider value={formInstance}>{childrenNode}</FieldContext.Provider>
    </form>
  );
};

const InternalStateForm = React.forwardRef<FormInstance, StateFormProps>(StateForm);

type InternalStateForm = typeof InternalStateForm;
interface RefStateForm extends InternalStateForm {
  Field: typeof Field;
  List: typeof List;
  useForm: typeof useForm;
}

const RefStateForm: RefStateForm = InternalStateForm as any;

RefStateForm.Field = Field;
RefStateForm.List = List;
RefStateForm.useForm = useForm;

export { FormInstance, Field as Field };

export default RefStateForm;

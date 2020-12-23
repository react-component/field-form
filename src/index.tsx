import * as React from 'react';
import { FormInstance } from './interface';
import Field from './Field';
import List from './List';
import useForm from './useForm';
import FieldForm, { FormProps } from './Form';
import { FormProvider } from './FormContext';

const InternalForm = React.forwardRef<FormInstance, FormProps>(FieldForm) as <Values = any>(
  props: React.PropsWithChildren<FormProps<Values>> & { ref?: React.Ref<FormInstance<Values>> },
) => React.ReactElement;

type InternalFormType = typeof InternalForm;

interface RefFormType extends InternalFormType {
  FormProvider: typeof FormProvider;
  Field: typeof Field;
  List: typeof List;
  useForm: typeof useForm;
}

const RefForm: RefFormType = InternalForm as RefFormType;

RefForm.FormProvider = FormProvider;
RefForm.Field = Field;
RefForm.List = List;
RefForm.useForm = useForm;

export { FormInstance, Field, List, useForm, FormProvider, FormProps };

export default RefForm;

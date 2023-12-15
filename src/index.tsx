import * as React from 'react';
import Field from './Field';
import FieldContext from './FieldContext';
import type { FormProps } from './Form';
import FieldForm from './Form';
import { FormProvider } from './FormContext';
import List from './List';
import ListContext from './ListContext';
import type { FormInstance } from './interface';
import useForm from './useForm';
import useWatch from './useWatch';

const InternalForm = React.forwardRef<FormInstance, FormProps>(FieldForm) as <Values = any>(
  props: FormProps<Values> & { ref?: React.Ref<FormInstance<Values>> },
) => React.ReactElement;

type InternalFormType = typeof InternalForm;
interface RefFormType extends InternalFormType {
  FormProvider: typeof FormProvider;
  Field: typeof Field;
  List: typeof List;
  useForm: typeof useForm;
  useWatch: typeof useWatch;
}

const RefForm: RefFormType = InternalForm as RefFormType;

RefForm.FormProvider = FormProvider;
RefForm.Field = Field;
RefForm.List = List;
RefForm.useForm = useForm;
RefForm.useWatch = useWatch;

export { Field, FieldContext, FormProvider, List, ListContext, useForm, useWatch };

export type { FormInstance, FormProps };

export default RefForm;

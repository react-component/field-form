import * as React from 'react';
import type { FormRef, FormInstance } from './interface';
import Field from './Field';
import List from './List';
import useForm from './useForm';
import type { FormProps } from './Form';
import FieldForm from './Form';
import { FormProvider } from './FormContext';
import FieldContext from './FieldContext';
import ListContext from './ListContext';
import useWatch from './useWatch';

const InternalForm = React.forwardRef<FormRef, FormProps>(FieldForm) as <Values = any>(
  props: FormProps<Values> & { ref?: React.Ref<FormRef<Values>> },
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

export { Field, List, useForm, FormProvider, FieldContext, ListContext, useWatch };

export type { FormProps, FormInstance, FormRef };

export default RefForm;

import * as React from 'react';
import { FormInstance } from './interface';
import Field from './Field';
import List from './List';
import type { StrictType } from './useForm';
import useForm, { STRICT } from './useForm';
import type { FormProps } from './Form';
import FieldForm from './Form';
import { FormProvider } from './FormContext';
import FieldContext from './FieldContext';
import ListContext from './ListContext';
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
  STRICT: StrictType;
}

const RefForm: RefFormType = InternalForm as RefFormType;

RefForm.FormProvider = FormProvider;
RefForm.Field = Field;
RefForm.List = List;
RefForm.useForm = useForm;
RefForm.useWatch = useWatch;
RefForm.STRICT = STRICT;

export {
  FormInstance,
  Field,
  List,
  useForm,
  FormProvider,
  FieldContext,
  ListContext,
  useWatch,
  STRICT,
};

export type { FormProps, StrictType };

export default RefForm;

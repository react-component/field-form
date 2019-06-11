import * as React from 'react';
import { FormInstance } from './interface';
import Field from './Field';
import List from './List';
import useForm from './useForm';
import FieldForm, { StateFormProps } from './Form';

const InternalStateForm = React.forwardRef<FormInstance, StateFormProps>(FieldForm);

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

export { FormInstance, Field, useForm };

export default RefStateForm;

import * as React from 'react';
import { FormInstance } from './interface';

export const HOOK_MARK = 'RC_FORM_INTERNAL_HOOKS';

const warningFunc: any = () => {
  throw new Error('StateForm is not defined.');
};

const Context = React.createContext<FormInstance>({
  getFieldValue: warningFunc,
  getFieldsValue: warningFunc,
  getFieldError: warningFunc,
  getFieldsError: warningFunc,
  isFieldsTouched: warningFunc,
  isFieldTouched: warningFunc,
  isFieldValidating: warningFunc,
  resetFields: warningFunc,
  setFields: warningFunc,
  setFieldsValue: warningFunc,
  validateFields: warningFunc,

  getInternalHooks: warningFunc,
});

export default Context;

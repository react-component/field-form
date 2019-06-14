import * as React from 'react';
import { InternalFormInstance } from './interface';

export const HOOK_MARK = 'RC_FORM_INTERNAL_HOOKS';

const warningFunc: any = () => {
  throw new Error('StateForm is not defined.');
};

const Context = React.createContext<InternalFormInstance>({
  getFieldValue: warningFunc,
  getFieldsValue: warningFunc,
  getFieldError: warningFunc,
  getFieldsError: warningFunc,
  isFieldsTouched: warningFunc,
  isFieldTouched: warningFunc,
  isFieldValidating: warningFunc,
  isFieldsValidating: warningFunc,
  resetFields: warningFunc,
  setFields: warningFunc,
  setFieldsValue: warningFunc,
  validateFields: warningFunc,

  getInternalHooks: warningFunc,
});

export default Context;

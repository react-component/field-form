import * as React from 'react';
import warning from 'rc-util/lib/warning';
import { InternalFormInstance } from './interface';

export const HOOK_MARK = 'RC_FORM_INTERNAL_HOOKS';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const warningFunc: any = () => {
  warning(false, 'Can not find FormContext. Please make sure you wrap Field under Form.');
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
  submit: warningFunc,

  getInternalHooks: () => {
    warningFunc();

    return {
      dispatch: warningFunc,
      registerField: warningFunc,
      useSubscribe: warningFunc,
      setInitialValues: warningFunc,
      setCallbacks: warningFunc,
      getFields: warningFunc,
      setValidateMessages: warningFunc,
      setPreserve: warningFunc,
    };
  },
});

export default Context;

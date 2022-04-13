import type { FormInstance } from '.';
import { FieldContext } from '.';
import warning from 'rc-util/lib/warning';
import { HOOK_MARK } from './FieldContext';
import type { InternalFormInstance, NamePath, Store } from './interface';
import { useState, useContext, useEffect, useRef } from 'react';
import { getNamePath, getValue } from './utils/valueUtil';

const useWatch = <ValueType = Store>(dependencies: NamePath = [], form?: FormInstance) => {
  const [value, setValue] = useState<ValueType>();

  const fieldContext = useContext(FieldContext);
  const formInstance = (form as InternalFormInstance) || fieldContext;

  // Warning if not exist form instance
  if (process.env.NODE_ENV !== 'production') {
    warning(
      !!formInstance,
      'useWatch requires a form instance since it can not auto detect from context.',
    );
  }

  const { getFieldsValue, getInternalHooks } = formInstance;
  const { registerWatch } = getInternalHooks(HOOK_MARK);

  const namePath = getNamePath(dependencies);
  const namePathRef = useRef(namePath);
  namePathRef.current = namePath;

  useEffect(
    () => {
      const cancelRegister = registerWatch(store => {
        const newValue = getValue(store, namePathRef.current);
        setValue(newValue);
      });

      // TODO: We can improve this perf in future
      const initialValue = getValue(getFieldsValue(), namePathRef.current);
      setValue(initialValue);

      return cancelRegister;
    },
    /* eslint-disable react-hooks/exhaustive-deps */
    // We do not need re-register since namePath content is the same
    [],
    /* eslint-enable */
  );

  return value;
};

export default useWatch;

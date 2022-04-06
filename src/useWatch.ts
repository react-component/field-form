import type { FormInstance } from '.';
import { HOOK_MARK } from './FieldContext';
import type { InternalFormInstance } from './interface';
import { useState, useEffect } from 'react';

interface UseWatchProps {
  form?: FormInstance<any>;
}
let watchId = 0;

const useWatch = (props: UseWatchProps) => {
  const { form } = props;
  const values = form.getFieldsValue(true);
  const [, forceUpdate] = useState({});
  const { setWatchCallbacks } = (form as InternalFormInstance).getInternalHooks(HOOK_MARK);

  useEffect(() => {
    watchId += 1;
    setWatchCallbacks(watchId, {
      onValuesChange: () => {
        forceUpdate({});
      },
    });
  }, [setWatchCallbacks]);

  return values;
};

export default useWatch;

import type { FormInstance } from '.';
import { HOOK_MARK } from './FieldContext';
import type { InternalFormInstance, NamePath } from './interface';
import { useState, useEffect, useRef } from 'react';
import { getNamePath, containsNamePath } from './utils/valueUtil';

interface UseWatchProps {
  form?: FormInstance<any>;
  dependencies?: NamePath[];
}
let watchId = 0;

const useWatch = (props: UseWatchProps) => {
  const { form, dependencies } = props;
  const [, forceUpdate] = useState({});
  const { setWatchCallbacks } = (form as InternalFormInstance).getInternalHooks(HOOK_MARK);
  const watchIdRef = useRef((watchId += 1));
  const isDrop = useRef(false);

  useEffect(() => {
    return () => {
      isDrop.current = true;
    };
  }, []);

  useEffect(() => {
    setWatchCallbacks(watchIdRef.current, {
      onValuesChange: namePath => {
        if (isDrop.current) return;
        if (dependencies) {
          const dependencyList = dependencies?.map(getNamePath);
          if (dependencyList.some(dependency => containsNamePath(namePath, dependency))) {
            forceUpdate({});
          }
        } else {
          forceUpdate({});
        }
      },
    });
  }, [dependencies, setWatchCallbacks]);

  return form.getFieldsValue(true);
};

export default useWatch;

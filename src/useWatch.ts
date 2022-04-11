import type { FormInstance } from '.';
import { FieldContext } from '.';
import { HOOK_MARK } from './FieldContext';
import type { InternalFormInstance, NamePath } from './interface';
import { useState, useRef, useContext, useEffect } from 'react';
import { getNamePath, containsNamePath } from './utils/valueUtil';

const useWatch = <Values = any>(dependencies?: NamePath[], form?: FormInstance<Values>) => {
  const watchIdRef = useRef<object>({});
  const [, forceUpdate] = useState({});

  const fieldContext = useContext(FieldContext);
  const { getFieldsValue, getInternalHooks } = (form || fieldContext) as InternalFormInstance;
  const { setWatchCallbacks } = getInternalHooks(HOOK_MARK);

  useEffect(() => {
    forceUpdate({});
  }, []);

  useEffect(() => {
    const id = watchIdRef.current;
    setWatchCallbacks(id, {
      onFieldsChange: namePathList => {
        const dependencyList = dependencies?.map(getNamePath);
        const nameList = namePathList?.map(getNamePath);
        if (dependencies && namePathList) {
          if (dependencyList.some(dependency => containsNamePath(nameList, dependency))) {
            forceUpdate({});
          }
        } else {
          forceUpdate({});
        }
      },
    });

    return () => {
      setWatchCallbacks(id, {});
    };
  }, [dependencies, getFieldsValue, setWatchCallbacks]);

  return getFieldsValue();
};

export default useWatch;

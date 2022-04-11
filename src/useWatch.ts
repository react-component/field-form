import type { FormInstance } from '.';
import { FieldContext } from '.';
import { HOOK_MARK } from './FieldContext';
import type { InternalFormInstance, NamePath } from './interface';
import { useState, useRef, useContext, useEffect } from 'react';
import { getNamePath, containsNamePath } from './utils/valueUtil';

const useWatch = <Values = any>(dependencies?: NamePath[], form?: FormInstance<Values>) => {
  const [values, setValues] = useState<Values>({} as Values);
  const watchIdRef = useRef<Record<string, any>>({});

  const fieldContext = useContext(FieldContext);
  const { getFieldsValue, getInternalHooks } = (form || fieldContext) as InternalFormInstance;
  const { setWatchCallbacks } = getInternalHooks(HOOK_MARK);

  useEffect(() => {
    const id = watchIdRef.current;
    return () => {
      setWatchCallbacks(id, {});
    };
  }, [setWatchCallbacks]);

  setWatchCallbacks(watchIdRef.current, {
    onFieldsChange: (namePathList, registerValues) => {
      const dependencyList = dependencies?.map(getNamePath);
      const nameList = namePathList?.map(getNamePath);
      if (dependencies && namePathList) {
        if (dependencyList.some(dependency => containsNamePath(nameList, dependency))) {
          setValues(getFieldsValue());
        }
      } else {
        setValues(registerValues || getFieldsValue());
      }
    },
  });

  return values;
};

export default useWatch;

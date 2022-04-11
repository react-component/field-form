import type { FormInstance } from '.';
import { FieldContext } from '.';
import { HOOK_MARK } from './FieldContext';
import type { InternalFormInstance, NamePath } from './interface';
import { useState, useRef, useContext, useEffect } from 'react';
import { getNamePath, containsNamePath } from './utils/valueUtil';

const useWatch = <Values = any>(dependencies?: NamePath[], form?: FormInstance<Values>) => {
  const [values, setValues] = useState<Values>({} as Values);
  const watchIdRef = useRef<object>({});

  const fieldContext = useContext(FieldContext);
  const { getFieldsValue, getInternalHooks } = (form || fieldContext) as InternalFormInstance;
  const { setWatchCallbacks } = getInternalHooks(HOOK_MARK);

  useEffect(() => {
    setValues(getFieldsValue());
  }, [getFieldsValue]);

  useEffect(() => {
    const id = watchIdRef.current;
    setWatchCallbacks(id, {
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

    return () => {
      setWatchCallbacks(id, {});
    };
  }, [dependencies, getFieldsValue, setWatchCallbacks]);

  return values;
};

export default useWatch;

import type { FormInstance } from '.';
import { FieldContext } from '.';
import { HOOK_MARK } from './FieldContext';
import type { InternalFormInstance, NamePath } from './interface';
import { useState, useEffect, useRef, useContext } from 'react';
import { getNamePath, containsNamePath } from './utils/valueUtil';

const useWatch = <Values>(dependencies?: NamePath[], form?: FormInstance<Values>) => {
  const [values, setValues] = useState<Values>({} as Values);
  const watchIdRef = useRef<symbol>(Symbol('watchId'));
  const isDrop = useRef(false);

  const fieldContext = useContext(FieldContext);
  const { getFieldsValue, getInternalHooks } = (form || fieldContext) as InternalFormInstance;
  const { setWatchCallbacks } = getInternalHooks(HOOK_MARK);

  useEffect(() => {
    isDrop.current = false;
    return () => {
      isDrop.current = true;
    };
  }, []);

  useEffect(() => {
    setWatchCallbacks(watchIdRef.current, {
      onValuesChange: ({ namePathList, registerValues }) => {
        if (isDrop.current) return;
        const dependencyList = dependencies?.map(getNamePath);
        if (dependencies && namePathList) {
          const nameList = namePathList?.map(getNamePath);
          if (dependencyList.some(dependency => containsNamePath(nameList, dependency))) {
            setValues(getFieldsValue());
          }
        } else {
          setValues(registerValues);
        }
      },
    });
  }, [dependencies, getFieldsValue, setWatchCallbacks]);

  return values;
};

export default useWatch;

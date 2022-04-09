import type { FormInstance } from '.';
import { FieldContext } from '.';
import { HOOK_MARK } from './FieldContext';
import type { InternalFormInstance, NamePath } from './interface';
import { useState, useEffect, useRef, useContext } from 'react';
import { getNamePath, containsNamePath } from './utils/valueUtil';
import set from 'rc-util/lib/utils/set';
import get from 'rc-util/lib/utils/get';

const useWatch = <Values>(dependencies?: NamePath[], form?: FormInstance<Values>) => {
  const [, forceUpdate] = useState({});
  const valuesRef = useRef<Values>({} as Values);
  const watchIdRef = useRef<symbol>(Symbol('watchId'));
  const isDrop = useRef(false);

  const fieldContext = useContext(FieldContext);
  const { getFieldValue, getFieldsValue, getInternalHooks } = (form ||
    fieldContext) as InternalFormInstance;
  const { setWatchCallbacks, getFieldEntities } = getInternalHooks(HOOK_MARK);

  useEffect(() => {
    isDrop.current = false;
    return () => {
      isDrop.current = true;
    };
  }, []);

  useEffect(() => {
    setWatchCallbacks(watchIdRef.current, {
      onValuesChange: ({ namePathList, type, values, isListField }) => {
        if (isDrop.current) return;
        valuesRef.current = getFieldsValue();
        const dependencyList = dependencies?.map(getNamePath);
        if (dependencies && namePathList) {
          const nameList = namePathList?.map(getNamePath);
          if (dependencyList.some(dependency => containsNamePath(nameList, dependency))) {
            dependencyList.forEach(name => {
              if (isListField) {
                valuesRef.current = set(valuesRef.current, name, getFieldValue(name));
              } else {
                valuesRef.current = set(
                  valuesRef.current,
                  name,
                  type === 'cancelRegister' ? undefined : getFieldValue(name),
                );
              }
            });
            forceUpdate({});
          }
        } else {
          dependencyList?.forEach(name => {
            if (getFieldEntities(true).find(item => item.getNamePath().join() === name.join())) {
              valuesRef.current = set(valuesRef.current, name, get(values, name));
            }
          });
          forceUpdate({});
        }
      },
    });
  }, [dependencies, getFieldEntities, getFieldValue, getFieldsValue, setWatchCallbacks]);

  return valuesRef.current;
};

export default useWatch;

import type { FormInstance } from '.';
import { FieldContext } from '.';
import { HOOK_MARK } from './FieldContext';
import type { InternalFormInstance, NamePath } from './interface';
import { useState, useEffect, useRef, useContext } from 'react';
import { getNamePath, containsNamePath } from './utils/valueUtil';
import set from 'rc-util/lib/utils/set';
import get from 'rc-util/lib/utils/get';

let watchId = 0;

const useWatch = <Values>(dependencies?: NamePath[], form?: FormInstance<Values>) => {
  const [, forceUpdate] = useState({});
  const valuesRef = useRef<Values>();
  const watchIdRef = useRef<number>();
  const isDrop = useRef(false);

  const fieldContext = useContext(FieldContext);
  const { getFieldValue, getInternalHooks } = (form || fieldContext) as InternalFormInstance;
  const { setWatchCallbacks, getFieldEntities } = getInternalHooks(HOOK_MARK);

  useEffect(() => {
    watchId += 1;
    watchIdRef.current = watchId;
    return () => {
      isDrop.current = true;
    };
  }, []);

  useEffect(() => {
    setWatchCallbacks(watchIdRef.current, {
      onValuesChange: ({ namePathList, type, values, isListField }) => {
        if (isDrop.current) return;
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
                  type === 'unMountField' ? undefined : getFieldValue(name),
                );
              }
            });
            forceUpdate({});
          }
        } else {
          dependencyList.forEach(name => {
            if (getFieldEntities(true).find(item => item.getNamePath().join() === name.join())) {
              valuesRef.current = set(
                valuesRef.current,
                name,
                values ? get(values, name) : getFieldValue(name),
              );
            }
          });
          forceUpdate({});
        }
      },
    });
  }, [dependencies, getFieldEntities, getFieldValue, setWatchCallbacks]);

  return valuesRef.current;
};

export default useWatch;

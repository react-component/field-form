import type { FormInstance } from '.';
import { FieldContext } from '.';
import { HOOK_MARK } from './FieldContext';
import type { InternalFormInstance, NamePath } from './interface';
import { useState, useContext, useEffect } from 'react';
import { getNamePath, containsNamePath } from './utils/valueUtil';

const useWatch = <Values = any>(dependencies?: NamePath[], form?: FormInstance<Values>) => {
  const [, forceUpdate] = useState({});

  const fieldContext = useContext(FieldContext);
  const { getFieldsValue, getInternalHooks } = (form || fieldContext) as InternalFormInstance;
  const { watchMap } = getInternalHooks(HOOK_MARK);

  useEffect(() => {
    forceUpdate({});
  }, []);

  useEffect(() => {
    const id = {};
    watchMap.set(id, namePathList => {
      const dependencyList = dependencies?.map(getNamePath);
      const nameList = namePathList?.map(getNamePath);
      if (dependencyList && nameList) {
        if (dependencyList.some(dependency => containsNamePath(nameList, dependency))) {
          forceUpdate({});
        }
      } else {
        forceUpdate({});
      }
    });
    return () => {
      watchMap.delete(id);
    };
  }, [dependencies, watchMap]);

  return getFieldsValue();
};

export default useWatch;

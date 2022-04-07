import type { FormInstance } from '.';
import { HOOK_MARK } from './FieldContext';
import type { InternalFormInstance, NamePath } from './interface';
import { useState, useEffect, useRef } from 'react';
import { getNamePath, containsNamePath } from './utils/valueUtil';
import set from 'rc-util/lib/utils/set';
import get from 'rc-util/lib/utils/get';

interface UseWatchProps<Values = any> {
  form?: FormInstance<Values>;
  dependencies?: NamePath[];
  // initialValues?: Record<string, any>;
}
let watchId = 0;

const useWatch = <Values>(props: UseWatchProps<Values>) => {
  const { form, dependencies } = props;
  const [, forceUpdate] = useState({});
  const valuesRef = useRef<Values>();
  const { setWatchCallbacks, getFieldEntities } = (form as InternalFormInstance).getInternalHooks(
    HOOK_MARK,
  );
  const watchIdRef = useRef((watchId += 1));
  const isDrop = useRef(false);

  useEffect(() => {
    return () => {
      isDrop.current = true;
    };
  }, []);

  useEffect(() => {
    setWatchCallbacks(watchIdRef.current, {
      onValuesChange: ({ namePathList, type, values }) => {
        if (isDrop.current) return;
        if (dependencies && namePathList) {
          const dependencyList = dependencies?.map(getNamePath);
          const nameList = namePathList?.map(getNamePath);
          if (dependencyList.some(dependency => containsNamePath(nameList, dependency))) {
            dependencyList.forEach(name => {
              valuesRef.current = set(
                valuesRef.current,
                name,
                type === 'unMountField' ? undefined : form.getFieldValue(name),
              );
            });
            forceUpdate({});
          }
        } else {
          const dependencyList = dependencies?.map(getNamePath);

          dependencyList.forEach(name => {
            if (getFieldEntities(true).find(item => item.getNamePath().join() === name.join())) {
              valuesRef.current = set(
                valuesRef.current,
                name,
                values ? get(values, name) : form.getFieldValue(name),
              );
            }
          });
          forceUpdate({});
        }
      },
    });
  }, [dependencies, form, getFieldEntities, setWatchCallbacks]);

  // return form.getFieldsValue(true);
  return valuesRef.current;
};

export default useWatch;

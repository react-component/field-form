import type { FormInstance } from '.';
import { HOOK_MARK } from './FieldContext';
import type { InternalFormInstance, NamePath } from './interface';
import { useState, useEffect, useRef } from 'react';
import { getNamePath, containsNamePath } from './utils/valueUtil';
import set from 'rc-util/lib/utils/set';

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
      onValuesChange: (namePath, type) => {
        if (isDrop.current) return;
        if (dependencies && namePath) {
          const dependencyList = dependencies?.map(getNamePath);
          const nameList = namePath?.map(getNamePath);
          if (dependencyList.some(dependency => containsNamePath(nameList, dependency))) {
            nameList.forEach(name => {
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
            valuesRef.current = set(valuesRef.current, name, form.getFieldValue(name));
          });
          forceUpdate({});
        }
      },
    });
  }, [dependencies, form, setWatchCallbacks]);

  // return form.getFieldsValue(true);
  return valuesRef.current;
};

export default useWatch;

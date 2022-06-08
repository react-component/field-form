import type { FormInstance } from '.';
import { FieldContext } from '.';
import warning from 'rc-util/lib/warning';
import { HOOK_MARK } from './FieldContext';
import type { InternalFormInstance, NamePath, Store } from './interface';
import { useState, useContext, useEffect, useRef, useMemo } from 'react';
import { getNamePath, getValue } from './utils/valueUtil';

type ReturnPromise<T> = T extends Promise<infer ValueType> ? ValueType : never;
type GetGeneric<TForm extends FormInstance> = ReturnPromise<ReturnType<TForm['validateFields']>>;

export function stringify(value: any) {
  try {
    return JSON.stringify(value);
  } catch (err) {
    return Math.random();
  }
}

function useWatch<
  TDependencies1 extends keyof GetGeneric<TForm>,
  TForm extends FormInstance,
  TDependencies2 extends keyof GetGeneric<TForm>[TDependencies1],
  TDependencies3 extends keyof GetGeneric<TForm>[TDependencies1][TDependencies2],
  TDependencies4 extends keyof GetGeneric<TForm>[TDependencies1][TDependencies2][TDependencies3],
>(
  dependencies: [TDependencies1, TDependencies2, TDependencies3, TDependencies4],
  form?: TForm,
): GetGeneric<TForm>[TDependencies1][TDependencies2][TDependencies3][TDependencies4];

function useWatch<
  TDependencies1 extends keyof GetGeneric<TForm>,
  TForm extends FormInstance,
  TDependencies2 extends keyof GetGeneric<TForm>[TDependencies1],
  TDependencies3 extends keyof GetGeneric<TForm>[TDependencies1][TDependencies2],
>(
  dependencies: [TDependencies1, TDependencies2, TDependencies3],
  form?: TForm,
): GetGeneric<TForm>[TDependencies1][TDependencies2][TDependencies3];

function useWatch<
  TDependencies1 extends keyof GetGeneric<TForm>,
  TForm extends FormInstance,
  TDependencies2 extends keyof GetGeneric<TForm>[TDependencies1],
>(
  dependencies: [TDependencies1, TDependencies2],
  form?: TForm,
): GetGeneric<TForm>[TDependencies1][TDependencies2];

function useWatch<TDependencies extends keyof GetGeneric<TForm>, TForm extends FormInstance>(
  dependencies: TDependencies | [TDependencies],
  form?: TForm,
): GetGeneric<TForm>[TDependencies];

function useWatch<TForm extends FormInstance>(dependencies: [], form?: TForm): GetGeneric<TForm>;

function useWatch<TForm extends FormInstance>(dependencies: NamePath, form?: TForm): any;

function useWatch<ValueType = Store>(dependencies: NamePath, form?: FormInstance): ValueType;

function useWatch(dependencies: NamePath = [], form?: FormInstance) {
  const [value, setValue] = useState<any>();

  const valueStr = useMemo(() => stringify(value), [value]);
  const valueStrRef = useRef(valueStr);
  valueStrRef.current = valueStr;

  const fieldContext = useContext(FieldContext);
  const formInstance = (form as InternalFormInstance) || fieldContext;
  const isValidForm = formInstance && formInstance._init;

  // Warning if not exist form instance
  if (process.env.NODE_ENV !== 'production') {
    warning(
      isValidForm,
      'useWatch requires a form instance since it can not auto detect from context.',
    );
  }

  const namePath = getNamePath(dependencies);
  const namePathRef = useRef(namePath);
  namePathRef.current = namePath;

  useEffect(
    () => {
      // Skip if not exist form instance
      if (!isValidForm) {
        return;
      }

      const { getFieldsValue, getInternalHooks } = formInstance;
      const { registerWatch } = getInternalHooks(HOOK_MARK);

      const cancelRegister = registerWatch(store => {
        const newValue = getValue(store, namePathRef.current);
        const nextValueStr = stringify(newValue);

        // Compare stringify in case it's nest object
        if (valueStrRef.current !== nextValueStr) {
          valueStrRef.current = nextValueStr;
          setValue(newValue);
        }
      });

      // TODO: We can improve this perf in future
      const initialValue = getValue(getFieldsValue(), namePathRef.current);
      setValue(initialValue);

      return cancelRegister;
    },

    // We do not need re-register since namePath content is the same
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return value;
}

export default useWatch;

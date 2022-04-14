import type { FormInstance } from '.';
import { FieldContext } from '.';
import warning from 'rc-util/lib/warning';
import { HOOK_MARK } from './FieldContext';
import type { InternalFormInstance, NamePath, Store } from './interface';
import { useState, useContext, useEffect, useRef } from 'react';
import { getNamePath, getValue } from './utils/valueUtil';

function useWatch<
  TKey1 extends keyof TForm['values'],
  TForm extends FormInstance,
  TKey2 extends keyof TForm['values'][TKey1],
  TKey3 extends keyof TForm['values'][TKey1][TKey2],
  TKey4 extends keyof TForm['values'][TKey1][TKey2][TKey3],
>(
  dependencies: [TKey1, TKey2, TKey3, TKey4],
  form?: TForm,
): TForm['values'][TKey1][TKey2][TKey3][TKey4];

function useWatch<
  TKey1 extends keyof TForm['values'],
  TForm extends FormInstance,
  TKey2 extends keyof TForm['values'][TKey1],
  TKey3 extends keyof TForm['values'][TKey1][TKey2],
>(dependencies: [TKey1, TKey2, TKey3], form?: TForm): TForm['values'][TKey1][TKey2][TKey3];

function useWatch<
  TKey1 extends keyof TForm['values'],
  TForm extends FormInstance,
  TKey2 extends keyof TForm['values'][TKey1],
>(dependencies: [TKey1, TKey2], form?: TForm): TForm['values'][TKey1][TKey2];

function useWatch<TKey extends keyof TForm['values'], TForm extends FormInstance>(
  dependencies: TKey | [TKey],
  form?: TForm,
): TForm['values'][TKey];

function useWatch<TForm extends FormInstance>(dependencies: NamePath, form?: TForm): any;

function useWatch<ValueType = Store>(dependencies: NamePath): ValueType;

function useWatch(dependencies: NamePath = [], form?: FormInstance) {
  const [value, setValue] = useState<any>();
  const valueCacheRef = useRef<any>();
  valueCacheRef.current = value;

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
        if (valueCacheRef.current !== newValue) {
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

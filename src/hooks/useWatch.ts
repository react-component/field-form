import { useEvent, warning } from '@rc-component/util';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import FieldContext, { HOOK_MARK } from '../FieldContext';
import type {
  FormInstance,
  InternalFormInstance,
  NamePath,
  Store,
  WatchOptions,
} from '../interface';
import { isFormInstance } from '../utils/typeUtil';
import { getNamePath, getValue } from '../utils/valueUtil';

type ReturnPromise<T> = T extends Promise<infer ValueType> ? ValueType : never;
type GetGeneric<TForm extends FormInstance> = ReturnPromise<ReturnType<TForm['validateFields']>>;
type IsAny<T> = 0 extends 1 & T ? true : false;
type IsEqual<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;
type AnyNamePath<TForm extends FormInstance, ValueType = Store> =
  IsAny<GetGeneric<TForm>> extends true
    ? NamePath
    : IsAny<ValueType> extends true
      ? NamePath
      : IsEqual<ValueType, Store> extends true
        ? NamePath<GetGeneric<TForm>>
        : NamePath;

export function stringify(value: any) {
  try {
    return JSON.stringify(value);
  } catch {
    return Math.random();
  }
}

function useWatch<
  TDependencies1 extends keyof GetGeneric<TForm>,
  TForm extends FormInstance,
  TDependencies2 extends keyof GetGeneric<TForm>[TDependencies1],
  TDependencies3 extends keyof GetGeneric<TForm>[TDependencies1][TDependencies2],
  TDependencies4 extends keyof GetGeneric<TForm>[TDependencies1][TDependencies2][TDependencies3],
  TDependencies5 extends keyof GetGeneric<TForm>[TDependencies1][TDependencies2][TDependencies3][TDependencies4],
>(
  dependencies: [TDependencies1, TDependencies2, TDependencies3, TDependencies4, TDependencies5],
  form?: TForm | WatchOptions<TForm>,
): GetGeneric<TForm>[TDependencies1][TDependencies2][TDependencies3][TDependencies4][TDependencies5];

function useWatch<
  TDependencies1 extends keyof GetGeneric<TForm>,
  TForm extends FormInstance,
  TDependencies2 extends keyof GetGeneric<TForm>[TDependencies1],
  TDependencies3 extends keyof GetGeneric<TForm>[TDependencies1][TDependencies2],
  TDependencies4 extends keyof GetGeneric<TForm>[TDependencies1][TDependencies2][TDependencies3],
>(
  dependencies: [TDependencies1, TDependencies2, TDependencies3, TDependencies4],
  form?: TForm | WatchOptions<TForm>,
): GetGeneric<TForm>[TDependencies1][TDependencies2][TDependencies3][TDependencies4];

function useWatch<
  TDependencies1 extends keyof GetGeneric<TForm>,
  TForm extends FormInstance,
  TDependencies2 extends keyof GetGeneric<TForm>[TDependencies1],
  TDependencies3 extends keyof GetGeneric<TForm>[TDependencies1][TDependencies2],
>(
  dependencies: [TDependencies1, TDependencies2, TDependencies3],
  form?: TForm | WatchOptions<TForm>,
): GetGeneric<TForm>[TDependencies1][TDependencies2][TDependencies3];

function useWatch<
  TDependencies1 extends keyof GetGeneric<TForm>,
  TForm extends FormInstance,
  TDependencies2 extends keyof GetGeneric<TForm>[TDependencies1],
>(
  dependencies: [TDependencies1, TDependencies2],
  form?: TForm | WatchOptions<TForm>,
): GetGeneric<TForm>[TDependencies1][TDependencies2];

function useWatch<TDependencies extends keyof GetGeneric<TForm>, TForm extends FormInstance>(
  dependencies: TDependencies | [TDependencies],
  form?: TForm | WatchOptions<TForm>,
): GetGeneric<TForm>[TDependencies];

function useWatch<TForm extends FormInstance>(
  dependencies: [],
  form?: TForm | WatchOptions<TForm>,
): GetGeneric<TForm>;

// ------- selector type -------
function useWatch<TForm extends FormInstance, TSelected = unknown>(
  selector: (values: GetGeneric<TForm>) => TSelected,
  form?: TForm | WatchOptions<TForm>,
): TSelected;

function useWatch<ValueType = Store, TSelected = unknown>(
  selector: (values: ValueType) => TSelected,
  form?: FormInstance | WatchOptions<FormInstance>,
): TSelected;
// ------- selector type end -------

function useWatch<TForm extends FormInstance>(
  dependencies: AnyNamePath<TForm>,
  form?: TForm | WatchOptions<TForm>,
): any;

function useWatch<ValueType = Store, TForm extends FormInstance = FormInstance>(
  dependencies: AnyNamePath<TForm, ValueType>,
  form?: TForm | WatchOptions<TForm>,
): ValueType;

function useWatch(
  ...args: [NamePath | ((values: Store) => any), FormInstance | WatchOptions<FormInstance>]
) {
  const [dependencies, _form = {}] = args;
  const options = isFormInstance(_form) ? { form: _form } : _form;
  const form = options.form;

  const [value, setValue] = useState<any>(() =>
    typeof dependencies === 'function' ? dependencies({}) : undefined,
  );

  const valueStr = useMemo(() => stringify(value), [value]);
  const valueStrRef = useRef(valueStr);
  valueStrRef.current = valueStr;

  const fieldContext = useContext(FieldContext);
  const formInstance = (form as InternalFormInstance) || fieldContext;
  const isValidForm = formInstance && formInstance._init;

  // Warning if not exist form instance
  if (process.env.NODE_ENV !== 'production') {
    warning(
      args.length === 2 ? (form ? isValidForm : true) : isValidForm,
      'useWatch requires a form instance since it can not auto detect from context.',
    );
  }

  // ============================== Form ==============================
  const { getFieldsValue, getInternalHooks } = formInstance;
  const { registerWatch } = getInternalHooks(HOOK_MARK);

  // ============================= Update =============================
  const triggerUpdate = useEvent((values?: any, allValues?: any) => {
    const watchValue = options.preserve
      ? (allValues ?? getFieldsValue(true))
      : (values ?? getFieldsValue());

    const nextValue =
      typeof dependencies === 'function'
        ? dependencies(watchValue)
        : getValue(watchValue, getNamePath(dependencies));

    if (stringify(value) !== stringify(nextValue)) {
      setValue(nextValue);
    }
  });

  // ============================= Effect =============================
  const flattenDeps =
    typeof dependencies === 'function' ? dependencies : JSON.stringify(dependencies);

  // Deps changed
  useEffect(() => {
    // Skip if not exist form instance
    if (!isValidForm) {
      return;
    }

    triggerUpdate();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidForm, flattenDeps]);

  // Value changed
  useEffect(() => {
    // Skip if not exist form instance
    if (!isValidForm) {
      return;
    }

    const cancelRegister = registerWatch((values, allValues) => {
      triggerUpdate(values, allValues);
    });

    return cancelRegister;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidForm]);

  return value;
}

export default useWatch;

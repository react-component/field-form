import warning from '@rc-component/util/lib/warning';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import FieldContext, { HOOK_MARK } from './FieldContext';
import type {
  FormInstance,
  InternalFormInstance,
  InternalNamePath,
  NamePath,
  Store,
  WatchOptions,
} from './interface';
import { isFormInstance } from './utils/typeUtil';
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

const useWatchWarning =
  process.env.NODE_ENV !== 'production'
    ? (namePath: InternalNamePath) => {
        const fullyStr = namePath.join('__RC_FIELD_FORM_SPLIT__');
        const nameStrRef = useRef(fullyStr);

        warning(
          nameStrRef.current === fullyStr,
          '`useWatch` is not support dynamic `namePath`. Please provide static instead.',
        );
      }
    : () => {};

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
  dependencies: NamePath,
  form?: TForm | WatchOptions<TForm>,
): any;

function useWatch<ValueType = Store>(
  dependencies: NamePath,
  form?: FormInstance | WatchOptions<FormInstance>,
): ValueType;

function useWatch(
  ...args: [NamePath | ((values: Store) => any), FormInstance | WatchOptions<FormInstance>]
) {
  const [dependencies, _form = {}] = args;
  const options = isFormInstance(_form) ? { form: _form } : _form;
  const form = options.form;

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
      args.length === 2 ? (form ? isValidForm : true) : isValidForm,
      'useWatch requires a form instance since it can not auto detect from context.',
    );
  }

  const namePath = getNamePath(dependencies);
  const namePathRef = useRef(namePath);
  namePathRef.current = namePath;

  useWatchWarning(namePath);

  useEffect(
    () => {
      // Skip if not exist form instance
      if (!isValidForm) {
        return;
      }

      const { getFieldsValue, getInternalHooks } = formInstance;
      const { registerWatch } = getInternalHooks(HOOK_MARK);

      const getWatchValue = (values: any, allValues: any) => {
        const watchValue = options.preserve ? allValues : values;
        return typeof dependencies === 'function'
          ? dependencies(watchValue)
          : getValue(watchValue, namePathRef.current);
      };

      const cancelRegister = registerWatch((values, allValues) => {
        const newValue = getWatchValue(values, allValues);
        const nextValueStr = stringify(newValue);

        // Compare stringify in case it's nest object
        if (valueStrRef.current !== nextValueStr) {
          valueStrRef.current = nextValueStr;
          setValue(newValue);
        }
      });

      // TODO: We can improve this perf in future
      const initialValue = getWatchValue(getFieldsValue(), getFieldsValue(true));

      // React 18 has the bug that will queue update twice even the value is not changed
      // ref: https://github.com/facebook/react/issues/27213
      if (value !== initialValue) {
        setValue(initialValue);
      }

      return cancelRegister;
    },

    // We do not need re-register since namePath content is the same
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isValidForm],
  );

  return value;
}

export default useWatch;

import * as React from 'react';
import type {
  FieldData,
  FieldError,
  FilterFunc,
  FormInstance,
  FormInstanceOptions,
  InternalFormInstance,
  InternalNamePath,
  Meta,
  NamePath,
} from './interface';
import FieldContext, { HOOK_MARK } from './FieldContext';
import { getNamePath, getValue, setValue, matchNamePath } from './utils/valueUtil';

class ScopedFormStore {

  private form: InternalFormInstance;

  private getScopeName: FormInstance['getScopeName'] = () => undefined;

  private get scopeName() {
    return this.getScopeName();
  }

  constructor(form: InternalFormInstance, getScopeName: FormInstance['getScopeName']) {
    this.form = form;
    this.getScopeName = getScopeName;
  }

  private scopedNamePath = (name?: NamePath) => {
    return [
      ...getNamePath(this.scopeName),
      ...getNamePath(name),
    ];
  }

  private scopedNameList = (nameList?: NamePath[]) => {
    if (nameList) {
      return nameList?.map(this.scopedNamePath);
    }
    return [this.scopeName];
  }

  private dropScopeName = (name: InternalNamePath) => {
    return name.slice(this.scopeName.length);
  };

  private preCheck = <T extends (...args: any[]) => any>(fn: T, originFn: T) => {
    return ((...args: Parameters<T>) => {
      if (this.scopeName) {
        return fn(...args);
      }
      return originFn(...args);
    }) as T;
  };

  getForm() {
    return {
      ...this.form,
      getFieldValue: this.preCheck(
        this.getFieldValue,
        this.form.getFieldValue,
      ),
      getFieldsValue: this.preCheck(
        this.getFieldsValue,
        this.form.getFieldsValue,
      ),
      getFieldError: this.preCheck(
        this.getFieldError,
        this.form.getFieldError,
      ),
      getFieldWarning: this.preCheck(
        this.getFieldWarning,
        this.form.getFieldWarning,
      ),
      getFieldsError: this.preCheck(
        this.getFieldsError,
        this.form.getFieldsError,
      ),
      isFieldsTouched: this.preCheck(
        this.isFieldsTouched,
        this.form.isFieldsTouched,
      ),
      isFieldTouched: this.preCheck(
        this.isFieldTouched,
        this.form.isFieldTouched,
      ),
      isFieldValidating: this.preCheck(
        this.isFieldValidating,
        this.form.isFieldValidating,
      ),
      isFieldsValidating: this.preCheck(
        this.isFieldsValidating,
        this.form.isFieldsValidating,
      ),
      resetFields: this.preCheck(
        this.resetFields,
        this.form.resetFields,
      ),
      setFields: this.preCheck(
        this.setFields,
        this.form.setFields,
      ),
      setFieldValue: this.preCheck(
        this.setFieldValue,
        this.form.setFieldValue,
      ),
      setFieldsValue: this.preCheck(
        this.setFieldsValue,
        this.form.setFieldsValue,
      ),
      validateFields: this.preCheck(
        this.validateFields,
        this.form.validateFields,
      ),
      getScopeName: this.getScopeName,
    } as InternalFormInstance;
  }

  private getFieldValue = (name: NamePath) => {
    return this.form.getFieldValue(
      this.scopedNamePath(name),
    );
  }

  private getFieldsValue = (
    nameList?: any,
    filterFunc?: any,
  ) => {
    if (nameList === true && !filterFunc) {
      return getValue(
        this.form.getFieldsValue(true),
        this.scopeName,
      );
    }

    const mergedFilterFunc = (filter?: FilterFunc): FilterFunc => {
      return (meta: Meta) => {
        if (meta) {
          return matchNamePath(meta.name, this.scopeName, true)
            && (!filter || filter({ ...meta, name: this.dropScopeName(meta.name) }));
        }
        return !filter || filter(meta);
      };
    };

    if (nameList && typeof nameList === 'object' && !Array.isArray(nameList)) {
      return getValue(
        this.form.getFieldsValue({
          ...nameList,
          filter: mergedFilterFunc(nameList.filter),
        }),
        this.scopeName,
      );
    }

    return getValue(
      this.form.getFieldsValue(
        Array.isArray(nameList) ? this.scopedNameList(nameList) : nameList,
        mergedFilterFunc(filterFunc),
      ),
      this.scopeName,
    );
  }

  private getFieldError = (name: NamePath) => this.form.getFieldError(this.scopedNamePath(name));

  private getFieldWarning = (name: NamePath) => this.form.getFieldWarning(this.scopedNamePath(name));

  private getFieldsError = (nameList?: NamePath) => {
    const fieldErrors = nameList
      ? this.form.getFieldsError(this.scopedNameList(nameList))
      : this.form.getFieldsError().filter(field => matchNamePath(field.name, this.scopeName, true));
    return fieldErrors.map(field => ({ ...field, name: this.dropScopeName(field.name) }));
  };

  private isFieldsTouched = (...args: any[]) => {
    const [arg0, arg1] = args;

    // this first param is array; eg: isFieldsTouched([['field0'], ['field1']])
    if (Array.isArray(arg0)) {
      return this.form.isFieldsTouched(this.scopedNameList(arg0), arg1);
    }

    // the params are only true; eg: isFieldsTouched(true)
    if (args.length === 1 && arg0 === true) {
      const internalHooks = this.form.getInternalHooks(HOOK_MARK);
      const fieldEntities = internalHooks.getFieldEntities(true);
      return fieldEntities.every(entity => {
        return !matchNamePath(entity.getNamePath(), this.scopeName, true) || entity.isFieldTouched() || entity.isList();
      });
    }

    // no params; eg: isFieldsTouched()
    return this.form.isFieldsTouched([this.scopeName], false);
  };

  private isFieldTouched = (name: NamePath) => this.form.isFieldTouched(this.scopedNamePath(name));

  private isFieldValidating = (name: NamePath) => this.form.isFieldValidating(this.scopedNamePath(name));

  private isFieldsValidating = (nameList?: NamePath[]) => this.form.isFieldsValidating(this.scopedNameList(nameList));

  private resetFields = (nameList?: NamePath[]) => this.form.resetFields(this.scopedNameList(nameList));

  private setFields = (fields: FieldData[]) => this.form.setFields(fields.map(field => ({ ...field, name: this.scopedNamePath(field.name) })));

  private setFieldValue = (name: NamePath, value: any) => this.form.setFieldValue(this.scopedNamePath(name), value);

  private setFieldsValue = (values: any) => {
    return this.form.setFieldsValue(
      setValue(this.form.getFieldsValue(true), this.scopeName, values),
    );
  };

  private validateFields = (arg1?: any, arg2?: any) => {

    const promiseWrap = async (promise: Promise<any>) => {
      return promise.then(res => getValue(res, this.scopeName)).catch((err: any) => {
        return Promise.reject({
          ...err,
          errorFields: (err.errorFields as FieldError[]).map(field => ({ ...field, name: this.dropScopeName(field.name) })),
          values: getValue(err.values, this.scopeName),
        });
      });
    };
    // this first param is array; eg: validateFields([['field0'], ['field1']])
    if (Array.isArray(arg1)) {
      return promiseWrap(
        this.form.validateFields(this.scopedNameList(arg1), arg2),
      );
    }
    // the first param is object, or no params; eg: validateFields() or validateFields({ validateOnly: true, dirty: true })
    return promiseWrap(
      this.form.validateFields([this.scopeName], { ...arg1, recursive: true }),
    );
  };

}

function useFormInstance<Values = any>(options?: FormInstanceOptions): FormInstance<Values> | undefined {
  const { form, scope } = options || {};
  const fieldContext = React.useContext(FieldContext);
  const mergedForm = (form || fieldContext.formInstance) as InternalFormInstance;

  const prefixNameRef = React.useRef(fieldContext.prefixName);
  prefixNameRef.current = fieldContext.prefixName;

  return React.useMemo(() => {
    if (!mergedForm || !mergedForm._init) {
      return;
    }

    if (scope) {
      const internalHooks = mergedForm.getInternalHooks(HOOK_MARK);
      const scopedFormStore = new ScopedFormStore(
        // get non-scoped formInstance
        internalHooks.getFormStore().getForm(),
        () => prefixNameRef.current,
      );
      return scopedFormStore.getForm();
    }

    return mergedForm;
  }, [mergedForm, scope]);

}

export default useFormInstance;

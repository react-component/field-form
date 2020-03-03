import * as React from 'react';
import { ValidateMessages, FormInstance, FieldData, FormValues } from './interface';

interface Forms<T extends FormValues> {
  [name: string]: FormInstance<T>;
}

interface FormChangeInfo<T extends FormValues> {
  changedFields: FieldData[];
  forms: Forms<T>;
}

interface FormFinishInfo<T extends FormValues> {
  values: Partial<T>;
  forms: Forms<T>;
}

export interface FormProviderProps<T extends FormValues> {
  validateMessages?: ValidateMessages;
  onFormChange?: (name: string, info: FormChangeInfo<T>) => void;
  onFormFinish?: (name: string, info: FormFinishInfo<T>) => void;
}

export interface FormContextProps<T extends FormValues> extends FormProviderProps<T> {
  triggerFormChange: (name: string, changedFields: FieldData[]) => void;
  triggerFormFinish: (name: string, values: Partial<T>) => void;
  registerForm: (name: string, form: FormInstance<T>) => void;
  unregisterForm: (name: string) => void;
}

const FormContext = React.createContext<FormContextProps<FormValues>>({
  triggerFormChange: () => {},
  triggerFormFinish: () => {},
  registerForm: () => {},
  unregisterForm: () => {},
});

const FormProvider: React.FunctionComponent<FormProviderProps<FormValues>> = ({
  validateMessages,
  onFormChange,
  onFormFinish,
  children,
}) => {
  const formContext = React.useContext(FormContext);

  const formsRef = React.useRef<Forms<FormValues>>({});

  return (
    <FormContext.Provider
      value={{
        ...formContext,
        validateMessages: {
          ...formContext.validateMessages,
          ...validateMessages,
        },

        // =========================================================
        // =                  Global Form Control                  =
        // =========================================================
        triggerFormChange: (name, changedFields) => {
          if (onFormChange) {
            onFormChange(name, {
              changedFields,
              forms: formsRef.current,
            });
          }

          formContext.triggerFormChange(name, changedFields);
        },
        triggerFormFinish: (name, values) => {
          if (onFormFinish) {
            onFormFinish(name, {
              values,
              forms: formsRef.current,
            });
          }

          formContext.triggerFormFinish(name, values);
        },
        registerForm: (name, form) => {
          if (name) {
            formsRef.current = {
              ...formsRef.current,
              [name]: form,
            };
          }

          formContext.registerForm(name, form);
        },
        unregisterForm: name => {
          const newForms = { ...formsRef.current };
          delete newForms[name];
          formsRef.current = newForms;

          formContext.unregisterForm(name);
        },
      }}
    >
      {children}
    </FormContext.Provider>
  );
};

export { FormProvider };

export default FormContext;

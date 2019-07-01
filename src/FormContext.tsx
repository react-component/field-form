import * as React from 'react';
import { ValidateMessages, FormInstance, FieldData } from './interface';

interface Forms {
  [name: string]: FormInstance;
}

interface FormChangeInfo {
  changedFields: FieldData[];
  forms: Forms;
}

export interface FormProviderProps {
  validateMessages?: ValidateMessages;
  onFormChange?: (name: string, info: FormChangeInfo) => void;
}

export interface FormContextProps extends FormProviderProps {
  triggerFormChange: (name: string, changedFields: FieldData[]) => void;
  registerForm: (name: string, form: FormInstance) => void;
  unregisterForm: (name: string) => void;
}

const FormContext = React.createContext<FormContextProps>({
  triggerFormChange: () => {},
  registerForm: () => {},
  unregisterForm: () => {},
});

const FormProvider: React.FunctionComponent<FormProviderProps> = ({
  validateMessages,
  onFormChange,
  children,
}) => {
  const formContext = React.useContext(FormContext);

  const formsRef = React.useRef<Forms>({});

  return (
    <FormContext.Provider
      value={{
        ...formContext,
        validateMessages: { ...formContext.validateMessages, ...validateMessages },

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

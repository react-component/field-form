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
  registerForm: (name: string, form: FormInstance) => () => void;
}

const FormContext = React.createContext<FormContextProps>({
  triggerFormChange: () => {},
  registerForm: () => () => {},
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
        validateMessages,

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
        },
        registerForm: (name, form) => {
          if (name) {
            formsRef.current = {
              ...formsRef.current,
              [name]: form,
            };
          }

          return () => {
            const newForms = { ...formsRef.current };
            delete newForms[name];
            formsRef.current = newForms;
          };
        },
      }}
    >
      {children}
    </FormContext.Provider>
  );
};

export { FormProvider };

export default FormContext;

import * as React from 'react';
import { ValidateMessages, FormInstance } from './interface';

interface Forms {
  [name: string]: FormInstance;
}

export interface FormProviderProps {
  validateMessages?: ValidateMessages;
  onFormChange?: (name: string, forms: Forms) => void;
}

export interface FormContextProps extends FormProviderProps {
  triggerFormChange: (name: string, form: FormInstance) => void;
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
        triggerFormChange: (name, form) => {
          if (onFormChange) {
            onFormChange(name, formsRef.current);
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

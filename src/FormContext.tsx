import * as React from 'react';
import { FormContextProps, FormProviderProps, Forms } from './interface';

const FormContext = React.createContext<FormContextProps>({
  triggerFormChange: () => {},
  triggerFormFinish: () => {},
  registerForm: () => {},
  unregisterForm: () => {},
});

const FormProvider: React.FunctionComponent<FormProviderProps> = ({
  validateMessages,
  onFormChange,
  onFormFinish,
  children,
}) => {
  const formContext = React.useContext(FormContext);

  const formsRef = React.useRef<Forms>({});

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

import * as React from 'react';
import Form from '../../src';
import { FieldProps } from '../../src/Field';

const { Field } = Form;

const Error = ({ children }) => (
  <ul style={{ color: 'red' }}>
    {children.map((error: React.ReactNode, index: number) => (
      <li key={index}>{error}</li>
    ))}
  </ul>
);

const FieldState = ({ touched, validating }: { touched: boolean; validating: boolean }) => (
  <div
    style={{
      color: 'green',
      position: 'absolute',
      marginTop: -35,
      left: 300,
    }}
  >
    {touched ? <span>Touched!</span> : null}
    {validating ? <span>Validating!</span> : null}
  </div>
);

interface LabelFieldProps extends FieldProps {
  label?: React.ReactNode;
}

const LabelField: React.FunctionComponent<LabelFieldProps> = ({
  name,
  label,
  children,
  ...restProps
}) => (
  <Field name={name} {...restProps}>
    {(control, meta, form) => {
      const childNode =
        typeof children === 'function'
          ? children(control, meta, form)
          : React.cloneElement(children as React.ReactElement, {
              ...control,
            });

      return (
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ flex: 'none', width: 100 }}>{label || name}</label>

            {childNode}
          </div>

          <FieldState {...meta} />
          <Error>{meta.errors}</Error>
        </div>
      );
    }}
  </Field>
);

export default LabelField;

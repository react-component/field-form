import React, { ReactElement } from 'react';
import { Field } from '../../src';
import { FieldProps } from '../../src/Field';

interface InfoFieldProps extends FieldProps {
  children?: ReactElement;
}

export const Input = ({ value = '', ...props }) => <input {...props} value={value} />;

/**
 * Return a wrapped Field with meta info
 */
const InfoField: React.FC<InfoFieldProps> = ({ children, ...props }) => (
  <Field {...props}>
    {(control, { errors, validating }) => (
      <div>
        {children ? React.cloneElement(children, control) : <Input {...control} />}
        <ul className="errors">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
        {validating && <span className="validating" />}
      </div>
    )}
  </Field>
);

export default InfoField;

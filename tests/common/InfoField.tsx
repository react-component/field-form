import React, { ReactElement } from 'react';
import { Field } from '../../src';
import { FieldProps } from '../../src/Field';

interface InfoFieldProps extends FieldProps {
  children: ReactElement;
}

/**
 * Return a wrapped Field with meta info
 */
const InfoField: React.FC<InfoFieldProps> = ({ children, ...props }) => (
  <Field {...props}>
    {(control, { errors }) => (
      <div>
        {children ? (
          React.cloneElement(children, control)
        ) : (
          <input {...control} value={control.value || ''} />
        )}
        <ul className="errors">
          {errors.map(error => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    )}
  </Field>
);

export default InfoField;

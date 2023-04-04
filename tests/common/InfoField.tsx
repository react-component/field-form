import React from 'react';
import { Field } from '../../src';
import type { FieldProps } from '../../src/Field';

interface InfoFieldProps extends FieldProps {
  children?: React.ReactElement;
}

export const Input: React.FC<any> = ({ value = '', ...props }) => {
  return <input {...props} value={value} />;
};

/**
 * Return a wrapped Field with meta info
 */
const InfoField: React.FC<InfoFieldProps> = ({ children, ...props }) => (
  <Field {...props}>
    {(control, info) => {
      const { errors, warnings, validating } = info;

      return (
        <div>
          {children ? (
            React.cloneElement(children, {
              ...(children?.props ?? {}),
              ...control,
              name: children?.props?.name || control?.name,
            })
          ) : (
            <Input
              {...{
                ...(children?.props ?? {}),
                ...control,
                name: children?.props?.name || control?.name,
              }}
            />
          )}
          <ul className="errors">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
          <ul className="warnings">
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
          {validating && <span className="validating" />}
        </div>
      );
    }}
  </Field>
);

export default InfoField;

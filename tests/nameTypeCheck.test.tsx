import React from 'react';
import { render } from '@testing-library/react';
import Form, { Field, List } from '../src';

describe('nameTypeCheck', () => {
  it('typescript', () => {
    type FieldType = {
      a: string;
      b?: string[];
      c?: { c1?: string; c2?: string[] }[];
      d?: { d1?: string[]; d2?: string };
      e?: { e1?: { e2?: string; e3?: string[]; e4: { e5: { e6: string } } } };
      list?: { age?: string }[];
    };

    const Demo: React.FC = () => {
      return (
        <Form>
          <Field<FieldType> name={'a'} />
          <Field<FieldType> name={'b'} />
          <Field<FieldType> name={'c'} />
          <Field<FieldType> name={'d'} />
          <Field<FieldType> name={'e'} />
          <Field<FieldType> name={['a']} />
          <Field<FieldType> name={['b']} />
          <Field<FieldType> name={['c']} />
          <Field<FieldType> name={['d']} />
          <Field<FieldType> name={['e']} />
          <Field<FieldType> name={['b', 1]} />
          <Field<FieldType> name={['c', 1]} />
          <Field<FieldType> name={['c', 1, 'c1']} />
          <Field<FieldType> name={['c', 1, 'c2']} />
          <Field<FieldType> name={['c', 1, 'c2', 1]} />
          <Field<FieldType> name={['d', 'd1']} />
          <Field<FieldType> name={['d', 'd1', 1]} />
          <Field<FieldType> name={['d', 'd2']} />
          <Field<FieldType> name={['e', 'e1']} />
          <Field<FieldType> name={['e', 'e1', 'e2']} />
          <Field<FieldType> name={['e', 'e1', 'e3']} />
          <Field<FieldType> name={['e', 'e1', 'e3', 1]} />
          <Field<FieldType> name={['e', 'e1', 'e4']} />
          <Field<FieldType> name={['e', 'e1', 'e4', 'e5']} />
          <Field<FieldType> name={['e', 'e1', 'e4', 'e5', 'e6']} />
          {/* list */}
          <List<FieldType> name={'list'}>
            {fields => {
              return fields.map(field => (
                <Field<FieldType['list']> {...field} name={[1, 'age']} key={field.key} />
              ));
            }}
          </List>
        </Form>
      );
    };
    render(<Demo />);
  });
});

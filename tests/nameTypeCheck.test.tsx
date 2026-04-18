/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo } from 'react';
import { render } from '@testing-library/react';
import Form, { Field, List } from '../src';
import type { FormInstance, NamePath } from '../src/interface';

describe('nameTypeCheck', () => {
  it('typescript', () => {
    type FieldType = {
      a: string;
      b?: string[];
      c?: { c1?: string; c2?: string[]; c3?: boolean[] }[];
      d?: { d1?: string[]; d2?: string };
      e?: { e1?: { e2?: string; e3?: string[]; e4: { e5: { e6: string } } } };
      list?: { age?: string }[];
      strictList?: { age: string; name: string }[];
      user?: { profile: { name: string; tags: string[] } };
      nullableList?: string[] | null;
      nullableObjectList?: { name?: string }[] | null;
    };

    type fieldType = NamePath<FieldType>;

    type SetFieldsValueParam = Parameters<FormInstance<FieldType>['setFieldsValue']>[0];

    const nullableListAsNull: SetFieldsValueParam = { nullableList: null };
    const nullableListAsArray: SetFieldsValueParam = { nullableList: ['bamboo'] };
    const nullableObjectListAsNull: SetFieldsValueParam = { nullableObjectList: null };
    const nullableObjectListAsArray: SetFieldsValueParam = {
      nullableObjectList: [{ name: 'light' }],
    };
    const optionalNestedObjectAsPartial: SetFieldsValueParam = {
      user: {
        profile: {
          name: 'light',
        },
      },
    };
    const optionalListAsPartial: SetFieldsValueParam = {
      strictList: [{ age: '18' }],
    };

    const Demo: React.FC = () => {
      return (
        <Form>
          <Field name={'use by strictNullChecks set true' as string} />
          <Field name={'use by strictNullChecks set true' as string | number} />
          {/* 无类型 */}
          <Field name={[]} />
          <Field name={'a'} />
          <Field name={['a']} />
          <Field name={12} />
          <Field name={[11]} />
          <Field name={['d', 1]} />
          <Field name={['d', 'd1']} />
          <Field name={[1, 2]} />
          <Field name={[true, false]} />
          {/* <Field name={{ aa: '111' }} /> */}
          {/* 有类型 */}
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
          <Field<FieldType> name={['c', 1, 'c3']} />
          <Field<FieldType> name={['c', 1, 'c3', 1]} />
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
  it('type inference', () => {
    interface Props<T = any> {
      data?: T[];
      list?: { name?: NamePath<T> }[];
    }
    function func<T = any>(props: Props<T>) {
      return props;
    }
    func({ data: [{ a: { b: 'c' } }], list: [{ name: ['a', 'b'] }] });
  });
  it('more type', () => {
    // Moment
    type t1 = NamePath<{ a: { b: string; func: Moment } }>;
    // Function
    type t2 = NamePath<{ a: { b: string; func: () => { c: string } } }>;
    // known
    const t3: NamePath<unknown> = 'a';

    interface Moment {
      func2: Function;
      format: (format?: string) => string;
    }
  });
  it('tree', () => {
    type t1 = NamePath<{ a: TreeNode }>;

    interface TreeNode {
      child: TreeNode[];
    }
  });
});

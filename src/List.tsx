import * as React from 'react';
import warning from 'warning';
import { InternalNamePath, NamePath, InternalFormInstance } from './interface';
import FieldContext, { HOOK_MARK } from './FieldContext';
import Field from './Field';
import { getNamePath, setValue } from './utils/valueUtil';

interface ListField {
  name: number;
  key: number;
}

interface ListOperations {
  add: () => void;
  remove: (index: number) => void;
}

interface ListProps {
  name: NamePath;
  children?: (fields: ListField[], operations: ListOperations) => JSX.Element | React.ReactNode;
}

interface ListRenderProps {
  value: any[];
  onChange: (value: any[]) => void;
}

const List: React.FunctionComponent<ListProps> = ({ name, children }) => {
  // User should not pass `children` as other type.
  if (typeof children !== 'function') {
    warning(false, 'Form.List only accepts function as children.');
    return null;
  }

  return (
    <FieldContext.Consumer>
      {(context: InternalFormInstance) => {
        const parentPrefixName = getNamePath(context.prefixName) || [];
        const prefixName: InternalNamePath = [...parentPrefixName, ...getNamePath(name)];

        const shouldUpdate = (prevValue: any, nextValue: any, { source }) => {
          if (source === 'internal') {
            return false;
          }
          return prevValue !== nextValue;
        };

        return (
          <FieldContext.Provider value={{ ...context, prefixName }}>
            <Field name={[]} shouldUpdate={shouldUpdate}>
              {({ value = [], onChange }: ListRenderProps) => {
                const { getInternalHooks, getFieldValue, setFieldsValue, setFields } = context;

                /**
                 * Always get latest value in case user update fields by `form` api.
                 */
                const operations: ListOperations = {
                  add: () => {
                    const newValue = getFieldValue(prefixName) || [];
                    onChange([...newValue, undefined]);
                  },
                  remove: (index: number) => {
                    const { getFields } = getInternalHooks(HOOK_MARK);
                    const newValue = getFieldValue(prefixName) || [];
                    const namePathList: InternalNamePath[] = newValue.map((__, i) => [
                      ...prefixName,
                      i,
                    ]);

                    const fields = getFields(namePathList)
                      .filter((__, i) => i !== index)
                      .map((fieldData, i) => ({
                        ...fieldData,
                        name: [...prefixName, i],
                      }));

                    const nextValue = [...newValue];
                    nextValue.splice(index, 1);

                    setFieldsValue(setValue({}, prefixName, []));
                    setFields(fields);
                  },
                };

                return children(
                  value.map(
                    (__, index): ListField => ({
                      name: index,
                      key: index,
                    }),
                  ),
                  operations,
                );
              }}
            </Field>
          </FieldContext.Provider>
        );
      }}
    </FieldContext.Consumer>
  );
};

export default List;

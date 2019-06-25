import * as React from 'react';
import warning from 'warning';
import { InternalNamePath, NamePath, StoreValue } from './interface';
import FieldContext from './FieldContext';
import Field from './Field';
import { getNamePath } from './utils/valueUtil';

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

const List: React.FunctionComponent<ListProps> = ({ name, children }) => {
  const context = React.useContext(FieldContext);
  const keyRef = React.useRef({
    keys: [],
    id: 0,
  });
  const keyManager = keyRef.current;

  // User should not pass `children` as other type.
  if (typeof children !== 'function') {
    warning(false, 'Form.List only accepts function as children.');
    return null;
  }

  const parentPrefixName = getNamePath(context.prefixName) || [];
  const prefixName: InternalNamePath = [...parentPrefixName, ...getNamePath(name)];

  const shouldUpdate = (prevValue: StoreValue, nextValue: StoreValue, { source }) => {
    if (source === 'internal') {
      return false;
    }
    return prevValue !== nextValue;
  };

  return (
    <FieldContext.Provider value={{ ...context, prefixName }}>
      <Field name={[]} shouldUpdate={shouldUpdate}>
        {({ value = [], onChange }) => {
          const { getFieldValue } = context;

          /**
           * Always get latest value in case user update fields by `form` api.
           */
          const operations: ListOperations = {
            add: () => {
              // Mapping keys
              keyManager.keys = [...keyManager.keys, keyManager.id];
              keyManager.id += 1;

              const newValue = (getFieldValue(prefixName) || []) as StoreValue[];
              onChange([...newValue, undefined]);
            },
            remove: (index: number) => {
              const newValue = (getFieldValue(prefixName) || []) as StoreValue[];

              // Do not handle out of range
              if (index < 0 || index >= newValue.length) {
                return;
              }

              // Update key mapping
              const newKeys = keyManager.keys.map((key, id) => {
                if (id < index) {
                  return key;
                }
                return keyManager.keys[id + 1];
              });
              keyManager.keys = newKeys.slice(0, -1);

              // Trigger store change
              onChange(newValue.filter((_, id) => id !== index));
            },
          };

          return children(
            (value as StoreValue[]).map(
              (__, index): ListField => {
                let key = keyManager.keys[index];
                if (key === undefined) {
                  keyManager.keys[index] = keyManager.id;
                  key = keyManager.keys[index];
                  keyManager.id += 1;
                }

                return {
                  name: index,
                  key,
                };
              },
            ),
            operations,
          );
        }}
      </Field>
    </FieldContext.Provider>
  );
};

export default List;

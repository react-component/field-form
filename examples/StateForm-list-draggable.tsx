/* eslint-disable react/prop-types */
import React from 'react';

/* eslint-enable react/prop-types */
import HTML5Backend from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';
import Form, { List, useForm } from '../src';
import Input from './components/Input';
import LabelField from './components/LabelField';
import useDraggable from './components/useDraggable';

type LabelFieldProps = Parameters<typeof LabelField>[0];
interface DraggableProps extends LabelFieldProps {
  id: string | number;
  index: number;
  move: (from: number, to: number) => void;
}
const DisableDraggable = {
  onDragStart(event) {
    event.stopPropagation();
    event.preventDefault();
  },
  draggable: true,
};
const Draggable: React.FunctionComponent<DraggableProps> = ({ id, index, move, children }) => {
  const { ref, isDragging } = useDraggable('list-draggable', id, index, move);
  return (
    <div
      ref={ref}
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {children}
    </div>
  );
};
const Demo = () => {
  const [form] = useForm();

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <h3>Draggable List of Form</h3>
        <p>You can set Field as List and sortable by drag and drop</p>

        <Form
          form={form}
          onValuesChange={(_, values) => {
            console.log('values:', values);
          }}
          style={{ border: '1px solid red', padding: 15 }}
        >
          <List name="users">
            {(fields, { add, remove, move }) => (
              <div>
                <h4>List of `users`</h4>
                {fields.map((field, index) => (
                  <Draggable
                    move={move}
                    index={index}
                    id={field.key}
                    {...field}
                    rules={[{ required: true }]}
                  >
                    <LabelField {...field} rules={[{ required: true }]}>
                      {control => (
                        <div style={{ position: 'relative' }}>
                          <Input {...DisableDraggable} {...control} />
                          <a
                            style={{
                              position: 'absolute',
                              top: 12,
                              right: -300,
                            }}
                            onClick={() => {
                              remove(index);
                            }}
                          >
                            Remove
                          </a>
                        </div>
                      )}
                    </LabelField>
                  </Draggable>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    add();
                  }}
                >
                  + New User
                </button>
              </div>
            )}
          </List>
        </Form>
      </div>
    </DndProvider>
  );
};

export default Demo;

/* eslint-disable react/prop-types */

import * as React from 'react';
import Form from '../src/';
import Input from './components/Input';
import LabelField from './components/LabelField';
import useDraggable from "./components/useDraggable";
import HTML5Backend from 'react-dnd-html5-backend'
import { DndProvider} from 'react-dnd'

const { List, useForm } = Form;

type LabelFieldProps = Parameters<typeof LabelField>[0];
interface DraggableFieldProps extends LabelFieldProps{
  id : string|number,
  index : number,
  move : (from:number,to :number)=>void,
}
const DraggableField :React.FunctionComponent<DraggableFieldProps>= ({id,index,move,...others})=>{
    const {ref,isDragging} = useDraggable("demo-list",id,index,move);
    return <div ref={ref} style={{
      opacity : isDragging ? 0.5 : 1,
    }}>
      <LabelField {...others} />
    </div>
};
const Demo = () => {
  const [form] = useForm();

  return (
    <DndProvider backend={HTML5Backend}>
    <div>
      <h3>List of Form</h3>
      <p>You can set Field as List</p>

      <Form
        form={form}
        onValuesChange={(_, values) => {
          console.log('values:', values);
        }}
        style={{ border: '1px solid red', padding: 15 }}
      >
        <List name="users">
          {(fields, { add, remove,move }) => {
            console.log('Demo Fields:', fields);
            return (
              <div>
                <h4>List of `users`</h4>
                {fields.map((field, index) => (
                  <DraggableField move={move} index={index} id={field.key} {...field} rules={[{ required: true }]}>
                    {control => (
                      <div style={{ position: 'relative' }}>
                        <Input {...control} />
                        <a style={{ position: 'absolute', top: 12, right: -300 }} onClick={() => {
                          remove(index);
                        }}>
                          Remove
                        </a>
                      </div>
                    )}
                  </DraggableField>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    add();
                  }}
                >
                  + New User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    remove(1);
                  }}
                >
                  Remove index: 1
                </button>
              </div>
            );
          }}
        </List>
      </Form>

      <div style={{ border: '1px solid #000', padding: 15 }}>
        <h4>Out Of Form</h4>
        <button
          onClick={() => {
            form.setFieldsValue({
              users: ['light', 'bamboo'],
            });
          }}
        >
          Set List Value
        </button>
      </div>
    </div>
    </DndProvider>
  );
};

export default Demo;

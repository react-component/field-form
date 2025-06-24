import Form, { Field } from 'rc-field-form';
import React from 'react';

function WatchCom({ name }: { name: number }) {
  const data = Form.useWatch(name);
  return data;
}

export default function App() {
  const [form] = Form.useForm();
  const [open, setOpen] = React.useState<boolean>(true);

  const data = React.useMemo(() => {
    return Array.from({ length: 1 * 500 }).map((_, i) => ({
      key: i,
      name: `Edward King ${i}`,
      age: 32,
      address: `London, Park Lane no. ${i}`,
    }));
  }, []);

  return (
    <Form form={form}>
      <div className="App">
        {/* When I made the switch, it was very laggy */}
        <button
          onClick={() => {
            setOpen(!open);
          }}
        >
          Switch
        </button>
        <WatchCom name={0} />
        <WatchCom name={1} />
        {open ? (
          <div className="flex gap-[5px] flex-wrap">
            {data?.map(item => {
              return (
                <Field key={item.name} name={item.name}>
                  <input />
                </Field>
              );
            })}
          </div>
        ) : (
          <h2>some thing</h2>
        )}
      </div>
    </Form>
  );
}

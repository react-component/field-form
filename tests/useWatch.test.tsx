import React, { useRef, useState } from 'react';
import { render, fireEvent } from '@testing-library/react';
import type { FormInstance } from '../src';
import { List } from '../src';
import Form, { Field } from '../src';
import timeout from './common/timeout';
import { act } from 'react-dom/test-utils';
import { Input } from './common/InfoField';
import { stringify } from '../src/useWatch';

describe('useWatch', () => {
  it('field initialValue', async () => {
    const Demo: React.FC = () => {
      const [form] = Form.useForm();
      const nameValue = Form.useWatch<string>('name', form);
      return (
        <div>
          <Form form={form}>
            <Field name="name" initialValue="bamboo">
              <Input />
            </Field>
          </Form>
          <div className="values">{nameValue}</div>
        </div>
      );
    };
    await act(async () => {
      const { container } = render(<Demo />);
      await timeout();
      expect(container.querySelector<HTMLDivElement>('.values')?.textContent).toEqual('bamboo');
    });
  });

  it('form initialValue', async () => {
    const Demo: React.FC = () => {
      const [form] = Form.useForm();
      const nameValue = Form.useWatch<string>(['name'], form);
      return (
        <div>
          <Form form={form} initialValues={{ name: 'bamboo', other: 'other' }}>
            <Field name="name">
              <Input />
            </Field>
          </Form>
          <div className="values">{nameValue}</div>
        </div>
      );
    };
    await act(async () => {
      const { container } = render(<Demo />);
      await timeout();
      expect(container.querySelector<HTMLDivElement>('.values')?.textContent).toEqual('bamboo');
    });
  });

  it('change value with form api', async () => {
    const staticForm = React.createRef<FormInstance>();
    const Demo: React.FC = () => {
      const [form] = Form.useForm();
      const nameValue = Form.useWatch<string>(['name'], form);
      return (
        <div>
          <Form form={form} ref={staticForm}>
            <Field name="name">
              <Input />
            </Field>
          </Form>
          <div className="values">{nameValue}</div>
        </div>
      );
    };
    await act(async () => {
      const { container } = render(<Demo />);
      await timeout();
      staticForm.current?.setFields([{ name: 'name', value: 'little' }]);
      expect(container.querySelector<HTMLDivElement>('.values').textContent)?.toEqual('little');

      staticForm.current?.setFieldsValue({ name: 'light' });
      expect(container.querySelector<HTMLDivElement>('.values').textContent)?.toEqual('light');

      staticForm.current?.resetFields();
      expect(container.querySelector<HTMLDivElement>('.values').textContent)?.toEqual('');
    });
  });

  describe('unmount', () => {
    it('basic', async () => {
      const Demo: React.FC<{ visible?: boolean }> = ({ visible }) => {
        const [form] = Form.useForm();
        const nameValue = Form.useWatch<string>(['name'], form);
        return (
          <div>
            <Form form={form} initialValues={{ name: 'bamboo' }}>
              {visible && (
                <Field name="name">
                  <Input />
                </Field>
              )}
            </Form>
            <div className="values">{nameValue}</div>
          </div>
        );
      };

      await act(async () => {
        const { container, rerender } = render(<Demo visible />);
        await timeout();

        expect(container.querySelector<HTMLDivElement>('.values')?.textContent).toEqual('bamboo');

        rerender(<Demo visible={false} />);
        expect(container.querySelector<HTMLDivElement>('.values')?.textContent).toEqual('');

        rerender(<Demo visible />);
        expect(container.querySelector<HTMLDivElement>('.values')?.textContent).toEqual('bamboo');
      });
    });

    it('nest children component', async () => {
      const DemoWatch: React.FC = () => {
        Form.useWatch(['name']);
        return (
          <Field name="name">
            <Input />
          </Field>
        );
      };

      const Demo: React.FC<{ visible?: boolean }> = ({ visible }) => {
        const [form] = Form.useForm();
        const nameValue = Form.useWatch<string>(['name'], form);

        return (
          <div>
            <Form form={form} initialValues={{ name: 'bamboo' }}>
              {visible && <DemoWatch />}
            </Form>
            <div className="values">{nameValue}</div>
          </div>
        );
      };

      await act(async () => {
        const { container, rerender } = render(<Demo visible />);
        await timeout();
        expect(container.querySelector<HTMLDivElement>('.values')?.textContent).toEqual('bamboo');

        rerender(<Demo visible={false} />);
        expect(container.querySelector<HTMLDivElement>('.values')?.textContent).toEqual('');

        rerender(<Demo visible />);
        expect(container.querySelector<HTMLDivElement>('.values')?.textContent).toEqual('bamboo');
      });
    });
  });

  it('list', async () => {
    const Demo: React.FC = () => {
      const [form] = Form.useForm();
      const users = Form.useWatch<string[]>(['users'], form) || [];
      return (
        <Form form={form} style={{ border: '1px solid red', padding: 15 }}>
          <div className="values">{JSON.stringify(users)}</div>
          <List name="users" initialValue={['bamboo', 'light']}>
            {(fields, { remove }) => {
              return (
                <div>
                  {fields.map((field, index) => (
                    <Field {...field} key={field.key} rules={[{ required: true }]}>
                      {control => (
                        <div>
                          <Input {...control} />
                          <a className="remove" onClick={() => remove(index)} />
                        </div>
                      )}
                    </Field>
                  ))}
                </div>
              );
            }}
          </List>
        </Form>
      );
    };
    await act(async () => {
      const { container } = render(<Demo />);
      await timeout();
      expect(container.querySelector<HTMLDivElement>('.values')?.textContent).toEqual(
        JSON.stringify(['bamboo', 'light']),
      );
      fireEvent.click(container.querySelector<HTMLAnchorElement>('.remove'));
      await timeout();
      expect(container.querySelector<HTMLDivElement>('.values')?.textContent).toEqual(
        JSON.stringify(['light']),
      );
    });
  });

  it('warning if not provide form', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const Demo: React.FC = () => {
      Form.useWatch([]);
      return null;
    };

    render(<Demo />);

    expect(errorSpy).toHaveBeenCalledWith(
      'Warning: useWatch requires a form instance since it can not auto detect from context.',
    );
    errorSpy.mockRestore();
  });

  it('no more render time', () => {
    let renderTime = 0;

    const Demo: React.FC = () => {
      const [form] = Form.useForm();
      const name = Form.useWatch<string>('name', form);

      renderTime += 1;

      return (
        <Form form={form}>
          <Field name="name">
            <Input />
          </Field>
          <Field name="age">
            <Input />
          </Field>
          <div className="value">{name}</div>
        </Form>
      );
    };

    const { container } = render(<Demo />);
    expect(renderTime).toEqual(1);

    const input = container.querySelectorAll<HTMLInputElement>('input');

    fireEvent.change(input[0], { target: { value: 'bamboo' } });
    expect(renderTime).toEqual(2);

    fireEvent.change(input[1], { target: { value: '123' } });
    expect(renderTime).toEqual(2);

    fireEvent.change(input[1], { target: { value: '123456' } });
    expect(renderTime).toEqual(2);
  });

  it('typescript', () => {
    type FieldType = {
      main?: string;
      name?: string;
      age?: number;
      gender?: boolean;
      demo?: string;
      demo2?: string;
      id?: number;
      demo1?: { demo2?: { demo3?: { demo4?: string } } };
    };

    const Demo: React.FC = () => {
      const [form] = Form.useForm<FieldType>();
      const values = Form.useWatch([], form);
      const main = Form.useWatch('main', form);
      const age = Form.useWatch(['age'], form);
      const demo1 = Form.useWatch(['demo1'], form);
      const demo2 = Form.useWatch(['demo1', 'demo2'], form);
      const demo3 = Form.useWatch(['demo1', 'demo2', 'demo3'], form);
      const demo4 = Form.useWatch(['demo1', 'demo2', 'demo3', 'demo4'], form);
      const demo5 = Form.useWatch(['demo1', 'demo2', 'demo3', 'demo4', 'demo5'], form);
      const more = Form.useWatch(['age', 'name', 'gender'], form);
      const demo = Form.useWatch<string>(['demo']);
      return (
        <>{JSON.stringify({ values, main, age, demo1, demo2, demo3, demo4, demo5, more, demo })}</>
      );
    };

    render(<Demo />);
  });

  // https://github.com/react-component/field-form/issues/431
  it('not trigger effect', () => {
    let updateA = 0;
    let updateB = 0;

    const Demo: React.FC = () => {
      const [form] = Form.useForm();
      const userA = Form.useWatch(['a'], form);
      const userB = Form.useWatch(['b'], form);

      React.useEffect(() => {
        updateA += 1;
      }, [userA]);
      React.useEffect(() => {
        updateB += 1;
      }, [userB]);

      return (
        <Form form={form}>
          <Field name={['a', 'name']}>
            <Input />
          </Field>
          <Field name={['b', 'name']}>
            <Input />
          </Field>
        </Form>
      );
    };

    const { container } = render(<Demo />);
    fireEvent.change(container.querySelector<HTMLInputElement>('input'), {
      target: { value: 'bamboo' },
    });
    expect(updateA > updateB).toBeTruthy();
  });

  it('mount while unmount', () => {
    const Demo: React.FC = () => {
      const [form] = Form.useForm();
      const [type, setType] = useState(true);
      const name = Form.useWatch<string>('name', form);

      return (
        <Form form={form}>
          <button type="button" onClick={() => setType(c => !c)}>
            type
          </button>
          {type && (
            <Field name="name" key="a">
              <Input />
            </Field>
          )}
          {!type && (
            <Field name="name" key="b">
              <Input />
            </Field>
          )}
          <div className="value">{name}</div>
        </Form>
      );
    };
    const { container } = render(<Demo />);
    fireEvent.change(container.querySelector<HTMLInputElement>('input'), {
      target: { value: 'bamboo' },
    });
    container.querySelector<HTMLButtonElement>('button').click();
    expect(container.querySelector<HTMLDivElement>('.value')?.textContent).toEqual('bamboo');
  });
  it('stringify error', () => {
    const obj: any = {};
    obj.name = obj;
    const str = stringify(obj);
    expect(typeof str === 'number').toBeTruthy();
  });
  it('first undefined', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const Demo: React.FC = () => {
      const formRef = useRef<FormInstance>();
      const name = Form.useWatch('name', formRef.current);
      const [, setUpdate] = useState({});
      return (
        <>
          <div className="setUpdate" onClick={() => setUpdate({})} />
          <div className="value">{name}</div>
          <Form ref={formRef} initialValues={{ name: 'default' }}>
            <Field name="name" key="a">
              <Input />
            </Field>
          </Form>
        </>
      );
    };
    const { container } = render(<Demo />);
    expect(container.querySelector<HTMLDivElement>('.value')?.textContent).toEqual('');
    fireEvent.click(container.querySelector<HTMLInputElement>('.setUpdate'));
    expect(container.querySelector<HTMLDivElement>('.value')?.textContent).toEqual('default');
    fireEvent.change(container.querySelector<HTMLInputElement>('input'), {
      target: { value: 'bamboo' },
    });
    expect(container.querySelector<HTMLDivElement>('.value')?.textContent).toEqual('bamboo');
    expect(errorSpy).not.toHaveBeenCalledWith(
      'Warning: useWatch requires a form instance since it can not auto detect from context.',
    );
    errorSpy.mockRestore();
  });

  it('dynamic change warning', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const Demo: React.FC = () => {
      const [form] = Form.useForm();
      const [watchPath, setWatchPath] = React.useState('light');
      Form.useWatch(watchPath, form);

      React.useEffect(() => {
        setWatchPath('bamboo');
      }, []);

      return <Form form={form} />;
    };
    render(<Demo />);

    expect(errorSpy).toHaveBeenCalledWith(
      'Warning: `useWatch` is not support dynamic `namePath`. Please provide static instead.',
    );
    errorSpy.mockRestore();
  });

  it('useWatch with preserve option', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const Demo: React.FC = () => {
      const [form] = Form.useForm();
      const nameValuePreserve = Form.useWatch<string>('name', {
        form,
        preserve: true,
      });
      const nameValue = Form.useWatch<string>('name', form);
      React.useEffect(() => {
        console.log(nameValuePreserve, nameValue);
      }, [nameValuePreserve, nameValue]);
      return (
        <div>
          <Form form={form} initialValues={{ name: 'bamboo' }} />
          <div className="values">{nameValuePreserve}</div>
          <button className="test-btn" onClick={() => form.setFieldValue('name', 'light')} />
        </div>
      );
    };
    await act(async () => {
      const { container } = render(<Demo />);
      await timeout();
      expect(logSpy).toHaveBeenCalledWith('bamboo', undefined); // initialValue
      fireEvent.click(container.querySelector('.test-btn'));
      await timeout();
      expect(logSpy).toHaveBeenCalledWith('light', undefined); // after setFieldValue
    });
  });
});

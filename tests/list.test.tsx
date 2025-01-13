import React from 'react';
import { fireEvent, render, act } from '@testing-library/react';
import { resetWarned } from '@rc-component/util/lib/warning';
import Form, { Field, List } from '../src';
import type { FormProps } from '../src';
import type { ListField, ListOperations, ListProps } from '../src/List';
import type { FormInstance, Meta } from '../src/interface';
import ListContext from '../src/ListContext';
import InfoField, { Input } from './common/InfoField';
import { changeValue, getInput } from './common';
import timeout from './common/timeout';

describe('Form.List', () => {
  const form = React.createRef<FormInstance>();

  const generateForm = (
    renderList?: (fields: ListField[], operations: ListOperations, meta: Meta) => React.ReactNode,
    formProps?: FormProps,
    listProps?: Partial<ListProps>,
  ): readonly [container: HTMLElement] => {
    const { container } = render(
      <div>
        <Form ref={form} {...formProps}>
          <div className="list">
            <List name="list" {...listProps}>
              {renderList}
            </List>
          </div>
        </Form>
      </div>,
    );
    return [container] as const;
  };

  it('basic', async () => {
    const [container] = generateForm(
      fields => (
        <div>
          {fields.map(field => (
            <Field {...field} key={field.key}>
              <Input data-key={field.key} />
            </Field>
          ))}
        </div>
      ),
      {
        initialValues: {
          list: ['', '', ''],
        },
      },
    );

    function matchKey(index: number, key: React.Key) {
      expect(getInput(container, index)).toHaveAttribute('data-key', String(key));
    }

    matchKey(0, '0');
    matchKey(1, '1');
    matchKey(2, '2');

    await changeValue(getInput(container, 0), '111');
    await changeValue(getInput(container, 1), '222');
    await changeValue(getInput(container, 2), '333');

    expect(form.current?.getFieldsValue()).toEqual({ list: ['111', '222', '333'] });
  });

  it('not crash', () => {
    // Empty only
    render(
      <Form initialValues={{ list: null }}>
        <Form.List name="list">{() => null}</Form.List>
      </Form>,
    );

    // Not a array
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    resetWarned();
    render(
      <Form initialValues={{ list: {} }}>
        <Form.List name="list">{() => null}</Form.List>
      </Form>,
    );
    expect(errorSpy).toHaveBeenCalledWith("Warning: Current value of 'list' is not an array type.");
    errorSpy.mockRestore();
  });

  it('operation', async () => {
    let operation: ListOperations;
    const [container] = generateForm((fields, opt) => {
      operation = opt;
      return (
        <div>
          {fields.map(field => (
            <Field {...field} key={field.key}>
              <Input data-key={field.key} />
            </Field>
          ))}
        </div>
      );
    });

    function matchKey(index: number, key: React.Key) {
      expect(getInput(container, index)).toHaveAttribute('data-key', String(key));
    }

    // Add
    act(() => {
      operation.add();
    });
    // Add default value
    act(() => {
      operation.add('2');
    });

    act(() => {
      operation.add();
    });

    expect(container.querySelectorAll('input')).toHaveLength(3);
    expect(form.current?.getFieldsValue()).toEqual({ list: [undefined, '2', undefined] });

    matchKey(0, '0');
    matchKey(1, '1');
    matchKey(2, '2');

    // Move
    act(() => {
      operation.move(2, 0);
    });
    matchKey(0, '2');
    matchKey(1, '0');
    matchKey(2, '1');

    // noneffective move
    act(() => {
      operation.move(-1, 0);
    });
    matchKey(0, '2');
    matchKey(1, '0');
    matchKey(2, '1');

    // noneffective move
    act(() => {
      operation.move(0, 10);
    });

    matchKey(0, '2');
    matchKey(1, '0');
    matchKey(2, '1');

    // noneffective move
    act(() => {
      operation.move(-1, 10);
    });

    matchKey(0, '2');
    matchKey(1, '0');
    matchKey(2, '1');

    // noneffective move
    act(() => {
      operation.move(0, 0);
    });
    matchKey(0, '2');
    matchKey(1, '0');
    matchKey(2, '1');

    // Revert Move
    act(() => {
      operation.move(0, 2);
    });
    matchKey(0, '0');
    matchKey(1, '1');
    matchKey(2, '2');

    // Modify
    await changeValue(getInput(container, 1), '222');
    expect(form.current?.getFieldsValue()).toEqual({
      list: [undefined, '222', undefined],
    });
    expect(form.current?.isFieldTouched(['list', 0])).toBeFalsy();
    expect(form.current?.isFieldTouched(['list', 1])).toBeTruthy();
    expect(form.current?.isFieldTouched(['list', 2])).toBeFalsy();

    matchKey(0, '0');
    matchKey(1, '1');
    matchKey(2, '2');

    // Remove
    act(() => {
      operation.remove(1);
    });
    expect(container.querySelectorAll('input')).toHaveLength(2);
    expect(form.current?.getFieldsValue()).toEqual({
      list: [undefined, undefined],
    });
    expect(form.current?.isFieldTouched(['list', 0])).toBeFalsy();
    expect(form.current?.isFieldTouched(['list', 2])).toBeFalsy();

    matchKey(0, '0');
    matchKey(1, '2');

    // Remove not exist: less
    act(() => {
      operation.remove(-1);
    });

    matchKey(0, '0');
    matchKey(1, '2');

    // Remove not exist: more
    act(() => {
      operation.remove(99);
    });

    matchKey(0, '0');
    matchKey(1, '2');
  });

  it('remove when the param is Array', () => {
    let operation: ListOperations;
    const [container] = generateForm((fields, opt) => {
      operation = opt;
      return (
        <div>
          {fields.map(field => (
            <Field {...field} key={field.key}>
              <Input data-key={field.key} />
            </Field>
          ))}
        </div>
      );
    });

    function matchKey(index: number, key: React.Key) {
      expect(getInput(container, index)).toHaveAttribute('data-key', String(key));
    }

    act(() => {
      operation.add();
    });

    act(() => {
      operation.add();
    });

    expect(container.querySelectorAll('input')).toHaveLength(2);

    // remove empty array
    act(() => {
      operation.remove([]);
    });

    matchKey(0, '0');
    matchKey(1, '1');

    // remove not exist element in array
    act(() => {
      operation.remove([-1, 99]);
    });

    matchKey(0, '0');
    matchKey(1, '1');

    act(() => {
      operation.remove([0]);
    });

    expect(container.querySelectorAll('input')).toHaveLength(1);
    matchKey(0, '1');

    act(() => {
      operation.add();
    });

    act(() => {
      operation.add();
    });

    matchKey(0, '1');
    matchKey(1, '2');
    matchKey(2, '3');

    act(() => {
      operation.remove([0, 1]);
    });

    matchKey(0, '3');
  });

  it('add when the second param is number', () => {
    let operation: ListOperations;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const [container] = generateForm((fields, opt) => {
      operation = opt;
      return (
        <div>
          {fields.map(field => (
            <Field {...field} key={field.key}>
              <Input />
            </Field>
          ))}
        </div>
      );
    });

    act(() => {
      operation.add();
    });
    act(() => {
      operation.add('1', 2);
    });

    act(() => {
      operation.add('2', -1);
    });

    expect(errorSpy).toHaveBeenCalledWith(
      'Warning: The second parameter of the add function should be a valid positive number.',
    );
    errorSpy.mockRestore();

    expect(container.querySelectorAll('input')).toHaveLength(3);
    expect(form.current?.getFieldsValue()).toEqual({
      list: [undefined, '1', '2'],
    });

    act(() => {
      operation.add('0', 0);
    });
    act(() => {
      operation.add('4', 3);
    });

    expect(container.querySelectorAll('input')).toHaveLength(5);
    expect(form.current?.getFieldsValue()).toEqual({
      list: ['0', undefined, '1', '4', '2'],
    });
  });

  describe('validate', () => {
    it('basic', async () => {
      const [container] = generateForm(
        fields => (
          <div>
            {fields.map(field => (
              <Field {...field} key={field.key} rules={[{ required: true }]}>
                <Input />
              </Field>
            ))}
          </div>
        ),
        {
          initialValues: { list: [''] },
        },
      );

      await changeValue(getInput(container), ['bamboo', '']);

      expect(form.current?.getFieldError(['list', 0])).toEqual(["'list.0' is required"]);
    });

    it('remove should keep error', async () => {
      const [container] = generateForm(
        (fields, { remove }) => (
          <div>
            {fields.map(field => (
              <Field {...field} key={field.key} rules={[{ required: true }]}>
                <Input />
              </Field>
            ))}

            <button
              type="button"
              onClick={() => {
                remove(0);
              }}
            />
          </div>
        ),
        {
          initialValues: { list: ['', ''] },
        },
      );

      expect(container.querySelectorAll('input')).toHaveLength(2);
      await changeValue(getInput(container, 1), ['bamboo', '']);
      expect(form.current?.getFieldError(['list', 1])).toEqual(["'list.1' is required"]);

      fireEvent.click(container.querySelector('button')!);

      expect(container.querySelectorAll('input')).toHaveLength(1);
      expect(form.current?.getFieldError(['list', 0])).toEqual(["'list.1' is required"]);
    });

    it('when param of remove is array', async () => {
      const [container] = generateForm(
        (fields, { remove }) => (
          <div>
            {fields.map(field => (
              <Field {...field} key={field.key} rules={[{ required: true }, { min: 5 }]}>
                <Input />
              </Field>
            ))}

            <button
              type="button"
              onClick={() => {
                remove([0, 2]);
              }}
            />
          </div>
        ),
        {
          initialValues: { list: ['', '', ''] },
        },
      );

      expect(container.querySelectorAll('input')).toHaveLength(3);
      await changeValue(getInput(container, 0), ['bamboo', '']);
      expect(form.current?.getFieldError(['list', 0])).toEqual(["'list.0' is required"]);

      await changeValue(getInput(container, 1), 'test');
      expect(form.current?.getFieldError(['list', 1])).toEqual([
        "'list.1' must be at least 5 characters",
      ]);

      await changeValue(getInput(container, 2), ['bamboo', '']);
      expect(form.current?.getFieldError(['list', 2])).toEqual(["'list.2' is required"]);

      fireEvent.click(container.querySelector('button')!);

      expect(container.querySelectorAll('input')).toHaveLength(1);
      expect(form.current?.getFieldError(['list', 0])).toEqual([
        "'list.1' must be at least 5 characters",
      ]);
      expect(getInput(container).value).toEqual('test');
    });

    it('when add() second param is number', async () => {
      const [container] = generateForm(
        (fields, { add }) => (
          <div>
            {fields.map(field => (
              <Field {...field} key={field.key} rules={[{ required: true }, { min: 5 }]}>
                <Input />
              </Field>
            ))}

            <button
              className="button"
              type="button"
              onClick={() => {
                add('test4', 1);
              }}
            />

            <button
              className="button1"
              type="button"
              onClick={() => {
                add('test5', 0);
              }}
            />
          </div>
        ),
        {
          initialValues: { list: ['test1', 'test2', 'test3'] },
        },
      );

      expect(container.querySelectorAll('input')).toHaveLength(3);
      await changeValue(getInput(container, 0), ['bamboo', '']);
      expect(form.current?.getFieldError(['list', 0])).toEqual(["'list.0' is required"]);

      fireEvent.click(container.querySelector('.button')!);
      fireEvent.click(container.querySelector('.button1')!);

      expect(container.querySelectorAll('input')).toHaveLength(5);
      expect(form.current?.getFieldError(['list', 1])).toEqual(["'list.0' is required"]);

      await changeValue(getInput(container, 1), 'test');
      expect(form.current?.getFieldError(['list', 1])).toEqual([
        "'list.1' must be at least 5 characters",
      ]);
    });
  });

  it('warning if children is not function', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    generateForm((<div />) as any);

    expect(errorSpy).toHaveBeenCalledWith('Warning: Form.List only accepts function as children.');

    errorSpy.mockRestore();
  });

  // https://github.com/ant-design/ant-design/issues/25584
  it('preserve should not break list', async () => {
    let operation: ListOperations;
    const [container] = generateForm(
      (fields, opt) => {
        operation = opt;
        return (
          <div>
            {fields.map(field => (
              <Field {...field} key={field.key}>
                <Input />
              </Field>
            ))}
          </div>
        );
      },
      { preserve: false },
    );

    // Add
    act(() => {
      operation.add();
    });
    expect(container.querySelectorAll('input')).toHaveLength(1);

    // Remove
    act(() => {
      operation.remove(0);
    });
    expect(container.querySelectorAll('input')).toHaveLength(0);

    // Add
    act(() => {
      operation.add();
    });
    expect(container.querySelectorAll('input')).toHaveLength(1);
  });

  it('list support validator', async () => {
    let operation: ListOperations;
    let currentMeta: Meta;
    let currentValue: any;

    generateForm(
      (_, opt, meta) => {
        operation = opt;
        currentMeta = meta;
        return null;
      },
      null,
      {
        rules: [
          {
            validator(_, value) {
              currentValue = value;
              return Promise.reject();
            },
            message: 'Bamboo Light',
          },
        ],
      },
    );

    await act(async () => {
      operation.add();
      await timeout();
    });

    expect(currentValue).toEqual([undefined]);
    expect(currentMeta.errors).toEqual(['Bamboo Light']);
  });

  it('Nest list remove should trigger correct onValuesChange', () => {
    const onValuesChange = jest.fn();

    const [container] = generateForm(
      (fields, operation) => (
        <div>
          {fields.map(field => (
            <Field {...field} key={field.key} name={[field.name, 'first']}>
              <Input />
            </Field>
          ))}
          <button
            type="button"
            onClick={() => {
              operation.remove(1);
            }}
          />
        </div>
      ),
      {
        onValuesChange,
        initialValues: {
          list: [{ first: 'light' }, { first: 'bamboo' }],
        },
      },
    );

    fireEvent.click(container.querySelector('button')!);
    expect(onValuesChange).toHaveBeenCalledWith(expect.anything(), { list: [{ first: 'light' }] });
  });

  it('Nest list remove should trigger correct onValuesChange when no spread field props', () => {
    const onValuesChange = jest.fn();

    const [container] = generateForm(
      (fields, operation) => (
        <div>
          {fields.map(field => (
            <div key={field.key}>
              <Field name={[field.name, 'first']}>
                <Input />
              </Field>
              <Field name={[field.name, 'second']}>
                <Input />
              </Field>
            </div>
          ))}
          <button
            type="button"
            className="add-btn"
            onClick={() => {
              operation.add();
            }}
          />
          <button
            type="button"
            className="remove-btn"
            onClick={() => {
              operation.remove(1);
            }}
          />
        </div>
      ),
      {
        onValuesChange,
        initialValues: {
          list: [{ first: 'light' }],
        },
      },
    );
    fireEvent.click(container.querySelector('.add-btn')!);
    expect(onValuesChange).toHaveBeenCalledWith(expect.anything(), {
      list: [{ first: 'light' }, undefined],
    });
    fireEvent.click(container.querySelector('.remove-btn')!);
    expect(onValuesChange).toHaveBeenCalledWith(expect.anything(), { list: [{ first: 'light' }] });
  });

  describe('isFieldTouched edge case', () => {
    it('virtual object', async () => {
      const formRef = React.createRef<FormInstance>();
      const { container } = render(
        <Form ref={formRef}>
          <Form.Field name={['user', 'name']}>
            <Input />
          </Form.Field>
          <Form.Field name={['user', 'age']}>
            <Input />
          </Form.Field>
        </Form>,
      );

      // Not changed
      expect(formRef.current?.isFieldTouched('user')).toBeFalsy();
      expect(formRef.current?.isFieldsTouched(['user'], false)).toBeFalsy();
      expect(formRef.current?.isFieldsTouched(['user'], true)).toBeFalsy();

      // Changed
      await changeValue(getInput(container, 0), ['bamboo', '']);

      expect(formRef.current?.isFieldTouched('user')).toBeTruthy();
      expect(formRef.current?.isFieldsTouched(['user'], false)).toBeTruthy();
      expect(formRef.current?.isFieldsTouched(['user'], true)).toBeTruthy();
    });

    it('List children change', async () => {
      const [container] = generateForm(
        fields => (
          <div>
            {fields.map(field => (
              <Field {...field} key={field.key}>
                <Input />
              </Field>
            ))}
          </div>
        ),
        { initialValues: { list: ['light', 'bamboo'] } },
      );

      // Not changed yet
      expect(form.current?.isFieldTouched('list')).toBeFalsy();
      expect(form.current?.isFieldsTouched(['list'], false)).toBeFalsy();
      expect(form.current?.isFieldsTouched(['list'], true)).toBeFalsy();

      // Change children value
      await changeValue(getInput(container, 0), 'little');

      expect(form.current?.isFieldTouched('list')).toBeTruthy();
      expect(form.current?.isFieldsTouched(['list'], false)).toBeTruthy();
      expect(form.current?.isFieldsTouched(['list'], true)).toBeTruthy();
    });

    it('List self change', () => {
      const [container] = generateForm((fields, opt) => (
        <div>
          {fields.map(field => (
            <Field {...field} key={field.key}>
              <Input />
            </Field>
          ))}
          <button
            type="button"
            onClick={() => {
              opt.add();
            }}
          />
        </div>
      ));

      // Not changed yet
      expect(form.current?.isFieldTouched('list')).toBeFalsy();
      expect(form.current?.isFieldsTouched(['list'], false)).toBeFalsy();
      expect(form.current?.isFieldsTouched(['list'], true)).toBeFalsy();

      // Change children value
      fireEvent.click(container.querySelector('button')!);

      expect(form.current?.isFieldTouched('list')).toBeTruthy();
      expect(form.current?.isFieldsTouched(['list'], false)).toBeTruthy();
      expect(form.current?.isFieldsTouched(['list'], true)).toBeTruthy();
    });
  });

  it('initialValue', () => {
    generateForm(
      fields => (
        <div>
          {fields.map(field => (
            <Field {...field} key={field.key}>
              <Input />
            </Field>
          ))}
        </div>
      ),
      null,
      { initialValue: ['light', 'bamboo'] },
    );

    expect(form.current?.getFieldsValue()).toEqual({
      list: ['light', 'bamboo'],
    });
  });

  it('ListContext', () => {
    const Hooker = ({ field }: any) => {
      const { getKey } = React.useContext(ListContext);
      const [key, restPath] = getKey(['list', field.name, 'user']);

      return (
        <>
          <span className="internal-key">{key}</span>
          <span className="internal-rest">{restPath.join('_')}</span>

          <Field {...field} name={[field.name, 'user']}>
            <Input />
          </Field>
        </>
      );
    };

    const [container] = generateForm(
      fields => (
        <div>
          {fields.map(field => {
            return <Hooker field={field} key={field.key} />;
          })}
        </div>
      ),
      {
        initialValues: {
          list: [{ user: 'bamboo' }],
        },
      },
    );

    expect(container.querySelector('.internal-key')!.textContent).toEqual('0');
    expect(container.querySelector('.internal-rest')!.textContent).toEqual('user');
    expect(getInput(container).value).toEqual('bamboo');
  });

  it('list should not pass context', async () => {
    const onValuesChange = jest.fn();

    const InnerForm = () => (
      <Form onValuesChange={onValuesChange}>
        <Field name="name">
          <Input />
        </Field>
        <Field name="age" initialValue={2}>
          <Input />
        </Field>
      </Form>
    );

    const { container } = render(
      <Form>
        <Form.List name="parent">{() => <InnerForm />}</Form.List>
      </Form>,
    );

    await changeValue(getInput(container, 0), 'little');

    expect(onValuesChange).toHaveBeenCalledWith({ name: 'little' }, { name: 'little', age: 2 });
  });

  it('getFieldsValue with Strict mode', () => {
    const formRef = React.createRef<FormInstance>();

    const initialValues = { list: [{ bamboo: 1, light: 3 }], little: 9 };

    render(
      <div>
        <Form ref={formRef} initialValues={initialValues}>
          <Field name="little">
            <Input />
          </Field>
          <Form.List name="list">
            {fields =>
              fields.map(field => (
                <Field key={field.key} name={[field.name, 'bamboo']}>
                  <Input />
                </Field>
              ))
            }
          </Form.List>
        </Form>
      </div>,
    );

    // Strict only return field not list
    expect(formRef.current.getFieldsValue({ strict: true })).toEqual({
      list: [{ bamboo: 1 }],
      little: 9,
    });
  });

  it('isFieldsTouched with params true', async () => {
    const formRef = React.createRef<FormInstance>();

    const { container } = render(
      <Form
        ref={formRef}
        initialValues={{
          usename: '',
          list: [{}],
        }}
      >
        <Form.Field name="username">
          <input />
        </Form.Field>
        <Form.List name="list">
          {(fields, { add }) => (
            <>
              {fields.map(field => {
                return (
                  <React.Fragment key={field.key}>
                    <Form.Field name={[field.name, 'field1']}>
                      <input placeholder="field1" />
                    </Form.Field>
                    <Form.Field name={[field.name, 'field2']}>
                      <input placeholder="field2" />
                    </Form.Field>
                  </React.Fragment>
                );
              })}
              <button onClick={() => add()}>add</button>
            </>
          )}
        </Form.List>
      </Form>,
    );

    expect(formRef.current.isFieldsTouched(true)).toBeFalsy();

    await changeValue(getInput(container, 0), 'changed1');
    expect(formRef.current.isFieldsTouched(true)).toBeFalsy();

    await changeValue(getInput(container, 1), 'changed2');
    expect(formRef.current.isFieldsTouched(true)).toBeFalsy();

    await changeValue(getInput(container, 2), 'changed3');
    expect(formRef.current.isFieldsTouched(true)).toBeTruthy();
  });

  // https://github.com/ant-design/ant-design/issues/51702
  it('list nest field should ignore preserve', async () => {
    const formRef = React.createRef<FormInstance>();

    const { container } = render(
      <Form ref={formRef} preserve={false}>
        <Form.List name="list">
          {(fields, { remove }) => {
            return (
              <>
                {fields.map(field => (
                  <InfoField key={field.key} name={[field.name, 'user']} />
                ))}
                <button onClick={() => remove(1)}>remove</button>
              </>
            );
          }}
        </Form.List>
      </Form>,
    );

    formRef.current!.setFieldValue('list', [
      { user: '1' },
      { user: '2' },
      {
        user: '3',
      },
    ]);

    await act(async () => {
      await timeout();
    });

    expect(container.querySelectorAll('input')).toHaveLength(3);

    // Remove 1 should keep correct value
    fireEvent.click(container.querySelector('button')!);

    await act(async () => {
      await timeout();
    });

    expect(formRef.current!.getFieldValue('list')).toEqual([{ user: '1' }, { user: '3' }]);
  });
});

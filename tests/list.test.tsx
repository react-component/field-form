import React from 'react';
import { render, act, fireEvent, screen, waitFor, RenderResult } from './test-utils';
import { resetWarned } from 'rc-util/es/warning';
import Form, { Field, List } from '../src';
import type { FormProps } from '../src';
import type { ListField, ListOperations, ListProps } from '../src/List';
import type { FormInstance, Meta } from '../src/interface';
import ListContext from '../src/ListContext';
import { Input } from './common/InfoField';
import { changeValue, getField } from './common';
import timeout from './common/timeout';
import { describe, expect, it, vi } from 'vitest';

describe('Form.List', () => {
  const form = React.createRef<FormInstance>();

  const generateForm = (
    renderList?: (fields: ListField[], operations: ListOperations, meta: Meta) => React.ReactNode,
    formProps?: FormProps,
    listProps?: Partial<ListProps>,
  ): readonly [HTMLElement, () => HTMLElement, () => void] => {
    const Component = () => (
      <div>
        <Form ref={form} {...formProps}>
          <List name="list" {...listProps}>
            {renderList}
          </List>
        </Form>
      </div>
    );
    const { container, rerender } = render(<Component />);

    return [
      container,
      () => container,
      () => {
        rerender(<Component />);
      },
    ] as const;
  };

  it('basic', async () => {
    const [, getList] = generateForm(
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
      expect(getList().querySelectorAll('input')[index].getAttribute('data-key')).toEqual(key);
    }

    matchKey(0, '0');
    matchKey(1, '1');
    matchKey(2, '2');

    const listNode = getList();

    await act(async () => {
      await changeValue(getField(listNode, 0), '111');
      await changeValue(getField(listNode, 1), '222');
      await changeValue(getField(listNode, 2), '333');
    });

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
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
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
    const [container, getList, rerender] = generateForm((fields, opt) => {
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
      expect(getList().querySelectorAll('input')[index].getAttribute('data-key')).toEqual(key);
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

    rerender();
    expect(getList().querySelectorAll('input').length).toEqual(3);
    expect(form.current?.getFieldsValue()).toEqual({ list: [undefined, '2', undefined] });

    matchKey(0, '0');
    matchKey(1, '1');
    matchKey(2, '2');

    // Move
    act(() => {
      operation.move(2, 0);
    });
    rerender();
    matchKey(0, '2');
    matchKey(1, '0');
    matchKey(2, '1');

    // noneffective move
    act(() => {
      operation.move(-1, 0);
    });
    rerender();
    matchKey(0, '2');
    matchKey(1, '0');
    matchKey(2, '1');

    // noneffective move
    act(() => {
      operation.move(0, 10);
    });

    rerender();
    matchKey(0, '2');
    matchKey(1, '0');
    matchKey(2, '1');

    // noneffective move
    act(() => {
      operation.move(-1, 10);
    });

    rerender();
    matchKey(0, '2');
    matchKey(1, '0');
    matchKey(2, '1');

    // noneffective move
    act(() => {
      operation.move(0, 0);
    });
    rerender();
    matchKey(0, '2');
    matchKey(1, '0');
    matchKey(2, '1');

    // Revert Move
    act(() => {
      operation.move(0, 2);
    });
    rerender();
    matchKey(0, '0');
    matchKey(1, '1');
    matchKey(2, '2');

    // Modify
    await changeValue(getField(getList(), 1), '222');
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
    rerender();
    expect(getList().querySelectorAll('input').length).toEqual(2);
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
    rerender();

    matchKey(0, '0');
    matchKey(1, '2');

    // Remove not exist: more
    act(() => {
      operation.remove(99);
    });
    rerender();

    matchKey(0, '0');
    matchKey(1, '2');
  });

  it('remove when the param is Array', () => {
    let operation: ListOperations;
    const [container, getList, rerender] = generateForm((fields, opt) => {
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
      expect(getList().querySelectorAll('input')[index].getAttribute('data-key')).toEqual(key);
    }

    act(() => {
      operation.add();
    });

    act(() => {
      operation.add();
    });

    rerender();
    expect(getList().querySelectorAll('input').length).toEqual(2);

    // remove empty array
    act(() => {
      operation.remove([]);
    });

    rerender();

    matchKey(0, '0');
    matchKey(1, '1');

    // remove not esist element in array
    act(() => {
      operation.remove([-1, 99]);
    });
    rerender();

    matchKey(0, '0');
    matchKey(1, '1');

    act(() => {
      operation.remove([0]);
    });

    rerender();
    expect(getList().querySelectorAll('input').length).toEqual(1);
    matchKey(0, '1');

    act(() => {
      operation.add();
    });

    act(() => {
      operation.add();
    });

    rerender();
    matchKey(0, '1');
    matchKey(1, '2');
    matchKey(2, '3');

    act(() => {
      operation.remove([0, 1]);
    });

    rerender();
    matchKey(0, '3');
  });

  it('add when the second param is number', () => {
    let operation: ListOperations;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const [container, getList, rerender] = generateForm((fields, opt) => {
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

    rerender();
    expect(getList().querySelectorAll('input').length).toEqual(3);
    expect(form.current?.getFieldsValue()).toEqual({
      list: [undefined, '1', '2'],
    });

    act(() => {
      operation.add('0', 0);
    });
    act(() => {
      operation.add('4', 3);
    });

    rerender();
    expect(getList().querySelectorAll('input').length).toEqual(5);
    expect(form.current?.getFieldsValue()).toEqual({
      list: ['0', undefined, '1', '4', '2'],
    });
  });

  describe('validate', () => {
    it('basic', async () => {
      const [, getList] = generateForm(
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

      await act(async () => {
        await changeValue(getField(getList()), '');
      });

      expect(form.current?.getFieldError(['list', 0])).toEqual(["'list.0' is required"]);
    });

    it('remove should keep error', async () => {
      const [container, getList, rerender] = generateForm(
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
      await act(async () => {
        await changeValue(getField(getList(), 1), '');
      });
      expect(form.current?.getFieldError(['list', 1])).toEqual(["'list.1' is required"]);

      fireEvent.click(container.querySelector('button'));
      rerender();

      expect(container.querySelectorAll('input')).toHaveLength(1);
      expect(form.current?.getFieldError(['list', 0])).toEqual(["'list.1' is required"]);
    });

    it('when param of remove is array', async () => {
      const [container, getList, rerender] = generateForm(
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
      await act(async () => {
        await changeValue(getField(getList(), 0), '');
      });
      expect(form.current?.getFieldError(['list', 0])).toEqual(["'list.0' is required"]);

      await act(async () => {
        await changeValue(getField(getList(), 1), 'test');
      });
      expect(form.current?.getFieldError(['list', 1])).toEqual([
        "'list.1' must be at least 5 characters",
      ]);

      await act(async () => {
        await changeValue(getField(getList(), 2), '');
      });
      expect(form.current?.getFieldError(['list', 2])).toEqual(["'list.2' is required"]);

      fireEvent.click(container.querySelector('button'));
      rerender();

      expect(container.querySelectorAll('input')).toHaveLength(1);
      expect(form.current?.getFieldError(['list', 0])).toEqual([
        "'list.1' must be at least 5 characters",
      ]);
      expect(getField(container).value).toEqual('test');
    });

    it('when add() second param is number', async () => {
      const [container, getList] = generateForm(
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

      await act(async () => {
        await changeValue(getField(getList(), 0), '');
      });
      expect(form.current?.getFieldError(['list', 0])).toEqual(["'list.0' is required"]);

      await act(async () => {
        fireEvent.click(container.querySelector('.button'));
        fireEvent.click(container.querySelector('.button1'));
      });

      expect(container.querySelectorAll('input')).toHaveLength(5);
      expect(form.current?.getFieldError(['list', 1])).toEqual(["'list.0' is required"]);

      await act(async () => {
        await changeValue(getField(getList(), 1), 'test');
      });

      expect(form.current?.getFieldError(['list', 1])).toEqual([
        "'list.1' must be at least 5 characters",
      ]);
    });
  });

  it('warning if children is not function', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    generateForm((<div />) as any);

    expect(errorSpy).toHaveBeenCalledWith('Warning: Form.List only accepts function as children.');

    errorSpy.mockRestore();
  });

  // https://github.com/ant-design/ant-design/issues/25584
  it('preserve should not break list', async () => {
    let operation: ListOperations;
    const [container, _, rerender] = generateForm(
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
    rerender();
    expect(container.querySelectorAll('input')).toHaveLength(1);

    // Remove
    act(() => {
      operation.remove(0);
    });
    rerender();
    expect(container.querySelectorAll('input')).toHaveLength(0);

    // Add
    act(() => {
      operation.add();
    });
    rerender();
    expect(container.querySelectorAll('input')).toHaveLength(1);
  });

  it('list support validator', async () => {
    let operation: ListOperations;
    let currentMeta: Meta;
    let currentValue: any;

    const [_conteiner, __, rerender] = generateForm(
      (_any, opt, meta) => {
        operation = opt;
        currentMeta = meta;
        return null;
      },
      null,
      {
        rules: [
          {
            validator(__any, value) {
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
      rerender();
    });

    expect(currentValue).toEqual([undefined]);
    expect(currentMeta.errors).toEqual(['Bamboo Light']);
  });

  it('Nest list remove should trigger correct onValuesChange', () => {
    const onValuesChange = vi.fn();

    const [container, _] = generateForm(
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

    fireEvent.click(container.querySelector('button'));
    expect(onValuesChange).toHaveBeenCalledWith(expect.anything(), { list: [{ first: 'light' }] });
  });

  describe('isFieldTouched edge case', () => {
    it('virtual object', () => {
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

      // console.log(container.html());

      // Changed
      act(() => {
        changeValue(getField(container, 0), '');
      });

      // rerender();

      // console.log(container.html());
      // expect(container.html()).toMatchSnapshot();

      expect(formRef.current?.isFieldTouched('user')).toBeTruthy();
      expect(formRef.current?.isFieldsTouched(['user'], false)).toBeTruthy();
      expect(formRef.current?.isFieldsTouched(['user'], true)).toBeTruthy();
    });

    it('List children change', () => {
      const [container, _] = generateForm(
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
      changeValue(getField(container), 'little');

      expect(form.current?.isFieldTouched('list')).toBeTruthy();
      expect(form.current?.isFieldsTouched(['list'], false)).toBeTruthy();
      expect(form.current?.isFieldsTouched(['list'], true)).toBeTruthy();
    });

    it('List self change', () => {
      const [container, _] = generateForm((fields, opt) => (
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
      fireEvent.click(container.querySelector('button'));

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

    expect(container.querySelector('.internal-key').textContent).toEqual('0');
    expect(container.querySelector('.internal-rest').textContent).toEqual('user');
    expect(container.querySelector('input').value).toEqual('bamboo');
  });
});

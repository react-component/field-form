import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import type { ReactWrapper } from 'enzyme';
import { resetWarned } from 'rc-util/lib/warning';
import Form, { Field, List } from '../src';
import type { FormProps } from '../src';
import type { ListField, ListOperations, ListProps } from '../src/List';
import type { FormInstance, Meta } from '../src/interface';
import ListContext from '../src/ListContext';
import { Input } from './common/InfoField';
import { changeValue, getField } from './common';
import timeout from './common/timeout';

describe('Form.List', () => {
  let form;

  function generateForm(
    renderList?: (
      fields: ListField[],
      operations: ListOperations,
      meta: Meta,
    ) => JSX.Element | React.ReactNode,
    formProps?: FormProps,
    listProps?: Partial<ListProps>,
  ): [ReactWrapper, () => ReactWrapper] {
    const wrapper = mount(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
          {...formProps}
        >
          <List name="list" {...listProps}>
            {renderList}
          </List>
        </Form>
      </div>,
    );

    return [wrapper, () => getField(wrapper).find('div')];
  }

  it('basic', async () => {
    const [, getList] = generateForm(
      fields => (
        <div>
          {fields.map(field => (
            <Field {...field}>
              <Input />
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

    function matchKey(index, key) {
      expect(getList().find(Field).at(index).key()).toEqual(key);
    }

    matchKey(0, '0');
    matchKey(1, '1');
    matchKey(2, '2');

    const listNode = getList();

    await changeValue(getField(listNode, 0), '111');
    await changeValue(getField(listNode, 1), '222');
    await changeValue(getField(listNode, 2), '333');

    expect(form.getFieldsValue()).toEqual({
      list: ['111', '222', '333'],
    });
  });

  it('not crash', () => {
    // Empty only
    mount(
      <Form initialValues={{ list: null }}>
        <Form.List name="list">{() => null}</Form.List>
      </Form>,
    );

    // Not a array
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    resetWarned();
    mount(
      <Form initialValues={{ list: {} }}>
        <Form.List name="list">{() => null}</Form.List>
      </Form>,
    );
    expect(errorSpy).toHaveBeenCalledWith("Warning: Current value of 'list' is not an array type.");
    errorSpy.mockRestore();
  });

  it('operation', async () => {
    let operation;
    const [wrapper, getList] = generateForm((fields, opt) => {
      operation = opt;
      return (
        <div>
          {fields.map(field => (
            <Field {...field}>
              <Input />
            </Field>
          ))}
        </div>
      );
    });

    function matchKey(index, key) {
      expect(getList().find(Field).at(index).key()).toEqual(key);
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

    wrapper.update();
    expect(getList().find(Field).length).toEqual(3);
    expect(form.getFieldsValue()).toEqual({
      list: [undefined, '2', undefined],
    });

    matchKey(0, '0');
    matchKey(1, '1');
    matchKey(2, '2');

    // Move
    act(() => {
      operation.move(2, 0);
    });
    wrapper.update();
    matchKey(0, '2');
    matchKey(1, '0');
    matchKey(2, '1');

    // noneffective move
    act(() => {
      operation.move(-1, 0);
    });
    wrapper.update();
    matchKey(0, '2');
    matchKey(1, '0');
    matchKey(2, '1');

    // noneffective move
    act(() => {
      operation.move(0, 10);
    });

    wrapper.update();
    matchKey(0, '2');
    matchKey(1, '0');
    matchKey(2, '1');

    // noneffective move
    act(() => {
      operation.move(-1, 10);
    });

    wrapper.update();
    matchKey(0, '2');
    matchKey(1, '0');
    matchKey(2, '1');

    // noneffective move
    act(() => {
      operation.move(0, 0);
    });
    wrapper.update();
    matchKey(0, '2');
    matchKey(1, '0');
    matchKey(2, '1');

    // Revert Move
    act(() => {
      operation.move(0, 2);
    });
    wrapper.update();
    matchKey(0, '0');
    matchKey(1, '1');
    matchKey(2, '2');

    // Modify
    await changeValue(getField(getList(), 1), '222');
    expect(form.getFieldsValue()).toEqual({
      list: [undefined, '222', undefined],
    });
    expect(form.isFieldTouched(['list', 0])).toBeFalsy();
    expect(form.isFieldTouched(['list', 1])).toBeTruthy();
    expect(form.isFieldTouched(['list', 2])).toBeFalsy();

    matchKey(0, '0');
    matchKey(1, '1');
    matchKey(2, '2');

    // Remove
    act(() => {
      operation.remove(1);
    });
    wrapper.update();
    expect(getList().find(Field).length).toEqual(2);
    expect(form.getFieldsValue()).toEqual({
      list: [undefined, undefined],
    });
    expect(form.isFieldTouched(['list', 0])).toBeFalsy();
    expect(form.isFieldTouched(['list', 2])).toBeFalsy();

    matchKey(0, '0');
    matchKey(1, '2');

    // Remove not exist: less
    act(() => {
      operation.remove(-1);
    });
    wrapper.update();

    matchKey(0, '0');
    matchKey(1, '2');

    // Remove not exist: more
    act(() => {
      operation.remove(99);
    });
    wrapper.update();

    matchKey(0, '0');
    matchKey(1, '2');
  });

  it('remove when the param is Array', () => {
    let operation;
    const [wrapper, getList] = generateForm((fields, opt) => {
      operation = opt;
      return (
        <div>
          {fields.map(field => (
            <Field {...field}>
              <Input />
            </Field>
          ))}
        </div>
      );
    });

    function matchKey(index, key) {
      expect(getList().find(Field).at(index).key()).toEqual(key);
    }

    act(() => {
      operation.add();
    });

    act(() => {
      operation.add();
    });

    wrapper.update();
    expect(getList().find(Field).length).toEqual(2);

    // remove empty array
    act(() => {
      operation.remove([]);
    });

    wrapper.update();

    matchKey(0, '0');
    matchKey(1, '1');

    // remove not esist element in array
    act(() => {
      operation.remove([-1, 99]);
    });
    wrapper.update();

    matchKey(0, '0');
    matchKey(1, '1');

    act(() => {
      operation.remove([0]);
    });

    wrapper.update();
    expect(getList().find(Field).length).toEqual(1);
    matchKey(0, '1');

    act(() => {
      operation.add();
    });

    act(() => {
      operation.add();
    });

    wrapper.update();
    matchKey(0, '1');
    matchKey(1, '2');
    matchKey(2, '3');

    act(() => {
      operation.remove([0, 1]);
    });

    wrapper.update();
    matchKey(0, '3');
  });

  it('add when the second param is number', () => {
    let operation;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const [wrapper, getList] = generateForm((fields, opt) => {
      operation = opt;
      return (
        <div>
          {fields.map(field => (
            <Field {...field}>
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

    wrapper.update();
    expect(getList().find(Field).length).toEqual(3);
    expect(form.getFieldsValue()).toEqual({
      list: [undefined, '1', '2'],
    });

    act(() => {
      operation.add('0', 0);
    });
    act(() => {
      operation.add('4', 3);
    });

    wrapper.update();
    expect(getList().find(Field).length).toEqual(5);
    expect(form.getFieldsValue()).toEqual({
      list: ['0', undefined, '1', '4', '2'],
    });
  });

  describe('validate', () => {
    it('basic', async () => {
      const [, getList] = generateForm(
        fields => (
          <div>
            {fields.map(field => (
              <Field {...field} rules={[{ required: true }]}>
                <Input />
              </Field>
            ))}
          </div>
        ),
        {
          initialValues: { list: [''] },
        },
      );

      await changeValue(getField(getList()), '');

      expect(form.getFieldError(['list', 0])).toEqual(["'list.0' is required"]);
    });

    it('remove should keep error', async () => {
      const [wrapper, getList] = generateForm(
        (fields, { remove }) => (
          <div>
            {fields.map(field => (
              <Field {...field} rules={[{ required: true }]}>
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

      expect(wrapper.find(Input)).toHaveLength(2);
      await changeValue(getField(getList(), 1), '');
      expect(form.getFieldError(['list', 1])).toEqual(["'list.1' is required"]);

      wrapper.find('button').simulate('click');
      wrapper.update();

      expect(wrapper.find(Input)).toHaveLength(1);
      expect(form.getFieldError(['list', 0])).toEqual(["'list.1' is required"]);
    });

    it('when param of remove is array', async () => {
      const [wrapper, getList] = generateForm(
        (fields, { remove }) => (
          <div>
            {fields.map(field => (
              <Field {...field} rules={[{ required: true }, { min: 5 }]}>
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

      expect(wrapper.find(Input)).toHaveLength(3);
      await changeValue(getField(getList(), 0), '');
      expect(form.getFieldError(['list', 0])).toEqual(["'list.0' is required"]);

      await changeValue(getField(getList(), 1), 'test');
      expect(form.getFieldError(['list', 1])).toEqual(["'list.1' must be at least 5 characters"]);

      await changeValue(getField(getList(), 2), '');
      expect(form.getFieldError(['list', 2])).toEqual(["'list.2' is required"]);

      wrapper.find('button').simulate('click');
      wrapper.update();

      expect(wrapper.find(Input)).toHaveLength(1);
      expect(form.getFieldError(['list', 0])).toEqual(["'list.1' must be at least 5 characters"]);
      expect(wrapper.find('input').props().value).toEqual('test');
    });

    it('when add() second param is number', async () => {
      const [wrapper, getList] = generateForm(
        (fields, { add }) => (
          <div>
            {fields.map(field => (
              <Field {...field} rules={[{ required: true }, { min: 5 }]}>
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

      expect(wrapper.find(Input)).toHaveLength(3);
      await changeValue(getField(getList(), 0), '');
      expect(form.getFieldError(['list', 0])).toEqual(["'list.0' is required"]);

      wrapper.find('.button').simulate('click');
      wrapper.find('.button1').simulate('click');

      expect(wrapper.find(Input)).toHaveLength(5);
      expect(form.getFieldError(['list', 1])).toEqual(["'list.0' is required"]);

      await changeValue(getField(getList(), 1), 'test');
      expect(form.getFieldError(['list', 1])).toEqual(["'list.1' must be at least 5 characters"]);
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
    let operation;
    const [wrapper] = generateForm(
      (fields, opt) => {
        operation = opt;
        return (
          <div>
            {fields.map(field => (
              <Field {...field}>
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
    wrapper.update();
    expect(wrapper.find(Input)).toHaveLength(1);

    // Remove
    act(() => {
      operation.remove(0);
    });
    wrapper.update();
    expect(wrapper.find(Input)).toHaveLength(0);

    // Add
    act(() => {
      operation.add();
    });
    wrapper.update();
    expect(wrapper.find(Input)).toHaveLength(1);
  });

  it('list support validator', async () => {
    let operation;
    let currentMeta;
    let currentValue;

    const [wrapper] = generateForm(
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
      wrapper.update();
    });

    expect(currentValue).toEqual([undefined]);
    expect(currentMeta.errors).toEqual(['Bamboo Light']);
  });

  it('Nest list remove should trigger correct onValuesChange', () => {
    const onValuesChange = jest.fn();

    const [wrapper] = generateForm(
      (fields, operation) => (
        <div>
          {fields.map(field => (
            <Field {...field} name={[field.name, 'first']}>
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

    wrapper.find('button').simulate('click');
    expect(onValuesChange).toHaveBeenCalledWith(expect.anything(), { list: [{ first: 'light' }] });
  });

  describe('isFieldTouched edge case', () => {
    it('virtual object', () => {
      const formRef = React.createRef<FormInstance>();
      const wrapper = mount(
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
      expect(formRef.current.isFieldTouched('user')).toBeFalsy();
      expect(formRef.current.isFieldsTouched(['user'], false)).toBeFalsy();
      expect(formRef.current.isFieldsTouched(['user'], true)).toBeFalsy();

      // Changed
      wrapper
        .find('input')
        .first()
        .simulate('change', { target: { value: '' } });

      expect(formRef.current.isFieldTouched('user')).toBeTruthy();
      expect(formRef.current.isFieldsTouched(['user'], false)).toBeTruthy();
      expect(formRef.current.isFieldsTouched(['user'], true)).toBeTruthy();
    });

    it('List children change', () => {
      const [wrapper] = generateForm(
        fields => (
          <div>
            {fields.map(field => (
              <Field {...field}>
                <Input />
              </Field>
            ))}
          </div>
        ),
        {
          initialValues: { list: ['light', 'bamboo'] },
        },
      );

      // Not changed yet
      expect(form.isFieldTouched('list')).toBeFalsy();
      expect(form.isFieldsTouched(['list'], false)).toBeFalsy();
      expect(form.isFieldsTouched(['list'], true)).toBeFalsy();

      // Change children value
      wrapper
        .find('input')
        .first()
        .simulate('change', { target: { value: 'little' } });

      expect(form.isFieldTouched('list')).toBeTruthy();
      expect(form.isFieldsTouched(['list'], false)).toBeTruthy();
      expect(form.isFieldsTouched(['list'], true)).toBeTruthy();
    });

    it('List self change', () => {
      const [wrapper] = generateForm((fields, opt) => (
        <div>
          {fields.map(field => (
            <Field {...field}>
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
      expect(form.isFieldTouched('list')).toBeFalsy();
      expect(form.isFieldsTouched(['list'], false)).toBeFalsy();
      expect(form.isFieldsTouched(['list'], true)).toBeFalsy();

      // Change children value
      wrapper.find('button').simulate('click');

      expect(form.isFieldTouched('list')).toBeTruthy();
      expect(form.isFieldsTouched(['list'], false)).toBeTruthy();
      expect(form.isFieldsTouched(['list'], true)).toBeTruthy();
    });
  });

  it('initialValue', () => {
    generateForm(
      fields => (
        <div>
          {fields.map(field => (
            <Field {...field}>
              <Input />
            </Field>
          ))}
        </div>
      ),
      null,
      { initialValue: ['light', 'bamboo'] },
    );

    expect(form.getFieldsValue()).toEqual({
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

    const [wrapper] = generateForm(
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

    expect(wrapper.find('.internal-key').text()).toEqual('0');
    expect(wrapper.find('.internal-rest').text()).toEqual('user');
    expect(wrapper.find('input').prop('value')).toEqual('bamboo');
  });
});

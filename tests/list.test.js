import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import Form, { Field, List } from '../src';
import { Input } from './common/InfoField';
import { changeValue, getField } from './common';

describe('Form.List', () => {
  let form;

  function generateForm(renderList, formProps) {
    const wrapper = mount(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
          {...formProps}
        >
          <List name="list">{renderList}</List>
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
      expect(
        getList()
          .find(Field)
          .at(index)
          .key(),
      ).toEqual(key);
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
      expect(
        getList()
          .find(Field)
          .at(index)
          .key(),
      ).toEqual(key);
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
  });

  it('warning if children is not function', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    generateForm(<div />);

    expect(errorSpy).toHaveBeenCalledWith('Warning: Form.List only accepts function as children.');

    errorSpy.mockRestore();
  });
});

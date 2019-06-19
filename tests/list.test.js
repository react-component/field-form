import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount } from 'enzyme';
import Form, { Field, List } from '../src';
import InfoField, { Input } from './common/InfoField';
import { changeValue, matchError, getField } from './common';
import timeout from './common/timeout';

describe('list', () => {
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

    // Add
    operation.add();
    operation.add();
    operation.add();
    wrapper.update();
    expect(getList().find(Field).length).toEqual(3);

    // Modify
    await changeValue(getField(getList(), 1), '222');
    expect(form.getFieldsValue()).toEqual({
      list: [undefined, '222', undefined],
    });
    expect(form.isFieldTouched(['list', 0])).toBeFalsy();
    expect(form.isFieldTouched(['list', 1])).toBeTruthy();
    expect(form.isFieldTouched(['list', 2])).toBeFalsy();

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
  });

  it('validate', async () => {
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

  it('warning if children is not function', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    generateForm(<div />);

    expect(errorSpy).toHaveBeenCalledWith('Warning: Form.List only accepts function as children.');

    errorSpy.mockRestore();
  });
});

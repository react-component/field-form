import React from 'react';
import { mount } from 'enzyme';
import Form, { Field } from '../../src';
import { Input } from '../common/InfoField';
import { changeValue, getField, matchArray } from '../common';

describe('legacy.field-props', () => {
  // https://github.com/ant-design/ant-design/issues/8985
  it('support disordered array', async () => {
    let form;

    mount(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
        >
          <Field name={['array', 1]} rules={[{ required: true }]}>
            <Input />
          </Field>
          <Field name={['array', 0]} rules={[{ required: true }]}>
            <Input />
          </Field>
        </Form>
      </div>,
    );

    try {
      await form.validateFields();
      throw new Error('Should not pass!');
    } catch ({ errorFields }) {
      matchArray(
        errorFields,
        [
          { name: ['array', 0], errors: ["'array.0' is required"] },
          { name: ['array', 1], errors: ["'array.1' is required"] },
        ],
        'name',
      );
    }
  });

  it('getValueFromEvent', async () => {
    let form;

    const wrapper = mount(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
        >
          <Field name="normal" getValueFromEvent={e => `${e.target.value}1`}>
            <Input />
          </Field>
        </Form>
      </div>,
    );

    await changeValue(getField(wrapper), '2');
    expect(form.getFieldValue('normal')).toBe('21');
  });

  it('normalize', async () => {
    let form;
    const wrapper = mount(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
        >
          <Field name="normal" normalize={v => v && v.toUpperCase()}>
            <Input />
          </Field>
        </Form>
      </div>,
    );

    await changeValue(getField(wrapper), 'a');

    expect(form.getFieldValue('normal')).toBe('A');
    expect(
      getField(wrapper)
        .find('input')
        .props().value,
    ).toBe('A');
  });

  it('support jsx message', async () => {
    let form;
    const wrapper = mount(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
        >
          <Field name="required" rules={[{ required: true, message: <b>1</b> }]}>
            <Input />
          </Field>
        </Form>
      </div>,
    );

    await changeValue(getField(wrapper), '');
    expect(form.getFieldError('required').length).toBe(1);
    expect(form.getFieldError('required')[0].type).toBe('b');
  });
});

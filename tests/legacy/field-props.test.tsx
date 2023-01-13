import React from 'react';
import { mount } from 'enzyme';
import type { FormInstance } from '../../src';
import Form, { Field } from '../../src';
import { Input } from '../common/InfoField';
import { changeValue, getField, matchArray } from '../common';

describe('legacy.field-props', () => {
  // https://github.com/ant-design/ant-design/issues/8985
  it('support disordered array', async () => {
    const form = React.createRef<FormInstance>();

    mount(
      <div>
        <Form ref={form}>
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
      await form.current?.validateFields();
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
    const form = React.createRef<FormInstance>();

    const wrapper = mount(
      <div>
        <Form ref={form}>
          <Field name="normal" getValueFromEvent={e => `${e.target.value}1`}>
            <Input />
          </Field>
        </Form>
      </div>,
    );

    await changeValue(getField(wrapper), '2');
    expect(form.current?.getFieldValue('normal')).toBe('21');
  });

  it('normalize', async () => {
    const form = React.createRef<FormInstance>();
    const wrapper = mount(
      <div>
        <Form ref={form}>
          <Field name="normal" normalize={v => v && v.toUpperCase()}>
            <Input />
          </Field>
        </Form>
      </div>,
    );

    await changeValue(getField(wrapper), 'a');

    expect(form.current?.getFieldValue('normal')).toBe('A');
    expect(getField(wrapper).find('input').props().value).toBe('A');
  });

  it('support jsx message', async () => {
    const form = React.createRef<FormInstance>();
    const wrapper = mount(
      <div>
        <Form ref={form}>
          <Field name="required" rules={[{ required: true, message: <b>1</b> }]}>
            <Input />
          </Field>
        </Form>
      </div>,
    );

    await changeValue(getField(wrapper), '');
    expect(form.current?.getFieldError('required').length).toBe(1);
    expect((form.current?.getFieldError('required')[0] as any).type).toBe('b');
  });
});

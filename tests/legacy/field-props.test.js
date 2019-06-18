import React from 'react';
import { mount } from 'enzyme';
import Form, { Field } from '../../src';
import { Input } from '../common/InfoField';
import { changeValue, getField, matchArray } from '../common';
import timeout from '../common/timeout';

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
      const values = await form.validateFields();
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
});

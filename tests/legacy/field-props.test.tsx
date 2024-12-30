import React from 'react';
import type { FormInstance } from '../../src';
import Form, { Field } from '../../src';
import InfoField, { Input } from '../common/InfoField';
import { changeValue, getInput, matchArray } from '../common';
import { render } from '@testing-library/react';

describe('legacy.field-props', () => {
  // https://github.com/ant-design/ant-design/issues/8985
  it('support disordered array', async () => {
    const form = React.createRef<FormInstance>();

    render(
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

    const { container } = render(
      <div>
        <Form ref={form}>
          <Field name="normal" getValueFromEvent={e => `${e.target.value}1`}>
            <Input />
          </Field>
        </Form>
      </div>,
    );

    await changeValue(getInput(container), '2');
    expect(form.current?.getFieldValue('normal')).toBe('21');
  });

  describe('normalize', () => {
    it('basic', async () => {
      const form = React.createRef<FormInstance>();
      const { container } = render(
        <div>
          <Form ref={form}>
            <Field name="normal" normalize={v => v && v.toUpperCase()}>
              <Input />
            </Field>
          </Form>
        </div>,
      );

      await changeValue(getInput(container), 'a');

      expect(form.current?.getFieldValue('normal')).toBe('A');
      expect(getInput(container).value).toBe('A');
    });

    it('value no change', async () => {
      const fn = jest.fn();
      const { container } = render(
        <Form onFieldsChange={fn}>
          <InfoField name="test" normalize={value => value?.replace(/\D/g, '') || undefined} />
        </Form>,
      );

      await changeValue(getInput(container), 'bamboo');
      expect(fn).toHaveBeenCalledTimes(0);
      await changeValue(getInput(container), '1');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  it('support jsx message', async () => {
    const form = React.createRef<FormInstance>();
    const { container } = render(
      <div>
        <Form ref={form}>
          <Field name="required" rules={[{ required: true, message: <b>1</b> }]}>
            <Input />
          </Field>
        </Form>
      </div>,
    );

    // React 18 will not trigger change if `value` is same
    await changeValue(getInput(container), ['1', '']);

    expect(form.current?.getFieldError('required').length).toBe(1);
    expect((form.current?.getFieldError('required')[0] as any).type).toBe('b');
  });
});

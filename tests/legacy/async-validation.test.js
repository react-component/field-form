import React from 'react';
import { mount } from 'enzyme';
import Form, { Field } from '../../src';
import { Input } from '../common/InfoField';
import { changeValue, getField } from '../common';
import timeout from '../common/timeout';

describe('legacy.async-validation', () => {
  let wrapper;
  let form;

  const checkRule = (_, value, callback) => {
    setTimeout(() => {
      if (value === '1') {
        callback();
      } else {
        callback(new Error('must be 1'));
      }
    }, 100);
  };

  beforeEach(() => {
    wrapper = mount(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
        >
          <Field name="normal">
            <Input />
          </Field>
          <Field name="async" rules={[{ validator: checkRule }]}>
            <Input />
          </Field>
        </Form>
      </div>,
    );
  });

  it('works', async () => {
    await changeValue(getField(wrapper, 'async'), '');
    expect(form.getFieldValue('async')).toBe('');
    expect(form.getFieldError('async')).toEqual([]);
    expect(form.isFieldValidating('async')).toBeTruthy();
    expect(form.isFieldsValidating()).toBeTruthy();

    await timeout(200);
    expect(form.getFieldError('async')).toEqual(['must be 1']);
    expect(form.isFieldValidating('async')).toBe(false);
    expect(form.isFieldsValidating()).toBe(false);

    await changeValue(getField(wrapper, 'async'), '1');
    expect(form.getFieldValue('async')).toBe('1');
    expect(form.getFieldError('async')).toEqual([]);
    expect(form.isFieldValidating('async')).toBeTruthy();
    expect(form.isFieldsValidating()).toBeTruthy();

    await timeout(200);
    expect(form.getFieldError('async')).toEqual([]);
    expect(form.isFieldValidating('async')).toBeFalsy();
    expect(form.isFieldsValidating()).toBeFalsy();
  });

  it('validateFields works for error', async () => {
    try {
      await form.validateFields();
      throw new Error('should not pass');
    } catch ({ values, errorFields }) {
      expect(values.normal).toEqual(undefined);
      expect(values.async).toEqual(undefined);
      expect(errorFields.length).toBe(1);

      const entity = errorFields[0];
      expect(entity.name).toEqual(['async']);
      expect(entity.errors).toEqual(['must be 1']);
    }
  });

  it('validateFields works for ok', async () => {
    await changeValue(getField(wrapper, 'async'), '1');
    const values = await form.validateFields();
    expect(values.normal).toBe(undefined);
    expect(values.async).toBe('1');
  });

  it('will error if change when validating', async done => {
    form.validateFields().catch(({ errorFields, outOfDate }) => {
      expect(errorFields.length).toBeTruthy();
      expect(outOfDate).toBeTruthy();
      done();
    });

    changeValue(getField(wrapper, 'async'), '1');
  });
});

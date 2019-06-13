import React from 'react';
import { mount } from 'enzyme';
import Form, { Field } from '../../src';
import { Input } from '../common/InfoField';
import { changeValue, getField } from '../common';
import timeout from '../common/timeout';

describe('legacy.async-validation', () => {
  let wrapper;
  let form;

  const checkRule = {
    validator(_, value, callback) {
      setTimeout(() => {
        if (value === '1') {
          callback();
        } else {
          callback(new Error('must be 1'));
        }
      }, 100);
    },
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
          <Field name="async" rules={[checkRule]}>
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
});

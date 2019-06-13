import React from 'react';
import { mount } from 'enzyme';
import Form, { Field } from '../../src';
import { Input } from '../common/InfoField';
import { changeValue, getField } from '../common';

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
    expect(form.getFieldError('async').length).toBeFalsy();
    expect(form.isFieldValidating('async')).toBeTruthy();
    expect(form.isFieldsValidating()).toBeTruthy();
  });
});

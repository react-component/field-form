import React from 'react';
import { mount } from 'enzyme';
import Form, { Field } from '../../src';
import { Input } from '../common/InfoField';
import { changeValue, getField } from '../common';
import timeout from '../common/timeout';

describe('legacy.form', () => {
  // https://github.com/ant-design/ant-design/issues/8386
  it('should work even set with undefined name', async () => {
    let form;
    mount(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
          initialValues={{ normal: '1' }}
        >
          <Field name="normal">
            <Input />
          </Field>
        </Form>
      </div>,
    );

    form.setFieldsValue({
      normal: '2',
      notExist: 'oh',
    });

    expect(form.getFieldValue('normal')).toBe('2');
  });

  // [Legacy] Seems useless
  it('can reset hidden fields', () => {});

  // [Legacy] Should move to Ant Design
  it('form name', () => {});
});

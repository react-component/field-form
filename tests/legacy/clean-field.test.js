import React from 'react';
import { mount } from 'enzyme';
import Form, { Field } from '../../src';
import { Input } from '../common/InfoField';

describe('legacy.clean-field', () => {
  // https://github.com/ant-design/ant-design/issues/12560
  it('clean field if did update removed', async () => {
    let form;

    const Test = ({ show }) => (
      <Form
        ref={instance => {
          form = instance;
        }}
      >
        {show ? (
          <Field name="age" rules={[{ required: true }]}>
            <Input />
          </Field>
        ) : (
          <Field name="name" rules={[{ required: true }]}>
            <Input />
          </Field>
        )}
      </Form>
    );

    const wrapper = mount(<Test show />);

    try {
      await form.validateFields();
      throw new Error('should not pass');
    } catch ({ errorFields }) {
      expect(errorFields.length).toBe(1);
      expect(errorFields[0].name).toEqual(['age']);
    }

    wrapper.setProps({ show: false });

    try {
      await form.validateFields();
      throw new Error('should not pass');
    } catch ({ errorFields }) {
      expect(errorFields.length).toBe(1);
      expect(errorFields[0].name).toEqual(['name']);
    }
  });
});

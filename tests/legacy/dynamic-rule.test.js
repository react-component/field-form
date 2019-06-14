import React from 'react';
import { mount } from 'enzyme';
import Form, { Field } from '../../src';
import { Input } from '../common/InfoField';
import { changeValue, getField, matchArray } from '../common';
import timeout from '../common/timeout';

describe('legacy.dynamic-rule', () => {
  describe('should update errors', () => {
    it('render props', async () => {
      let form;

      const wrapper = mount(
        <div>
          <Form
            ref={instance => {
              form = instance;
            }}
          >
            {(_, { getFieldValue }) => (
              <React.Fragment>
                <Field name="type">
                  <Input />
                </Field>
                <Field name="val1" rules={[{ required: getFieldValue('type') }]}>
                  <Input />
                </Field>
                <Field name="val2" rules={[{ required: !getFieldValue('type') }]}>
                  <Input />
                </Field>
              </React.Fragment>
            )}
          </Form>
        </div>,
      );

      await changeValue(getField(wrapper, 'type'), 'test');

      // try {
      //   await form.validateFields();
      //   throw new Error('should not pass');
      // } catch ({ errorFields }) {
      //   matchArray(
      //     errorFields,
      //     [
      //       {
      //         name: ['val1'],
      //       },
      //     ],
      //     'name',
      //   );
      // }
    });
  });
});

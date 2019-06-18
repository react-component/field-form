import React from 'react';
import { mount } from 'enzyme';
import Form, { Field } from '../../src';
import { Input } from '../common/InfoField';
import { changeValue, getField, validateFields, matchArray } from '../common';
import timeout from '../common/timeout';

describe('legacy.dynamic-rule', () => {
  describe('should update errors', () => {
    function doTest(name, renderFunc) {
      it(name, async () => {
        const [form, wrapper] = await renderFunc();

        await changeValue(getField(wrapper, 'type'), 'test');
        try {
          await validateFields(form);
          throw new Error('should not pass');
        } catch ({ errorFields }) {
          matchArray(
            errorFields,
            [
              {
                name: ['val1'],
              },
            ],
            'name',
          );
        }

        await changeValue(getField(wrapper, 'type'), '');
        try {
          await validateFields(form);
          throw new Error('should not pass');
        } catch ({ errorFields }) {
          matchArray(
            errorFields,
            [
              {
                name: ['val2'],
              },
            ],
            'name',
          );
        }
      });
    }

    // [Legacy] Test case
    doTest('render props', async () => {
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

      wrapper.update();

      return [form, wrapper];
    });

    doTest('use function rule', async () => {
      let form;

      const wrapper = mount(
        <div>
          <Form
            ref={instance => {
              form = instance;
            }}
          >
            <Field name="type">
              <Input />
            </Field>
            <Field
              name="val1"
              rules={[({ getFieldValue }) => ({ required: getFieldValue('type') })]}
            >
              <Input />
            </Field>
            <Field
              name="val2"
              rules={[({ getFieldValue }) => ({ required: !getFieldValue('type') })]}
            >
              <Input />
            </Field>
          </Form>
        </div>,
      );

      wrapper.update();

      return [form, wrapper];
    });
  });
});

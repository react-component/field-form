import React from 'react';
import { mount } from 'enzyme';
import Form, { Field } from '../../src';
import { Input } from '../common/InfoField';
import { changeValue, getField, matchArray } from '../common';

describe('legacy.basic-form', () => {
  describe('onFieldsChange', () => {
    it('trigger `onFieldsChange` when value change', async () => {
      const onFieldsChange = jest.fn();

      const wrapper = mount(
        <div>
          <Form onFieldsChange={onFieldsChange}>
            <Field name={['user', 'name']}>
              <Input />
            </Field>
            <Field name={['user', 'age']}>
              <Input type="number" />
            </Field>
            <Field name="agreement">
              <Input type="checkbox" />
            </Field>
          </Form>
        </div>,
      );

      await changeValue(getField(wrapper, ['user', 'name']), 'Light');
      expect(onFieldsChange.mock.calls[0][0]).toMatchObject([
        { name: ['user', 'name'], value: 'Light' },
      ]);
      matchArray(
        onFieldsChange.mock.calls[0][1],
        [
          { name: ['user', 'name'], value: 'Light' },
          { name: ['user', 'age'], value: undefined },
          { name: ['agreement'], value: undefined },
        ],
        'name',
      );
    });

    // [Legacy] Not trigger in field form. This is anti with origin test
    // https://github.com/react-component/form/blob/master/tests/createForm.spec.js#L70
    it('**Not** trigger `onFieldsChange` when `setFields`', () => {
      let form;
      const onFieldsChange = jest.fn();

      mount(
        <div>
          <Form
            ref={instance => {
              form = instance;
            }}
            onFieldsChange={onFieldsChange}
          >
            <Field name="name">
              <Input />
            </Field>
          </Form>
        </div>,
      );

      form.setFields([{ name: 'name', value: '233' }]);

      expect(onFieldsChange).not.toHaveBeenCalled();
    });
  });

  describe('onValuesChange', () => {
    it('trigger `onValuesChange` when value change', async () => {
      const onValuesChange = jest.fn();

      const wrapper = mount(
        <Form onValuesChange={onValuesChange}>
          <Field name={['user', 'name']}>
            <Input />
          </Field>
          <Field name={['user', 'age']}>
            <Input type="number" />
          </Field>
          <Field name="agreement">
            <Input type="checkbox" />
          </Field>
        </Form>,
      );

      await changeValue(getField(wrapper, ['user', 'name']), 'Bamboo');

      expect(onValuesChange.mock.calls[0][0]).toMatchObject({ user: { name: 'Bamboo' } });
      expect(onValuesChange.mock.calls[0][1]).toMatchObject({
        user: {
          name: 'Bamboo',
        },
      });
    });

    // [Legacy] Not trigger in field form. This is anti with origin test
    // https://github.com/react-component/form/blob/master/tests/createForm.spec.js#L184
    it('**Not** trigger `onValuesChange` when `setFieldsValue`', () => {
      let form;
      const onValuesChange = jest.fn();

      mount(
        <div>
          <Form
            ref={instance => {
              form = instance;
            }}
            onValuesChange={onValuesChange}
          >
            <Field name={['user', 'name']}>
              <Input />
            </Field>
            <Field name={['user', 'age']}>
              <Input type="number" />
            </Field>
            <Field name="agreement">
              <Input type="checkbox" />
            </Field>
          </Form>
        </div>,
      );

      form.setFieldsValue({ user: { name: 'Light' } });
      expect(onValuesChange).not.toHaveBeenCalled();
    });
  });
});

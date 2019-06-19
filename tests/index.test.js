import React from 'react';
import { mount } from 'enzyme';
import Form, { Field } from '../src';
import InfoField, { Input } from './common/InfoField';
import { changeValue, getField, matchError } from './common';
import timeout from './common/timeout';

describe('Basic', () => {
  describe('create form', () => {
    function renderContent() {
      return (
        <div>
          <Field name="light">
            <Input />
          </Field>
          <Field name="bamboo">{() => null}</Field>
          <InfoField />
        </div>
      );
    }

    it('sub component', () => {
      const wrapper = mount(<Form>{renderContent()}</Form>);
      expect(wrapper.find('form')).toBeTruthy();
      expect(wrapper.find('input').length).toBe(2);
    });

    describe('render props', () => {
      it('normal', () => {
        const wrapper = mount(<Form>{renderContent}</Form>);
        expect(wrapper.find('form')).toBeTruthy();
        expect(wrapper.find('input').length).toBe(2);
      });

      it('empty', () => {
        const wrapper = mount(<Form>{() => null}</Form>);
        expect(wrapper.find('form')).toBeTruthy();
      });
    });
  });

  describe('reset form', () => {
    function resetTest(name, ...args) {
      it(name, async () => {
        let form;

        const wrapper = mount(
          <div>
            <Form
              ref={instance => {
                form = instance;
              }}
            >
              <Field name="username" rules={[{ required: true }]}>
                <Input />
              </Field>
            </Form>
          </div>,
        );

        await changeValue(getField(wrapper, 'username'), 'Bamboo');
        expect(form.getFieldValue('username')).toEqual('Bamboo');
        expect(form.getFieldError('username')).toEqual([]);
        expect(form.isFieldTouched('username')).toBeTruthy();

        form.resetFields(...args);
        expect(form.getFieldValue('username')).toEqual(undefined);
        expect(form.getFieldError('username')).toEqual([]);
        expect(form.isFieldTouched('username')).toBeFalsy();

        await changeValue(getField(wrapper, 'username'), '');
        expect(form.getFieldValue('username')).toEqual('');
        expect(form.getFieldError('username')).toEqual(["'username' is required"]);
        expect(form.isFieldTouched('username')).toBeTruthy();

        form.resetFields(...args);
        expect(form.getFieldValue('username')).toEqual(undefined);
        expect(form.getFieldError('username')).toEqual([]);
        expect(form.isFieldTouched('username')).toBeFalsy();
      });
    }

    resetTest('with field name', ['username']);
    resetTest('without field name');
  });

  describe('initialValues', () => {
    it('works', () => {
      let form;

      const wrapper = mount(
        <div>
          <Form
            ref={instance => {
              form = instance;
            }}
            initialValues={{ username: 'Light', path1: { path2: 'Bamboo' } }}
          >
            <Field name="username">
              <Input />
            </Field>
            <Field name={['path1', 'path2']}>
              <Input />
            </Field>
          </Form>
        </div>,
      );

      expect(form.getFieldsValue()).toEqual({
        username: 'Light',
        path1: {
          path2: 'Bamboo',
        },
      });
      expect(
        getField(wrapper, 'username')
          .find('input')
          .props().value,
      ).toEqual('Light');
      expect(
        getField(wrapper, ['path1', 'path2'])
          .find('input')
          .props().value,
      ).toEqual('Bamboo');
    });

    it('update and reset should use new initialValues', () => {
      let form;

      const Test = ({ initialValues }) => (
        <Form
          ref={instance => {
            form = instance;
          }}
          initialValues={initialValues}
        >
          <Field name="username">
            <Input />
          </Field>
        </Form>
      );

      const wrapper = mount(<Test initialValues={{ username: 'Bamboo' }} />);
      expect(form.getFieldsValue()).toEqual({
        username: 'Bamboo',
      });
      expect(
        getField(wrapper, 'username')
          .find('input')
          .props().value,
      ).toEqual('Bamboo');

      // Should not change it
      wrapper.setProps({ initialValues: { username: 'Light' } });
      wrapper.update();
      expect(form.getFieldsValue()).toEqual({
        username: 'Bamboo',
      });
      expect(
        getField(wrapper, 'username')
          .find('input')
          .props().value,
      ).toEqual('Bamboo');

      // Should change it
      form.resetFields();
      wrapper.update();
      expect(form.getFieldsValue()).toEqual({
        username: 'Light',
      });
      expect(
        getField(wrapper, 'username')
          .find('input')
          .props().value,
      ).toEqual('Light');
    });
  });

  it('should throw if no Form in use', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mount(
      <Field>
        <Input />
      </Field>,
    );

    expect(errorSpy).toHaveBeenCalledWith(
      'Warning: Can not find FormContext. Please make sure you wrap Field under Form.',
    );

    errorSpy.mockRestore();
  });

  it('keep origin input function', async () => {
    const onChange = jest.fn();
    const onValuesChange = jest.fn();
    const wrapper = mount(
      <Form onValuesChange={onValuesChange}>
        <Field name="username">
          <Input onChange={onChange} />
        </Field>
      </Form>,
    );

    await changeValue(getField(wrapper), 'Bamboo');
    expect(onValuesChange).toHaveBeenCalledWith({ username: 'Bamboo' }, { username: 'Bamboo' });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ target: { value: 'Bamboo' } }));
  });

  it('submit', async () => {
    const onFinish = jest.fn();

    const wrapper = mount(
      <Form onFinish={onFinish}>
        <InfoField name="user" rules={[{ required: true }]}>
          <Input />
        </InfoField>
        <button type="submit">submit</button>
      </Form>,
    );

    // Not trigger
    wrapper.find('button').simulate('submit');
    await timeout();
    wrapper.update();
    matchError(wrapper, "'user' is required");
    expect(onFinish).not.toHaveBeenCalled();

    // Trigger
    await changeValue(getField(wrapper), 'Bamboo');
    wrapper.find('button').simulate('submit');
    await timeout();
    matchError(wrapper, false);
    expect(onFinish).toHaveBeenCalledWith({ user: 'Bamboo' });
  });
});

import React from 'react';
import { mount } from 'enzyme';
import Form, { Field } from '../../src';
import { Input } from '../common/InfoField';
import { changeValue, getField } from '../common';
import timeout from '../common/timeout';

describe('legacy.dynamic-binding', () => {
  const getInput = (wrapper, id) => wrapper.find(id).last();

  it('normal input', async () => {
    let form;

    const Test = ({ mode }) => (
      <Form
        ref={instance => {
          form = instance;
        }}
      >
        <span>text content</span>
        {mode ? (
          <Field name="name">
            <Input id="text" />
          </Field>
        ) : null}
        <span>text content</span>
        <span>text content</span>
        <span>text content</span>
        {mode ? null : (
          <Field name="name">
            <Input id="number" type="number" />
          </Field>
        )}
        <span>text content</span>
      </Form>
    );

    const wrapper = mount(<Test mode />);

    getInput(wrapper, '#text').simulate('change', { target: { value: '123' } });
    wrapper.setProps({ mode: false });
    expect(getInput(wrapper, '#number').getDOMNode().value).toBe('123');
    expect(form.getFieldValue('name')).toBe('123');
    getInput(wrapper, '#number').simulate('change', { target: { value: '456' } });
    wrapper.setProps({ mode: true });
    expect(getInput(wrapper, '#text').getDOMNode().value).toBe('456');
    expect(form.getFieldValue('name')).toBe('456');

    const values = await form.validateFields();
    expect(values.name).toBe('456');
  });

  // [Legacy] We do not remove value in Field Form
  it('hidden input', async () => {
    let form;

    const Test = ({ mode }) => (
      <Form
        ref={instance => {
          form = instance;
        }}
      >
        <span>text content</span>
        {mode ? (
          <Field name="input1">
            <Input id="text1" />
          </Field>
        ) : null}
        <span>text content</span>
        <span>text content</span>
        <span>text content</span>
        {mode ? (
          <Field name="input2">
            <Input id="text2" />
          </Field>
        ) : null}
        <span>text content</span>
      </Form>
    );

    const wrapper = mount(<Test mode />);
    getInput(wrapper, '#text1').simulate('change', { target: { value: '123' } });
    getInput(wrapper, '#text2').simulate('change', { target: { value: '456' } });
    expect(getInput(wrapper, '#text1').getDOMNode().value).toBe('123');
    expect(getInput(wrapper, '#text2').getDOMNode().value).toBe('456');
    expect(form.getFieldValue('input1')).toBe('123');
    expect(form.getFieldValue('input2')).toBe('456');

    // Different with `rc-form`
    wrapper.setProps({ mode: false });
    expect(form.getFieldValue('input1')).toBeTruthy();
    expect(form.getFieldValue('input2')).toBeTruthy();

    wrapper.setProps({ mode: true });
    expect(getInput(wrapper, '#text1').getDOMNode().value).toBe('123');
    expect(getInput(wrapper, '#text2').getDOMNode().value).toBe('456');
    expect(form.getFieldValue('input1')).toBe('123');
    expect(form.getFieldValue('input2')).toBe('456');

    getInput(wrapper, '#text1').simulate('change', { target: { value: '789' } });
    expect(getInput(wrapper, '#text1').getDOMNode().value).toBe('789');
    expect(getInput(wrapper, '#text2').getDOMNode().value).toBe('456');
    expect(form.getFieldValue('input1')).toBe('789');
    expect(form.getFieldValue('input2')).toBe('456');

    const values = await form.validateFields();
    expect(values.input1).toBe('789');
    expect(values.input2).toBe('456');
  });

  it('nested fields', async () => {
    let form;

    const Test = ({ mode }) => (
      <Form
        ref={instance => {
          form = instance;
        }}
      >
        {mode ? (
          <Field name={['name', 'xxx']}>
            <Input id="text" />
          </Field>
        ) : null}
        <span>text content</span>
        {mode ? null : (
          <Field name={['name', 'xxx']}>
            <Input id="number" type="number" />
          </Field>
        )}
      </Form>
    );

    const wrapper = mount(<Test mode />);

    getInput(wrapper, '#text').simulate('change', { target: { value: '123' } });
    wrapper.setProps({ mode: false });
    expect(getInput(wrapper, '#number').getDOMNode().value).toBe('123');
    expect(form.getFieldValue(['name', 'xxx'])).toBe('123');

    getInput(wrapper, '#number').simulate('change', { target: { value: '456' } });
    wrapper.setProps({ mode: true });
    expect(getInput(wrapper, '#text').getDOMNode().value).toBe('456');
    expect(form.getFieldValue(['name', 'xxx'])).toBe('456');

    const values = await form.validateFields();
    expect(values.name.xxx).toBe('456');
  });

  it('input with different keys', async () => {
    let form;

    const Test = ({ mode }) => (
      <Form
        ref={instance => {
          form = instance;
        }}
      >
        {mode ? (
          <Field name="name">
            <Input key="text" id="text" />
          </Field>
        ) : null}
        {mode ? null : (
          <Field name="name">
            <Input key="number" id="number" type="number" />
          </Field>
        )}
      </Form>
    );

    const wrapper = mount(<Test mode />);

    getInput(wrapper, '#text').simulate('change', { target: { value: '123' } });
    wrapper.setProps({ mode: false });
    expect(getInput(wrapper, '#number').getDOMNode().value).toBe('123');
    expect(form.getFieldValue('name')).toBe('123');

    getInput(wrapper, '#number').simulate('change', { target: { value: '456' } });
    wrapper.setProps({ mode: true });
    expect(getInput(wrapper, '#text').getDOMNode().value).toBe('456');
    expect(form.getFieldValue('name')).toBe('456');

    const values = await form.validateFields();
    expect(values.name).toBe('456');
  });

  it('submit without removed fields', async () => {
    // [Legacy] Since we don't remove values, this test is no need anymore.
  });

  it('reset fields', async () => {
    let form;

    const Test = ({ mode }) => (
      <Form
        ref={instance => {
          form = instance;
        }}
      >
        <span>text content</span>
        {mode ? (
          <Field name="input1">
            <Input id="text1" />
          </Field>
        ) : null}
        <span>text content</span>
        <span>text content</span>
        <span>text content</span>
        {mode ? (
          <Field name="input2">
            <Input id="text2" />
          </Field>
        ) : null}
        <span>text content</span>
      </Form>
    );

    const wrapper = mount(<Test mode />);

    getInput(wrapper, '#text1').simulate('change', { target: { value: '123' } });
    getInput(wrapper, '#text2').simulate('change', { target: { value: '456' } });
    expect(getInput(wrapper, '#text1').getDOMNode().value).toBe('123');
    expect(getInput(wrapper, '#text2').getDOMNode().value).toBe('456');
    expect(form.getFieldValue('input1')).toBe('123');
    expect(form.getFieldValue('input2')).toBe('456');

    // Different with `rc-form` test
    wrapper.setProps({ mode: false });
    expect(form.getFieldValue('input1')).toBeTruthy();
    expect(form.getFieldValue('input2')).toBeTruthy();

    form.resetFields();
    wrapper.setProps({ mode: true });
    expect(getInput(wrapper, '#text1').getDOMNode().value).toBe('');
    expect(getInput(wrapper, '#text2').getDOMNode().value).toBe('');
    expect(form.getFieldValue('input1')).toBe(undefined);
    expect(form.getFieldValue('input2')).toBe(undefined);

    getInput(wrapper, '#text1').simulate('change', { target: { value: '789' } });
    expect(getInput(wrapper, '#text1').getDOMNode().value).toBe('789');
    expect(getInput(wrapper, '#text2').getDOMNode().value).toBe('');
    expect(form.getFieldValue('input1')).toBe('789');
    expect(form.getFieldValue('input2')).toBe(undefined);

    getInput(wrapper, '#text2').simulate('change', { target: { value: '456' } });
    expect(getInput(wrapper, '#text2').getDOMNode().value).toBe('456');
    expect(form.getFieldValue('input2')).toBe('456');

    const values = await form.validateFields();
    expect(values.input1).toBe('789');
    expect(values.input2).toBe('456');
  });
});

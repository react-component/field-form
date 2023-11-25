import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import type { FormInstance } from '../../src';
import Form, { Field } from '../../src';
import { Input } from '../common/InfoField';

const getInput = (container: HTMLElement, id: string) =>
  container.querySelector<HTMLInputElement>(id);

describe('legacy.dynamic-binding', () => {
  it('normal input', async () => {
    const form = React.createRef<FormInstance>();

    const Test: React.FC<any> = ({ mode }) => (
      <Form ref={form}>
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

    const { container, rerender } = render(<Test mode />);

    fireEvent.change(getInput(container, '#text'), { target: { value: '123' } });

    rerender(<Test mode={false} />);

    expect(getInput(container, '#number')?.value).toBe('123');
    expect(form.current?.getFieldValue('name')).toBe('123');

    fireEvent.change(getInput(container, '#number'), { target: { value: '456' } });

    rerender(<Test mode />);

    expect(getInput(container, '#text')?.value).toBe('456');
    expect(form.current?.getFieldValue('name')).toBe('456');
    const values = await form.current?.validateFields();
    expect(values.name).toBe('456');
  });

  // [Legacy] We do not remove value in Field Form
  it('hidden input', async () => {
    const form = React.createRef<FormInstance>();

    const Test: React.FC<any> = ({ mode }) => (
      <Form ref={form}>
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

    const { container, rerender } = render(<Test mode />);

    fireEvent.change(getInput(container, '#text1'), { target: { value: '123' } });
    fireEvent.change(getInput(container, '#text2'), { target: { value: '456' } });

    expect(getInput(container, '#text1')?.value).toBe('123');
    expect(getInput(container, '#text2')?.value).toBe('456');
    expect(form.current?.getFieldValue('input1')).toBe('123');
    expect(form.current?.getFieldValue('input2')).toBe('456');

    // Different with `rc-form`

    rerender(<Test mode={false} />);
    expect(form.current?.getFieldValue('input1')).toBeTruthy();
    expect(form.current?.getFieldValue('input2')).toBeTruthy();

    rerender(<Test mode />);

    expect(getInput(container, '#text1')?.value).toBe('123');
    expect(getInput(container, '#text2')?.value).toBe('456');
    expect(form.current?.getFieldValue('input1')).toBe('123');
    expect(form.current?.getFieldValue('input2')).toBe('456');

    fireEvent.change(getInput(container, '#text1'), { target: { value: '789' } });

    expect(getInput(container, '#text1')?.value).toBe('789');
    expect(getInput(container, '#text2')?.value).toBe('456');
    expect(form.current?.getFieldValue('input1')).toBe('789');
    expect(form.current?.getFieldValue('input2')).toBe('456');

    const values = await form.current?.validateFields();
    expect(values.input1).toBe('789');
    expect(values.input2).toBe('456');
  });

  it('nested fields', async () => {
    const form = React.createRef<FormInstance>();

    const Test: React.FC<any> = ({ mode }) => (
      <Form ref={form}>
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

    const { container, rerender } = render(<Test mode />);

    fireEvent.change(getInput(container, '#text'), { target: { value: '123' } });

    rerender(<Test mode={false} />);
    expect(getInput(container, '#number')?.value).toBe('123');
    expect(form.current?.getFieldValue(['name', 'xxx'])).toBe('123');

    fireEvent.change(getInput(container, '#number'), { target: { value: '456' } });

    rerender(<Test mode />);

    expect(getInput(container, '#text')?.value).toBe('456');
    expect(form.current?.getFieldValue(['name', 'xxx'])).toBe('456');
    const values = await form.current?.validateFields();
    expect(values.name.xxx).toBe('456');
  });

  it('input with different keys', async () => {
    const form = React.createRef<FormInstance>();

    const Test: React.FC<any> = ({ mode }) => (
      <Form ref={form}>
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

    const { container, rerender } = render(<Test mode />);

    fireEvent.change(getInput(container, '#text'), { target: { value: '123' } });

    rerender(<Test mode={false} />);

    expect(getInput(container, '#number')?.value).toBe('123');
    expect(form.current?.getFieldValue('name')).toBe('123');

    fireEvent.change(getInput(container, '#number'), { target: { value: '456' } });

    rerender(<Test mode />);

    expect(getInput(container, '#text')?.value).toBe('456');
    expect(form.current?.getFieldValue('name')).toBe('456');

    const values = await form.current?.validateFields();
    expect(values.name).toBe('456');
  });

  it('submit without removed fields', async () => {
    // [Legacy] Since we don't remove values, this test is no need anymore.
  });

  it('reset fields', async () => {
    const form = React.createRef<FormInstance>();

    const Test: React.FC<any> = ({ mode }) => (
      <Form ref={form}>
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

    const { container, rerender } = render(<Test mode />);

    fireEvent.change(getInput(container, '#text1'), { target: { value: '123' } });
    fireEvent.change(getInput(container, '#text2'), { target: { value: '456' } });

    expect(getInput(container, '#text1')?.value).toBe('123');
    expect(getInput(container, '#text2')?.value).toBe('456');

    expect(form.current?.getFieldValue('input1')).toBe('123');
    expect(form.current?.getFieldValue('input2')).toBe('456');

    // Different with `rc-form` test

    rerender(<Test mode={false} />);

    expect(form.current?.getFieldValue('input1')).toBeTruthy();
    expect(form.current?.getFieldValue('input2')).toBeTruthy();

    form.current?.resetFields();
    rerender(<Test mode />);
    expect(getInput(container, '#text1')?.value).toBe('');
    expect(getInput(container, '#text2')?.value).toBe('');
    expect(form.current?.getFieldValue('input1')).toBe(undefined);
    expect(form.current?.getFieldValue('input2')).toBe(undefined);

    fireEvent.change(getInput(container, '#text1'), { target: { value: '789' } });

    expect(getInput(container, '#text1')?.value).toBe('789');
    expect(getInput(container, '#text2')?.value).toBe('');
    expect(form.current?.getFieldValue('input1')).toBe('789');
    expect(form.current?.getFieldValue('input2')).toBe(undefined);

    fireEvent.change(getInput(container, '#text2'), { target: { value: '456' } });

    expect(getInput(container, '#text2')?.value).toBe('456');
    expect(form.current?.getFieldValue('input2')).toBe('456');

    const values = await form.current?.validateFields();
    expect(values.input1).toBe('789');
    expect(values.input2).toBe('456');
  });
});

import { render } from '@testing-library/react';
import React from 'react';
import Form, { Field, List } from '../src';
import type { FormInstance } from '../src';
import { Input } from './common/InfoField';

describe('getFieldsName', () => {
  it('returns empty array when no named fields', () => {
    const formRef = React.createRef<FormInstance>();
    render(<Form ref={formRef} />);
    expect(formRef.current!.getFieldsName()).toEqual([]);
  });

  it('returns name paths of registered fields', () => {
    const formRef = React.createRef<FormInstance>();
    render(
      <Form ref={formRef}>
        <Field name="username">
          <Input />
        </Field>
        <Field name={['profile', 'email']}>
          <Input />
        </Field>
      </Form>,
    );
    expect(formRef.current!.getFieldsName()).toEqual([['username'], ['profile', 'email']]);
  });

  it('excludes field without name', () => {
    const formRef = React.createRef<FormInstance>();
    render(
      <Form ref={formRef}>
        <Field name="a">
          <Input />
        </Field>
        <Field>{() => null}</Field>
      </Form>,
    );
    expect(formRef.current!.getFieldsName()).toEqual([['a']]);
  });

  it('includes one entry per Field with the same name', () => {
    const formRef = React.createRef<FormInstance>();
    render(
      <Form ref={formRef}>
        <Field name="x">
          <Input />
        </Field>
        <Field name="x">
          <Input />
        </Field>
      </Form>,
    );
    expect(formRef.current!.getFieldsName()).toEqual([['x'], ['x']]);
  });

  it('updates when field unmounts', () => {
    const formRef = React.createRef<FormInstance>();
    const Demo = ({ show }: { show: boolean }) => (
      <Form ref={formRef}>
        <Field name="keep">
          <Input />
        </Field>
        {show ? (
          <Field name="toggle">
            <Input />
          </Field>
        ) : null}
      </Form>
    );
    const { rerender } = render(<Demo show />);
    expect(formRef.current!.getFieldsName()).toEqual([['keep'], ['toggle']]);
    rerender(<Demo show={false} />);
    expect(formRef.current!.getFieldsName()).toEqual([['keep']]);
  });

  it('includes Form.List item fields', () => {
    const formRef = React.createRef<FormInstance>();
    render(
      <Form ref={formRef} initialValues={{ list: ['a', 'b'] }}>
        <List name="list">
          {fields =>
            fields.map(f => (
              <Field {...f} key={f.key}>
                <Input />
              </Field>
            ))
          }
        </List>
      </Form>,
    );
    expect(formRef.current!.getFieldsName()).toEqual([
      ['list', 0],
      ['list', 1],
      ['list'],
    ]);
  });
});

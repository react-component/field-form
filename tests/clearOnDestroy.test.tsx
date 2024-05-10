import { fireEvent, render } from '@testing-library/react';
import React, { useState } from 'react';
import Form, { Field, type FormInstance } from '../src';
import { changeValue, getInput } from './common';
import { Input } from './common/InfoField';

describe('Form.clearOnDestroy', () => {
  it('works', async () => {
    let formCache: FormInstance | undefined;
    const Demo = ({ load, count }: { load?: boolean; count?: string }) => {
      const [form] = Form.useForm();
      formCache = form;

      return (
        <>
          {load && (
            <Form form={form} initialValues={{ count }} clearOnDestroy>
              <Field name="count">
                <Input />
              </Field>
            </Form>
          )}
        </>
      );
    };
    const { rerender } = render(<Demo load count={'1'} />);
    expect(formCache.getFieldsValue(true)).toEqual({ count: '1' });
    rerender(<Demo count={'1'} />);
    expect(formCache.getFieldsValue(true)).toEqual({});
  });
  it('change value', async () => {
    let formCache: FormInstance | undefined;
    const Demo = () => {
      const [load, setLoad] = useState(true);

      const [form] = Form.useForm();
      formCache = form;

      return (
        <>
          <button onClick={() => setLoad(c => !c)}>load</button>
          {load && (
            <Form form={form} clearOnDestroy>
              <Field name="count">
                <Input />
              </Field>
            </Form>
          )}
        </>
      );
    };
    const { container, queryByText } = render(<Demo />);
    await changeValue(getInput(container), 'bamboo');
    expect(formCache.getFieldsValue(true)).toEqual({ count: 'bamboo' });
    fireEvent.click(queryByText('load'));
    expect(formCache.getFieldsValue(true)).toEqual({});
    formCache.setFields([{ name: 'count', value: '1' }]);
    expect(formCache.getFieldsValue(true)).toEqual({ count: '1' });
  });
});

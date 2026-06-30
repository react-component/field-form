import { fireEvent, render } from '@testing-library/react';
import React, { useState } from 'react';
import Form, { Field, type FormInstance } from '../src';
import { changeValue, getInput } from './common';
import { Input } from './common/InfoField';

describe('Form.clearOnDestroy', () => {
  it('works', async () => {
    let formCache: FormInstance | undefined;
    const Demo = ({ load }: { load?: boolean }) => {
      const [form] = Form.useForm();
      formCache = form;

      return (
        <>
          {load && (
            <Form form={form} initialValues={{ count: '1' }} clearOnDestroy>
              <Field name="count">
                <Input />
              </Field>
            </Form>
          )}
        </>
      );
    };
    const { rerender } = render(<Demo load />);
    expect(formCache.getFieldsValue(true)).toEqual({ count: '1' });
    rerender(<Demo />);
    expect(formCache.getFieldsValue(true)).toEqual({});

    // Rerender back should filled again
    rerender(<Demo load />);
    expect(formCache.getFieldsValue(true)).toEqual({ count: '1' });
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

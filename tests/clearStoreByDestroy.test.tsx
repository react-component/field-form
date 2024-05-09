import { fireEvent, render } from '@testing-library/react';
import React, { useState } from 'react';
import Form, { Field, type FormInstance } from '../src';
import { changeValue, getInput } from './common';
import { Input } from './common/InfoField';

describe('Form.clearStoreByDestroy', () => {
  it('works', async () => {
    let formCache: FormInstance | undefined;
    const Demo = () => {
      const [load, setLoad] = useState(false);
      const [count, setCount] = useState(0);

      const [form] = Form.useForm(undefined);
      formCache = form;

      return (
        <>
          <button
            onClick={() => {
              setCount(c => c + 1);
              setLoad(c => !c);
            }}
          >
            load
          </button>

          {load && (
            <Form form={form} initialValues={{ count }} clearStoreOnDestroy>
              <Field name="count">
                <Input placeholder="count" />
              </Field>
            </Form>
          )}
        </>
      );
    };
    const { container, queryByText } = render(<Demo />);

    fireEvent.click(queryByText('load'));
    expect(formCache.getFieldsValue(true)).toEqual({ count: 1 });
    fireEvent.click(queryByText('load'));
    expect(formCache.getFieldsValue(true)).toEqual({});
    fireEvent.click(queryByText('load'));
    expect(formCache.getFieldsValue(true)).toEqual({ count: 3 });
    await changeValue(getInput(container), 'bamboo');
    expect(formCache.getFieldsValue(true)).toEqual({ count: 'bamboo' });
    fireEvent.click(queryByText('load'));
    expect(formCache.getFieldsValue(true)).toEqual({});
  });
});

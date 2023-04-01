import React from 'react';
import { render, act, waitFor } from './test-utils';
import Form from '../src';
import InfoField, { Input } from './common/InfoField';
import { changeValue } from './common';
import sinon from 'sinon';
import { vi } from 'vitest';

describe('Form.ReactStrict', () => {
  it('should not register twice', async () => {
    const onFieldsChange = vi.fn();

    const { container } = render(
      <React.StrictMode>
        <Form name="testForm" onFieldsChange={onFieldsChange}>
          <InfoField name="input">
            <Input />
          </InfoField>
        </Form>
      </React.StrictMode>,
    );

    await act(async () => {
      const input = container.querySelector('input');
      await changeValue(input, 'bamboo');
    });

    expect(onFieldsChange).toHaveBeenCalledTimes(1);
    expect(onFieldsChange.mock.calls[0][1]).toHaveLength(1);
  });
});

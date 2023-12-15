import { render } from '@testing-library/react';
import React from 'react';
import Form from '../src';
import { changeValue, getInput } from './common';
import InfoField, { Input } from './common/InfoField';

describe('Form.ReactStrict', () => {
  it('should not register twice', async () => {
    const onFieldsChange = jest.fn();

    const { container } = render(
      <React.StrictMode>
        <Form name="testForm" onFieldsChange={onFieldsChange}>
          <InfoField name="input">
            <Input />
          </InfoField>
        </Form>
      </React.StrictMode>,
    );

    await changeValue(getInput(container), 'bamboo');

    expect(onFieldsChange).toHaveBeenCalledTimes(1);
    expect(onFieldsChange.mock.calls[0][1]).toHaveLength(1);
  });
});

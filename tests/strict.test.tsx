import React from 'react';
import { mount } from 'enzyme';
import Form from '../src';
import InfoField, { Input } from './common/InfoField';
import { changeValue } from './common';

describe('Form.ReactStrict', () => {
  it('should not register twice', async () => {
    const onFieldsChange = jest.fn();

    const wrapper = mount(
      <React.StrictMode>
        <Form name="testForm" onFieldsChange={onFieldsChange}>
          <InfoField name="input">
            <Input />
          </InfoField>
        </Form>
      </React.StrictMode>,
    );

    await changeValue(wrapper, 'bamboo');

    expect(onFieldsChange).toHaveBeenCalledTimes(1);
    expect(onFieldsChange.mock.calls[0][1]).toHaveLength(1);
  });
});

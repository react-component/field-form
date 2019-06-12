import React from 'react';
import { mount } from 'enzyme';
import Form, { FormProvider } from '../src';
import InfoField from './common/InfoField';
import { changeValue, matchError } from './common';

describe('context', () => {
  it('validateMessages', async () => {
    const wrapper = mount(
      <FormProvider validateMessages={{ required: "I'm global" }}>
        <Form>
          <InfoField name="username" rules={[{ required: true }]} />
        </Form>
      </FormProvider>,
    );

    await changeValue(wrapper, '');
    matchError(wrapper, "I'm global");
  });
});

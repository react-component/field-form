/* eslint-disable no-template-curly-in-string */
import React from 'react';
import { mount } from 'enzyme';
import Form from '../src';
import InfoField, { Input } from './common/InfoField';
import { changeValue, matchError } from './common';

describe('Form.WarningValidate', () => {
  it('required', async () => {
    const wrapper = mount(
      <Form>
        <InfoField
          name="name"
          rules={[
            {
              required: true,
              warningOnly: true,
            },
          ]}
        >
          <Input />
        </InfoField>
      </Form>,
    );

    await changeValue(wrapper, '');
    matchError(wrapper, false, "'name' is required");
  });

  describe('validateFirst should not block error', () => {
    function testValidateFirst(name: string, validateFirst: boolean | 'parallel') {
      it(name, async () => {
        const wrapper = mount(
          <Form>
            <InfoField
              name="name"
              validateFirst={validateFirst}
              rules={[
                {
                  type: 'string',
                  len: 10,
                  warningOnly: true,
                },
                {
                  type: 'url',
                },
              ]}
            >
              <Input />
            </InfoField>
          </Form>,
        );

        await changeValue(wrapper, 'bamboo');
        matchError(wrapper, "'name' is not a valid url", false);
      });
    }

    testValidateFirst('default', true);
    testValidateFirst('parallel', 'parallel');
  });
});
/* eslint-enable no-template-curly-in-string */

/* eslint-disable no-template-curly-in-string */
import React from 'react';
import { mount } from 'enzyme';
import Form from '../src';
import InfoField, { Input } from './common/InfoField';
import { changeValue, matchError } from './common';
import type { FormInstance, Rule } from '../src/interface';

describe('Form.WarningValidate', () => {
  it('required', async () => {
    let form: FormInstance<any>;

    const wrapper = mount(
      <Form
        ref={f => {
          form = f;
        }}
      >
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
    expect(form.getFieldWarning('name')).toEqual(["'name' is required"]);
  });

  describe('validateFirst should not block error', () => {
    function testValidateFirst(
      name: string,
      validateFirst: boolean | 'parallel',
      additionalRule?: Rule,
      errorMessage?: string,
    ) {
      it(name, async () => {
        const rules = [
          additionalRule,
          {
            type: 'string',
            len: 10,
            warningOnly: true,
          },
          {
            type: 'url',
          },
          {
            type: 'string',
            len: 20,
            warningOnly: true,
          },
        ];

        const wrapper = mount(
          <Form>
            <InfoField
              name="name"
              validateFirst={validateFirst}
              rules={rules.filter(r => r) as any}
            >
              <Input />
            </InfoField>
          </Form>,
        );

        await changeValue(wrapper, 'bamboo');
        matchError(wrapper, errorMessage || "'name' is not a valid url", false);
      });
    }

    testValidateFirst('default', true);
    testValidateFirst(
      'default',
      true,
      {
        type: 'string',
        len: 3,
      },
      "'name' must be exactly 3 characters",
    );
    testValidateFirst('parallel', 'parallel');
  });
});
/* eslint-enable no-template-curly-in-string */

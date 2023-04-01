import React from 'react';
import { render, act } from './test-utils';
import Form from '../src';
import InfoField, { Input } from './common/InfoField';
import { changeValue, getField, matchError } from './common';
import type { FormInstance, Rule } from '../src/interface';
import { vi } from 'vitest';

describe('Form.WarningValidate', () => {
  it('required', async () => {
    const form = React.createRef<FormInstance>();

    const { container } = render(
      <Form ref={form}>
        <InfoField name="name" rules={[{ required: true, warningOnly: true }]}>
          <Input />
        </InfoField>
      </Form>,
    );
    await act(async () => {
      const firtField = getField(container);
      await changeValue(firtField, '');
    });
    await act(async () => {
      // await form.current.validateFields();
      matchError(container, false, "'name' is required");
      expect(form.current?.getFieldWarning('name')).toEqual(["'name' is required"]);
    });
  });

  describe('validateFirst should not block error', () => {
    const testValidateFirst = (
      name: string,
      validateFirst: boolean | 'parallel',
      additionalRule?: Rule,
      errorMessage?: string,
    ) => {
      it(name, async () => {
        const rules: Rule[] = [
          additionalRule,
          { type: 'string', len: 10, warningOnly: true },
          { type: 'url' },
          { type: 'string', len: 20, warningOnly: true },
        ];
        const { container } = render(
          <Form>
            <InfoField name="name" validateFirst={validateFirst} rules={rules.filter(Boolean)}>
              <Input />
            </InfoField>
          </Form>,
        );

        await act(async () => {
          const firtField = getField(container);
          await changeValue(firtField, 'bamboo');
        });

        matchError(container, errorMessage || "'name' is not a valid url", false);
      });
    };
    testValidateFirst('default', true);
    testValidateFirst(
      'default',
      true,
      { type: 'string', len: 3 },
      "'name' must be exactly 3 characters",
    );
    testValidateFirst('parallel', 'parallel');
  });
});

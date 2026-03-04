import React from 'react';
import { render } from '@testing-library/react';
import type { FormInstance } from '../src';
import Form, { FormProvider } from '../src';
import InfoField from './common/InfoField';
import { changeValue, matchError, getInput } from './common';
import timeout from './common/timeout';

describe('Form.Context', () => {
  it('validateMessages', async () => {
    const { container } = render(
      <FormProvider validateMessages={{ required: "I'm global" }}>
        <Form>
          <InfoField name="username" rules={[{ required: true }]} />
        </Form>
      </FormProvider>,
    );

    await changeValue(getInput(container), ['bamboo', '']);
    matchError(container, "I'm global");
  });

  it('change event', async () => {
    const onFormChange = jest.fn();

    const { container } = render(
      <FormProvider onFormChange={onFormChange}>
        <Form name="form1">
          <InfoField name="username" rules={[{ required: true }]} />
        </Form>
      </FormProvider>,
    );

    await changeValue(getInput(container), 'Light');
    expect(onFormChange).toHaveBeenCalledWith(
      'form1',
      expect.objectContaining({
        changedFields: [
          {
            errors: [],
            warnings: [],
            name: ['username'],
            touched: true,
            validating: false,
            value: 'Light',
            validated: false,
          },
        ],
        forms: {
          form1: expect.objectContaining({}),
        },
      }),
    );
    expect(onFormChange).toHaveBeenCalledWith(
      'form1',
      expect.objectContaining({
        changedFields: [
          {
            errors: [],
            warnings: [],
            name: ['username'],
            touched: true,
            validating: false,
            value: 'Light',
            validated: true,
          },
        ],
        forms: {
          form1: expect.objectContaining({}),
        },
      }),
    );
  });

  describe('adjust sub form', () => {
    it('basic', async () => {
      const onFormChange = jest.fn();

      const { container, rerender } = render(
        <FormProvider onFormChange={onFormChange}>
          <Form name="form1" />
        </FormProvider>,
      );

      rerender(
        <FormProvider onFormChange={onFormChange}>
          <Form name="form2">
            <InfoField name="test" />
          </Form>
        </FormProvider>,
      );

      await changeValue(getInput(container), 'Bamboo');
      const { forms } = onFormChange.mock.calls[0][1];
      expect(Object.keys(forms)).toEqual(['form2']);
    });

    it('multiple context', async () => {
      const onFormChange = jest.fn();

      const Demo: React.FC<{ changed?: boolean }> = ({ changed }) => (
        <FormProvider onFormChange={onFormChange}>
          <FormProvider>
            {!changed ? (
              <Form name="form1" />
            ) : (
              <Form name="form2">
                <InfoField name="test" />
              </Form>
            )}
          </FormProvider>
        </FormProvider>
      );

      const { container, rerender } = render(<Demo />);

      rerender(<Demo changed />);

      await changeValue(getInput(container), 'Bamboo');
      const { forms } = onFormChange.mock.calls[0][1];
      expect(Object.keys(forms)).toEqual(['form2']);
    });
  });

  it('submit', async () => {
    const onFormFinish = jest.fn();
    const form = React.createRef<FormInstance>();

    const { container } = render(
      <div>
        <FormProvider onFormFinish={onFormFinish}>
          <Form name="form1" ref={form}>
            <InfoField name="name" rules={[{ required: true }]} />
          </Form>
          <Form name="form2" />
        </FormProvider>
      </div>,
    );

    await changeValue(getInput(container), ['bamboo', '']);
    form.current?.submit();
    await timeout();
    expect(onFormFinish).not.toHaveBeenCalled();

    await changeValue(getInput(container), 'Light');
    form.current?.submit();
    await timeout();
    expect(onFormFinish).toHaveBeenCalled();

    expect(onFormFinish.mock.calls[0][0]).toEqual('form1');
    const info = onFormFinish.mock.calls[0][1];
    expect(info.values).toEqual({ name: 'Light' });
    expect(Object.keys(info.forms).sort()).toEqual(['form1', 'form2'].sort());
  });

  it('do nothing if no Provider in use', () => {
    const { rerender } = render(
      <div>
        <Form name="no" />
      </div>,
    );
    rerender(<div>{null}</div>);
  });
});

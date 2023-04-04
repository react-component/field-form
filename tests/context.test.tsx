import timeout from './common/timeout';
import Form, { FormInstance, FormProvider } from '../src';
import useForm from '../src/useForm';
import InfoField from './common/InfoField';
import { changeValue, matchError, getField } from './common';
import { render, act, waitFor, renderHook, fireEvent } from './test-utils';
import React from 'react';
import { vi } from 'vitest';

describe('Form.Context', () => {
  it('validateMessages', async () => {
    const { container } = render(
      <FormProvider validateMessages={{ required: "I'm global" }}>
        <Form initialValues={{ username: 'abc' }}>
          <InfoField name="username" rules={[{ required: true }]} />
        </Form>
      </FormProvider>,
    );

    await act(async () => {
      const input = container.querySelector('input');
      await changeValue(input, '');
    });

    waitFor(() => {
      matchError(container, "I'm global");
    });
  });

  it('change event', async () => {
    const onFormChange = vi.fn();

    const { result } = renderHook(() => {
      const [form] = useForm();
      return { form };
    });

    const { container } = render(
      <FormProvider onFormChange={onFormChange}>
        <Form form={result.current.form} name="form1">
          <InfoField name="username" rules={[{ required: true }]} />
        </Form>
      </FormProvider>,
    );

    const firtField = getField(container);
    expect(firtField).toBeTruthy();
    await changeValue(firtField, 'Light');

    expect(onFormChange.mock.calls[0][1].changedFields).toEqual([
      {
        touched: true,
        validating: false,
        errors: [],
        warnings: [],
        name: ['username'],
        validated: false,
        value: 'Light',
      },
    ]);
    expect(onFormChange.mock.calls[1][1].changedFields).toEqual([
      {
        touched: true,
        validating: true,
        errors: [],
        warnings: [],
        name: ['username'],
        validated: false,
        value: 'Light',
      },
    ]);
  });

  describe('adjust sub form', () => {
    it('basic', async () => {
      const onFormChange = vi.fn();

      const ComponentChild = () => (
        <Form name="form2">
          <InfoField name="test" />
        </Form>
      );

      const ComponentParent = () => {
        const [showChild, setShowChild] = React.useState(false);

        return (
          <FormProvider onFormChange={onFormChange}>
            <Form name="form1" />
            {showChild && <ComponentChild />}
            <button onClick={() => setShowChild(!showChild)}>Toggle Child</button>
          </FormProvider>
        );
      };

      const { container } = render(<ComponentParent />);

      // Check if the child component is not present initially
      const child = container.querySelector('form2');
      expect(child).toBeNull();

      // Click the button to insert the child component
      await act(async () => {
        const toggleButton = container.querySelector('button');
        fireEvent.click(toggleButton);
      });

      waitFor(() => {
        // Check if the child component is now present
        const insertedChild = container.querySelector('form2');
        expect(insertedChild).toBeTruthy();
      });

      await act(async () => {
        await changeValue(getField(container), 'Bamboo');
      });

      expect(onFormChange).toBeCalledTimes(1);
      expect(onFormChange.mock.calls[0][1].changedFields).toHaveLength(1);
      expect(Object.keys(onFormChange.mock.calls[0][1].forms)).toEqual(['form1', 'form2']);
    });

    it('multiple context', async () => {
      const onFormChange = vi.fn();

      const Demo = () => {
        const [showChild, setShowChild] = React.useState(false);

        return (
          <FormProvider onFormChange={onFormChange}>
            <FormProvider>
              {!showChild ? (
                <Form name="form1" />
              ) : (
                <Form name="form2">
                  <InfoField name="test" />
                </Form>
              )}
              <button onClick={() => setShowChild(!showChild)}>Toggle Child</button>
            </FormProvider>
          </FormProvider>
        );
      };
      const { container } = render(<Demo />);

      await act(async () => {
        const toggleButton = container.querySelector('button');
        fireEvent.click(toggleButton);
      });

      await act(async () => {
        await changeValue(getField(container), 'Bamboo');
      });

      const { forms } = onFormChange.mock.calls[0][1];
      expect(Object.keys(forms)).toEqual(['form2']);
    });
  });

  it('submit', async () => {
    const onFormFinish = vi.fn();
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

    await act(async () => {
      await changeValue(getField(container), 'Bamboo');
      form.current?.submit();
    });

    expect(onFormFinish).toBeCalledTimes(1);

    await act(async () => {
      await changeValue(getField(container), 'Light');
      form.current?.submit();
    });

    expect(onFormFinish).toBeCalledTimes(2);

    expect(onFormFinish.mock.calls[0][0]).toEqual('form1');
    const info = onFormFinish.mock.calls[1][1];
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

import { act, fireEvent, render } from '@testing-library/react';
import React, { useState, useLayoutEffect } from 'react';
import Form, { Field, type FormInstance } from '../src';
import { changeValue, getInput } from './common';
import { Input } from './common/InfoField';

describe('Form.clearOnDestroy', () => {
  it('works', async () => {
    let formCache: FormInstance | undefined;
    const Demo = ({ load }: { load?: boolean }) => {
      const [form] = Form.useForm();
      formCache = form;

      return (
        <>
          {load && (
            <Form form={form} initialValues={{ count: '1' }} clearOnDestroy>
              <Field name="count">
                <Input />
              </Field>
            </Form>
          )}
        </>
      );
    };
    const { rerender } = render(<Demo load />);
    expect(formCache.getFieldsValue(true)).toEqual({ count: '1' });
    rerender(<Demo />);
    expect(formCache.getFieldsValue(true)).toEqual({});

    // Rerender back should filled again
    rerender(<Demo load />);
    expect(formCache.getFieldsValue(true)).toEqual({ count: '1' });
  });

  it('change value', async () => {
    let formCache: FormInstance | undefined;
    const Demo = () => {
      const [load, setLoad] = useState(true);

      const [form] = Form.useForm();
      formCache = form;

      return (
        <>
          <button onClick={() => setLoad(c => !c)}>load</button>
          {load && (
            <Form form={form} clearOnDestroy>
              <Field name="count">
                <Input />
              </Field>
            </Form>
          )}
        </>
      );
    };
    const { container, queryByText } = render(<Demo />);
    await changeValue(getInput(container), 'bamboo');
    expect(formCache.getFieldsValue(true)).toEqual({ count: 'bamboo' });
    fireEvent.click(queryByText('load'));
    expect(formCache.getFieldsValue(true)).toEqual({});
    formCache.setFields([{ name: 'count', value: '1' }]);
    expect(formCache.getFieldsValue(true)).toEqual({ count: '1' });
  });
});

describe('clearOnDestroy initialization across mount replay', () => {
  it('does not rerender unchanged named fields or report initialization changes on ordinary mount', () => {
    let formCache: FormInstance;
    const onRender = jest.fn();
    const onValuesChange = jest.fn();
    const onFieldsChange = jest.fn();
    const TrackedInput = (props: React.ComponentProps<typeof Input>) => {
      onRender();
      return <Input {...props} />;
    };
    const Demo = () => {
      const [form] = Form.useForm();
      formCache = form;
      return (
        <Form
          form={form}
          initialValues={{ count: '1' }}
          clearOnDestroy
          onValuesChange={onValuesChange}
          onFieldsChange={onFieldsChange}
        >
          <Field name="count">
            <TrackedInput />
          </Field>
        </Form>
      );
    };
    const { container } = render(<Demo />);
    expect(onRender).toHaveBeenCalledTimes(1);
    expect(container.querySelector('input').value).toBe('1');
    expect(formCache.isFieldsTouched()).toBe(false);
    expect(onValuesChange).not.toHaveBeenCalled();
    expect(onFieldsChange).not.toHaveBeenCalled();
  });

  const Activity = (
    React as {
      Activity?: React.ComponentType<{
        mode: 'hidden' | 'visible';
        children: React.ReactNode;
      }>;
    }
  ).Activity;

  (Activity ? it.each : it.skip.each)(['initialValue', 'metadata'])(
    'restores saved values after %s updates while Activity is hidden',
    update => {
      let formCache: FormInstance;
      const Demo = ({ mode, fresh = false }: { mode: 'hidden' | 'visible'; fresh?: boolean }) => {
        const [form] = Form.useForm();
        formCache = form;
        return (
          <Activity mode={mode}>
            <Form form={form} initialValues={{ count: '1' }} clearOnDestroy>
              <Field name="count">
                <Input />
              </Field>
              {fresh && (
                <Field name="fresh" initialValue="fresh-default">
                  <Input />
                </Field>
              )}
            </Form>
          </Activity>
        );
      };
      const { container, rerender, unmount } = render(<Demo mode="visible" />);
      act(() => formCache.setFieldsValue({ preloaded: 'saved-preloaded' }));
      fireEvent.change(container.querySelector('input'), { target: { value: 'edited' } });
      rerender(<Demo mode="hidden" />);
      expect(formCache.getFieldsValue(true)).toEqual({});
      const fresh = update === 'initialValue';
      if (fresh) {
        rerender(<Demo mode="hidden" fresh />);
        expect(formCache.getFieldsValue(true)).toEqual({ fresh: 'fresh-default' });
      } else {
        act(() => formCache.setFields([{ name: 'count', touched: false }]));
        expect(formCache.getFieldsValue(true)).toEqual({});
      }
      rerender(<Demo mode="visible" fresh={fresh} />);
      expect(formCache.getFieldsValue(true)).toEqual({
        count: 'edited',
        preloaded: 'saved-preloaded',
        ...(fresh ? { fresh: 'fresh-default' } : {}),
      });
      expect(container.querySelector('input').value).toBe('edited');
      unmount();
      expect(formCache.getFieldsValue(true)).toEqual({});
    },
  );

  (Activity ? it.each : it.skip.each)([
    'setFieldsValue',
    'setFieldValue',
    'setFields',
    'resetFields',
  ])('keeps explicit %s changes made while Activity is hidden', operation => {
    let formCache: FormInstance;
    const Demo = ({ mode }: { mode: 'hidden' | 'visible' }) => {
      const [form] = Form.useForm();
      formCache = form;
      return (
        <Activity mode={mode}>
          <Form form={form} initialValues={{ count: '1' }} clearOnDestroy>
            <Field name="count">
              <Input />
            </Field>
          </Form>
        </Activity>
      );
    };
    const { container, rerender, unmount } = render(<Demo mode="visible" />);
    fireEvent.change(container.querySelector('input'), { target: { value: 'edited' } });
    rerender(<Demo mode="hidden" />);
    expect(formCache.getFieldsValue(true)).toEqual({});
    const expected =
      operation === 'resetFields'
        ? { count: '1' }
        : operation === 'setFieldsValue'
          ? { count: 'external', extra: 'new' }
          : { count: 'external' };
    act(() => {
      if (operation === 'setFieldsValue') {
        formCache.setFieldsValue(expected);
      } else if (operation === 'setFieldValue') {
        formCache.setFieldValue('count', 'external');
      } else if (operation === 'setFields') {
        formCache.setFields([{ name: 'count', value: 'external' }]);
      } else {
        formCache.resetFields();
      }
    });
    expect(formCache.getFieldsValue(true)).toEqual(expected);
    rerender(<Demo mode="visible" />);
    expect(formCache.getFieldsValue(true)).toEqual(expected);
    expect(container.querySelector('input').value).toBe(expected.count);
    unmount();
    expect(formCache.getFieldsValue(true)).toEqual({});
  });

  (Activity ? it : it.skip)(
    'uses clearOnDestroy at first visible mount after initially hidden rendering',
    () => {
      let formCache: FormInstance;
      const reads: unknown[] = [];
      const Probe = ({ form }: { form: FormInstance }) => {
        useLayoutEffect(() => {
          reads.push(form.getFieldValue('count'));
        }, []);
        return null;
      };
      const Demo = ({
        mode,
        clearOnDestroy,
      }: {
        mode: 'hidden' | 'visible';
        clearOnDestroy: boolean;
      }) => {
        const [form] = Form.useForm();
        formCache = form;
        return (
          <Activity mode={mode}>
            <Form form={form} initialValues={{ count: '1' }} clearOnDestroy={clearOnDestroy}>
              <Probe form={form} />
            </Form>
          </Activity>
        );
      };
      const { rerender, unmount } = render(
        <React.StrictMode>
          <Demo mode="hidden" clearOnDestroy={false} />
        </React.StrictMode>,
      );
      expect(formCache.getFieldsValue(true)).toEqual({ count: '1' });
      expect(reads).toEqual([]);
      rerender(
        <React.StrictMode>
          <Demo mode="hidden" clearOnDestroy />
        </React.StrictMode>,
      );
      rerender(
        <React.StrictMode>
          <Demo mode="visible" clearOnDestroy />
        </React.StrictMode>,
      );
      expect(reads).toEqual(['1', '1']);
      expect(formCache.getFieldsValue(true)).toEqual({ count: '1' });
      rerender(
        <React.StrictMode>
          <Demo mode="hidden" clearOnDestroy />
        </React.StrictMode>,
      );
      expect(formCache.getFieldsValue(true)).toEqual({});
      rerender(
        <React.StrictMode>
          <Demo mode="visible" clearOnDestroy />
        </React.StrictMode>,
      );
      expect(reads).toEqual(['1', '1', '1', '1']);
      expect(formCache.getFieldsValue(true)).toEqual({ count: '1' });
      unmount();
      expect(formCache.getFieldsValue(true)).toEqual({});
    },
  );

  it.each(['array', 'fragment'])(
    'keeps edited fields mounted when single children change to %s',
    shape => {
      const onMount = jest.fn();
      const onUnmount = jest.fn();
      let formCache: FormInstance;
      const TrackedInput = (props: React.ComponentProps<typeof Input>) => {
        React.useEffect(() => {
          onMount();
          return onUnmount;
        }, []);
        return <Input {...props} />;
      };
      const Demo = ({ multiple }: { multiple?: boolean }) => {
        const [form] = Form.useForm();
        formCache = form;
        const field = (
          <Field key="count" name="count" preserve={false}>
            <TrackedInput />
          </Field>
        );
        const children = multiple ? shape === 'array' ? [field] : <>{field}</> : field;
        return (
          <Form form={form} initialValues={{ count: '1' }} clearOnDestroy>
            {children}
          </Form>
        );
      };
      const { container, rerender, unmount } = render(<Demo />);
      fireEvent.change(container.querySelector('input'), { target: { value: 'edited' } });
      rerender(<Demo multiple />);
      expect(onMount).toHaveBeenCalledTimes(1);
      expect(onUnmount).not.toHaveBeenCalled();
      expect(container.querySelector('input').value).toBe('edited');
      expect(formCache.getFieldsValue(true)).toEqual({ count: 'edited' });
      rerender(<Demo />);
      expect(onMount).toHaveBeenCalledTimes(1);
      expect(onUnmount).not.toHaveBeenCalled();
      expect(container.querySelector('input').value).toBe('edited');
      expect(formCache.getFieldsValue(true)).toEqual({ count: 'edited' });
      unmount();
      expect(onUnmount).toHaveBeenCalledTimes(1);
      expect(formCache.getFieldsValue(true)).toEqual({});
    },
  );

  it('keeps preloaded store values across replay and discards them after each real unmount', () => {
    let formCache: FormInstance;
    const onValuesChange = jest.fn();
    const Demo = ({ load }: { load?: boolean }) => {
      const [form] = Form.useForm();
      formCache = form;
      return load ? (
        <Form
          form={form}
          initialValues={{ count: '1' }}
          clearOnDestroy
          onValuesChange={onValuesChange}
        >
          <Field name="count">
            <Input />
          </Field>
        </Form>
      ) : null;
    };
    const { container, rerender } = render(
      <React.StrictMode>
        <Demo />
      </React.StrictMode>,
    );
    act(() => formCache.setFieldsValue({ count: 'preloaded', other: { value: 'seeded' } }));
    rerender(
      <React.StrictMode>
        <Demo load />
      </React.StrictMode>,
    );
    expect(container.querySelector('input').value).toBe('preloaded');
    expect(formCache.getFieldsValue(true)).toEqual({
      count: 'preloaded',
      other: { value: 'seeded' },
    });
    expect(formCache.isFieldsTouched()).toBe(false);
    expect(onValuesChange).not.toHaveBeenCalled();
    for (let i = 0; i < 3; i += 1) {
      fireEvent.change(container.querySelector('input'), { target: { value: `changed-${i}` } });
      expect(onValuesChange).toHaveBeenCalledTimes(i + 1);
      expect(formCache.getFieldValue('count')).toBe(`changed-${i}`);
      rerender(
        <React.StrictMode>
          <Demo />
        </React.StrictMode>,
      );
      expect(formCache.getFieldsValue(true)).toEqual({});
      rerender(
        <React.StrictMode>
          <Demo load />
        </React.StrictMode>,
      );
      expect(container.querySelector('input').value).toBe('1');
      expect(formCache.getFieldsValue(true)).toEqual({ count: '1' });
      expect(formCache.isFieldsTouched()).toBe(false);
    }
  });

  it('keeps displayed initialValues after a parent rerender in StrictMode', () => {
    const Demo = () => (
      <Form initialValues={{ count: '1' }} clearOnDestroy>
        <Field name="count">
          <Input />
        </Field>
      </Form>
    );
    const { container, rerender } = render(
      <React.StrictMode>
        <Demo />
      </React.StrictMode>,
    );
    expect(container.querySelector('input').value).toBe('1');
    rerender(
      <React.StrictMode>
        <Demo />
      </React.StrictMode>,
    );
    expect(container.querySelector('input').value).toBe('1');
  });

  it.each([false, true])('initializes a delayed field with StrictMode=%s', strict => {
    const Wrapper = strict ? React.StrictMode : React.Fragment;
    const Demo = ({ field }: { field?: boolean }) => (
      <Form initialValues={{ count: '1' }} clearOnDestroy>
        {field && (
          <Field name="count">
            <Input />
          </Field>
        )}
      </Form>
    );
    const { container, rerender } = render(
      <Wrapper>
        <Demo />
      </Wrapper>,
    );
    expect(container.querySelector('input')).toBeNull();
    rerender(
      <Wrapper>
        <Demo field />
      </Wrapper>,
    );
    expect(container.querySelector('input').value).toBe('1');
  });

  it('preserves initialValues and edits with clearOnDestroy=false in StrictMode', () => {
    let formCache: FormInstance;
    const Demo = () => {
      const [form] = Form.useForm();
      formCache = form;
      return (
        <Form form={form} initialValues={{ count: '1' }} clearOnDestroy={false}>
          <Field name="count">
            <Input />
          </Field>
        </Form>
      );
    };
    const { container, rerender } = render(
      <React.StrictMode>
        <Demo />
      </React.StrictMode>,
    );
    expect(formCache.getFieldsValue(true)).toEqual({ count: '1' });
    fireEvent.change(container.querySelector('input'), { target: { value: 'changed' } });
    expect(formCache.getFieldsValue(true)).toEqual({ count: 'changed' });
    rerender(
      <React.StrictMode>
        <Demo />
      </React.StrictMode>,
    );
    expect(container.querySelector('input').value).toBe('changed');
    expect(formCache.getFieldsValue(true)).toEqual({ count: 'changed' });
  });

  it.each([false, true])('keeps initialValues with StrictMode=%s', strict => {
    let formCache: FormInstance;
    const Demo = ({ load }: { load?: boolean }) => {
      const [form] = Form.useForm();
      formCache = form;
      return load ? (
        <Form form={form} initialValues={{ count: '1' }} clearOnDestroy>
          <Field name="count">
            <Input />
          </Field>
        </Form>
      ) : null;
    };
    const Wrapper = strict ? React.StrictMode : React.Fragment;
    const { container, rerender } = render(
      <Wrapper>
        <Demo load />
      </Wrapper>,
    );
    expect(container.querySelector('input').value).toBe('1');
    expect(formCache.getFieldsValue(true)).toEqual({ count: '1' });
    fireEvent.change(container.querySelector('input'), { target: { value: 'changed' } });
    expect(formCache.getFieldsValue(true)).toEqual({ count: 'changed' });
    rerender(
      <Wrapper>
        <Demo />
      </Wrapper>,
    );
    expect(container.querySelector('input')).toBeNull();
    expect(formCache.getFieldsValue(true)).toEqual({});
    rerender(
      <Wrapper>
        <Demo load />
      </Wrapper>,
    );
    expect(container.querySelector('input').value).toBe('1');
    expect(formCache.getFieldsValue(true)).toEqual({ count: '1' });
  });

  it.each([false, true])(
    'keeps mount values available to child layout effects with preserve=%s',
    preserve => {
      const onValuesChange = jest.fn();
      const onFieldsChange = jest.fn();
      const reads: unknown[] = [];
      let formCache: FormInstance;
      const Probe = ({ form }: { form: FormInstance }) => {
        useLayoutEffect(() => {
          reads.push(form.getFieldValue('count'));
          form.setFieldsValue({ count: 'mounted' });
        }, []);
        return null;
      };
      const Demo = ({ load = true }: { load?: boolean }) => {
        const [form] = Form.useForm();
        formCache = form;
        const count = Form.useWatch('count', form);
        return (
          <>
            <span>{count ?? 'missing'}</span>
            {load && (
              <Form
                form={form}
                initialValues={{ count: '1' }}
                clearOnDestroy
                preserve={preserve}
                onValuesChange={onValuesChange}
                onFieldsChange={onFieldsChange}
              >
                <Field name="count">
                  <Input />
                </Field>
                <Probe form={form} />
              </Form>
            )}
          </>
        );
      };
      const { container, rerender } = render(
        <React.StrictMode>
          <Demo />
        </React.StrictMode>,
      );
      expect(reads).toEqual(['1', 'mounted']);
      expect(container.querySelector('input').value).toBe('mounted');
      expect(container.querySelector('span').textContent).toBe('mounted');
      expect(formCache.getFieldsValue(true)).toEqual({ count: 'mounted' });
      expect(formCache.isFieldTouched('count')).toBe(true);
      expect(onValuesChange).not.toHaveBeenCalled();
      expect(onFieldsChange).not.toHaveBeenCalled();
      rerender(
        <React.StrictMode>
          <Demo load={false} />
        </React.StrictMode>,
      );
      expect(formCache.getFieldsValue(true)).toEqual({});
      rerender(
        <React.StrictMode>
          <Demo />
        </React.StrictMode>,
      );
      expect(reads).toEqual(['1', 'mounted', '1', 'mounted']);
      expect(formCache.getFieldsValue(true)).toEqual({ count: 'mounted' });
    },
  );

  it('does not touch fields or trigger change callbacks during initialization', () => {
    let formCache: FormInstance;
    const onValuesChange = jest.fn();
    const onFieldsChange = jest.fn();
    const Demo = () => {
      const [form] = Form.useForm();
      formCache = form;
      return (
        <Form
          form={form}
          initialValues={{ count: '1' }}
          clearOnDestroy
          onValuesChange={onValuesChange}
          onFieldsChange={onFieldsChange}
        >
          <Field name="count">
            <Input />
          </Field>
        </Form>
      );
    };
    const { container } = render(
      <React.StrictMode>
        <Demo />
      </React.StrictMode>,
    );
    expect(container.querySelector('input').value).toBe('1');
    expect(formCache.getFieldsValue(true)).toEqual({ count: '1' });
    expect(formCache.isFieldsTouched()).toBe(false);
    expect(onValuesChange).not.toHaveBeenCalled();
    expect(onFieldsChange).not.toHaveBeenCalled();
  });

  it.each<false | string>([false, 'form'])(
    'keeps initialization and real unmount clearing with component=%s and render props',
    component => {
      let formCache: FormInstance;
      const Demo = ({ load = true }: { load?: boolean }) => {
        const [form] = Form.useForm();
        formCache = form;
        return load ? (
          <Form form={form} initialValues={{ count: '1' }} clearOnDestroy component={component}>
            {values => (
              <>
                <span>{values.count}</span>
                <Field name="count">
                  <Input />
                </Field>
              </>
            )}
          </Form>
        ) : null;
      };
      const { container, rerender } = render(
        <React.StrictMode>
          <Demo />
        </React.StrictMode>,
      );
      expect(container.querySelector('form') === null).toBe(component === false);
      expect(container.querySelector('span').textContent).toBe('1');
      expect(formCache.getFieldsValue(true)).toEqual({ count: '1' });
      fireEvent.change(container.querySelector('input'), { target: { value: 'changed' } });
      expect(container.querySelector('span').textContent).toBe('changed');
      rerender(
        <React.StrictMode>
          <Demo load={false} />
        </React.StrictMode>,
      );
      expect(formCache.getFieldsValue(true)).toEqual({});
      rerender(
        <React.StrictMode>
          <Demo />
        </React.StrictMode>,
      );
      expect(container.querySelector('span').textContent).toBe('1');
      expect(formCache.getFieldsValue(true)).toEqual({ count: '1' });
    },
  );

  it('preserves controlled fields without marking them touched during replay', () => {
    let formCache: FormInstance;
    const Demo = () => {
      const [form] = Form.useForm();
      formCache = form;
      return (
        <Form
          form={form}
          initialValues={{ count: '1' }}
          fields={[{ name: ['count'], value: 'controlled' }]}
          clearOnDestroy
        >
          <Field name="count">
            <Input />
          </Field>
        </Form>
      );
    };
    const { container, rerender } = render(
      <React.StrictMode>
        <Demo />
      </React.StrictMode>,
    );
    expect(container.querySelector('input').value).toBe('controlled');
    expect(formCache.getFieldsValue(true)).toEqual({ count: 'controlled' });
    expect(formCache.isFieldsTouched()).toBe(false);
    rerender(
      <React.StrictMode>
        <Demo />
      </React.StrictMode>,
    );
    expect(container.querySelector('input').value).toBe('controlled');
  });

  it('keeps list values across replay and resets them after real unmount with preserve=false', () => {
    let formCache: FormInstance;
    const Demo = ({ load = true }: { load?: boolean }) => {
      const [form] = Form.useForm();
      formCache = form;
      return load ? (
        <Form form={form} initialValues={{ rows: ['1', '2'] }} clearOnDestroy preserve={false}>
          <Form.List name="rows">
            {fields =>
              fields.map(field => (
                <Field {...field} key={field.key}>
                  <Input />
                </Field>
              ))
            }
          </Form.List>
        </Form>
      ) : null;
    };
    const { container, rerender } = render(
      <React.StrictMode>
        <Demo />
      </React.StrictMode>,
    );
    expect(formCache.getFieldsValue(true)).toEqual({ rows: ['1', '2'] });
    fireEvent.change(container.querySelector('input'), { target: { value: 'changed' } });
    expect(formCache.getFieldsValue(true)).toEqual({ rows: ['changed', '2'] });
    rerender(
      <React.StrictMode>
        <Demo load={false} />
      </React.StrictMode>,
    );
    expect(formCache.getFieldsValue(true)).toEqual({});
    rerender(
      <React.StrictMode>
        <Demo />
      </React.StrictMode>,
    );
    expect(formCache.getFieldsValue(true)).toEqual({ rows: ['1', '2'] });
    expect(Array.from(container.querySelectorAll('input'), input => input.value)).toEqual([
      '1',
      '2',
    ]);
  });
});

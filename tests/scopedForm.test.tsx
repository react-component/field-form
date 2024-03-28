import React, { forwardRef } from 'react';
import type { ForwardedRef, PropsWithChildren } from 'react';
import { act, renderHook } from '@testing-library/react';
import Form from '../src';
import type { FormInstance } from '../src';
import { isEqual } from 'lodash';
import timeout from './common/timeout';

const CreateForm = forwardRef((props: PropsWithChildren, ref: ForwardedRef<FormInstance>) => {
  const { children } = props;
  return (
    <Form
      initialValues={{
        field0: 'field0',
        field1: 'field1',
        list: [
          {
            listfield0: 'listfield0',
          },
        ],
      }}
      ref={ref}
    >
      <Form.Field
        name="field0"
      >
        <input type="text" />
      </Form.Field>
      <Form.Field
        name="field1"
      >
        <input type="text" />
      </Form.Field>
      <Form.Field
        name="field2"
        rules={[{ required: true, message: 'field2 is required' }]}
      >
        <input type="text" />
      </Form.Field>
      <Form.List
        name="list"
        rules={[
          {
            validator(_, value) {
              if (value?.length) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('At least one is required'));
            },
          },
        ]}
      >
        {
          (fields, { add }) => (
            <>
              {
                fields.map(field => {
                  return (
                    <React.Fragment key={field.key}>
                      <Form.Field
                        name={[field.name, 'listfield0']}
                        rules={[
                          {
                            warningOnly: true, async validator(_, value) {
                              await timeout();
                              if (/[A-Z]+/.test(value)) {
                                throw new Error('Capital letters are not recommended');
                              }
                            },
                          },
                        ]}
                      >
                        <input type="text" />
                      </Form.Field>
                      <Form.Field
                        name={[field.name, 'listfield1']}
                        rules={[{ required: true, message: 'listfield1 is required' }]}
                      >
                        <input type="text" />
                      </Form.Field>
                      <Form.Field
                        name={[field.name, 'listfield2']}
                      >
                        <input type="text" />
                      </Form.Field>
                    </React.Fragment>
                  );
                })
              }
              <button id="add" onClick={() => add()}>Add</button>
              {children}
            </>
          )
        }
      </Form.List>
    </Form>
  );
});

describe('Form.useFormInstance', () => {

  it('useFormInstance returns undefined', () => {
    const { result } = renderHook(() => Form.useFormInstance());

    expect(result.current).toBeUndefined();
  });

  it('useFormInstance returns FormInstance', () => {
    const formRef = React.createRef<FormInstance>();
    const { result } = renderHook(() => Form.useFormInstance(), {
      wrapper({ children }) {
        return (
          <Form ref={formRef}>{children}</Form>
        );
      },
    });

    expect(result.current).toBeTruthy();
    expect(formRef.current).toBe(result.current);
  });

  it('useFormInstance({ scope: true }) returns new FormInstance', () => {
    const formRef = React.createRef<FormInstance>();
    const { result } = renderHook(() => Form.useFormInstance({ scope: true }), {
      wrapper({ children }) {
        return (
          <Form ref={formRef}>{children}</Form>
        );
      },
    });

    expect(result.current).toBeTruthy();
    expect(formRef.current).not.toBe(result.current);
  });

  it('useFormInstance({ scope: true }) works fine in top level', () => {
    const formRef = React.createRef<FormInstance>();
    const { result } = renderHook(() => Form.useFormInstance({ scope: true }), {
      wrapper({ children }) {
        return (
          <Form
            ref={formRef}
            initialValues={{
              field0: 'field0',
              field1: 'field1',
            }}
          >
            <Form.Field
              name="field0"
            >
              <input type="text" />
            </Form.Field>
            <Form.Field
              name="field1"
            >
              <input type="text" />
            </Form.Field>
            {children}
          </Form>
        );
      },
    });

    expect(result.current.getScopeName()).toBeUndefined();
    expect(formRef.current.getScopeName()).toBeUndefined();

    expect(result.current.getFieldsValue()).toEqual(formRef.current.getFieldsValue());
    expect(result.current.getFieldsValue(true)).toBe(formRef.current.getFieldsValue(true));
    expect(result.current.getFieldsValue(['field0'])).toEqual(formRef.current.getFieldsValue(['field0']));
    expect(result.current.getFieldValue(['field0'])).toEqual(formRef.current.getFieldValue(['field0']));

  });

  const renderScopedForm = () => {
    const formRef = React.createRef<FormInstance>();
    const { result } = renderHook(() => Form.useFormInstance({ scope: true }), {
      wrapper({ children }) {
        return (
          <CreateForm ref={formRef}>{children}</CreateForm>
        );
      },
    });
    return { formRef, result };
  };

  it('useFormInstance({ scope: true }).getFieldsValue works fine in sub level', async () => {

    const { result } = renderScopedForm();

    expect(result.current.getScopeName()).toEqual(['list']);

    act(() => {
      result.current.setFieldValue([0, 'nonexistent'], 'nonexistent');
    });

    // getFieldsValue
    expect(result.current.getFieldsValue({ strict: true })).toEqual(
      [
        {
          listfield0: 'listfield0',
        },
      ]
    );
    expect(result.current.getFieldsValue(true)).toBe(result.current.getFieldsValue(true));
    expect(result.current.getFieldsValue(true)).toEqual(
      [
        {
          listfield0: 'listfield0',
          nonexistent: 'nonexistent',
        },
      ]
    );
    expect(result.current.getFieldsValue({
      strict: true,
      filter: (meta) => {
        return isEqual(meta.name, [0, 'listfield0']);
      },
    })).toEqual([{ listfield0: 'listfield0' }]);
    expect(result.current.getFieldsValue([
      [0, 'listfield0'],
      [0, 'listfield1'],
    ], (meta) => {
      return isEqual(meta.name, [0, 'listfield0']);
    })).toEqual([{ listfield0: 'listfield0' }]);

    const mock = jest.fn();
    const values = result.current.getFieldsValue([
      [0, 'listfield0'],
      [0, 'notexistfield'],
    ], (meta) => {
      if (!meta) {
        mock();
      }
      return true;
    });
    expect(mock).toHaveBeenCalled();
    expect(values).toEqual([{ listfield0: 'listfield0' }]);

  });

  it('useFormInstance({ scope: true }).(get|set)FieldValue works fine in sub level', async () => {
    const { result } = renderScopedForm();
    expect(result.current.getFieldValue([0, 'listfield0'])).toBe('listfield0');
    expect(result.current.getFieldValue([0, 'listfield1'])).toBeUndefined();
    act(() => {
      result.current.setFieldValue([0, 'listfield1'], 'modifiedlistfield1');
      result.current.setFieldValue([0, 'nonexistent'], 'nonexistent');
    });
    expect(result.current.getFieldValue([0, 'listfield1'])).toBe('modifiedlistfield1');
    expect(result.current.getFieldValue([0, 'nonexistent'])).toBe('nonexistent');
  });

  it('useFormInstance({ scope: true }).setFieldsValue() works fine in sub level', () => {
    const { result } = renderScopedForm();
    act(() => {
      result.current.setFieldsValue([{
        listfield1: 'listfield1',
      }]);
    });
    expect(result.current.getFieldsValue()).toEqual([{ listfield1: 'listfield1' }]);
  });

  it('useFormInstance({ scope: true }).getFieldError() works fine in sub level', async () => {
    const { result, formRef } = renderScopedForm();

    await act(async () => {
      result.current.setFieldValue([0, 'listfield0'], 'Capital');
      await result.current.validateFields().catch(e => e);
    });
    expect(result.current.getFieldError([0, 'listfield1'])).toEqual(['listfield1 is required']);
    expect(result.current.getFieldWarning([0, 'listfield0'])).toEqual(['Capital letters are not recommended']);
    const fieldsError = result.current.getFieldsError();
    expect(fieldsError.find(field => isEqual(field.name, [0, 'listfield0']))?.warnings).toEqual(['Capital letters are not recommended']);
    expect(fieldsError.find(field => isEqual(field.name, [0, 'listfield1']))?.errors).toEqual(['listfield1 is required']);
    expect(result.current.getFieldsError([
      [0, 'listfield1'],
    ])[0]?.errors).toEqual(['listfield1 is required']);
    expect(formRef.current.getFieldError(['field0'])).toEqual([]);

    await act(async () => {
      result.current.setFieldsValue([]);
      await result.current.validateFields().catch(e => e);
    });
    expect(result.current.getFieldError([])).toEqual(['At least one is required']);

  });

  it('useFormInstance({ scope: true }).validateFields() works fine in sub level', async () => {
    const { result, formRef } = renderScopedForm();
    let values: any;
    let errors: any;
    act(() => {
      result.current.setFieldsValue([
        {
          listfield0: 'Capital',
        },
        {},
      ]);
    });
    await act(async () => {
      try {
        values = await result.current.validateFields();
      } catch (e) {
        errors = e;
      }
    });
    expect(values).toBeUndefined();
    expect(errors?.errorFields).toEqual([
      { name: [0, 'listfield1'], errors: ['listfield1 is required'], warnings: [] },
      { name: [1, 'listfield1'], errors: ['listfield1 is required'], warnings: [] },
    ]);
    expect(errors?.values).toEqual([{ listfield0: 'Capital', }, {}]);
    expect(formRef.current.getFieldError('field0')).toEqual([]);

    await act(async () => {
      await formRef.current.validateFields().catch(e => e);
    });
    expect(formRef.current.getFieldError('field2')).toEqual(['field2 is required']);

    act(() => {
      formRef.current.resetFields();
    });
    await act(async () => {
      await result.current.validateFields([
        [0, 'listfield0']
      ]).catch(e => e);
    });
    expect(result.current.getFieldError([0, 'listfield1'])).toEqual([]);

    await act(async () => {
      await result.current.validateFields([
        [0, 'listfield1']
      ]).catch(e => e);
    });
    expect(result.current.getFieldError([0, 'listfield1'])).toEqual(['listfield1 is required']);

  });

  it('useFormInstance({ scope: true }).isFieldTouched() works fine in sub level', () => {
    const { result } = renderScopedForm();
    act(() => {
      result.current.setFields([
        {
          name: [0, 'listfield0'],
          touched: true,
        },
      ]);
    });
    expect(result.current.isFieldTouched([0, 'listfield0'])).toBe(true);
    expect(result.current.isFieldTouched([0, 'listfield1'])).toBe(false);
    expect(result.current.isFieldsTouched([0])).toBe(true);
    expect(
      result.current.isFieldsTouched([
        [0, 'listfield0'],
        [0, 'listfield1'],
      ]),
    ).toBe(true);
    expect(
      result.current.isFieldsTouched([
        [0, 'listfield0'],
        [0, 'listfield1'],
      ], true),
    ).toBe(false);
    expect(result.current.isFieldsTouched(true)).toBe(false);
    expect(result.current.isFieldsTouched()).toBe(true);

    act(() => {
      result.current.setFields([
        {
          name: [0, 'listfield1'],
          touched: true,
        },
        {
          name: [0, 'listfield2'],
          touched: true,
        },
      ]);
    });
    expect(result.current.isFieldsTouched(true)).toBe(true);

  });

  it('useFormInstance({ scope: true }).isFieldValidating() works fine in sub level', async () => {
    const { result, formRef } = renderScopedForm();

    act(() => {
      formRef.current.validateFields(['field2']).catch(e => e);
    });

    expect(formRef.current.isFieldsValidating()).toBe(true);
    expect(result.current.isFieldsValidating()).toBe(false);

    await timeout();

    act(() => {
      result.current.validateFields().catch(e => e);
    });

    expect(result.current.isFieldValidating([0, 'listfield0'])).toBe(true);
    expect(result.current.isFieldValidating([0, 'listfield2'])).toBe(false);

    expect(result.current.isFieldsValidating()).toBe(true);
    expect(result.current.isFieldsValidating([
      [0, 'listfield0'],
      [0, 'listfield1'],
      [0, 'listfield2'],
    ])).toBe(true);
    expect(result.current.isFieldsValidating([
      [0, 'listfield2'],
    ])).toBe(false);

  });

  it('useFormInstance({ scope: true }).resetFields() works fine in sub level', () => {
    const { result, formRef } = renderScopedForm();

    act(() => {
      formRef.current.setFields([
        {
          name: 'field2',
          touched: true,
        },
        {
          name: ['list', 0, 'listfield0'],
          touched: true,
        },
        {
          name: ['list', 0, 'listfield1'],
          touched: true,
        },
      ]);
    });
    expect(formRef.current.isFieldTouched('field2')).toBe(true);
    expect(result.current.isFieldsTouched()).toBe(true);
    expect(result.current.isFieldsTouched(true)).toBe(false);
    expect(result.current.isFieldsTouched([
      [0, 'listfield0'],
    ])).toBe(true);

    act(() => {
      result.current.resetFields([
        [0, 'listfield0'],
      ]);
    });
    expect(formRef.current.isFieldTouched('field2')).toBe(true);
    expect(result.current.isFieldsTouched([
      [0, 'listfield0'],
    ])).toBe(false);

    act(() => {
      result.current.resetFields();
    });
    expect(formRef.current.isFieldTouched('field2')).toBe(true);
    expect(result.current.isFieldsTouched()).toBe(false);
  });

});

describe('Form.useWatch', () => {
  it('Form.useWatch({ scope: true })', () => {
    const formRef = React.createRef<FormInstance>();
    const { result } = renderHook(() => Form.useWatch([0, 'listfield0'], { scope: true }), {
      wrapper({ children }) {
        return (
          <CreateForm ref={formRef}>{children}</CreateForm>
        );
      },
    });

    expect(result.current).toBe('listfield0');
    act(() => {
      formRef.current.setFieldValue(['list', 0, 'listfield0'], 'modified');
    });
    expect(result.current).toBe('modified');

  });
});

import React, { useEffect } from 'react';
import { render, act, fireEvent } from './test-utils';
import Form, { Field, useForm } from '../src';
import type { FormInstance } from '../src';
import InfoField, { Input } from './common/InfoField';
import { changeValue, matchError, getField } from './common';
import timeout from './common/timeout';
import type { ValidateMessages } from '@/interface';
import { vi } from 'vitest';

describe('Form.Validate', () => {
  it('required', async () => {
    let form;
    const { container } = render(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
        >
          <InfoField name="username" rules={[{ required: true }]} />
        </Form>
      </div>,
    );

    await act(async () => {
      await changeValue(getField(container), '');
    });

    matchError(container, true);
    expect(form.getFieldError('username')).toEqual(["'username' is required"]);
    expect(form.getFieldsError()).toEqual([
      {
        name: ['username'],
        errors: ["'username' is required"],
        warnings: [],
      },
    ]);

    // Contains not exists
    expect(form.getFieldsError(['username', 'not-exist'])).toEqual([
      {
        name: ['username'],
        errors: ["'username' is required"],
        warnings: [],
      },
      {
        name: ['not-exist'],
        errors: [],
        warnings: [],
      },
    ]);
  });

  describe('validateMessages', () => {
    function renderForm(messages: ValidateMessages, fieldProps = {}) {
      return render(
        <Form validateMessages={messages}>
          <InfoField name="username" rules={[{ required: true }]} {...fieldProps} />
        </Form>,
      );
    }

    it('template message', async () => {
      const { container } = renderForm({ required: "You miss '${name}'!" });

      await act(async () => {
        await changeValue(getField(container), '');
      });

      matchError(container, "You miss 'username'!");
    });

    it('function message', async () => {
      const { container } = renderForm({ required: () => 'Bamboo & Light' });

      await act(async () => {
        await changeValue(getField(container), '');
      });

      matchError(container, 'Bamboo & Light');
    });

    it('messageVariables', async () => {
      const { container } = renderForm(
        { required: "You miss '${label}'!" },
        {
          messageVariables: {
            label: 'Light&Bamboo',
          },
        },
      );

      await act(async () => {
        await changeValue(getField(container), '');
      });

      matchError(container, "You miss 'Light&Bamboo'!");
    });
  });
  describe('customize validator', () => {
    it('work', async () => {
      const { container } = render(
        <Form>
          <InfoField
            name="username"
            rules={[
              {
                async validator(_, value) {
                  if (value !== 'bamboo') {
                    return Promise.reject(new Error('should be bamboo!'));
                  }
                  return '';
                },
              },
            ]}
          />
        </Form>,
      );

      // Wrong value
      await act(async () => {
        await changeValue(getField(container), 'light');
      });
      matchError(container, 'should be bamboo!');

      // Correct value
      await act(async () => {
        await changeValue(getField(container), 'bamboo');
      });
      matchError(container, false);
    });

    it('should error if throw in validate', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { container } = render(
        <Form>
          <InfoField
            name="username"
            rules={[
              {
                validator() {
                  throw new Error('without thinking');
                },
              },
            ]}
          />
        </Form>,
      );

      await act(async () => {
        await changeValue(getField(container), 'light');
      });

      matchError(container, "Validation error on field 'username'");

      const consoleErr = String(errorSpy.mock.calls[0][0]);
      expect(consoleErr).toBe('Error: without thinking');

      errorSpy.mockRestore();
    });
  });

  it('fail validate if throw', async () => {
    const { container } = render(
      <Form>
        <InfoField
          name="username"
          rules={[
            {
              validator() {
                throw new Error('OPS');
              },
            },
          ]}
        />
      </Form>,
    );

    // Wrong value
    await act(async () => {
      await changeValue(getField(container), 'light');
    });

    matchError(container, "Validation error on field 'username'");
  });

  describe('callback', () => {
    it('warning if not return promise', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { container } = render(
        <Form>
          <InfoField
            name="username"
            rules={[
              {
                validator(_, value, callback) {
                  callback();
                },
              },
            ]}
          />
        </Form>,
      );

      await act(async () => {
        await changeValue(getField(container), 'light');
      });
      expect(errorSpy).toHaveBeenCalledWith(
        'Warning: `callback` is deprecated. Please return a promise instead.',
      );

      errorSpy.mockRestore();
    });

    it('warning if both promise & callback exist', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { container } = render(
        <Form>
          <InfoField
            name="username"
            rules={[
              {
                async validator(_, __, callback) {
                  callback();
                  return new Promise(() => {});
                },
              },
            ]}
          />
        </Form>,
      );

      await act(async () => {
        await changeValue(getField(container), 'light');
      });
      expect(errorSpy).toHaveBeenCalledWith(
        'Warning: Your validator function has already return a promise. `callback` will be ignored.',
      );

      errorSpy.mockRestore();
    });
  });

  describe('validateTrigger', () => {
    it('normal', async () => {
      let form;
      const { container } = render(
        <div>
          <Form
            ref={instance => {
              form = instance;
            }}
          >
            <InfoField
              name="test"
              validateTrigger={['onBlur', 'onChange']}
              rules={[
                { required: true, validateTrigger: 'onBlur' },
                {
                  validator: async () => {
                    throw new Error('Not pass');
                  },
                  validateTrigger: 'onChange',
                },
              ]}
            >
              <Input />
            </InfoField>
          </Form>
        </div>,
      );

      await act(async () => {
        const field = getField(container, 'test');
        await changeValue(field, '');
      });
      expect(form.getFieldError('test')).toEqual(['Not pass']);

      await act(async () => {
        fireEvent.blur(getField(container, 'test'));
        await timeout();
      });
      expect(form.getFieldError('test')).toEqual(["'test' is required"]);
    });

    it('change validateTrigger', async () => {
      const form = React.createRef<FormInstance>();

      const Test = ({ init = false }) => (
        <Form ref={form}>
          <Field
            name="title"
            validateTrigger={init ? 'onChange' : 'onBlur'}
            rules={[
              { required: true, message: 'Title is required' },
              { min: 3, message: 'Title should be 3+ characters' },
            ]}
          >
            <Input />
          </Field>
        </Form>
      );

      const { container, rerender } = render(<Test />);

      await act(async () => {
        fireEvent.blur(getField(container));
        await timeout();
      });

      expect(form.current.getFieldError('title')).toEqual(['Title is required']);

      rerender(<Test init={true} />);

      await act(async () => {
        await changeValue(getField(container), '1');
        await timeout();
      });

      expect(form.current.getFieldValue('title')).toBe('1');
      expect(form.current.getFieldError('title')).toEqual(['Title should be 3+ characters']);
    });

    it('form context', async () => {
      const Component = (props: { validateTrigger?: 'onBlur' | 'onChange' }) => {
        const { validateTrigger = 'onBlur' } = props;

        return (
          <Form {...props} validateTrigger={validateTrigger}>
            <InfoField name="test" rules={[{ required: true }]} />
          </Form>
        );
      };
      const { container, rerender } = render(<Component />);

      // Not trigger validate since Form set `onBlur`
      await act(async () => {
        await changeValue(getField(container), '');
        await timeout();
      });

      matchError(container, false);

      // Trigger onBlur
      await act(async () => {
        fireEvent.blur(getField(container));
        await timeout();
      });
      rerender(<Component />);
      matchError(container, true);

      // // Update Form context
      rerender(<Component validateTrigger="onChange" />);

      await act(async () => {
        await changeValue(getField(container), '1');
      });

      matchError(container, false);
    });
  });
  describe('validate only accept exist fields', () => {
    it('skip init value', async () => {
      let form;
      const onFinish = vi.fn();

      const { container } = render(
        <div>
          <Form
            onFinish={onFinish}
            ref={instance => {
              form = instance;
            }}
            initialValues={{ user: 'light', pass: 'bamboo' }}
          >
            <InfoField name="user">
              <Input />
            </InfoField>
            <button type="submit">submit</button>
          </Form>
        </div>,
      );

      // Validate callback
      expect(await form.validateFields(['user'])).toEqual({ user: 'light' });
      expect(await form.validateFields()).toEqual({ user: 'light' });

      // Submit callback
      fireEvent.click(container.querySelector('button'));
      await timeout();
      expect(onFinish).toHaveBeenCalledWith({ user: 'light' });
    });

    it('remove from fields', async () => {
      const onFinish = vi.fn();
      const { container } = render(
        <Form
          onFinish={onFinish}
          initialValues={{
            switch: true,
            ignore: 'test',
          }}
        >
          <InfoField name="switch" valuePropName="checked">
            <Input type="checkbox" className="switch" />
          </InfoField>
          <Field shouldUpdate>
            {(_, __, { getFieldValue }) =>
              getFieldValue('switch') && (
                <InfoField name="ignore">
                  <Input className="ignore" />
                </InfoField>
              )
            }
          </Field>
          <button type="submit">submit</button>
        </Form>,
      );

      // Submit callback
      await act(async () => {
        fireEvent.click(container.querySelector('button'));
        await timeout();
      });

      expect(onFinish).toHaveBeenCalledWith({ switch: true, ignore: 'test' });
      onFinish.mockReset();

      // Hide one
      fireEvent.click(getField(container, 'switch'));

      await act(async () => {
        fireEvent.click(container.querySelector('button'));
        await timeout();
      });

      expect(onFinish).toHaveBeenCalledWith({ switch: false });
    });

    it('validateFields should not pass when validateFirst is set', async () => {
      const form = React.createRef<FormInstance>();

      render(
        <div>
          <Form ref={form}>
            <InfoField name="user" validateFirst rules={[{ required: true }]}>
              <Input />
            </InfoField>
          </Form>
        </div>,
      );
      await act(async () => {
        // Validate callback
        await new Promise(resolve => {
          let failed = false;
          form.current
            .validateFields()
            .catch(() => {
              failed = true;
            })
            .then(() => {
              expect(failed).toBeTruthy();
              resolve('');
            });
        });
      });
    });
  });

  it('should error in console if user script failed', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(
      <Form
        onFinish={() => {
          throw new Error('should console this');
        }}
        initialValues={{ user: 'light' }}
      >
        <InfoField name="user">
          <Input />
        </InfoField>
        <button type="submit">submit</button>
      </Form>,
    );

    fireEvent.click(container.querySelector('button'));
    await timeout();
    expect(errorSpy.mock.calls[0][0].message).toEqual('should console this');

    errorSpy.mockRestore();
  });

  describe('validateFirst', () => {
    it('work', async () => {
      let form;
      let canEnd = false;
      const onFinish = vi.fn();

      const { container } = render(
        <div>
          <Form
            ref={instance => {
              form = instance;
            }}
            onFinish={onFinish}
          >
            <InfoField
              name="username"
              validateFirst
              rules={[
                // Follow promise will never end
                { required: true },
                {
                  validator: () =>
                    new Promise(resolve => {
                      if (canEnd) {
                        resolve('');
                      }
                    }),
                },
              ]}
            />
            <button type="submit">submit</button>
          </Form>
        </div>,
      );

      // Not pass
      await act(async () => {
        await changeValue(getField(container), '');
      });
      matchError(container, true);
      expect(form.getFieldError('username')).toEqual(["'username' is required"]);
      expect(form.getFieldsError()).toEqual([
        {
          name: ['username'],
          errors: ["'username' is required"],
          warnings: [],
        },
      ]);
      expect(onFinish).not.toHaveBeenCalled();

      // Should pass
      canEnd = true;
      await act(async () => {
        await changeValue(getField(container), 'test');
      });

      await act(async () => {
        fireEvent.click(container.querySelector('button'));
        await timeout();
      });

      matchError(container, false);
      expect(onFinish).toHaveBeenCalledWith({ username: 'test' });
    });

    [
      { name: 'serialization', first: true, second: false, validateFirst: true },
      { name: 'parallel', first: true, second: true, validateFirst: 'parallel' as const },
    ].forEach(({ name, first, second, validateFirst }) => {
      it(name, async () => {
        let ruleFirst = false;
        let ruleSecond = false;

        const Component = () => (
          <Form>
            <InfoField
              name="username"
              validateFirst={validateFirst}
              rules={[
                {
                  validator: async () => {
                    ruleFirst = true;
                    await timeout();
                    throw new Error('failed first');
                  },
                },
                {
                  validator: async () => {
                    ruleSecond = true;
                    await timeout();
                    throw new Error('failed second');
                  },
                },
              ]}
            />
          </Form>
        );

        const { container, rerender } = render(<Component />);

        await changeValue(getField(container), 'test');
        await timeout();

        rerender(<Component />);

        matchError(container, 'failed first');

        expect(ruleFirst).toEqual(first);
        expect(ruleSecond).toEqual(second);
      });
    });
  });

  it('switch to remove errors', async () => {
    const Demo = () => {
      const [checked, setChecked] = React.useState(true);

      return (
        <Form>
          <button
            type="button"
            onClick={() => {
              setChecked(!checked);
            }}
          />
          <InfoField
            name={checked ? 'username' : 'age'}
            rules={
              checked
                ? [
                    {
                      validator(rule, value, callback) {
                        callback('Integer number only!');
                      },
                    },
                  ]
                : []
            }
          />
        </Form>
      );
    };
    const { container, rerender } = render(<Demo />);

    await changeValue(getField(container), '233');
    matchError(container, true);

    fireEvent.click(container.querySelector('button'));
    rerender(<Demo />);

    matchError(container, false);
  });

  it('submit should trigger Field re-render', () => {
    const renderProps = vi.fn().mockImplementation(() => null);

    const Demo = () => {
      const [form] = useForm();

      return (
        <Form form={form}>
          <Field
            name="test"
            rules={[{ validator: async () => Promise.reject(new Error('Failed')) }]}
          >
            {renderProps}
          </Field>
          <button
            type="button"
            onClick={() => {
              form.submit();
            }}
          />
        </Form>
      );
    };

    const { container } = render(<Demo />);
    renderProps.mockReset();

    // Should trigger validating
    fireEvent.click(container.querySelector('button'));
    expect(renderProps.mock.calls[0][1]).toEqual(expect.objectContaining({ validating: true }));
  });

  it('renderProps should use latest rules', async () => {
    let failedTriggerTimes = 0;
    let passedTriggerTimes = 0;

    type FormStore = {
      username: string;
      password: string;
    };

    const Demo = () => (
      <Form>
        <InfoField name="username" />
        <Form.Field
          shouldUpdate={(prev: FormStore, cur: FormStore) => prev.username !== cur.username}
        >
          {(_, __, { getFieldValue }) => {
            const value = getFieldValue('username');

            if (value === 'removed') {
              return null;
            }

            return (
              <InfoField
                dependencies={['username']}
                name="password"
                rules={
                  value !== 'light'
                    ? [
                        {
                          validator: async () => {
                            failedTriggerTimes += 1;
                            throw new Error('Failed');
                          },
                        },
                      ]
                    : [
                        {
                          validator: async () => {
                            passedTriggerTimes += 1;
                          },
                        },
                      ]
                }
              />
            );
          }}
        </Form.Field>
      </Form>
    );

    const { container } = render(<Demo />);

    expect(failedTriggerTimes).toEqual(0);
    expect(passedTriggerTimes).toEqual(0);

    // Failed of second input
    await act(async () => {
      await changeValue(getField(container, 1), '');
    });

    matchError(getField(container, 1).parentElement, true);

    expect(failedTriggerTimes).toEqual(2);
    expect(passedTriggerTimes).toEqual(0);

    // Changed first to trigger update
    await act(async () => {
      await changeValue(getField(container, 0), 'light');
    });
    matchError(getField(container, 0).parentElement, false);

    expect(failedTriggerTimes).toEqual(2);
    expect(passedTriggerTimes).toEqual(1);

    // Remove should not trigger validate
    await act(async () => {
      await changeValue(getField(container, 0), 'removed');
    });

    expect(failedTriggerTimes).toEqual(2);
    expect(passedTriggerTimes).toEqual(1);
  });

  it('validate support recursive', async () => {
    let form;
    const Component = () => (
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
        >
          <InfoField name={['username', 'do']} rules={[{ required: true }]} />
          <InfoField name={['username', 'list']} rules={[{ required: true }]} />
        </Form>
      </div>
    );
    const { container, rerender } = render(<Component />);

    await act(async () => {
      changeValue(getField(container, 0), '');
      await timeout();
    });

    await act(async () => {
      rerender(<Component />);
    });

    let values;
    try {
      await act(async () => {
        values = await form.validateFields(['username'], { recursive: true });
      });
      expect(values.username.do).toBe('');
    } catch (error) {
      expect(error.errorFields.length).toBe(2);
    }

    await act(async () => {
      values = await form.validateFields(['username']);
    });
    expect(values.username.do).toBe('');
  });

  it('not trigger validator', async () => {
    const form = React.createRef<FormInstance>();
    const { container } = render(
      <div>
        <Form ref={form}>
          <InfoField name="user" rules={[{ required: true }]} />
        </Form>
      </div>,
    );
    await act(async () => {
      form.current.setFieldValue('user', 'light');
    });
    matchError(container, false);
  });

  it('filter empty rule', async () => {
    const { container } = render(
      <div>
        <Form>
          <InfoField name="user" rules={[{ required: true }, null]} />
        </Form>
      </div>,
    );
    await act(async () => {
      await changeValue(getField(container), '');
      await timeout();
    });
    matchError(container, true);
  });

  it('validated status should be true when trigger validate', async () => {
    const validateTrigger = vi.fn();
    const validateNoTrigger = vi.fn();
    const App = ({ trigger = true }) => {
      const ref = React.useRef(null);
      useEffect(() => {
        if (!trigger) return;
        ref.current!.validateFields();
      }, [trigger]);
      return (
        <div>
          <Form ref={ref}>
            <InfoField
              initialValue="test@qq.com"
              name="email"
              onMetaChange={meta => {
                if (trigger) {
                  validateTrigger(meta.validated);
                } else {
                  validateNoTrigger(meta.validated);
                }
              }}
              rules={[
                {
                  type: 'email',
                  message: 'Please input your e-mail',
                },
                {
                  required: true,
                  message: 'Please input your value',
                },
              ]}
            />
          </Form>
        </div>
      );
    };
    const { rerender } = render(<App trigger={false} />);
    await timeout();
    expect(validateNoTrigger).not.toHaveBeenCalled();

    await act(async () => {
      rerender(<App trigger={true} />);
      await timeout();
    });
    expect(validateTrigger).toBeCalledWith(true);
  });

  it('should trigger onFieldsChange 3 times', async () => {
    const onFieldsChange = vi.fn();

    const { container } = render(
      <Form onFieldsChange={onFieldsChange}>
        <InfoField name="test" rules={[{ required: true }]}>
          <Input />
        </InfoField>
      </Form>,
    );

    await act(async () => {
      await changeValue(getField(container, 'test'), 'test');
      await timeout();
    });

    // `validated: false` -> `validated: false` -> `validated: true`
    // `validating: false` -> `validating: true` -> `validating: false`
    expect(onFieldsChange).toHaveBeenCalledTimes(3);

    expect(onFieldsChange).toHaveBeenNthCalledWith(
      1,
      [
        expect.objectContaining({
          name: ['test'],
          validated: false,
          validating: false,
        }),
      ],
      expect.anything(),
    );
    expect(onFieldsChange).toHaveBeenNthCalledWith(
      2,
      [
        expect.objectContaining({
          name: ['test'],
          validated: false,
          validating: true,
        }),
      ],
      expect.anything(),
    );
    expect(onFieldsChange).toHaveBeenNthCalledWith(
      3,
      [
        expect.objectContaining({
          name: ['test'],
          validated: true,
          validating: false,
        }),
      ],
      expect.anything(),
    );
  });
});

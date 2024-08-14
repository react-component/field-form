import { fireEvent, render, act } from '@testing-library/react';
import React, { useEffect } from 'react';
import Form, { Field, useForm } from '../src';
import type { FormInstance, ValidateMessages } from '../src/interface';
import { changeValue, getInput, matchError } from './common';
import InfoField, { Input } from './common/InfoField';
import timeout, { waitFakeTime } from './common/timeout';

describe('Form.Validate', () => {
  it('required', async () => {
    const form = React.createRef<FormInstance>();
    const { container } = render(
      <div>
        <Form ref={form}>
          <InfoField name="username" rules={[{ required: true }]} />
        </Form>
      </div>,
    );

    await changeValue(getInput(container), ['bamboo', '']);
    matchError(container, true);
    expect(form.current?.getFieldError('username')).toEqual(["'username' is required"]);
    expect(form.current?.getFieldsError()).toEqual([
      {
        name: ['username'],
        errors: ["'username' is required"],
        warnings: [],
      },
    ]);

    // Contains not exists
    expect(form.current?.getFieldsError(['username', 'not-exist'])).toEqual([
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

      await changeValue(getInput(container), ['bamboo', '']);
      matchError(container, "You miss 'username'!");
    });

    it('function message', async () => {
      const { container } = renderForm({ required: () => 'Bamboo & Light' });

      await changeValue(getInput(container), ['bamboo', '']);
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

      await changeValue(getInput(container), ['bamboo', '']);
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
      await changeValue(getInput(container), 'light');
      matchError(container, 'should be bamboo!');

      // Correct value
      await changeValue(getInput(container), 'bamboo');
      matchError(container, false);
    });

    it('should error if throw in validate', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
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

      await changeValue(getInput(container), 'light');
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
    await changeValue(getInput(container), 'light');
    matchError(container, "Validation error on field 'username'");
  });

  describe('callback', () => {
    it('warning if not return promise', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

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

      await changeValue(getInput(container), 'light');
      expect(errorSpy).toHaveBeenCalledWith(
        'Warning: `callback` is deprecated. Please return a promise instead.',
      );

      errorSpy.mockRestore();
    });

    it('warning if both promise & callback exist', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

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

      await changeValue(getInput(container), 'light');
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
              <Input data-name="test" />
            </InfoField>
          </Form>
        </div>,
      );

      await changeValue(getInput(container, 'test'), ['bamboo', '']);
      expect(form.getFieldError('test')).toEqual(['Not pass']);

      // wrapper.find('input').simulate('blur');
      fireEvent.blur(getInput(container, 'test'));
      await timeout();
      expect(form.getFieldError('test')).toEqual(["'test' is required"]);
    });

    it('change validateTrigger', async () => {
      let form;

      const Test = ({ init = false }) => (
        <Form
          ref={instance => {
            form = instance;
          }}
        >
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

      // getInput(container).simulate('blur');
      fireEvent.blur(getInput(container));
      await timeout();
      expect(form.getFieldError('title')).toEqual(['Title is required']);

      // wrapper.setProps({ init: true });
      rerender(<Test init />);
      await changeValue(getInput(container), '1');
      expect(form.getFieldValue('title')).toBe('1');
      expect(form.getFieldError('title')).toEqual(['Title should be 3+ characters']);
    });

    it('form context', async () => {
      const { container, rerender } = render(
        <Form validateTrigger="onBlur">
          <InfoField name="test" rules={[{ required: true }]} />
        </Form>,
      );

      // Not trigger validate since Form set `onBlur`
      await changeValue(getInput(container), ['bamboo', '']);
      matchError(container, false);

      // Trigger onBlur
      // wrapper.find('input').simulate('blur');
      fireEvent.blur(getInput(container));
      await timeout();
      // wrapper.update();
      matchError(container, true);

      // Update Form context
      // wrapper.setProps({ validateTrigger: 'onChange' });
      rerender(
        <Form validateTrigger="onChange">
          <InfoField name="test" rules={[{ required: true }]} />
        </Form>,
      );
      await changeValue(getInput(container), '1');
      matchError(container, false);
    });
  });

  describe('validate only accept exist fields', () => {
    it('skip init value', async () => {
      let form;
      const onFinish = jest.fn();

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
          </Form>
        </div>,
      );

      // Validate callback
      expect(await form.validateFields(['user'])).toEqual({ user: 'light' });
      expect(await form.validateFields()).toEqual({ user: 'light' });

      // Submit callback
      // wrapper.find('button').simulate('submit');
      fireEvent.submit(container.querySelector('form'));
      await timeout();
      expect(onFinish).toHaveBeenCalledWith({ user: 'light' });
    });

    it('remove from fields', async () => {
      const onFinish = jest.fn();
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
        </Form>,
      );

      // Submit callback
      // wrapper.find('button').simulate('submit');
      fireEvent.submit(container.querySelector('form'));
      await timeout();
      expect(onFinish).toHaveBeenCalledWith({ switch: true, ignore: 'test' });
      onFinish.mockReset();

      // Hide one
      // wrapper.find('input.switch').simulate('change', {
      //   target: {
      //     checked: false,
      //   },
      // });
      fireEvent.click(container.querySelector('input.switch'));
      // wrapper.find('button').simulate('submit');
      fireEvent.submit(container.querySelector('form'));
      await timeout();
      expect(onFinish).toHaveBeenCalledWith({ switch: false });
    });

    it('validateFields should not pass when validateFirst is set', async () => {
      let form;

      render(
        <div>
          <Form
            ref={instance => {
              form = instance;
            }}
          >
            <InfoField name="user" validateFirst rules={[{ required: true }]}>
              <Input />
            </InfoField>
          </Form>
        </div>,
      );

      // Validate callback
      await new Promise(resolve => {
        let failed = false;
        form
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

  it('should error in console if user script failed', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

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
      </Form>,
    );

    // wrapper.find('form').simulate('submit');
    fireEvent.submit(container.querySelector('form'));
    await timeout();
    expect(errorSpy.mock.calls[0][0].message).toEqual('should console this');

    errorSpy.mockRestore();
  });

  describe('validateFirst', () => {
    it('work', async () => {
      let form;
      let canEnd = false;
      const onFinish = jest.fn();

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
          </Form>
        </div>,
      );

      // Not pass
      await changeValue(getInput(container), ['bamboo', '']);
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
      await changeValue(getInput(container), 'test');
      // wrapper.find('form').simulate('submit');
      fireEvent.submit(container.querySelector('form'));
      await timeout();

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

        const { container } = render(
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
          </Form>,
        );

        await changeValue(getInput(container), 'test');
        await timeout(100);

        // wrapper.update();
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
    const { container } = render(<Demo />);

    await changeValue(getInput(container), '233');
    matchError(container, true);

    // wrapper.find('button').simulate('click');
    fireEvent.click(container.querySelector('button'));
    // wrapper.update();
    matchError(container, false);
  });

  it('submit should trigger Field re-render', () => {
    const renderProps = jest.fn().mockImplementation(() => null);

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
    // wrapper.find('button').simulate('click');
    fireEvent.click(container.querySelector('button'));
    expect(renderProps.mock.calls[0][1]).toEqual(expect.objectContaining({ validating: true }));
  });

  it('renderProps should use latest rules', async () => {
    let failedTriggerTimes = 0;
    let passedTriggerTimes = 0;

    interface FormStore {
      username: string;
      password: string;
    }

    const Demo = () => (
      <Form>
        <InfoField name="username" />
        <Form.Field<FormStore> shouldUpdate={(prev, cur) => prev.username !== cur.username}>
          {(_, __, { getFieldValue }) => {
            const value = getFieldValue('username');

            if (value === 'removed') {
              return null;
            }

            return (
              <InfoField
                dependencies={['username']}
                name="password"
                initialValue="bamboo"
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
    await changeValue(getInput(container, 1), '');
    matchError(getInput(container, 1, true), true);

    expect(failedTriggerTimes).toEqual(1);
    expect(passedTriggerTimes).toEqual(0);

    // Changed first to trigger update
    await changeValue(getInput(container, 0), 'light');
    matchError(getInput(container, 1, true), false);

    expect(failedTriggerTimes).toEqual(1);
    expect(passedTriggerTimes).toEqual(1);

    // Remove should not trigger validate
    await changeValue(getInput(container, 0), 'removed');

    expect(failedTriggerTimes).toEqual(1);
    expect(passedTriggerTimes).toEqual(1);
  });

  it('validate support recursive', async () => {
    let form: FormInstance;
    const { container } = render(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
        >
          <InfoField name={['username', 'do']} rules={[{ required: true }]} />
          <InfoField name={['username', 'list']} rules={[{ required: true }]} />
        </Form>
      </div>,
    );

    async function changeInputValue(input: HTMLElement, value = '') {
      fireEvent.change(input, {
        target: {
          value: '2',
        },
      });
      fireEvent.change(input, {
        target: {
          value,
        },
      });

      await act(async () => {
        await timeout();
      });
    }

    await changeInputValue(container.querySelector('input'));

    try {
      await form.validateFields([['username']], { recursive: true });

      // Should not reach this
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.errorFields.length).toBe(2);
      expect(error.errorFields[0].errors).toEqual(["'username.do' is required"]);
      expect(error.errorFields[1].errors).toEqual(["'username.list' is required"]);
    }

    await act(async () => {
      await timeout();
    });

    // Passed
    await changeInputValue(container.querySelectorAll('input')[0], 'do');
    await changeInputValue(container.querySelectorAll('input')[1], 'list');

    const passedValues = await form.validateFields([['username']], { recursive: true });
    expect(passedValues).toEqual({ username: { do: 'do', list: 'list' } });
  });

  it('not trigger validator', async () => {
    const { container } = render(
      <div>
        <Form>
          <InfoField name="user" rules={[{ required: true }]} />
        </Form>
      </div>,
    );
    await changeValue(getInput(container, 0), ['light']);
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
    await changeValue(getInput(container), ['bamboo', '']);
    matchError(container, true);
  });
  it('validated status should be true when trigger validate', async () => {
    const validateTrigger = jest.fn();
    const validateNoTrigger = jest.fn();
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
    // wrapper.setProps({ trigger: true });
    rerender(<App trigger />);
    await timeout();
    expect(validateTrigger).toBeCalledWith(true);
  });

  it('should trigger onFieldsChange 3 times', async () => {
    const onFieldsChange = jest.fn();
    const onMetaChange = jest.fn();

    const App = () => {
      const ref = React.useRef(null);
      return (
        <Form ref={ref} onFieldsChange={onFieldsChange}>
          <InfoField
            name="test"
            rules={[{ required: true }]}
            onMetaChange={meta => {
              onMetaChange(meta.validated);
            }}
          >
            <Input />
          </InfoField>
        </Form>
      );
    };
    const { container } = render(<App />);

    await changeValue(getInput(container), 'bamboo');

    await timeout();

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
    // should reset validated and validating when reset btn had been clicked
    // wrapper.find('#reset').simulate('reset');
    fireEvent.reset(container.querySelector('form'));
    await timeout();
    expect(onMetaChange).toHaveBeenNthCalledWith(3, true);
    expect(onMetaChange).toHaveBeenNthCalledWith(4, false);
  });

  it('should not trigger onFieldsChange if no rules', async () => {
    const onFieldsChange = jest.fn();
    const onFinish = jest.fn();

    const App = () => {
      return (
        <Form
          onFieldsChange={onFieldsChange}
          initialValues={{
            list: ['hello'],
          }}
          onFinish={onFinish}
        >
          <Form.List name="list">
            {fields =>
              fields.map(field => (
                <InfoField key={field.key} {...field}>
                  <Input />
                </InfoField>
              ))
            }
          </Form.List>
        </Form>
      );
    };
    const { container } = render(<App />);

    // wrapper.find('form').simulate('submit');
    fireEvent.submit(container.querySelector('form'));

    await timeout();

    expect(onFieldsChange).not.toHaveBeenCalled();
    expect(onFinish).toHaveBeenCalledWith({
      list: ['hello'],
    });
  });

  it('validateOnly', async () => {
    const formRef = React.createRef<FormInstance>();
    const { container } = render(
      <Form ref={formRef}>
        <InfoField name="test" rules={[{ required: true }]}>
          <Input />
        </InfoField>
      </Form>,
    );

    // Validate only
    const result = await formRef.current.validateFields({ validateOnly: true }).catch(e => e);
    await timeout();
    expect(result.errorFields).toHaveLength(1);
    expect(container.querySelector('.errors').textContent).toBeFalsy();

    // Normal validate
    await formRef.current.validateFields().catch(e => e);
    await timeout();
    expect(container.querySelector('.errors').textContent).toEqual(`'test' is required`);
  });

  it('validateDebounce', async () => {
    jest.useFakeTimers();

    const validator = jest.fn(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Not Correct'));
          }, 100);
        }),
    );

    const formRef = React.createRef<FormInstance>();

    const { container } = render(
      <Form ref={formRef}>
        <InfoField name="test" rules={[{ validator }]} validateDebounce={1000}>
          <Input />
        </InfoField>
      </Form>,
    );

    fireEvent.change(container.querySelector('input'), {
      target: {
        value: 'light',
      },
    });

    // Debounce should wait
    await act(async () => {
      await Promise.resolve();
      jest.advanceTimersByTime(900);
      await Promise.resolve();
    });
    expect(validator).not.toHaveBeenCalled();

    // Debounce should work
    await act(async () => {
      await Promise.resolve();
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    expect(validator).toHaveBeenCalled();

    // `validateFields` should ignore `validateDebounce`
    validator.mockReset();
    formRef.current.validateFields();

    await act(async () => {
      await Promise.resolve();
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });
    expect(validator).toHaveBeenCalled();

    // `submit` should ignore `validateDebounce`
    validator.mockReset();
    fireEvent.submit(container.querySelector('form'));

    await act(async () => {
      await Promise.resolve();
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });
    expect(validator).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('dirty', async () => {
    jest.useFakeTimers();

    const formRef = React.createRef<FormInstance>();

    const Demo = ({ touchMessage, validateMessage }) => (
      <Form ref={formRef}>
        <InfoField name="touch" rules={[{ required: true, message: touchMessage }]}>
          <Input />
        </InfoField>
        <InfoField name="validate" rules={[{ required: true, message: validateMessage }]}>
          <Input />
        </InfoField>
        <InfoField name="noop" rules={[{ required: true, message: 'noop' }]}>
          <Input />
        </InfoField>
      </Form>
    );

    const { container, rerender } = render(
      <Demo touchMessage="touch" validateMessage="validate" />,
    );

    fireEvent.change(container.querySelectorAll('input')[0], {
      target: {
        value: 'light',
      },
    });
    fireEvent.change(container.querySelectorAll('input')[0], {
      target: {
        value: '',
      },
    });

    formRef.current.validateFields(['validate']);

    await waitFakeTime();
    matchError(container.querySelectorAll<HTMLDivElement>('.field')[0], `touch`);
    matchError(container.querySelectorAll<HTMLDivElement>('.field')[1], `validate`);
    matchError(container.querySelectorAll<HTMLDivElement>('.field')[2], false);

    // Revalidate
    rerender(<Demo touchMessage="new_touch" validateMessage="new_validate" />);
    formRef.current.validateFields({ dirty: true });

    await waitFakeTime();
    matchError(container.querySelectorAll<HTMLDivElement>('.field')[0], `new_touch`);
    matchError(container.querySelectorAll<HTMLDivElement>('.field')[1], `new_validate`);
    matchError(container.querySelectorAll<HTMLDivElement>('.field')[2], false);

    jest.useRealTimers();
  });

  it('should handle escaped and unescaped variables correctly', async () => {
    const { container } = render(
      <Form>
        <InfoField
          messageVariables={{
            name: 'bamboo',
          }}
          name="test"
          rules={[
            {
              validator: () => Promise.reject(new Error('\\${name} should be ${name}!')),
            },
          ]}
        >
          <Input />
        </InfoField>
      </Form>,
    );

    // Wrong value
    await changeValue(getInput(container), 'light');
    matchError(container, '${name} should be bamboo!');
  });
});

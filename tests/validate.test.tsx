/* eslint-disable no-template-curly-in-string */
import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import Form, { Field, useForm } from '../src';
import InfoField, { Input } from './common/InfoField';
import { changeValue, matchError, getField } from './common';
import timeout from './common/timeout';

describe('Form.Validate', () => {
  it('required', async () => {
    let form;
    const wrapper = mount(
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

    await changeValue(wrapper, '');
    matchError(wrapper, true);
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
    function renderForm(messages, fieldProps = {}) {
      return mount(
        <Form validateMessages={messages}>
          <InfoField name="username" rules={[{ required: true }]} {...fieldProps} />
        </Form>,
      );
    }

    it('template message', async () => {
      const wrapper = renderForm({ required: "You miss '${name}'!" });

      await changeValue(wrapper, '');
      matchError(wrapper, "You miss 'username'!");
    });

    it('function message', async () => {
      const wrapper = renderForm({ required: () => 'Bamboo & Light' });

      await changeValue(wrapper, '');
      matchError(wrapper, 'Bamboo & Light');
    });

    it('messageVariables', async () => {
      const wrapper = renderForm(
        { required: "You miss '${label}'!" },
        {
          messageVariables: {
            label: 'Light&Bamboo',
          },
        },
      );

      await changeValue(wrapper, '');
      matchError(wrapper, "You miss 'Light&Bamboo'!");
    });
  });

  describe('customize validator', () => {
    it('work', async () => {
      const wrapper = mount(
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
      await changeValue(wrapper, 'light');
      matchError(wrapper, 'should be bamboo!');

      // Correct value
      await changeValue(wrapper, 'bamboo');
      matchError(wrapper, false);
    });

    it('should error if throw in validate', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const wrapper = mount(
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

      await changeValue(wrapper, 'light');
      matchError(wrapper, "Validation error on field 'username'");

      const consoleErr = String(errorSpy.mock.calls[0][0]);
      expect(consoleErr).toBe('Error: without thinking');

      errorSpy.mockRestore();
    });
  });

  it('fail validate if throw', async () => {
    const wrapper = mount(
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
    await changeValue(wrapper, 'light');
    matchError(wrapper, "Validation error on field 'username'");
  });

  describe('callback', () => {
    it('warning if not return promise', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const wrapper = mount(
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

      await changeValue(wrapper, 'light');
      expect(errorSpy).toHaveBeenCalledWith(
        'Warning: `callback` is deprecated. Please return a promise instead.',
      );

      errorSpy.mockRestore();
    });

    it('warning if both promise & callback exist', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const wrapper = mount(
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

      await changeValue(wrapper, 'light');
      expect(errorSpy).toHaveBeenCalledWith(
        'Warning: Your validator function has already return a promise. `callback` will be ignored.',
      );

      errorSpy.mockRestore();
    });
  });

  describe('validateTrigger', () => {
    it('normal', async () => {
      let form;
      const wrapper = mount(
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

      await changeValue(getField(wrapper, 'test'), '');
      expect(form.getFieldError('test')).toEqual(['Not pass']);

      wrapper.find('input').simulate('blur');
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

      const wrapper = mount(<Test />);

      getField(wrapper).simulate('blur');
      await timeout();
      expect(form.getFieldError('title')).toEqual(['Title is required']);

      wrapper.setProps({ init: true });
      await changeValue(getField(wrapper), '1');
      expect(form.getFieldValue('title')).toBe('1');
      expect(form.getFieldError('title')).toEqual(['Title should be 3+ characters']);
    });

    it('form context', async () => {
      const wrapper = mount(
        <Form validateTrigger="onBlur">
          <InfoField name="test" rules={[{ required: true }]} />
        </Form>,
      );

      // Not trigger validate since Form set `onBlur`
      await changeValue(getField(wrapper), '');
      matchError(wrapper, false);

      // Trigger onBlur
      wrapper.find('input').simulate('blur');
      await timeout();
      wrapper.update();
      matchError(wrapper, true);

      // Update Form context
      wrapper.setProps({ validateTrigger: 'onChange' });
      await changeValue(getField(wrapper), '1');
      matchError(wrapper, false);
    });
  });

  describe('validate only accept exist fields', () => {
    it('skip init value', async () => {
      let form;
      const onFinish = jest.fn();

      const wrapper = mount(
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
      wrapper.find('button').simulate('submit');
      await timeout();
      expect(onFinish).toHaveBeenCalledWith({ user: 'light' });
    });

    it('remove from fields', async () => {
      const onFinish = jest.fn();
      const wrapper = mount(
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
      wrapper.find('button').simulate('submit');
      await timeout();
      expect(onFinish).toHaveBeenCalledWith({ switch: true, ignore: 'test' });
      onFinish.mockReset();

      // Hide one
      wrapper.find('input.switch').simulate('change', {
        target: {
          checked: false,
        },
      });
      wrapper.find('button').simulate('submit');
      await timeout();
      expect(onFinish).toHaveBeenCalledWith({ switch: false });
    });

    it('validateFields should not pass when validateFirst is set', async () => {
      let form;

      mount(
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

    const wrapper = mount(
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

    wrapper.find('form').simulate('submit');
    await timeout();
    expect(errorSpy.mock.calls[0][0].message).toEqual('should console this');

    errorSpy.mockRestore();
  });

  describe('validateFirst', () => {
    it('work', async () => {
      let form;
      let canEnd = false;
      const onFinish = jest.fn();

      const wrapper = mount(
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
      await changeValue(wrapper, '');
      matchError(wrapper, true);
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
      await changeValue(wrapper, 'test');
      wrapper.find('form').simulate('submit');
      await timeout();

      matchError(wrapper, false);
      expect(onFinish).toHaveBeenCalledWith({ username: 'test' });
    });

    [
      { name: 'serialization', first: true, second: false, validateFirst: true },
      { name: 'parallel', first: true, second: true, validateFirst: 'parallel' as const },
    ].forEach(({ name, first, second, validateFirst }) => {
      it(name, async () => {
        let ruleFirst = false;
        let ruleSecond = false;

        const wrapper = mount(
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

        await changeValue(wrapper, 'test');
        await timeout();

        wrapper.update();
        matchError(wrapper, 'failed first');

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
    const wrapper = mount(<Demo />);

    await changeValue(wrapper, '233');
    matchError(wrapper, true);

    wrapper.find('button').simulate('click');
    wrapper.update();
    matchError(wrapper, false);
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

    const wrapper = mount(<Demo />);
    renderProps.mockReset();

    // Should trigger validating
    wrapper.find('button').simulate('click');
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

    const wrapper = mount(<Demo />);

    expect(failedTriggerTimes).toEqual(0);
    expect(passedTriggerTimes).toEqual(0);

    // Failed of second input
    await changeValue(getField(wrapper, 1), '');
    matchError(getField(wrapper, 2), true);

    expect(failedTriggerTimes).toEqual(1);
    expect(passedTriggerTimes).toEqual(0);

    // Changed first to trigger update
    await changeValue(getField(wrapper, 0), 'light');
    matchError(getField(wrapper, 2), false);

    expect(failedTriggerTimes).toEqual(1);
    expect(passedTriggerTimes).toEqual(1);

    // Remove should not trigger validate
    await changeValue(getField(wrapper, 0), 'removed');

    expect(failedTriggerTimes).toEqual(1);
    expect(passedTriggerTimes).toEqual(1);
  });

  it('validate support recursive', async () => {
    let form;
    const wrapper = mount(
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

    wrapper
      .find('input')
      .at(0)
      .simulate('change', { target: { value: '' } });
    await act(async () => {
      await timeout();
    });
    wrapper.update();

    try {
      const values = await form.validateFields(['username'], { recursive: true });
      expect(values.username.do).toBe('');
    } catch (error) {
      expect(error.errorFields.length).toBe(2);
    }

    const values = await form.validateFields(['username']);
    expect(values.username.do).toBe('');
  });

  it('not trigger validator', async () => {
    const wrapper = mount(
      <div>
        <Form>
          <InfoField name="user" rules={[{ required: true }]} />
        </Form>
      </div>,
    );
    await changeValue(getField(wrapper, 0), ['light']);
    matchError(wrapper, false);
  });
});
/* eslint-enable no-template-curly-in-string */

/* eslint-disable no-template-curly-in-string */
import React from 'react';
import { mount } from 'enzyme';
import Form, { Field } from '../src';
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
      },
    ]);

    // Contains not exists
    expect(form.getFieldsError(['username', 'not-exist'])).toEqual([
      {
        name: ['username'],
        errors: ["'username' is required"],
      },
      {
        name: ['not-exist'],
        errors: [],
      },
    ]);
  });

  it('messageTemplatePropsName', async () => {
    let form;
    const wrapper = mount(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
        >
          <InfoField
            name="username"
            label="用户名"
            messageTemplatePropsName="label"
            rules={[{ required: true }]}
          />
        </Form>
      </div>,
    );

    await changeValue(wrapper, '');
    matchError(wrapper, true);
    expect(form.getFieldError('username')).toEqual(["'用户名' is required"]);
  });

  describe('validateMessages', () => {
    function renderForm(messages) {
      return mount(
        <Form validateMessages={messages}>
          <InfoField name="username" rules={[{ required: true }]} />
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
  });

  describe('messageTemplatePropsName validateMessages', () => {
    function renderForm(messages) {
      return mount(
        <Form validateMessages={messages}>
          <InfoField
            name="username"
            label="用户名"
            messageTemplatePropsName="label"
            rules={[{ required: true }]}
          />
        </Form>,
      );
    }

    it('template message', async () => {
      const wrapper = renderForm({ required: "你没有输入 '${name}'!" });

      await changeValue(wrapper, '');
      matchError(wrapper, "你没有输入 '用户名'!");
    });

    it('function message', async () => {
      const wrapper = renderForm({ required: () => 'Bamboo & Light' });

      await changeValue(wrapper, '');
      matchError(wrapper, 'Bamboo & Light');
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

  it('validate only accept exist fields', async () => {
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

  it('validateFirst', async () => {
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
                      resolve();
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
});
/* eslint-enable no-template-curly-in-string */

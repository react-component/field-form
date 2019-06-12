import React from 'react';
import { mount } from 'enzyme';
import Form from '../src';
import InfoField from './common/InfoField';
import { changeValue, matchError } from './common';

describe('validate', () => {
  it('required', async () => {
    const wrapper = mount(
      <Form>
        <InfoField name="username" rules={[{ required: true }]} />
      </Form>,
    );

    await changeValue(wrapper, '');
    matchError(wrapper, true);
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

  it('customize validator', async () => {
    const wrapper = mount(
      <Form>
        <InfoField
          name="username"
          rules={[
            {
              async validator(_, value) {
                if (value !== 'bamboo') {
                  return Promise.reject('should be bamboo!');
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
});

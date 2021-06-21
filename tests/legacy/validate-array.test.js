import React from 'react';
import { mount } from 'enzyme';
import Form, { Field } from '../../src';
import { matchArray } from '../common';

describe('legacy.validate-array', () => {
  const MyInput = ({ value = [''], onChange, ...props }) => (
    <input
      {...props}
      onChange={e => {
        onChange(e.target.value.split(','));
      }}
      value={value.join(',')}
    />
  );

  it('forceValidate works', async () => {
    let form;

    mount(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
          initialValues={{ url_array: ['test'] }}
        >
          <Field
            name="url_array"
            rules={[
              {
                required: true,
                message: 'The tags must be urls',
                type: 'array',
                defaultField: { type: 'url' },
              },
            ]}
          >
            <MyInput />
          </Field>
        </Form>
      </div>,
    );

    try {
      await form.validateFields();
      throw new Error('Should not pass!');
    } catch ({ errorFields }) {
      matchArray(
        errorFields,
        [{ name: ['url_array'], errors: ["'url_array.0' is not a valid url"] }],
        'name',
      );
    }
  });

  it('validates an unrequired type array which is undefined', async () => {
    let form;

    mount(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
        >
          <Field
            name="unrequired_array"
            rules={[
              {
                message: 'The tags must be strings',
                type: 'array',
                defaultField: { type: 'string' },
              },
            ]}
          >
            <MyInput />
          </Field>
        </Form>
      </div>,
    );

    const values = await form.validateFields();
    expect(values.unrequired_array).toBe(undefined);
  });
});

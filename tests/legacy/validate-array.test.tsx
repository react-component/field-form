import React from 'react';
import { render } from '@testing-library/react';
import type { FormInstance } from '../../src';
import Form, { Field } from '../../src';
import { matchArray } from '../common';

describe('legacy.validate-array', () => {
  const MyInput: React.FC<any> = ({ value = [''], onChange, ...props }) => (
    <input
      {...props}
      value={value.join(',')}
      onChange={e => {
        onChange(e.target.value.split(','));
      }}
    />
  );

  it('forceValidate works', async () => {
    const form = React.createRef<FormInstance>();

    render(
      <div>
        <Form ref={form} initialValues={{ url_array: ['test'] }}>
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
      await form.current?.validateFields();
      throw new Error('Should not pass!');
    } catch ({ errorFields }) {
      matchArray(
        errorFields,
        [{ name: ['url_array'], errors: ["'url_array.0' is not a valid url"] }],
        'name',
      );
    }
  });

  // https://github.com/ant-design/ant-design/issues/36436
  it('antd issue #36436', async () => {
    const form = React.createRef<FormInstance>();
    render(
      <div>
        <Form ref={form}>
          <Field name="tags" rules={[{ type: 'array', defaultField: { type: 'string' } }]}>
            <input />
          </Field>
        </Form>
      </div>,
    );
    expect(async () => {
      await form.current?.validateFields();
    }).not.toThrow();
  });
});

import React from 'react';
import { mount } from 'enzyme';
import Form, { Field } from '../src';
import timeout from './common/timeout';

describe('useWatch', () => {
  it('base', async () => {
    const Demo = () => {
      const [form] = Form.useForm();
      const values = Form.useWatch({ form, dependencies: ['name'] });

      return (
        <div>
          <Form form={form}>
            <Field name="name" initialValue="bamboo" />
          </Form>
          <div className="values">{JSON.stringify(values)}</div>
        </div>
      );
    };
    const wrapper = mount(<Demo />);
    await timeout();
    expect(wrapper.find('.values').last().getDOMNode().innerHTML).toBe(
      JSON.stringify({ name: 'bamboo' }),
    );
  });
});

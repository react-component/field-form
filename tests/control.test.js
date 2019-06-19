import React from 'react';
import { mount } from 'enzyme';
import Form from '../src';
import InfoField from './common/InfoField';

describe('Control', () => {
  it('fields', () => {
    const wrapper = mount(
      <Form>
        <InfoField name="username" />
      </Form>,
    );

    wrapper.setProps({
      fields: [{ name: 'username', value: 'Bamboo' }],
    });

    expect(wrapper.find('input').props().value).toEqual('Bamboo');
  });
});

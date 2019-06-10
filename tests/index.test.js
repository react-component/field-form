import React from 'react';
import { mount } from 'enzyme';
import Form from '../src';

describe('Basic', () => {
  it('create form', () => {
    const wrapper = mount(<Form />);
    expect(wrapper.find('form')).toBeTruthy();
  });
});

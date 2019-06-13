import timeout from './timeout';
import InfoField, { Input } from './InfoField';
import { Field } from '../../src';

export async function changeValue(wrapper, value) {
  wrapper.find('input').simulate('change', { target: { value } });
  await timeout();
  wrapper.update();
}

export function matchError(wrapper, error) {
  if (error) {
    expect(wrapper.find('.errors li').length).toBeTruthy();
  } else {
    expect(wrapper.find('.errors li').length).toBeFalsy();
  }

  if (error && typeof error !== 'boolean') {
    expect(wrapper.find('.errors li').text()).toBe(error);
  }
}

export function getField(wrapper, index = 0) {
  if (typeof index === 'number') {
    return wrapper.find(Field).at(index);
  }

  const fields = wrapper.find(Field);
  for (let i = 0; i < fields.length; i += 1) {
    const field = fields.at(i);
    if (index === field.props().name) {
      return field;
    }
  }
  return null;
}

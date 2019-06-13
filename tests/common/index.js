import timeout from './timeout';
import InfoField, { Input } from './InfoField';

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
  return wrapper.find(InfoField).at(index);
}

export function getInput(wrapper, index = 0) {
  return wrapper.find(Input).at(index);
}

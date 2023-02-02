import { act } from 'react-dom/test-utils';
import type { ReactWrapper } from 'enzyme';
import timeout from './timeout';
import { Field } from '../../src';
import { getNamePath, matchNamePath } from '../../src/utils/valueUtil';

export async function changeValue(wrapper: ReactWrapper, value: string | string[]) {
  wrapper.find('input').simulate('change', { target: { value } });
  await act(async () => {
    await timeout();
  });
  wrapper.update();
}

export function matchError(
  wrapper: ReactWrapper,
  error?: boolean | string,
  warning?: boolean | string,
) {
  // Error
  if (error) {
    expect(wrapper.find('.errors li').length).toBeTruthy();
  } else {
    expect(wrapper.find('.errors li').length).toBeFalsy();
  }

  if (error && typeof error !== 'boolean') {
    expect(wrapper.find('.errors li').text()).toBe(error);
  }

  // Warning
  if (warning) {
    expect(wrapper.find('.warnings li').length).toBeTruthy();
  } else {
    expect(wrapper.find('.warnings li').length).toBeFalsy();
  }

  if (warning && typeof warning !== 'boolean') {
    expect(wrapper.find('.warnings li').text()).toBe(warning);
  }
}

export function getField(wrapper: ReactWrapper, index: string | number | string[] = 0) {
  if (typeof index === 'number') {
    return wrapper.find(Field).at(index);
  }
  const name = getNamePath(index);
  const fields = wrapper.find(Field);
  for (let i = 0; i < fields.length; i += 1) {
    const field = fields.at(i);
    const fieldName = getNamePath((field.props() as any).name);
    if (matchNamePath(name, fieldName)) {
      return field;
    }
  }
  return null;
}

export function matchArray(source: any[], target: any[], matchKey: React.Key) {
  expect(matchKey).toBeTruthy();

  try {
    expect(source.length).toBe(target.length);
  } catch (err) {
    throw new Error(
      `
        Array length not match.
        source(${source.length}): ${JSON.stringify(source)}
        target(${target.length}): ${JSON.stringify(target)}
      `.trim(),
    );
  }

  target.forEach(tgt => {
    const matchValue = tgt[matchKey];
    const src = source.find(item => matchNamePath(item[matchKey], matchValue));
    expect(src).toBeTruthy();
    expect(src).toMatchObject(tgt);
  });
}

export async function validateFields(form, ...args) {
  await act(async () => {
    await form.validateFields(...args);
  });
}

import { act } from 'react-dom/test-utils';
import { mountNameByPath, matchNamePath } from '../../src/utils/valueUtil';
import { fireEvent, waitFor } from '../../tests/test-utils';
import type { NamePath } from '../../src/interface';
import timeout from './timeout';

export async function changeValue(
  input: HTMLElement,
  value: string | string[],
  ignoreTest = false,
): Promise<void> {
  expect(input).toBeTruthy();

  fireEvent.focus(input);
  // Force change value, because if empty and set empty, change not trigger effetct in test
  if (!value) {
    // changeValue called if "" (empty) value
    fireEvent.change(input, { target: { value: `${value}any` } });
    await timeout();
  }

  fireEvent.change(input, { target: { value } });
  if (!ignoreTest) {
    await waitFor(() => expect((input as HTMLInputElement).value).toBe(value));
  }
}

export function matchError(
  wrapper: HTMLElement,
  error?: boolean | string,
  warning?: boolean | string,
) {
  // Error
  const errorsFound = wrapper.querySelectorAll('.errors li').length;
  expect(!!errorsFound).toBe(!!error);

  if (error && typeof error !== 'boolean') {
    const errorFound = wrapper.querySelector('.errors li').textContent;
    expect(errorFound).toBe(error);
  }

  // Warning
  const warningsFound = wrapper.querySelectorAll('.warnings li').length;
  expect(!!warningsFound).toBe(!!warning);

  if (warning && typeof warning !== 'boolean') {
    const warningFound = wrapper.querySelector('.warnings li').textContent;
    expect(warningFound).toBe(warning);
  }
}

export function getField(
  wrapper: HTMLElement | Element,
  index: NamePath | null = 0,
): HTMLInputElement | null {
  let name = index;
  if (Array.isArray(index)) {
    name = mountNameByPath(index);
  }
  if (typeof index === 'number') {
    return wrapper.querySelectorAll('form input')?.item(index) as HTMLInputElement;
  }
  return wrapper.querySelector(`form input[name="${name}"]`);
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

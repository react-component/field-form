import timeout from './timeout';
import { matchNamePath } from '../../src/utils/valueUtil';
import { fireEvent, act } from '@testing-library/react';

export function getInput(
  container: HTMLElement,
  dataNameOrIndex?: string | number,
  parentField = false,
): HTMLInputElement {
  let ele: HTMLInputElement | null = null;

  if (!dataNameOrIndex) {
    ele = container.querySelector('input');
  } else if (typeof dataNameOrIndex === 'number') {
    ele = container.querySelectorAll('input')[dataNameOrIndex];
  } else {
    ele = container.querySelector(`[data-name="${dataNameOrIndex}"]`);
  }

  if (parentField) {
    return ele.closest('.field');
  }

  return ele!;
}

export async function changeValue(wrapper: HTMLElement, value: string | string[]) {
  const values = Array.isArray(value) ? value : [value];

  for (let i = 0; i < values.length; i += 1) {
    fireEvent.change(wrapper, { target: { value: values[i] } });

    await act(async () => {
      await timeout();
    });
  }

  return;
}

export function matchError(
  wrapper: HTMLElement,
  error?: boolean | string,
  warning?: boolean | string,
) {
  // Error
  if (error) {
    expect(wrapper.querySelector('.errors li')).toBeTruthy();
  } else {
    expect(wrapper.querySelector('.errors li')).toBeFalsy();
  }

  if (error && typeof error !== 'boolean') {
    expect(wrapper.querySelector('.errors li').textContent).toBe(error);
  }

  // Warning
  if (warning) {
    expect(wrapper.querySelector('.warnings li')).toBeTruthy();
  } else {
    expect(wrapper.querySelector('.warnings li')).toBeFalsy();
  }

  if (warning && typeof warning !== 'boolean') {
    expect(wrapper.querySelector('.warnings li').textContent).toBe(warning);
  }

  return;
}

export function matchArray(source: any[], target: any[], matchKey: string | number) {
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

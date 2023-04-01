import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, renderHook, act } from './test-utils';

describe('render hooks - test', () => {
  it('should render', () => {
    const { getByText } = render(<div>test</div>);
    expect(getByText('test')).toBeDefined();
  });

  it('should render hook', () => {
    const { result } = renderHook(() => {
      const [value, setValue] = useState(0);
      return { value, setValue };
    });

    expect(result.current.value).toBe(0);
  });

  it('should render hook with act', () => {
    const { result } = renderHook(() => {
      const [value, setValue] = useState(0);
      return { value, setValue };
    });

    act(() => {
      result.current.setValue(1);
    });

    expect(result.current.value).toBe(1);
  });
});

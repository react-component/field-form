import { cleanup, render, RenderOptions, RenderResult } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  (console.log as jest.Mock).mockRestore();
});

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

// afterEach(() => {});

const customRender = (
  ui: React.ReactElement, //
  options: RenderOptions = {},
): RenderResult =>
  render(ui, {
    // wrap provider(s) here if needed
    wrapper: ({ children }) => children,
    ...options,
  });
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// override render export
export { customRender as render };

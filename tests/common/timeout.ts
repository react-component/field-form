import { act } from '@testing-library/react';

export default async (timeout: number = 10) => {
  return new Promise<void>(resolve => {
    setTimeout(resolve, timeout);
  });
};

export async function waitFakeTime(timeout: number = 10) {
  await act(async () => {
    await new Promise<void>(resolve => {
      setTimeout(resolve, 11);
      jest.advanceTimersByTime(11);
    });
  });

  await act(async () => {
    await new Promise<void>(resolve => {
      setTimeout(resolve, 11);
      jest.advanceTimersByTime(11);
    });
  });

  await act(async () => {
    await Promise.resolve();
    jest.advanceTimersByTime(timeout);
    await Promise.resolve();
  });
}

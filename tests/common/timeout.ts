export default async (timeout: number = 10) => {
  return new Promise<void>(resolve => {
    setTimeout(resolve, timeout);
  });
};

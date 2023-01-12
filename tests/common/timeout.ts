export default (timeout: number = 0) => {
  return new Promise<void>(resolve => {
    setTimeout(resolve, timeout);
  });
};

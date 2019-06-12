export default (timeout: number = 0) => {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
};

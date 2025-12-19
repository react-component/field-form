import type { FieldError } from '../interface';

export function allPromiseFinish(promiseList: Promise<FieldError>[]): Promise<FieldError[]> {
  let hasError = false;
  let count = promiseList.length;
  const results: FieldError[] = [];

  if (!promiseList.length) {
    return Promise.resolve([]);
  }

  return new Promise((resolve, reject) => {
    promiseList.forEach((promise, index) => {
      promise
        .catch(e => {
          hasError = true;
          return e;
        })
        .then(result => {
          count -= 1;
          results[index] = result;

          if (count > 0) {
            return;
          }

          if (hasError) {
            reject(results);
          }
          resolve(results);
        });
    });
  });
}

/**
 * Call action with delay in macro task.
 */
export const macroTask = (fn: VoidFunction) => {
  const channel = new MessageChannel();
  channel.port1.onmessage = fn;
  channel.port2.postMessage(null);
};

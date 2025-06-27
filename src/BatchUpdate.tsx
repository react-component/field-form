import * as React from 'react';

export type BatchTask = (key: string, callback: VoidFunction) => void;

export interface BatchUpdateRef {
  batch: BatchTask;
}

const BatchUpdate = React.forwardRef<BatchUpdateRef>((_, ref) => {
  const [batchInfo, setBatchInfo] = React.useState<Record<string, VoidFunction>>({});

  React.useLayoutEffect(() => {
    const keys = Object.keys(batchInfo);
    if (keys.length) {
      keys.forEach(key => {
        batchInfo[key]?.();
      });
      setBatchInfo({});
    }
  }, [batchInfo]);

  React.useImperativeHandle(ref, () => ({
    batch: (key, callback) => {
      setBatchInfo(ori => ({
        ...ori,
        [key]: callback,
      }));
    },
  }));

  return null;
});

export default BatchUpdate;

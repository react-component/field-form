import { matchNamePath } from '../utils/valueUtil';
import type { InternalNamePath, WatchCallBack } from '../interface';
import type { FormStore } from './useForm';

/**
 * Call action with delay in macro task.
 */
const macroTask = (fn: VoidFunction) => {
  const channel = new MessageChannel();
  channel.port1.onmessage = fn;
  channel.port2.postMessage(null);
};

export default class WatcherCenter {
  namePathList: InternalNamePath[] = [];
  taskId: number = 0;

  watcherList = new Set<WatchCallBack>();
  form: FormStore;

  constructor(form: FormStore) {
    this.form = form;
  }

  public register(callback: WatchCallBack): VoidFunction {
    this.watcherList.add(callback);

    return () => {
      this.watcherList.delete(callback);
    };
  }

  public notify(namePath: InternalNamePath[]) {
    // Insert with deduplication
    namePath.forEach(path => {
      if (this.namePathList.every(exist => !matchNamePath(exist, path))) {
        this.namePathList.push(path);
      }
    });

    this.doBatch();
  }

  private doBatch() {
    this.taskId += 1;
    const currentId = this.taskId;

    macroTask(() => {
      if (currentId === this.taskId && this.watcherList.size) {
        const formInst = this.form.getForm();
        const values = formInst.getFieldsValue();
        const allValues = formInst.getFieldsValue(true);

        this.watcherList.forEach(callback => {
          callback(values, allValues, this.namePathList);
        });

        this.namePathList = [];
      }
    });
  }
}

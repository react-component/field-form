import { InternalNamePath } from '../interface';
import { matchNamePath } from './valueUtil';

interface KV<T> {
  key: InternalNamePath;
  value: T;
}

/**
 * NameMap like a `Map` but accepts `string[]` as key.
 */
class NameMap<T> {
  private list: KV<T>[] = [];

  public set(key: InternalNamePath, value: T) {
    const index = this.list.findIndex(item => matchNamePath(item.key, key));
    if (index !== -1) {
      this.list[index].value = value;
    } else {
      this.list.push({
        key,
        value,
      });
    }
  }

  public get(key: InternalNamePath) {
    const result = this.list.find(item => matchNamePath(item.key, key));
    return result && result.value;
  }

  public update(key: InternalNamePath, updater: (origin: T) => T | null) {
    const origin = this.get(key) as T;
    const next = updater(origin);

    if (!next) {
      this.delete(key);
    } else {
      this.set(key, next);
    }
  }

  public delete(key: InternalNamePath) {
    this.list = this.list.filter(item => !matchNamePath(item.key, key));
  }

  public map<U>(callback: (kv: KV<T>) => U) {
    return this.list.map(callback);
  }

  public toJSON(): { [name: string]: T } {
    const json: { [name: string]: T } = {};
    this.map(({ key, value }) => {
      json[key.join('.')] = value;
      return null;
    });

    return json;
  }
}

export default NameMap;

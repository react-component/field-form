import { InternalNamePath } from '../interface';

const INTERNAL_SPLIT = '__FORM__SPLIT__';

interface KV<T> {
  key: InternalNamePath;
  value: T;
}

/**
 * NameMap like a `Map` but accepts `string[]` as key.
 */
class NameMap<T> {
  // private list: KV<T>[] = [];

  private cache = new Map<string, KV<T>>();

  public set(key: InternalNamePath, value: T) {
    this.cache.set(key.join(INTERNAL_SPLIT), { key, value });
  }

  public get(key: InternalNamePath): T {
    const ret = this.cache.get(key.join(INTERNAL_SPLIT));
    return ret && ret.value;
  }

  public update(key: InternalNamePath, updater: (origin: T) => T | null) {
    const origin = this.get(key);
    const next = updater(origin);

    if (!next) {
      this.delete(key);
    } else {
      this.set(key, next);
    }
  }

  public delete(key: InternalNamePath) {
    this.cache.delete(key.join(INTERNAL_SPLIT));
  }

  public map<U>(callback: (kv: KV<T>) => U) {
    return [...this.cache.values()].map(callback);
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

import type { InternalNamePath } from '../interface';

interface KV<T> {
  key: InternalNamePath;
  value: T;
}

const SPLIT = '__@field_split__';

/**
 * Convert name path into string to fast the fetch speed of Map.
 */
function normalize(namePath: InternalNamePath): string {
  return (
    namePath
      .map(cell => `${typeof cell}:${cell}`)
      // Magic split
      .join(SPLIT)
  );
}

/**
 * NameMap like a `Map` but accepts `string[]` as key.
 */
class NameMap<T> {
  private kvs = new Map<string, T>();

  public set(key: InternalNamePath, value: T) {
    this.kvs.set(normalize(key), value);
  }

  public get(key: InternalNamePath) {
    return this.kvs.get(normalize(key));
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
    this.kvs.delete(normalize(key));
  }

  // Since we only use this in test, let simply realize this
  public map<U>(callback: (kv: KV<T>) => U) {
    return [...this.kvs.entries()].map(([key, value]) => {
      const cells = key.split(SPLIT);

      return callback({
        key: cells.map(cell => {
          const [, type, unit] = cell.match(/^([^:]*):(.*)$/);
          return type === 'number' ? Number(unit) : unit;
        }),
        value,
      });
    });
  }

  public toJSON(): Record<string, T> {
    const json: Record<string, T> = {};
    this.map(({ key, value }) => {
      json[key.join('.')] = value;
      return null;
    });

    return json;
  }
}

export default NameMap;

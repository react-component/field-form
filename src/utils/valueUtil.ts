import get from 'rc-util/lib/utils/get';
import set from 'rc-util/lib/utils/set';
import { InternalNamePath, NamePath, Store, StoreValue, EventArgs } from '../interface';
import { toArray } from './typeUtil';

/**
 * Convert name to internal supported format.
 * This function should keep since we still thinking if need support like `a.b.c` format.
 * 'a' => ['a']
 * 123 => [123]
 * ['a', 123] => ['a', 123]
 */
export function getNamePath(path: NamePath | null): InternalNamePath {
  return toArray(path);
}

export function getValue(store: Store, namePath: InternalNamePath) {
  const value = get(store, namePath);
  return value;
}

export function setValue(store: Store, namePath: InternalNamePath, value: StoreValue): Store {
  const newStore = set(store, namePath, value);
  return newStore;
}

export function cloneByNamePathList(store: Store, namePathList: InternalNamePath[]): Store {
  let newStore = {};
  namePathList.forEach(namePath => {
    const value = getValue(store, namePath);
    newStore = setValue(newStore, namePath, value);
  });

  return newStore;
}

export function containsNamePath(namePathList: InternalNamePath[], namePath: InternalNamePath) {
  return namePathList && namePathList.some(path => matchNamePath(path, namePath));
}

function isObject(obj: StoreValue) {
  return typeof obj === 'object' && obj !== null && Object.getPrototypeOf(obj) === Object.prototype;
}

/**
 * Copy values into store and return a new values object
 * ({ a: 1, b: { c: 2 } }, { a: 4, b: { d: 5 } }) => { a: 4, b: { c: 2, d: 5 } }
 */
function internalSetValues<T>(store: T, values: T): T {
  const newStore: T = (Array.isArray(store) ? [...store] : { ...store }) as T;

  if (!values) {
    return newStore;
  }

  Object.keys(values).forEach(key => {
    const prevValue = newStore[key];
    const value = values[key];

    // If both are object (but target is not array), we use recursion to set deep value
    const recursive = isObject(prevValue) && isObject(value);
    newStore[key] = recursive ? internalSetValues(prevValue, value || {}) : value;
  });

  return newStore;
}

export function setValues<T>(store: T, ...restValues: T[]): T {
  return restValues.reduce(
    (current: T, newStore: T): T => internalSetValues<T>(current, newStore),
    store,
  );
}

export function matchNamePath(
  namePath: InternalNamePath,
  changedNamePath: InternalNamePath | null,
) {
  if (!namePath || !changedNamePath || namePath.length !== changedNamePath.length) {
    return false;
  }
  return namePath.every((nameUnit, i) => changedNamePath[i] === nameUnit);
}

// Like `shallowEqual`, but we not check the data which may cause re-render
type SimilarObject = string | number | {};
export function isSimilar(source: SimilarObject, target: SimilarObject) {
  if (source === target) {
    return true;
  }

  if ((!source && target) || (source && !target)) {
    return false;
  }

  if (!source || !target || typeof source !== 'object' || typeof target !== 'object') {
    return false;
  }

  const sourceKeys = Object.keys(source);
  const targetKeys = Object.keys(target);
  const keys = new Set([...sourceKeys, ...targetKeys]);

  return [...keys].every(key => {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (typeof sourceValue === 'function' && typeof targetValue === 'function') {
      return true;
    }
    return sourceValue === targetValue;
  });
}

export function defaultGetValueFromEvent(valuePropName: string, ...args: EventArgs) {
  const event = args[0];
  if (event && event.target && valuePropName in event.target) {
    return (event.target as HTMLInputElement)[valuePropName];
  }

  return event;
}

/**
 * Moves an array item from one position in an array to another.
 *
 * Note: This is a pure function so a new array will be returned, instead
 * of altering the array argument.
 *
 * @param array         Array in which to move an item.         (required)
 * @param moveIndex     The index of the item to move.          (required)
 * @param toIndex       The index to move item at moveIndex to. (required)
 */
export function move<T>(array: T[], moveIndex: number, toIndex: number) {
  const { length } = array;
  if (moveIndex < 0 || moveIndex >= length || toIndex < 0 || toIndex >= length) {
    return array;
  }
  const item = array[moveIndex];
  const diff = moveIndex - toIndex;

  if (diff > 0) {
    // move left
    return [
      ...array.slice(0, toIndex),
      item,
      ...array.slice(toIndex, moveIndex),
      ...array.slice(moveIndex + 1, length),
    ];
  }
  if (diff < 0) {
    // move right
    return [
      ...array.slice(0, moveIndex),
      ...array.slice(moveIndex + 1, toIndex + 1),
      item,
      ...array.slice(toIndex + 1, length),
    ];
  }
  return array;
}

import getValue from 'rc-util/lib/utils/get';
import setValue from 'rc-util/lib/utils/set';
import type { InternalNamePath, NamePath, Store, EventArgs } from '../interface';
import { toArray } from './typeUtil';

export { getValue, setValue };

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

export function cloneByNamePathList(store: Store, namePathList: InternalNamePath[]): Store {
  let newStore = {};
  namePathList.forEach(namePath => {
    const value = getValue(store, namePath);
    newStore = setValue(newStore, namePath, value);
  });

  return newStore;
}

/**
 * Check if `namePathList` includes `namePath`.
 * @param namePathList A list of `InternalNamePath[]`
 * @param namePath Compare `InternalNamePath`
 * @param partialMatch True will make `[a, b]` match `[a, b, c]`
 */
export function containsNamePath(
  namePathList: InternalNamePath[],
  namePath: InternalNamePath,
  partialMatch = false,
) {
  return namePathList && namePathList.some(path => matchNamePath(namePath, path, partialMatch));
}

/**
 * Check if `namePath` is super set or equal of `subNamePath`.
 * @param namePath A list of `InternalNamePath[]`
 * @param subNamePath Compare `InternalNamePath`
 * @param partialMatch True will make `[a, b]` match `[a, b, c]`
 */
export function matchNamePath(
  namePath: InternalNamePath,
  subNamePath: InternalNamePath | null,
  partialMatch = false,
) {
  if (!namePath || !subNamePath) {
    return false;
  }

  if (!partialMatch && namePath.length !== subNamePath.length) {
    return false;
  }

  return subNamePath.every((nameUnit, i) => namePath[i] === nameUnit);
}

// Like `shallowEqual`, but we not check the data which may cause re-render
type SimilarObject = string | number | object;
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

  /**
   * `target` is the element that triggered the event (e.g., the user clicked on)
   * `currentTarget` is the element that the event listener is attached to.
   */
  const nodeName = (event?.target?.nodeName ?? '').toLowerCase();

  if (nodeName === 'input') {
    const type = (event.target.type ?? 'text').toLowerCase();

    if (['checkbox', 'radio'].includes(type)) {
      return event.target.checked;
    }

    // `datetime` Obsolete
    if (['number', 'range'].includes(type)) {
      // https://caniuse.com/?search=valueAsNumber, support IE11+
      return event.target.valueAsNumber ?? event.target.value;
    }

    /**
     * Problems with backfilling the data collected, so it is not processed here
     * @see https://devlog.willcodefor.beer/pages/use-valueasnumber-and-valueasdate-on-inputs/
     * `datetime` Obsolete
     */
    // if (['date', 'datetime-local'].includes(type)) {
    //   const _value = {
    //     timestamp: event.target.valueAsNumber,
    //     date: event.target.valueAsDate,
    //     formatted: event.target.value,
    //   }
    // }

    if (type === 'file') {
      return event.target.files;
    }

    /**
     * text password search email url week month tel color time
     * [submit, reset, button, image, hidden] ?? i dont care :)
     */
    // return event.target.value; // valuePropName default is 'value'
  }

  // because `valuePropName` default is `value`
  // if (['textarea', 'select'].includes(nodeName)) {
  //   return event.target.value;
  // }

  if (typeof event?.target === 'object' && valuePropName in event.target) {
    return event.target[valuePropName];
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

import type { Moment } from 'moment';
import type { Dayjs } from 'dayjs';

/**
 * Remove type from Object
 */
type PureObject<T> = Omit<T, keyof Object>;

/**
 * Store: The store type from `FormInstance<Store>`
 * ParentNamePath: Auto generate by nest logic. Do not fill manually.
 */
export type DeepNamePath<Store = any, ParentNamePath extends any[] = []> =
  // Follow code is batch check if `Store` is base type
  Store extends string | number
    ? string | number
    : string[] extends Store
    ? Store
    : number[] extends Store
    ? Store
    : Store extends Record<string, any>[] // Check if `Store` is `object[]`
    ? // Connect path. e.g. { a: { b: string }[] }
      // Get: [a] | [ a,number] | [ a ,number , b]
      | [...ParentNamePath, number]
        | DeepNamePath<PureObject<Store[number]>, [...ParentNamePath, number]>
    : Store extends Record<string, any> // Check if `Store` is `object`
    ? {
        // Convert `Store` to <key, value>. We mark key a `FieldKey`
        [FieldKey in keyof Store]:
          | (ParentNamePath['length'] extends 0 ? FieldKey : never) // If `ParentNamePath` is empty, it can use `FieldKey` without array path
          | [...ParentNamePath, FieldKey] // Exist `ParentNamePath`, connect it
          | (Store[FieldKey] extends (number | string)[]
              ? [...ParentNamePath, FieldKey, number] // If `Store[FieldKey]` is base array type
              : Store[FieldKey] extends Record<string, any>
              ? DeepNamePath<PureObject<Store[FieldKey]>, [...ParentNamePath, FieldKey]> // If `Store[FieldKey]` is object
              : never);
      }[keyof Store]
    : never;

type Test = {
  date: Moment;
};

type CCC = DeepNamePath<Test>;

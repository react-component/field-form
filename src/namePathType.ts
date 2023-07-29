/**
 * Store: The store type from `FormInstance<Store>`
 * ParentNamePath: Auto generate by nest logic. Do not fill manually.
 */
export type DeepNamePathBase<Store = any, ParentNamePath extends any[] = []> =
  // Follow code is batch check if `Store` is base type
  Store extends string | number
    ? Store
    : string[] extends Store
    ? Store
    : number[] extends Store
    ? Store
    : Store extends Record<string, any>[] // Check if `Store` is `object[]`
    ? // Connect path. e.g. { a: { b: string }[] }
      // Get: [a] | [ a,number] | [ a ,number , b]
      | []
        | [...ParentNamePath, number]
        | DeepNamePathBase<Store[number], [...ParentNamePath, number]>
    : Store extends Record<string, any> // Check if `Store` is `object`
    ? {
        // Convert `Store` to <key, value>. We mark key a `FieldKey`
        [FieldKey in keyof Store]:
          | (ParentNamePath['length'] extends 0 ? FieldKey : never) // If `ParentNamePath` is empty, it can use `FieldKey` without array path
          | [...ParentNamePath, FieldKey] // Exist `ParentNamePath`, connect it
          | (Store[FieldKey] extends (number | string)[]
              ? [...ParentNamePath, FieldKey, number] // If `Store[FieldKey]` is base array type
              : Store[FieldKey] extends Record<string, any>
              ? DeepNamePathBase<Store[FieldKey], [...ParentNamePath, FieldKey]> // If `Store[FieldKey]` is object
              : never);
      }[keyof Store]
    : never;

type IsOptional<Key extends keyof Obj, Obj> = {} extends Pick<Obj, Key> ? Key : never;

export type DeepRequired<T = any> = {
  [Key in keyof T]-?: IsOptional<Key, T> extends never ? T[Key] : DeepRequired<T[Key]>;
};

export type DeepNamePath<T = any> = DeepNamePathBase<DeepRequired<T>>;

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
    : // Check if `Store` is `object[]`
    Store extends Record<string, any>[]
    ? // Connect path. e.g. { a: { b: string }[] }
      // Get: [a] | [ a,number] | [ a ,number , b]
      [...ParentNamePath, number] | DeepNamePath<Store[number], [...ParentNamePath, number]>
    : // Check if `Store` is `object`
    Store extends Record<string, any>
    ? // Convert `Store` to <key, value>. We mark key a `FieldKey`
      {
        [FieldKey in keyof Store]:
          | // If `ParentNamePath` is empty, it can use `FieldKey` without array path
          (ParentNamePath['length'] extends 0 ? FieldKey : never)
          // Exist `ParentNamePath`, connect it
          | [...ParentNamePath, FieldKey]
          | (Store[FieldKey] extends (number | string)[]
              ? // If `Store[FieldKey]` is base array type
                [...ParentNamePath, FieldKey, number]
              : Store[FieldKey] extends Record<string, any>
              ? // If `Store[FieldKey]` is object
                DeepNamePath<Store[FieldKey], [...ParentNamePath, FieldKey]>
              : never);
      }[keyof Store]
    : never;

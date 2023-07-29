/**
 * Store: The store type from `FormInstance<Store>`
 * ParentNamePath: Auto generate by nest logic. Do not fill manually.
 */
export type DeepNamePath<Store = any, ParentNamePath extends any[] = []> =
  // Follow code is batch check if `Store` is base type
  Store extends string | number
    ? Store
    : string[] extends Store
    ? Store
    : number[] extends Store
    ? Store
    : Store extends Record<string, any>[] // Check if `Store` is `object[]`
    ? Store[0] extends undefined
      ? []
      : // Connect path. e.g. { a: { b: string }[] }
        // Get: [a] | [ a,number] | [ a ,number , b]
        [...ParentNamePath, number] | DeepNamePath<Store[number], [...ParentNamePath, number]>
    : Store extends Record<string, any> // Check if `Store` is `object`
    ? {
        // Convert `Store` to <key, value>. We mark key a `FieldKey`
        [FieldKey in keyof Store]: Required<Store>[FieldKey] extends Function // Filter function
          ? never
          :
              | (ParentNamePath['length'] extends 0 ? FieldKey : never) // If `ParentNamePath` is empty, it can use `FieldKey` without array path
              | [...ParentNamePath, FieldKey] // Exist `ParentNamePath`, connect it
              | (Required<Store>[FieldKey] extends (number | string | boolean)[]
                  ? [...ParentNamePath, FieldKey, number] // If `Store[FieldKey]` is base array type
                  : Required<Store>[FieldKey] extends Record<string, any>
                  ? DeepNamePath<Required<Store>[FieldKey], [...ParentNamePath, FieldKey]> // If `Store[FieldKey]` is object
                  : never);
      }[keyof Store]
    : never;

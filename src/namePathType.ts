/**
 * Store: The store type from `FormInstance<Store>`
 * ParentNamePath: Auto generate by nest logic. Do not fill manually.
 */
export type DeepNamePath<Store = any, ParentNamePath extends any[] = []> =
  // Follow code is batch check if `Store` is base type
  Store extends Function
    ? never // Ignore function type
    : string extends Store
    ? ParentNamePath['length'] extends 0
      ? Store // Return `string` instead of array if `ParentNamePath` is empty
      : never
    : number extends Store
    ? ParentNamePath['length'] extends 0
      ? Store // Return `number` instead of array if `ParentNamePath` is empty
      : never
    : string[] extends Store
    ? ParentNamePath['length'] extends 0
      ? Store // Return `string[]` instead of array if `ParentNamePath` is empty
      : [...ParentNamePath, number] // Connect string path
    : number[] extends Store
    ? ParentNamePath['length'] extends 0
      ? Store // Return `number[]` instead of array if `ParentNamePath` is empty
      : [...ParentNamePath, number] // Connect number path
    : boolean[] extends Store
    ? ParentNamePath['length'] extends 0
      ? Store // Return `boolean[]` instead of array if `ParentNamePath` is empty
      : [...ParentNamePath, number] // Connect boolean path
    : Store extends any[] // Check if `Store` is `object[]`
    ? // Connect path. e.g. { a: { b: string }[] }
      // Get: [a] | [ a,number] | [ a ,number , b]
      [...ParentNamePath, number] | DeepNamePath<Store[number], [...ParentNamePath, number]>
    : {
        // Convert `Store` to <key, value>. We mark key a `FieldKey`
        [FieldKey in keyof Store]:
          | (ParentNamePath['length'] extends 0 ? FieldKey : never) // If `ParentNamePath` is empty, it can use `FieldKey` without array path
          | [...ParentNamePath, FieldKey] // Exist `ParentNamePath`, connect it
          | DeepNamePath<Required<Store>[FieldKey], [...ParentNamePath, FieldKey]>; // If `Store[FieldKey]` is object
      }[keyof Store];

/**
 * Store: The store type from `FormInstance<Store>`
 * ParentNamePath: Auto generate by nest logic. Do not fill manually.
 */
export type DeepNamePath<Store = any, ParentNamePath extends any[] = []> =
  // Limit 10
  ParentNamePath['length'] extends 10
    ? never
    : // Return if Store is basic type
    Store extends string | number | (string | number)[]
    ? Store
    : Store extends Record<string, any>[]
    ? [...ParentNamePath, number] | DeepNamePath<Store[number], [...ParentNamePath, number]>
    : Store extends Record<string, any>
    ? {
        // If Store is object.
        // Let's create an <Store.Key, RootStore.KeyPath> map
        // And get from the map by Store.Key.
        [FieldKey in keyof Store]:
          | (ParentNamePath['length'] extends 0 ? FieldKey : never)
          | [...ParentNamePath, FieldKey]
          | (Store[FieldKey] extends (number | string)[]
              ? [...ParentNamePath, FieldKey, number]
              : Store[FieldKey] extends Record<string, any>
              ? DeepNamePath<Store[FieldKey], [...ParentNamePath, FieldKey]>
              : never);
      }[keyof Store]
    : never;

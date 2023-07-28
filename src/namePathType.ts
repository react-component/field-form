/**
 * Store: The store type from `FormInstance<Store>`
 * ParentNamePath: Auto generate by nest logic. Do not fill manually.
 */
// export type DeepNamePath<Store = any, ParentNamePath extends any[] = []> = any extends Store
//   ? // Return if Store is basic type
//     Store extends string | number | (string | number)[]
//     ? Store
//     : never
//   : // If Store is object.
//     // Let's create an <Store.Key, RootStore.KeyPath> map
//     // And get from the map by Store.Key.
//     {
//       [FieldKey in keyof Required<Store>]:
//         | (ParentNamePath['length'] extends 0 ? FieldKey | [...ParentNamePath, FieldKey] : never)
//         | (Required<Store>[FieldKey] extends any[]
//             ? // If is a validate array path
//               | ([...ParentNamePath, FieldKey] | [...ParentNamePath, FieldKey, number])
//                 | (Required<Store>[FieldKey] extends (string | number)[]
//                     ? never
//                     : // Dig with [...ParentNamePath, FieldKey, number]
//                       DeepNamePath<
//                         Required<Store>[FieldKey][number],
//                         [...ParentNamePath, FieldKey, number]
//                       >)
//             : Required<Store>[FieldKey] extends Record<string, any>
//             ? // If value is a object, dig into value.
//               | [...ParentNamePath, FieldKey]
//                 | DeepNamePath<Required<Store>[FieldKey], [...ParentNamePath, FieldKey]>
//             : [...ParentNamePath, FieldKey]);
//     }[keyof Store];

/**
 * Store: The store type from `FormInstance<Store>`
 * ParentNamePath: Auto generate by nest logic. Do not fill manually.
 */
export type DeepNamePath<Store = any, ParentNamePath extends any[] = []> = any extends Store
  ? // Return if Store is basic type
    Store extends string | number | (string | number)[]
    ? Store
    : never
  : Store extends Record<string, any>[]
  ? // If is a validate array path
    [...ParentNamePath, number] | DeepNamePath<Store[number], [...ParentNamePath, number]>
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
            : // If value is a object, dig into value.
            Store[FieldKey] extends Record<string, any>
            ? DeepNamePath<Store[FieldKey], [...ParentNamePath, FieldKey]>
            : never);
    }[keyof Store]
  : never;

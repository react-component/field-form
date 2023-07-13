type DefineNamePathBase<T, T1 extends any[] = []> = T extends any[]
  ?
      | [...T1, number]
      | (Required<T>[number] extends Record<string, any>
          ? {
              [K in keyof Required<Required<T>[number]>]:
                | [...T1, number, K]
                | (Required<Required<T>[number]>[K] extends any[]
                    ? [...T1, number, K, number]
                    : never);
            }[keyof T[number]]
          : never)
  : Required<T> extends Record<string, any>
  ? {
      [K in keyof Required<T>]:
        | [...T1, K]
        | (Required<T>[K] extends any[] ? [...T1, K, number] : never);
    }[keyof T]
  : never;

export type Check<T> = Required<T> extends any[]
  ? false
  : Required<T> extends Record<string, any>
  ? true
  : false;

export type DefineNamePath1<T, T1 extends any[] = []> = Check<T> extends true
  ? {
      [K in keyof Required<T>]: DefineNamePathBase<Required<T>[K], [...T1, K]>;
    }[keyof T]
  : never;

export type DefineNamePath2<T, T1 extends any[] = []> = Check<T> extends true
  ? {
      [K in keyof Required<T>]: DefineNamePath1<Required<T>[K], [...T1, K]>;
    }[keyof T]
  : never;

export type DefineNamePath3<T, T1 extends any[] = []> = Check<T> extends true
  ? {
      [K in keyof Required<T>]: DefineNamePath2<Required<T>[K], [...T1, K]>;
    }[keyof T]
  : never;

export type DefineNamePath4<T, T1 extends any[] = []> = Check<T> extends true
  ? {
      [K in keyof Required<T>]: DefineNamePath3<Required<T>[K], [...T1, K]>;
    }[keyof T]
  : never;

type DefineNamePathUnion<T> =
  | DefineNamePath1<T>
  | DefineNamePath2<T>
  | DefineNamePath3<T>
  | DefineNamePath4<T>;

export type DefineNamePath<T = any> = T extends Record<string, any>
  ? T extends string | number | (string | number)[]
    ? T
    : T extends Record<string, any>[]
    ?
        | [number]
        | [number, keyof Required<T>[number]]
        | [number, ...DefineNamePathUnion<Required<T>[number]>]
    : keyof T | [keyof T] | DefineNamePathUnion<T>
  : T;

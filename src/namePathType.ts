type DefineNamePathBase<T, T1 extends any[] = never> = T extends any[]
  ?
      | [...T1, number]
      | (T[number] extends Record<string, any>
          ? {
              [K in keyof T[number]]: [...T1, number, K];
            }[keyof T[number]]
          : undefined)
  : Required<T> extends Record<string, any>
  ? {
      [K in keyof T]: Required<T>[K] extends any[] ? [...T1, K] | [...T1, K, number] : [...T1, K];
    }[keyof T]
  : undefined;

type DefineNamePath1<T, T1 extends any[] = never> = T extends any[]
  ? undefined
  : Required<T> extends Record<string, any>
  ? {
      [K in keyof T]: DefineNamePathBase<Required<T>[K], [...T1, K]>;
    }[keyof T]
  : undefined;

type DefineNamePath2<T, T1 extends any[] = never> = T extends any[]
  ? undefined
  : Required<T> extends Record<string, any>
  ? {
      [K in keyof T]: DefineNamePath1<Required<T>[K], [...T1, K]>;
    }[keyof T]
  : undefined;

type DefineNamePath3<T, T1 extends any[] = never> = T extends any[]
  ? undefined
  : Required<T> extends Record<string, any>
  ? {
      [K in keyof T]: DefineNamePath2<Required<T>[K], [...T1, K]>;
    }[keyof T]
  : undefined;

export type DefineNamePath<T = any> = T extends any[] | number | string
  ? T
  : {
      [K in keyof T]:
        | K
        | [K]
        | DefineNamePathBase<Required<T>[K], [K]>
        | DefineNamePath1<Required<T>[K], [K]>
        | DefineNamePath2<Required<T>[K], [K]>
        | DefineNamePath3<Required<T>[K], [K]>;
    }[keyof T];

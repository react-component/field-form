type DefineNamePathBase<T, T1 extends any[] = never> = T extends any[]
  ?
      | [...T1, number]
      | (T[number] extends object
          ? {
              [K in keyof T[number]]: [...T1, number, K];
            }[keyof T[number]]
          : undefined)
  : Required<T> extends object
  ? {
      [K in keyof T]: Required<T>[K] extends any[] ? [...T1, K] | [...T1, K, number] : [...T1, K];
    }[keyof T]
  : undefined;

type DefineNamePath1<T, T1 extends any[] = never> = T extends any[]
  ? undefined
  : Required<T> extends object
  ? {
      [K in keyof T]: DefineNamePathBase<Required<T>[K], [...T1, K]>;
    }[keyof T]
  : undefined;

type DefineNamePath2<T, T1 extends any[] = never> = T extends any[]
  ? undefined
  : Required<T> extends object
  ? {
      [K in keyof T]: DefineNamePath1<Required<T>[K], [...T1, K]>;
    }[keyof T]
  : undefined;

type DefineNamePath3<T, T1 extends any[] = never> = T extends any[]
  ? undefined
  : Required<T> extends object
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

// export type checkType = DefineNamePath<{
//   a: string;
//   b?: string[];
//   c?: { c1?: string; c2?: number }[];
//   d?: { d1?: string[]; d2?: string };
// }>;

// export type checkTypeAll = DefineNamePath<{
//   a: string;
//   b?: string[];
//   c?: { c1?: string; c2?: number }[];
//   d?: { d1?: string[]; d2?: string };
//   e?: { e1?: { e2?: string; e3?: string[]; e4: { e5: { e6: string } } } };
// }>;

// export const demoAll: checkTypeAll[] = [
//   // 基础
//   'a',
//   'b',
//   'c',
//   'd',
//   'e',
//   ['a'],
//   ['b'],
//   ['c'],
//   ['d'],
//   ['e'],
//   // 二级以上
//   ['b', 1],
//   ['c', 1],
//   ['c', 1, 'c1'],
//   ['c', 1, 'c2'],
//   ['d', 'd1'],
//   ['d', 'd1', 1],
//   ['d', 'd2'],
//   ['e', 'e1'],
//   ['e', 'e1', 'e2'],
//   ['e', 'e1', 'e3'],
//   ['e', 'e1', 'e3', 1],
//   ['e', 'e1', 'e4'],
//   ['e', 'e1', 'e4', 'e5'],
//   ['e', 'e1', 'e4', 'e5'],
//   ['e', 'e1', 'e4', 'e5', 'e6'],
// ];

// export interface TableProps<T = any> {
//   dataSource?: T[];
//   columns?: { dataIndex?: DefineNamePath<T> }[];
// }

// export function func<T = any>(props: TableProps<T>) {
//   return props;
// }

// func({ dataSource: [{ id: 1, a: { b: 'c' } }], columns: [{ dataIndex: ['a'] }] });

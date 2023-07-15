export type DeepNamePath2<T = unknown, T1 extends any[] = []> = any extends T
  ? never
  : Required<T> extends []
  ? Required<T>
  : {
      [P in keyof Required<T>]:
        | (T1['length'] extends 0 ? P | [...T1, P] : never)
        | (Required<T>[P] extends (string | number)[]
            ? [...T1, P] | [...T1, P, number]
            : Required<T>[P] extends any[]
            ?
                | [...T1, P]
                | [...T1, P, number]
                | DeepNamePath2<Required<T>[P][number], [...T1, P, number]>
            : Required<T>[P] extends Record<string, unknown>
            ? [...T1, P] | DeepNamePath2<Required<T>[P], [...T1, P]>
            : [...T1, P]);
    }[keyof T];

export type DeepNamePath<T = any> =
  | (T extends string | number | (string | number)[] ? T : never)
  | DeepNamePath2<T>;

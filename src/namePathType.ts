export type DefineNamePath<T, T1 extends any[] = []> = T extends (string | number)[]
  ? [...T1, number]
  : T extends Record<string, any>[]
  ? [...T1, number] | DefineNamePath<Required<T>[number], [...T1, number]>
  : T extends Record<string, any>
  ? {
      [P in keyof T]:
        | (T1[0] extends undefined ? P : [...T1, P])
        | [...T1, P]
        | (Required<T>[P] extends Record<string, any>
            ? [...T1, P] | DefineNamePath<Required<T>[P], [...T1, P]>
            : never);
    }[keyof T]
  : never;

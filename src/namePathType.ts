export type DefineNamePath<T, T1 extends any[] = []> = {
  [P in keyof Required<T>]:
    | (T1[0] extends undefined ? P : [...T1, P])
    | [...T1, P]
    | (Required<T>[P] extends Record<string, any>
        ? DefineNamePath<Required<T>[P], [...T1, P]>
        : never);
}[keyof T];

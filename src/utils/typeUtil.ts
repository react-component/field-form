import type { FormInstance, InternalFormInstance } from '../interface';

export function toArray<T>(value?: T | T[] | null): T[] {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export function isFormInstance<T>(form: T | FormInstance): form is FormInstance {
  return form && !!(form as InternalFormInstance)._init;
}

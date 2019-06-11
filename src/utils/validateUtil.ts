import AsyncValidator from 'async-validator';
import {
  FieldError,
  InternalNamePath,
  Rule,
  ValidateOptions,
  FormInstance,
  ValidateMessages,
} from '../interface';
import NameMap from './NameMap';
import { containsNamePath, getNamePath } from './valueUtil';

/**
 * Replace with template.
 *   `I'm ${name}` + { name: 'bamboo' } = I'm bamboo
 */
function replaceMessage(template: string, kv: { [name: string]: any }): string {
  return template.replace(/\$\{\w+\}/g, function(str: string) {
    const key = str.slice(2, -1);
    return kv[key];
  });
}

/**
 * We use `async-validator` to validate rules. So have to hot replace the message with validator.
 */
function convertMessages(messages: ValidateMessages, name: string, rule: Rule) {
  const kv: { [name: string]: any } = {
    ...rule,
    name,
    enum: (rule.enum || []).join(', '),
  };

  const replaceFunc = (template: string, additionalKV?: Record<string, any>) => {
    if (!template) return null;
    return () => {
      return replaceMessage(template, { ...kv, ...additionalKV });
    };
  };

  const typeReplaceFunc = replaceFunc(messages.type);

  const newMessages = {
    _kv: kv,
    _rule: rule,
    ...messages,
    enum: replaceFunc(messages.enum),
    required: replaceFunc(messages.required),
    types: {
      string: typeReplaceFunc,
      method: typeReplaceFunc,
      array: typeReplaceFunc,
      object: typeReplaceFunc,
      number: typeReplaceFunc,
      date: typeReplaceFunc,
      boolean: typeReplaceFunc,
      integer: typeReplaceFunc,
      float: typeReplaceFunc,
      regexp: typeReplaceFunc,
      email: typeReplaceFunc,
      url: typeReplaceFunc,
      hex: typeReplaceFunc,
    },
  };
  return newMessages;
}

function validateRule(
  name: string,
  value: any,
  rule: Rule,
  options: ValidateOptions,
): Promise<string[]> {
  const validator = new AsyncValidator({
    [name]: [rule],
  });

  const messages = convertMessages(options.validateMessages, name, rule);
  validator.messages(messages);

  return new Promise(resolve => {
    validator.validate({ [name]: value }, { ...options }, (errors: any) => {
      resolve(
        (errors || []).map((e: any) => {
          if (e && e.message) {
            return e.message;
          }
          return e;
        }),
      );
    });
  });
}

/**
 * We use `async-validator` to validate the value.
 * But only check one value in a time to avoid namePath validate issue.
 */
export function validateRules(
  namePath: InternalNamePath,
  value: any,
  rules: Rule[],
  options: ValidateOptions,
  context: FormInstance,
) {
  const name = namePath.join('.');

  // Fill rule with context
  const filledRules: Rule[] = rules.map(currentRule => {
    if (!currentRule.validator) {
      return currentRule;
    }
    return {
      ...currentRule,
      validator(rule: any, val: any, callback: any) {
        currentRule.validator(rule, val, callback, context);
      },
    };
  });

  const summaryPromise: Promise<string[]> = Promise.all(
    filledRules.map(rule => validateRule(name, value, rule, options)),
  ).then((errorsList: string[][]): string[] | Promise<string[]> => {
    const errors: string[] = [].concat(...errorsList);

    if (!errors.length) {
      return [];
    }

    return Promise.reject<string[]>(errors);
  });

  // Internal catch error to avoid console error log.
  summaryPromise.catch(e => e);

  return summaryPromise;
}

/**
 * Convert `NameMap<string[]>` into `[{ name, errors }]` format.
 */
function nameMapToErrorList(nameMap: NameMap<string[]>): FieldError[] {
  return nameMap.map(({ key, value }) => ({
    name: key,
    errors: value,
  }));
}

export class ErrorCache {
  private cache: NameMap<string[]> = new NameMap();

  public updateError = (fieldErrors: FieldError[]) => {
    this.cache = this.cache.clone();
    fieldErrors.forEach(({ name, errors }) => {
      this.cache.set(name, errors);
    });
  };

  public getFieldsError = (namePathList?: InternalNamePath[]): FieldError[] => {
    const fullErrors: FieldError[] = nameMapToErrorList(this.cache);

    return !namePathList
      ? fullErrors
      : fullErrors.filter(({ name }) => {
          const errorNamePath = getNamePath(name);
          return containsNamePath(namePathList, errorNamePath);
        });
  };

  public resetField = (namePath: InternalNamePath) => {
    this.cache.delete(namePath);
  };
}

export const defaultValidateMessages = {
  enum: "'${name}' must be one of [${enum}]",
  required: "'${name}' is required",
  type: "'${name}' is not a validate ${type}",

  // default: 'Validation error on field ${name}',
  // whitespace: '${name} cannot be empty',
  // date: {
  //   format: '%s date %s is invalid for format %s',
  //   parse: '%s date could not be parsed, %s is invalid ',
  //   invalid: '%s date %s is invalid',
  // },
  // string: {
  //   len: '%s must be exactly %s characters',
  //   min: '%s must be at least %s characters',
  //   max: '%s cannot be longer than %s characters',
  //   range: '%s must be between %s and %s characters',
  // },
  // number: {
  //   len: '%s must equal %s',
  //   min: '%s cannot be less than %s',
  //   max: '%s cannot be greater than %s',
  //   range: '%s must be between %s and %s',
  // },
  // array: {
  //   len: '%s must be exactly %s in length',
  //   min: '%s cannot be less than %s in length',
  //   max: '%s cannot be greater than %s in length',
  //   range: '%s must be between %s and %s in length',
  // },
  // pattern: {
  //   mismatch: '%s value %s does not match pattern %s',
  // },
};

import AsyncValidator, { Rules, ValidateOption } from 'async-validator';
import * as React from 'react';
import warning from 'warning';
import {
  InternalNamePath,
  ValidateOptions,
  ValidateMessages,
  RuleObject,
  FormValue,
  FormValues,
  ValidateMessage,
} from '../interface';
import { setValues } from './valueUtil';
import { defaultValidateMessages } from './messages';

// Remove incorrect original ts define
// const AsyncValidator: unknown = RawAsyncValidator;
type CustomAsyncValidator = AsyncValidator & {
  messages: (messages: ValidateMessages) => void;
};

/**
 * Replace with template.
 *   `I'm ${name}` + { name: 'bamboo' } = I'm bamboo
 */
function replaceMessage(template: string, kv: Record<string, string>): string {
  return template.replace(/\$\{\w+\}/g, (str: string) => {
    const key = str.slice(2, -1);
    return kv[key];
  });
}

/**
 * We use `async-validator` to validate rules. So have to hot replace the message with validator.
 * { required: '${name} is required' } => { required: () => 'field is required' }
 */
function convertMessages(
  messages: ValidateMessages,
  name: string,
  rule: RuleObject,
  messageVariables?: Record<string, string>,
): ValidateMessages {
  const kv = {
    ...(rule as Record<string, string | number>),
    name,
    enum: (rule.enum || []).join(', '),
  };

  const replaceFunc = (template: string, additionalKV?: Record<string, string>) => () =>
    replaceMessage(template, { ...kv, ...additionalKV });

  /* eslint-disable no-param-reassign */
  function fillTemplate(source: ValidateMessages, target: ValidateMessages = {}) {
    // @ts-ignore
    Object.keys(source).forEach((ruleName: keyof ValidateMessages) => {
      const value = source[ruleName];
      if (typeof value === 'string') {
        target[ruleName] = replaceFunc(value, messageVariables);
      } else if (value && typeof value === 'object') {
        // @ts-ignore
        target[ruleName] = {};
        fillTemplate(value as ValidateMessages, target[ruleName] as ValidateMessages);
      } else {
        target[ruleName] = value as ValidateMessage;
      }
    });

    return target;
  }
  /* eslint-enable */
  // @NOTE setValues does not seem to be supposed to receive ValidateMessages, bug?
  const messagesAsFormValues = messages as Partial<FormValues>;
  return fillTemplate(
    setValues({}, defaultValidateMessages, messagesAsFormValues),
  ) as ValidateMessages;
}

async function validateRule(
  name: string,
  value: FormValue,
  rule: RuleObject,
  options: ValidateOptions,
  messageVariables?: Record<string, string>,
): Promise<string[]> {
  const cloneRule = { ...rule };
  // We should special handle array validate
  let subRuleField: RuleObject | null = null;
  if (cloneRule && cloneRule.type === 'array' && cloneRule.defaultField) {
    subRuleField = cloneRule.defaultField;
    delete cloneRule.defaultField;
  }

  const rules = {
    [name]: [cloneRule],
  };
  const validator = new AsyncValidator(rules as Rules) as CustomAsyncValidator;

  const messages: ValidateMessages = convertMessages(
    options.validateMessages!,
    name,
    cloneRule,
    messageVariables,
  );
  validator.messages(messages);

  let result = [];

  try {
    const validateOptions = ({ ...options } as unknown) as ValidateOption;
    await Promise.resolve(validator.validate({ [name]: value }, validateOptions));
  } catch (errObj) {
    if (errObj.errors) {
      result = errObj.errors.map(
        ({ message }: { message: React.ReactElement | string }, index: number) =>
          // Wrap ReactNode with `key`
          React.isValidElement(message)
            ? React.cloneElement(message, { key: `error_${index}` })
            : message,
      );
    } else {
      console.error(errObj); // eslint-disable-line no-console
      result = [(messages.default as () => string)()];
    }
  }

  if (!result.length && subRuleField) {
    const subResults: string[][] = await Promise.all(
      (value as FormValue[]).map((subValue: FormValue, i: number) =>
        validateRule(
          `${name}.${i}`,
          subValue,
          subRuleField as RuleObject,
          options,
          messageVariables,
        ),
      ),
    );

    return subResults.reduce((prev, errors) => [...prev, ...errors], []);
  }

  return result;
}

/**
 * We use `async-validator` to validate the value.
 * But only check one value in a time to avoid namePath validate issue.
 */
export function validateRules(
  namePath: InternalNamePath,
  value: FormValue,
  rules: RuleObject[],
  options: ValidateOptions,
  validateFirst: boolean,
  messageVariables?: Record<string, string>,
) {
  const name = namePath.join('.');

  // Fill rule with context
  const filledRules: RuleObject[] = rules.map(currentRule => {
    const originValidatorFunc = currentRule.validator;

    if (!originValidatorFunc) {
      return currentRule;
    }
    return {
      ...currentRule,
      validator(rule: RuleObject, val: FormValue, callback: (error?: string) => void) {
        let hasPromise = false;

        // Wrap callback only accept when promise not provided
        const wrappedCallback = (...args: (string | undefined)[]) => {
          // Wait a tick to make sure return type is a promise
          Promise.resolve().then(() => {
            warning(
              !hasPromise,
              'Your validator function has already return a promise. `callback` will be ignored.',
            );

            if (!hasPromise) {
              callback(...args);
            }
          });
        };

        // Get promise
        const promise = originValidatorFunc(rule, val, wrappedCallback);
        hasPromise =
          !!promise && typeof promise.then === 'function' && typeof promise.catch === 'function';

        /**
         * 1. Use promise as the first priority.
         * 2. If promise not exist, use callback with warning instead
         */
        warning(hasPromise, '`callback` is deprecated. Please return a promise instead.');

        if (hasPromise) {
          (promise as Promise<void>)
            .then(() => {
              callback();
            })
            .catch(err => {
              callback(err);
            });
        }
      },
    };
  });

  const rulePromises = filledRules.map(rule =>
    validateRule(name, value, rule, options, messageVariables),
  );

  const summaryPromise: Promise<string[]> = (validateFirst
    ? finishOnFirstFailed(rulePromises)
    : finishOnAllFailed(rulePromises)
  ).then((errors: string[]): string[] | Promise<string[]> => {
    if (!errors.length) {
      return [];
    }

    return Promise.reject<string[]>(errors);
  });

  // Internal catch error to avoid console error log.
  summaryPromise.catch(e => e);

  return summaryPromise;
}

async function finishOnAllFailed(rulePromises: Promise<string[]>[]): Promise<string[]> {
  return Promise.all(rulePromises).then((errorsList: string[][]): string[] | Promise<string[]> => {
    const errors: string[] = ([] as string[]).concat(...errorsList);

    return errors;
  });
}

async function finishOnFirstFailed(rulePromises: Promise<string[]>[]): Promise<string[]> {
  let count = 0;

  return new Promise(resolve => {
    rulePromises.forEach(promise => {
      promise.then(errors => {
        if (errors.length) {
          resolve(errors);
        }

        count += 1;
        if (count === rulePromises.length) {
          resolve([]);
        }
      });
    });
  });
}

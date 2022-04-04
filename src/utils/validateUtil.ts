import RawAsyncValidator from 'async-validator';
import * as React from 'react';
import warning from 'rc-util/lib/warning';
import type {
  InternalNamePath,
  ValidateOptions,
  RuleObject,
  StoreValue,
  RuleError,
} from '../interface';
import { defaultValidateMessages } from './messages';
import { setValues } from './valueUtil';

// Remove incorrect original ts define
const AsyncValidator: any = RawAsyncValidator;

/**
 * Replace with template.
 *   `I'm ${name}` + { name: 'bamboo' } = I'm bamboo
 */
function replaceMessage(template: string, kv: Record<string, unknown>): string {
  return template.replace(/\${(\w+)}/g, (_, $1: string) => {
    return String(kv[$1]);
  });
}

function replaceError<E extends unknown>(error: E, kv: Record<string, unknown>): E {
  if (typeof error === 'string') {
    return replaceMessage(error, kv) as E;
  }
  return error;
}

async function validateRule(
  name: string,
  value: StoreValue,
  rule: RuleObject,
  options: ValidateOptions,
  messageVariables?: Record<string, string>,
): Promise<string[]> {
  const cloneRule = { ...rule };

  // Bug of `async-validator`
  // https://github.com/react-component/field-form/issues/316
  // https://github.com/react-component/field-form/issues/313
  delete (cloneRule as any).ruleIndex;

  // We should special handle array validate
  let subRuleField: RuleObject = null;
  if (cloneRule && cloneRule.type === 'array' && cloneRule.defaultField) {
    subRuleField = cloneRule.defaultField;
    delete cloneRule.defaultField;
  }

  const validator = new AsyncValidator({
    [name]: [cloneRule],
  });

  const messages = setValues({}, defaultValidateMessages, options.validateMessages);
  validator.messages(messages);

  let result = [];

  try {
    await Promise.resolve(validator.validate({ [name]: value }, { ...options }));
  } catch (errObj) {
    if (errObj.errors) {
      result = errObj.errors.map(({ message }, index) =>
        // Wrap ReactNode with `key`
        React.isValidElement(message)
          ? React.cloneElement(message, { key: `error_${index}` })
          : message,
      );
    } else {
      console.error(errObj);
      result = [messages.default];
    }
  }

  if (!result.length && subRuleField) {
    const subResults: string[][] = await Promise.all(
      (value as StoreValue[]).map((subValue: StoreValue, i: number) =>
        validateRule(`${name}.${i}`, subValue, subRuleField, options, messageVariables),
      ),
    );

    return subResults.flat();
  }

  // Replace message with variables
  const kv = {
    ...rule,
    name,
    enum: (rule.enum || []).join(', '),
    ...messageVariables,
  };

  return result.map(error => replaceError(error, kv));
}

/**
 * We use `async-validator` to validate the value.
 * But only check one value in a time to avoid namePath validate issue.
 */
export function validateRules(
  namePath: InternalNamePath,
  value: StoreValue,
  rules: RuleObject[],
  options: ValidateOptions,
  validateFirst: boolean | 'parallel',
  messageVariables?: Record<string, string>,
) {
  const name = namePath.join('.');

  // Fill rule with context
  const filledRules: RuleObject[] = rules
    .map((currentRule, ruleIndex) => {
      const originValidatorFunc = currentRule.validator;
      const cloneRule = {
        ...currentRule,
        ruleIndex,
      };

      // Replace validator if needed
      if (originValidatorFunc) {
        cloneRule.validator = (
          rule: RuleObject,
          val: StoreValue,
          callback: (error?: string) => void,
        ) => {
          let hasPromise = false;

          // Wrap callback only accept when promise not provided
          const wrappedCallback = (...args: string[]) => {
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
            promise && typeof promise.then === 'function' && typeof promise.catch === 'function';

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
                callback(err || ' ');
              });
          }
        };
      }

      return cloneRule;
    })
    .sort(({ warningOnly: w1, ruleIndex: i1 }, { warningOnly: w2, ruleIndex: i2 }) => {
      if (!!w1 === !!w2) {
        // Let keep origin order
        return i1 - i2;
      }

      if (w1) {
        return 1;
      }

      return -1;
    });

  // Do validate rules
  let summaryPromise: Promise<RuleError[]>;

  if (validateFirst === true) {
    // >>>>> Validate by serialization
    summaryPromise = new Promise(async (resolve, reject) => {
      /* eslint-disable no-await-in-loop */
      for (let i = 0; i < filledRules.length; i += 1) {
        const rule = filledRules[i];
        const errors = await validateRule(name, value, rule, options, messageVariables);
        if (errors.length) {
          reject([{ errors, rule }]);
          return;
        }
      }
      /* eslint-enable */

      resolve([]);
    });
  } else {
    // >>>>> Validate by parallel
    const rulePromises: Promise<RuleError>[] = filledRules.map(rule =>
      validateRule(name, value, rule, options, messageVariables).then(errors => ({ errors, rule })),
    );

    summaryPromise = (
      validateFirst ? finishOnFirstFailed(rulePromises) : finishOnAllFailed(rulePromises)
    ).then((errors: RuleError[]): RuleError[] | Promise<RuleError[]> => {
      // Always change to rejection for Field to catch
      return Promise.reject<RuleError[]>(errors);
    });
  }

  // Internal catch error to avoid console error log.
  summaryPromise.catch(e => e);

  return summaryPromise;
}

async function finishOnAllFailed(rulePromises: Promise<RuleError>[]): Promise<RuleError[]> {
  return Promise.all(rulePromises).then(
    (errorsList: RuleError[]): RuleError[] | Promise<RuleError[]> => {
      const errors: RuleError[] = [].concat(...errorsList);

      return errors;
    },
  );
}

async function finishOnFirstFailed(rulePromises: Promise<RuleError>[]): Promise<RuleError[]> {
  let count = 0;

  return new Promise(resolve => {
    rulePromises.forEach(promise => {
      promise.then(ruleError => {
        if (ruleError.errors.length) {
          resolve([ruleError]);
        }

        count += 1;
        if (count === rulePromises.length) {
          resolve([]);
        }
      });
    });
  });
}

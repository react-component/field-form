import { render, act } from '../test-utils';
import Form, { Field } from '../../src';
import type { FormInstance } from '../../src';
import { Input } from '../common/InfoField';
import { changeValue, getField } from '../common';
import timeout from '../common/timeout';

describe('legacy.async-validation', () => {
  let container;
  let form: FormInstance;

  const checkRule = (_, value, callback) => {
    setTimeout(() => {
      if (value === '1') {
        callback();
      } else {
        callback(new Error('must be 1'));
      }
    }, 100);
  };

  beforeEach(() => {
    const rendered = render(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
        >
          <Field name="normal">
            <Input />
          </Field>
          <Field name="async" rules={[{ validator: checkRule }]}>
            <Input />
          </Field>
        </Form>
      </div>,
    );
    container = rendered.container;
  });

  it('works', async () => {
    expect(form.getFieldsValue()).toEqual({ normal: undefined, async: undefined });
    expect(form.isFieldsTouched()).toBeFalsy();

    await act(async () => {
      await changeValue(getField(container, 'async'), 'a');
      await changeValue(getField(container, 'async'), '');
      expect(form.isFieldsTouched()).toBeTruthy();
      expect(form.getFieldValue('async')).toBe('');
      expect(form.getFieldError('async')).toEqual([]);
      expect(form.isFieldValidating('async')).toBeTruthy();
      expect(form.isFieldsValidating(['async'])).toBeTruthy();
    });

    await act(async () => {
      await timeout(200);
      expect(form.getFieldError('async')).toEqual(['must be 1']);
      expect(form.isFieldValidating('async')).toBe(false);
      expect(form.isFieldsValidating(['async'])).toBe(false);
    });

    await act(async () => {
      await changeValue(getField(container, 'async'), '1');
      expect(form.getFieldValue('async')).toBe('1');
      expect(form.getFieldError('async')).toEqual([]);
      expect(form.isFieldValidating('async')).toBeTruthy();
      expect(form.isFieldsValidating(['async'])).toBeTruthy();
    });

    await act(async () => {
      await timeout(200);
      expect(form.getFieldError('async')).toEqual([]);
      expect(form.isFieldValidating('async')).toBeFalsy();
      expect(form.isFieldsValidating(['async'])).toBeFalsy();
    });
  });

  it('validateFields works for error', async () => {
    try {
      await form.validateFields();
      throw new Error('should not pass');
    } catch ({ values, errorFields }) {
      expect(values.normal).toEqual(undefined);
      expect(values.async).toEqual(undefined);
      expect(errorFields.length).toBe(1);

      const entity = errorFields[0];
      expect(entity.name).toEqual(['async']);
      expect(entity.errors).toEqual(['must be 1']);
    }
  });

  it('validateFields works for ok', async () => {
    await changeValue(getField(container, 'async'), '1');
    const values = await form.validateFields();
    expect(values.normal).toBe(undefined);
    expect(values.async).toBe('1');
  });

  it('will error if change when validating', async done => {
    form.validateFields().catch(({ errorFields, outOfDate }) => {
      expect(errorFields.length).toBeTruthy();
      expect(outOfDate).toBeTruthy();
      done();
    });

    changeValue(getField(container, 'async'), '1');
  });
});

import React from 'react';
import { mount } from 'enzyme';
import { resetWarned } from 'rc-util/lib/warning';
import Form, { Field, useForm } from '../src';
import InfoField, { Input } from './common/InfoField';
import { changeValue, getField, matchError } from './common';
import timeout from './common/timeout';

describe('Form.Basic', () => {
  describe('create form', () => {
    function renderContent() {
      return (
        <div>
          <Field name="light">
            <Input />
          </Field>
          <Field name="bamboo">{() => null}</Field>
          <InfoField />
        </div>
      );
    }

    it('sub component', () => {
      const wrapper = mount(<Form>{renderContent()}</Form>);
      expect(wrapper.find('form')).toBeTruthy();
      expect(wrapper.find('input').length).toBe(2);
    });

    describe('component', () => {
      it('without dom', () => {
        const wrapper = mount(<Form component={false}>{renderContent()}</Form>);
        expect(wrapper.find('form').length).toBe(0);
        expect(wrapper.find('input').length).toBe(2);
      });

      it('use string', () => {
        const wrapper = mount(<Form component="pre">{renderContent()}</Form>);
        expect(wrapper.find('form').length).toBe(0);
        expect(wrapper.find('pre').length).toBe(1);
        expect(wrapper.find('input').length).toBe(2);
      });

      it('use component', () => {
        const MyComponent = ({ children }) => <div>{children}</div>;
        const wrapper = mount(<Form component={MyComponent}>{renderContent()}</Form>);
        expect(wrapper.find('form').length).toBe(0);
        expect(wrapper.find(MyComponent).length).toBe(1);
        expect(wrapper.find('input').length).toBe(2);
      });
    });

    describe('render props', () => {
      it('normal', () => {
        const wrapper = mount(<Form>{renderContent}</Form>);
        expect(wrapper.find('form')).toBeTruthy();
        expect(wrapper.find('input').length).toBe(2);
      });

      it('empty', () => {
        const wrapper = mount(<Form>{() => null}</Form>);
        expect(wrapper.find('form')).toBeTruthy();
      });
    });
  });

  it('fields touched', async () => {
    let form;

    const wrapper = mount(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
        >
          <InfoField name="username" />
          <InfoField name="password" />
          <Field>{() => null}</Field>
        </Form>
      </div>,
    );

    expect(form.isFieldsTouched()).toBeFalsy();
    expect(form.isFieldsTouched(['username', 'password'])).toBeFalsy();

    await changeValue(getField(wrapper, 0), 'Bamboo');
    expect(form.isFieldsTouched()).toBeTruthy();
    expect(form.isFieldsTouched(['username', 'password'])).toBeTruthy();
    expect(form.isFieldsTouched(true)).toBeFalsy();
    expect(form.isFieldsTouched(['username', 'password'], true)).toBeFalsy();

    await changeValue(getField(wrapper, 1), 'Light');
    expect(form.isFieldsTouched()).toBeTruthy();
    expect(form.isFieldsTouched(['username', 'password'])).toBeTruthy();
    expect(form.isFieldsTouched(true)).toBeTruthy();
    expect(form.isFieldsTouched(['username', 'password'], true)).toBeTruthy();
  });

  describe('reset form', () => {
    function resetTest(name, ...args) {
      it(name, async () => {
        let form;
        const onReset = jest.fn();

        const wrapper = mount(
          <div>
            <Form
              ref={instance => {
                form = instance;
              }}
            >
              <Field name="username" rules={[{ required: true }]} onReset={onReset}>
                <Input />
              </Field>
            </Form>
          </div>,
        );

        await changeValue(getField(wrapper, 'username'), 'Bamboo');
        expect(form.getFieldValue('username')).toEqual('Bamboo');
        expect(form.getFieldError('username')).toEqual([]);
        expect(form.isFieldTouched('username')).toBeTruthy();

        expect(onReset).not.toHaveBeenCalled();
        form.resetFields(...args);
        expect(form.getFieldValue('username')).toEqual(undefined);
        expect(form.getFieldError('username')).toEqual([]);
        expect(form.isFieldTouched('username')).toBeFalsy();
        expect(onReset).toHaveBeenCalled();
        onReset.mockRestore();

        await changeValue(getField(wrapper, 'username'), '');
        expect(form.getFieldValue('username')).toEqual('');
        expect(form.getFieldError('username')).toEqual(["'username' is required"]);
        expect(form.isFieldTouched('username')).toBeTruthy();

        expect(onReset).not.toHaveBeenCalled();
        form.resetFields(...args);
        expect(form.getFieldValue('username')).toEqual(undefined);
        expect(form.getFieldError('username')).toEqual([]);
        expect(form.isFieldTouched('username')).toBeFalsy();
        expect(onReset).toHaveBeenCalled();
      });
    }

    resetTest('with field name', ['username']);
    resetTest('without field name');

    it('not affect others', async () => {
      let form;

      const wrapper = mount(
        <div>
          <Form
            ref={instance => {
              form = instance;
            }}
          >
            <Field name="username" rules={[{ required: true }]}>
              <Input />
            </Field>

            <Field name="password" rules={[{ required: true }]}>
              <Input />
            </Field>
          </Form>
        </div>,
      );

      await changeValue(getField(wrapper, 'username'), 'Bamboo');
      await changeValue(getField(wrapper, 'password'), '');
      form.resetFields(['username']);

      expect(form.getFieldValue('username')).toEqual(undefined);
      expect(form.getFieldError('username')).toEqual([]);
      expect(form.isFieldTouched('username')).toBeFalsy();
      expect(form.getFieldValue('password')).toEqual('');
      expect(form.getFieldError('password')).toEqual(["'password' is required"]);
      expect(form.isFieldTouched('password')).toBeTruthy();
    });
  });

  it('should throw if no Form in use', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mount(
      <Field>
        <Input />
      </Field>,
    );

    expect(errorSpy).toHaveBeenCalledWith(
      'Warning: Can not find FormContext. Please make sure you wrap Field under Form.',
    );

    errorSpy.mockRestore();
  });

  it('keep origin input function', async () => {
    const onChange = jest.fn();
    const onValuesChange = jest.fn();
    const wrapper = mount(
      <Form onValuesChange={onValuesChange}>
        <Field name="username">
          <Input onChange={onChange} />
        </Field>
      </Form>,
    );

    await changeValue(getField(wrapper), 'Bamboo');
    expect(onValuesChange).toHaveBeenCalledWith({ username: 'Bamboo' }, { username: 'Bamboo' });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ target: { value: 'Bamboo' } }));
  });

  it('submit', async () => {
    const onFinish = jest.fn();
    const onFinishFailed = jest.fn();

    const wrapper = mount(
      <Form onFinish={onFinish} onFinishFailed={onFinishFailed}>
        <InfoField name="user" rules={[{ required: true }]}>
          <Input />
        </InfoField>
        <button type="submit">submit</button>
      </Form>,
    );

    // Not trigger
    wrapper.find('button').simulate('submit');
    await timeout();
    wrapper.update();
    matchError(wrapper, "'user' is required");
    expect(onFinish).not.toHaveBeenCalled();
    expect(onFinishFailed).toHaveBeenCalledWith({
      errorFields: [{ name: ['user'], errors: ["'user' is required"] }],
      outOfDate: false,
      values: {},
    });

    onFinish.mockReset();
    onFinishFailed.mockReset();

    // Trigger
    await changeValue(getField(wrapper), 'Bamboo');
    wrapper.find('button').simulate('submit');
    await timeout();
    matchError(wrapper, false);
    expect(onFinish).toHaveBeenCalledWith({ user: 'Bamboo' });
    expect(onFinishFailed).not.toHaveBeenCalled();
  });

  it('getInternalHooks should not usable by user', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    let form;
    mount(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
        />
      </div>,
    );

    expect(form.getInternalHooks()).toEqual(null);

    expect(errorSpy).toHaveBeenCalledWith(
      'Warning: `getInternalHooks` is internal usage. Should not call directly.',
    );

    errorSpy.mockRestore();
  });

  it('valuePropName', async () => {
    let form;
    const wrapper = mount(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
        >
          <Field name="check" valuePropName="checked">
            <Input type="checkbox" />
          </Field>
        </Form>
      </div>,
    );

    wrapper.find('input[type="checkbox"]').simulate('change', { target: { checked: true } });
    await timeout();
    expect(form.getFieldsValue()).toEqual({ check: true });

    wrapper.find('input[type="checkbox"]').simulate('change', { target: { checked: false } });
    await timeout();
    expect(form.getFieldsValue()).toEqual({ check: false });
  });

  it('getValueProps', async () => {
    const wrapper = mount(
      <div>
        <Form initialValues={{ test: 'bamboo' }}>
          <Field name="test" getValueProps={val => ({ light: val })}>
            <span className="anything" />
          </Field>
        </Form>
      </div>,
    );

    expect(wrapper.find('.anything').props().light).toEqual('bamboo');
  });

  describe('shouldUpdate', () => {
    it('work', async () => {
      let isAllTouched;
      let hasError;

      const wrapper = mount(
        <Form>
          <Field name="username" rules={[{ required: true }]}>
            <Input />
          </Field>
          <Field name="password" rules={[{ required: true }]}>
            <Input />
          </Field>
          <Field shouldUpdate>
            {(_, __, { getFieldsError, isFieldsTouched }) => {
              isAllTouched = isFieldsTouched(true);
              hasError = getFieldsError().filter(({ errors }) => errors.length).length;

              return null;
            }}
          </Field>
        </Form>,
      );

      await changeValue(getField(wrapper, 'username'), '');
      expect(isAllTouched).toBeFalsy();
      expect(hasError).toBeTruthy();

      await changeValue(getField(wrapper, 'username'), 'Bamboo');
      expect(isAllTouched).toBeFalsy();
      expect(hasError).toBeFalsy();

      await changeValue(getField(wrapper, 'password'), 'Light');
      expect(isAllTouched).toBeTruthy();
      expect(hasError).toBeFalsy();

      await changeValue(getField(wrapper, 'password'), '');
      expect(isAllTouched).toBeTruthy();
      expect(hasError).toBeTruthy();
    });

    it('true will force one more update', async () => {
      let renderPhase = 0;

      const wrapper = mount(
        <Form initialValues={{ username: 'light' }}>
          <Field name="username">
            <Input />
          </Field>
          <Field shouldUpdate>
            {(_, __, form) => {
              renderPhase += 1;
              return (
                <span
                  id="holder"
                  data-touched={form.isFieldsTouched(true)}
                  data-value={form.getFieldsValue()}
                />
              );
            }}
          </Field>
        </Form>,
      );

      const props = wrapper.find('#holder').props();
      expect(renderPhase).toEqual(2);
      expect(props['data-touched']).toBeFalsy();
      expect(props['data-value']).toEqual({ username: 'light' });
    });
  });

  describe('setFields', () => {
    it('should work', () => {
      let form;
      const wrapper = mount(
        <div>
          <Form
            ref={instance => {
              form = instance;
            }}
          >
            <InfoField name="username">
              <Input />
            </InfoField>
          </Form>
        </div>,
      );

      form.setFields([
        {
          name: 'username',
          touched: false,
          validating: true,
          errors: ['Set It!'],
        },
      ]);
      wrapper.update();

      matchError(wrapper, 'Set It!');
      expect(wrapper.find('.validating').length).toBeTruthy();
      expect(form.isFieldsTouched()).toBeFalsy();
    });

    it('should trigger by setField', () => {
      const triggerUpdate = jest.fn();
      const formRef = React.createRef();

      const wrapper = mount(
        <div>
          <Form ref={formRef}>
            <Field shouldUpdate={(prev, next) => prev.value !== next.value}>
              {() => {
                triggerUpdate();
                return <input />;
              }}
            </Field>
          </Form>
        </div>,
      );
      wrapper.update();
      triggerUpdate.mockReset();

      // Not trigger render
      formRef.current.setFields([{ name: 'others', value: 'no need to update' }]);
      wrapper.update();
      expect(triggerUpdate).not.toHaveBeenCalled();

      // Trigger render
      formRef.current.setFields([{ name: 'value', value: 'should update' }]);
      wrapper.update();
      expect(triggerUpdate).toHaveBeenCalled();
    });
  });

  it('render props get meta', () => {
    let called1 = false;
    let called2 = false;

    mount(
      <Form>
        <Field name="Light">
          {(_, meta) => {
            expect(meta.name).toEqual(['Light']);
            called1 = true;
            return null;
          }}
        </Field>
        <Field name={['Bamboo', 'Best']}>
          {(_, meta) => {
            expect(meta.name).toEqual(['Bamboo', 'Best']);
            called2 = true;
            return null;
          }}
        </Field>
      </Form>,
    );

    expect(called1).toBeTruthy();
    expect(called2).toBeTruthy();
  });

  it('setFieldsValue should clean up status', async () => {
    let form;
    let currentMeta;

    const wrapper = mount(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
        >
          <Field name="normal" rules={[{ validator: () => new Promise(() => {}) }]}>
            {(control, meta) => {
              currentMeta = meta;
              return <Input {...control} />;
            }}
          </Field>
        </Form>
      </div>,
    );

    // Init
    expect(form.getFieldValue('normal')).toBe(undefined);
    expect(form.isFieldTouched('normal')).toBeFalsy();
    expect(form.getFieldError('normal')).toEqual([]);
    expect(currentMeta.validating).toBeFalsy();

    // Set it
    form.setFieldsValue({
      normal: 'Light',
    });

    expect(form.getFieldValue('normal')).toBe('Light');
    expect(form.isFieldTouched('normal')).toBeTruthy();
    expect(form.getFieldError('normal')).toEqual([]);
    expect(currentMeta.validating).toBeFalsy();

    // Input it
    await changeValue(getField(wrapper), 'Bamboo');

    expect(form.getFieldValue('normal')).toBe('Bamboo');
    expect(form.isFieldTouched('normal')).toBeTruthy();
    expect(form.getFieldError('normal')).toEqual([]);
    expect(currentMeta.validating).toBeTruthy();

    // Set it again
    form.setFieldsValue({
      normal: 'Light',
    });

    expect(form.getFieldValue('normal')).toBe('Light');
    expect(form.isFieldTouched('normal')).toBeTruthy();
    expect(form.getFieldError('normal')).toEqual([]);
    expect(currentMeta.validating).toBeFalsy();
  });

  it('warning if invalidate element', () => {
    resetWarned();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mount(
      <div>
        <Form>
          <Field>
            <h1 key="1">Light</h1>
            <h2 key="2">Bamboo</h2>
          </Field>
        </Form>
      </div>,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      'Warning: `children` of Field is not validate ReactElement.',
    );
    errorSpy.mockRestore();
  });

  it('warning if call function before set prop', () => {
    jest.useFakeTimers();
    resetWarned();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const Test = () => {
      const [form] = useForm();
      form.getFieldsValue();

      return <Form />;
    };

    mount(<Test />);

    jest.runAllTimers();
    expect(errorSpy).toHaveBeenCalledWith(
      'Warning: Instance created by `useForm` is not connected to any Form element. Forget to pass `form` prop?',
    );
    errorSpy.mockRestore();
    jest.useRealTimers();
  });

  it('filtering fields by meta', async () => {
    let form;

    const wrapper = mount(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
        >
          <InfoField name="username" />
          <InfoField name="password" />
          <Field>{() => null}</Field>
        </Form>
      </div>,
    );

    expect(
      form.getFieldsValue(null, meta => {
        expect(Object.keys(meta)).toEqual(['touched', 'validating', 'errors', 'name']);
        return false;
      }),
    ).toEqual({});

    expect(form.getFieldsValue(null, () => true)).toEqual(form.getFieldsValue());
    expect(form.getFieldsValue(null, meta => meta.touched)).toEqual({});

    await changeValue(getField(wrapper, 0), 'Bamboo');
    expect(form.getFieldsValue(null, () => true)).toEqual(form.getFieldsValue());
    expect(form.getFieldsValue(null, meta => meta.touched)).toEqual({
      username: 'Bamboo',
    });
    expect(form.getFieldsValue(['username'], meta => meta.touched)).toEqual({
      username: 'Bamboo',
    });
    expect(form.getFieldsValue(['password'], meta => meta.touched)).toEqual({});
  });
});

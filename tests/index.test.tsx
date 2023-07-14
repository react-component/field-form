import { mount } from 'enzyme';
import { fireEvent, render } from '@testing-library/react';
import { resetWarned } from 'rc-util/lib/warning';
import React from 'react';
import type { FormInstance } from '../src';
import Form, { Field, useForm } from '../src';
import { changeValue, getField, matchError } from './common';
import InfoField, { Input } from './common/InfoField';
import timeout from './common/timeout';
import type { Meta } from '@/interface';

describe('Form.Basic', () => {
  describe('create form', () => {
    const Content: React.FC = () => (
      <div>
        <Field name="light">
          <Input />
        </Field>
        <Field name="bamboo">{() => null}</Field>
        <InfoField />
      </div>
    );

    it('sub component', () => {
      const { container } = render(
        <Form>
          <Content />
        </Form>,
      );
      expect(container.querySelector<HTMLFormElement>('form')).toBeTruthy();
      expect(container.querySelectorAll<HTMLInputElement>('input').length).toBe(2);
    });

    describe('component', () => {
      it('without dom', () => {
        const { container } = render(
          <Form component={false}>
            <Content />
          </Form>,
        );
        expect(container.querySelectorAll<HTMLFormElement>('form').length).toBe(0);
        expect(container.querySelectorAll<HTMLInputElement>('input').length).toBe(2);
      });

      it('use string', () => {
        const { container } = render(
          <Form component="pre">
            <Content />
          </Form>,
        );
        expect(container.querySelectorAll<HTMLFormElement>('form').length).toBe(0);
        expect(container.querySelectorAll<HTMLPreElement>('pre').length).toBe(1);
        expect(container.querySelectorAll<HTMLInputElement>('input').length).toBe(2);
      });

      it('use component', () => {
        const Component: React.FC<any> = ({ children }) => (
          <div className="customize">{children}</div>
        );
        const { container } = render(
          <Form component={Component}>
            <Content />
          </Form>,
        );
        expect(container.querySelectorAll<HTMLFormElement>('form').length).toBe(0);
        expect(container.querySelectorAll<HTMLDivElement>('.customize').length).toBe(1);
        expect(container.querySelectorAll<HTMLInputElement>('input').length).toBe(2);
      });
    });

    describe('render props', () => {
      it('normal', () => {
        const { container } = render(
          <Form>
            <Content />
          </Form>,
        );
        expect(container.querySelector<HTMLFormElement>('form')).toBeTruthy();
        expect(container.querySelectorAll<HTMLInputElement>('input').length).toBe(2);
      });
      it('empty', () => {
        const { container } = render(<Form>{() => null}</Form>);
        expect(container.querySelector<HTMLFormElement>('form')).toBeTruthy();
      });
    });
  });

  it('fields touched', async () => {
    const form = React.createRef<FormInstance>();

    const wrapper = mount(
      <div>
        <Form ref={form}>
          <InfoField name="username" />
          <InfoField name="password" />
          <Field>{() => null}</Field>
        </Form>
      </div>,
    );

    expect(form.current?.isFieldsTouched()).toBeFalsy();
    expect(form.current?.isFieldsTouched(['username', 'password'])).toBeFalsy();

    await changeValue(getField(wrapper, 0), 'Bamboo');
    expect(form.current?.isFieldsTouched()).toBeTruthy();
    expect(form.current?.isFieldsTouched(['username', 'password'])).toBeTruthy();
    expect(form.current?.isFieldsTouched(true)).toBeFalsy();
    expect(form.current?.isFieldsTouched(['username', 'password'], true)).toBeFalsy();

    await changeValue(getField(wrapper, 1), 'Light');
    expect(form.current?.isFieldsTouched()).toBeTruthy();
    expect(form.current?.isFieldsTouched(['username', 'password'])).toBeTruthy();
    expect(form.current?.isFieldsTouched(true)).toBeTruthy();
    expect(form.current?.isFieldsTouched(['username', 'password'], true)).toBeTruthy();
  });

  describe('reset form', () => {
    function resetTest(name: string, ...args) {
      it(name, async () => {
        const form = React.createRef<FormInstance>();
        const onReset = jest.fn();
        const onMeta = jest.fn();

        const wrapper = mount(
          <div>
            <Form ref={form}>
              <Field
                name="username"
                rules={[{ required: true }]}
                onReset={onReset}
                onMetaChange={onMeta}
              >
                <Input />
              </Field>
            </Form>
          </div>,
        );

        await changeValue(getField(wrapper, 'username'), 'Bamboo');
        expect(form.current?.getFieldValue('username')).toEqual('Bamboo');
        expect(form.current?.getFieldError('username')).toEqual([]);
        expect(form.current?.isFieldTouched('username')).toBeTruthy();
        expect(onMeta).toHaveBeenCalledWith(
          expect.objectContaining({ touched: true, errors: [], warnings: [] }),
        );
        expect(onReset).not.toHaveBeenCalled();
        onMeta.mockRestore();
        onReset.mockRestore();

        form.current?.resetFields(...args);
        expect(form.current?.getFieldValue('username')).toEqual(undefined);
        expect(form.current?.getFieldError('username')).toEqual([]);
        expect(form.current?.isFieldTouched('username')).toBeFalsy();
        expect(onMeta).toHaveBeenCalledWith(
          expect.objectContaining({ touched: false, errors: [], warnings: [] }),
        );
        expect(onReset).toHaveBeenCalled();
        onMeta.mockRestore();
        onReset.mockRestore();

        await changeValue(getField(wrapper, 'username'), '');
        expect(form.current?.getFieldValue('username')).toEqual('');
        expect(form.current?.getFieldError('username')).toEqual(["'username' is required"]);
        expect(form.current?.isFieldTouched('username')).toBeTruthy();
        expect(onMeta).toHaveBeenCalledWith(
          expect.objectContaining({
            touched: true,
            errors: ["'username' is required"],
            warnings: [],
          }),
        );
        expect(onReset).not.toHaveBeenCalled();
        onMeta.mockRestore();
        onReset.mockRestore();

        form.current?.resetFields(...args);
        expect(form.current?.getFieldValue('username')).toEqual(undefined);
        expect(form.current?.getFieldError('username')).toEqual([]);
        expect(form.current?.isFieldTouched('username')).toBeFalsy();
        expect(onMeta).toHaveBeenCalledWith(
          expect.objectContaining({ touched: false, errors: [], warnings: [] }),
        );
        expect(onReset).toHaveBeenCalled();
      });
    }

    resetTest('with field name', ['username']);
    resetTest('without field name');

    it('not affect others', async () => {
      const form = React.createRef<FormInstance>();

      const wrapper = mount(
        <div>
          <Form ref={form}>
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
      form.current?.resetFields(['username']);

      expect(form.current?.getFieldValue('username')).toEqual(undefined);
      expect(form.current?.getFieldError('username')).toEqual([]);
      expect(form.current?.isFieldTouched('username')).toBeFalsy();
      expect(form.current?.getFieldValue('password')).toEqual('');
      expect(form.current?.getFieldError('password')).toEqual(["'password' is required"]);
      expect(form.current?.isFieldTouched('password')).toBeTruthy();
    });

    it('remove Field should trigger onMetaChange', () => {
      const onMetaChange = jest.fn();
      const { unmount } = render(
        <Form>
          <Field name="username" onMetaChange={onMetaChange}>
            <Input />
          </Field>
        </Form>,
      );
      unmount();
      expect(onMetaChange).toHaveBeenCalledWith(expect.objectContaining({ destroy: true }));
    });
  });

  it('should throw if no Form in use', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
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

  it('onValuesChange should not return fully value', async () => {
    const onValuesChange = jest.fn();

    const Demo: React.FC<any> = ({ showField = true }) => (
      <Form onValuesChange={onValuesChange} initialValues={{ light: 'little' }}>
        {showField && (
          <Field name="light">
            <Input />
          </Field>
        )}
        <Field name="bamboo">
          <Input />
        </Field>
      </Form>
    );

    const wrapper = mount(<Demo />);
    await changeValue(getField(wrapper, 'bamboo'), 'cute');
    expect(onValuesChange).toHaveBeenCalledWith(expect.anything(), {
      light: 'little',
      bamboo: 'cute',
    });

    onValuesChange.mockReset();
    wrapper.setProps({ showField: false });
    await changeValue(getField(wrapper, 'bamboo'), 'beauty');
    expect(onValuesChange).toHaveBeenCalledWith(expect.anything(), { bamboo: 'beauty' });
  });
  it('should call onReset fn, when the button is clicked', async () => {
    const resetFn = jest.fn();
    const wrapper = mount(
      <Form onReset={resetFn}>
        <InfoField name={'user'}>
          <Input />
        </InfoField>
        <button type="reset">reset</button>
      </Form>,
    );
    await changeValue(getField(wrapper), 'Bamboo');
    wrapper.find('button').simulate('reset');
    await timeout();
    expect(resetFn).toHaveBeenCalledTimes(1);
    const { value } = wrapper.find('input').props();
    expect(value).toEqual('');
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
      errorFields: [{ name: ['user'], errors: ["'user' is required"], warnings: [] }],
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

    const form = React.createRef<FormInstance>();
    render(
      <div>
        <Form ref={form} />
      </div>,
    );

    expect((form.current as any)?.getInternalHooks()).toEqual(null);

    expect(errorSpy).toHaveBeenCalledWith(
      'Warning: `getInternalHooks` is internal usage. Should not call directly.',
    );

    errorSpy.mockRestore();
  });

  it('valuePropName', async () => {
    const form = React.createRef<FormInstance>();
    const wrapper = mount(
      <div>
        <Form ref={form}>
          <Field name="check" valuePropName="checked">
            <Input type="checkbox" />
          </Field>
        </Form>
      </div>,
    );

    wrapper.find('input[type="checkbox"]').simulate('change', { target: { checked: true } });
    await timeout();
    expect(form.current?.getFieldsValue()).toEqual({ check: true });

    wrapper.find('input[type="checkbox"]').simulate('change', { target: { checked: false } });
    await timeout();
    expect(form.current?.getFieldsValue()).toEqual({ check: false });
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

    expect((wrapper.find('.anything').props() as any).light).toEqual('bamboo');
  });

  describe('shouldUpdate', () => {
    it('work', async () => {
      let isAllTouched: boolean;
      let hasError: number;

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
                  data-touched={form?.isFieldsTouched(true)}
                  data-value={form?.getFieldsValue()}
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
      const form = React.createRef<FormInstance>();
      const wrapper = mount(
        <div>
          <Form ref={form}>
            <InfoField name="username">
              <Input />
            </InfoField>
          </Form>
        </div>,
      );

      form.current?.setFields([
        { name: 'username', touched: false, validating: true, errors: ['Set It!'] },
      ]);
      wrapper.update();

      matchError(wrapper, 'Set It!');
      expect(wrapper.find('.validating').length).toBeTruthy();
      expect(form.current?.isFieldsTouched()).toBeFalsy();
    });

    it('should trigger by setField', () => {
      const triggerUpdate = jest.fn();
      const formRef = React.createRef<FormInstance>();

      render(
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

      triggerUpdate.mockReset();

      // Not trigger render
      formRef.current.setFields([{ name: 'others', value: 'no need to update' }]);

      expect(triggerUpdate).not.toHaveBeenCalled();

      // Trigger render
      formRef.current.setFields([{ name: 'value', value: 'should update' }]);

      expect(triggerUpdate).toHaveBeenCalled();
    });
  });

  it('render props get meta', () => {
    let called1 = false;
    let called2 = false;

    render(
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
    const form = React.createRef<FormInstance>();
    let currentMeta: Meta = null;

    const wrapper = mount(
      <div>
        <Form ref={form}>
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
    expect(form.current?.getFieldValue('normal')).toBe(undefined);
    expect(form.current?.isFieldTouched('normal')).toBeFalsy();
    expect(form.current?.getFieldError('normal')).toEqual([]);
    expect(currentMeta.validating).toBeFalsy();

    // Set it
    form.current?.setFieldsValue({ normal: 'Light' });

    expect(form.current?.getFieldValue('normal')).toBe('Light');
    expect(form.current?.isFieldTouched('normal')).toBeTruthy();
    expect(form.current?.getFieldError('normal')).toEqual([]);
    expect(currentMeta.validating).toBeFalsy();

    // Input it
    await changeValue(getField(wrapper), 'Bamboo');

    expect(form.current?.getFieldValue('normal')).toBe('Bamboo');
    expect(form.current?.isFieldTouched('normal')).toBeTruthy();
    expect(form.current?.getFieldError('normal')).toEqual([]);
    expect(currentMeta.validating).toBeTruthy();

    // Set it again
    form.current?.setFieldsValue({ normal: 'Light' });

    expect(form.current?.getFieldValue('normal')).toBe('Light');
    expect(form.current?.isFieldTouched('normal')).toBeTruthy();
    expect(form.current?.getFieldError('normal')).toEqual([]);
    expect(currentMeta.validating).toBeFalsy();
  });

  it('warning if invalidate element', () => {
    resetWarned();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <div>
        <Form>
          {/* @ts-ignore */}
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

    const Test: React.FC = () => {
      const [form] = useForm();
      form.getFieldsValue();

      return <Form />;
    };

    render(<Test />);

    jest.runAllTimers();
    expect(errorSpy).toHaveBeenCalledWith(
      'Warning: Instance created by `useForm` is not connected to any Form element. Forget to pass `form` prop?',
    );
    errorSpy.mockRestore();
    jest.useRealTimers();
  });

  it('filtering fields by meta', async () => {
    const form = React.createRef<FormInstance>();

    const wrapper = mount(
      <div>
        <Form ref={form}>
          <InfoField name="username" />
          <InfoField name="password" />
          <Field>{() => null}</Field>
        </Form>
      </div>,
    );

    expect(
      form.current?.getFieldsValue(null, meta => {
        expect(Object.keys(meta)).toEqual([
          'touched',
          'validating',
          'errors',
          'warnings',
          'name',
          'validated',
        ]);
        return false;
      }),
    ).toEqual({});

    expect(form.current?.getFieldsValue(null, () => true)).toEqual(form.current?.getFieldsValue());
    expect(form.current?.getFieldsValue(null, meta => meta.touched)).toEqual({});

    await changeValue(getField(wrapper, 0), 'Bamboo');
    expect(form.current?.getFieldsValue(null, () => true)).toEqual(form.current?.getFieldsValue());
    expect(form.current?.getFieldsValue(null, meta => meta.touched)).toEqual({
      username: 'Bamboo',
    });
    expect(form.current?.getFieldsValue(['username'], meta => meta.touched)).toEqual({
      username: 'Bamboo',
    });
    expect(form.current?.getFieldsValue(['password'], meta => meta.touched)).toEqual({});
  });

  it('should not crash when return value contains target field', async () => {
    const CustomInput: React.FC<any> = ({ value, onChange }) => {
      const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ value: e.target.value, target: 'string' });
      };
      return <Input value={value} onChange={onInputChange} />;
    };
    const { container } = render(
      <Form>
        <Field name="user">
          <CustomInput />
        </Field>
      </Form>,
    );
    expect(() => {
      fireEvent.change(container.querySelector('input'), { target: { value: 'Light' } });
    }).not.toThrowError();
  });

  it('setFieldsValue for List should work', () => {
    const Demo: React.FC<any> = () => {
      const [form] = useForm();

      const handelReset = () => {
        form.setFieldsValue({
          users: [],
        });
      };

      const initialValues = {
        users: [{ name: '11' }, { name: '22' }],
      };

      return (
        <Form
          form={form}
          initialValues={initialValues}
          name="dynamic_form_nest_item"
          autoComplete="off"
        >
          <Form.List name="users">
            {fields => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Field
                    key={key}
                    {...restField}
                    name={[name, 'name']}
                    rules={[{ required: true, message: 'Missing name' }]}
                  >
                    <Input placeholder="Name" />
                  </Field>
                ))}
              </>
            )}
          </Form.List>
          <Field>
            <button className="reset-btn" onClick={handelReset}>
              reset
            </button>
          </Field>
        </Form>
      );
    };
    const { container } = render(<Demo />);
    expect(container.querySelector<HTMLInputElement>('input')?.value).toBe('11');
    fireEvent.click(container.querySelector('.reset-btn'));
    expect(container.querySelectorAll<HTMLInputElement>('input').length).toBe(0);
  });

  it('setFieldsValue should work for multiple Select', () => {
    const Select: React.FC<any> = ({ value, defaultValue }) => {
      return <div className="select-div">{(value || defaultValue || []).toString()}</div>;
    };

    const Demo: React.FC<any> = () => {
      const [formInstance] = Form.useForm();

      React.useEffect(() => {
        formInstance.setFieldsValue({ selector: ['K1', 'K2'] });
      }, [formInstance]);

      return (
        <Form form={formInstance}>
          <Field initialValue="K1" name="selector">
            <Select />
          </Field>
        </Form>
      );
    };

    const { container } = render(<Demo />);
    expect(container.querySelector('.select-div').textContent).toBe('K1,K2');
  });

  // https://github.com/ant-design/ant-design/issues/34768
  it('remount should not clear current value', () => {
    let refForm: FormInstance = null;

    const Demo: React.FC<any> = ({ remount }) => {
      const [form] = Form.useForm();
      refForm = form;
      let node = (
        <Form form={form} initialValues={{ name: 'little' }}>
          <Field name="name">
            <Input />
          </Field>
        </Form>
      );

      if (remount) {
        node = <div>{node}</div>;
      }

      return node;
    };

    const { container, rerender } = render(<Demo />);
    refForm.setFieldsValue({ name: 'bamboo' });
    expect(container.querySelector<HTMLInputElement>('input').value).toBe('bamboo');
    rerender(<Demo remount />);
    expect(container.querySelector<HTMLInputElement>('input').value).toBe('bamboo');
  });

  it('setFieldValue', () => {
    const formRef = React.createRef<FormInstance>();

    const Demo: React.FC = () => (
      <Form ref={formRef} initialValues={{ list: ['bamboo', 'little', 'light'] }}>
        <Form.List name="list">
          {fields =>
            fields.map(field => (
              <Field {...field} key={field.key}>
                <Input />
              </Field>
            ))
          }
        </Form.List>
        <Field name={['nest', 'target']} initialValue="nested">
          <Input />
        </Field>
      </Form>
    );

    const { container } = render(<Demo />);
    expect(
      Array.from(container.querySelectorAll<HTMLInputElement>('input')).map(input => input?.value),
    ).toEqual(['bamboo', 'little', 'light', 'nested']);

    // Set
    formRef.current.setFieldValue(['list', 1], 'tiny');
    formRef.current.setFieldValue(['nest', 'target'], 'match');

    expect(
      Array.from(container.querySelectorAll<HTMLInputElement>('input')).map(input => input?.value),
    ).toEqual(['bamboo', 'tiny', 'light', 'match']);
  });

  it('onMetaChange should only trigger when meta changed', () => {
    const onMetaChange = jest.fn();
    const formRef = React.createRef<FormInstance>();

    const Demo: React.FC = () => (
      <Form ref={formRef}>
        <Field onMetaChange={onMetaChange} shouldUpdate={() => false}>
          {() => null}
        </Field>
      </Form>
    );

    render(<Demo />);

    formRef.current?.setFieldsValue({});
    onMetaChange.mockReset();

    // Re-render should not trigger `onMetaChange`
    for (let i = 0; i < 10; i += 1) {
      formRef.current?.setFieldsValue({});
    }

    expect(onMetaChange).toHaveBeenCalledTimes(0);
  });
});

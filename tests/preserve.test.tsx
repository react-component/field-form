/* eslint-disable no-template-curly-in-string, arrow-body-style */
import { mount } from 'enzyme';
import React from 'react';
import type { FormInstance } from '../src';
import Form from '../src';
import InfoField, { Input } from './common/InfoField';
import timeout from './common/timeout';

describe('Form.Preserve', () => {
  const Demo = ({
    removeField,
    formPreserve,
    fieldPreserve,
    onFinish,
  }: {
    removeField: boolean;
    formPreserve?: boolean;
    fieldPreserve?: boolean;
    onFinish: (values: object) => void;
  }) => (
    <Form onFinish={onFinish} initialValues={{ keep: 233, remove: 666 }} preserve={formPreserve}>
      <InfoField name="keep" />
      {!removeField && <InfoField name="remove" preserve={fieldPreserve} />}
    </Form>
  );

  it('field', async () => {
    const onFinish = jest.fn();
    const wrapper = mount(<Demo removeField={false} onFinish={onFinish} fieldPreserve={false} />);

    async function matchTest(removeField: boolean, match: object) {
      onFinish.mockReset();
      wrapper.setProps({ removeField });
      wrapper.find('form').simulate('submit');
      await timeout();
      expect(onFinish).toHaveBeenCalledWith(match);
    }

    await matchTest(false, { keep: 233, remove: 666 });
    await matchTest(true, { keep: 233 });
    await matchTest(false, { keep: 233, remove: 666 });
  });

  it('form', async () => {
    const onFinish = jest.fn();
    const wrapper = mount(<Demo removeField={false} onFinish={onFinish} formPreserve={false} />);

    async function matchTest(removeField: boolean, match: object) {
      onFinish.mockReset();
      wrapper.setProps({ removeField });
      wrapper.find('form').simulate('submit');
      await timeout();
      expect(onFinish).toHaveBeenCalledWith(match);
    }

    await matchTest(false, { keep: 233, remove: 666 });
    await matchTest(true, { keep: 233 });
    await matchTest(false, { keep: 233, remove: 666 });
  });

  it('keep preserve when other field exist the name', async () => {
    const formRef = React.createRef<FormInstance>();

    const KeepDemo = ({ onFinish, keep }: { onFinish: (values: any) => void; keep: boolean }) => {
      return (
        <Form ref={formRef} initialValues={{ test: 'bamboo' }} onFinish={onFinish}>
          <Form.Field shouldUpdate>
            {() => {
              return (
                <>
                  {keep && <InfoField name="test" preserve={false} />}
                  <InfoField name="test" />
                </>
              );
            }}
          </Form.Field>
        </Form>
      );
    };

    const onFinish = jest.fn();
    const wrapper = mount(<KeepDemo onFinish={onFinish} keep />);

    // Change value
    wrapper
      .find('input')
      .first()
      .simulate('change', { target: { value: 'light' } });

    formRef.current.submit();
    await timeout();
    expect(onFinish).toHaveBeenCalledWith({ test: 'light' });
    onFinish.mockReset();

    // Remove preserve should not change the value
    wrapper.setProps({ keep: false });
    await timeout();
    formRef.current.submit();
    await timeout();
    expect(onFinish).toHaveBeenCalledWith({ test: 'light' });
  });

  it('form preserve but field !preserve', async () => {
    const onFinish = jest.fn();
    const wrapper = mount(
      <Demo removeField={false} onFinish={onFinish} formPreserve={false} fieldPreserve />,
    );

    async function matchTest(removeField: boolean, match: object) {
      onFinish.mockReset();
      wrapper.setProps({ removeField });
      wrapper.find('form').simulate('submit');
      await timeout();
      expect(onFinish).toHaveBeenCalledWith(match);
    }

    await matchTest(true, { keep: 233 });
    await matchTest(false, { keep: 233, remove: 666 });
  });

  describe('Form.List', () => {
    it('form preserve should not crash', async () => {
      let form: FormInstance;

      const wrapper = mount(
        <Form
          initialValues={{ list: ['light', 'bamboo', 'little'] }}
          preserve={false}
          ref={instance => {
            form = instance;
          }}
        >
          <Form.List name="list">
            {(fields, { remove }) => {
              return (
                <div>
                  {fields.map(field => (
                    <Form.Field {...field}>
                      <input />
                    </Form.Field>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      remove(0);
                    }}
                  />
                </div>
              );
            }}
          </Form.List>
        </Form>,
      );

      wrapper.find('button').simulate('click');
      wrapper.update();

      expect(form.getFieldsValue()).toEqual({ list: ['bamboo', 'little'] });
    });

    it('warning when Form.List use preserve', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      let form: FormInstance;

      const wrapper = mount(
        <Form
          ref={instance => {
            form = instance;
          }}
          initialValues={{ list: ['bamboo'] }}
        >
          <Form.List name="list">
            {(fields, { remove }) => (
              <>
                {fields.map(field => (
                  <Form.Field {...field} preserve={false}>
                    <input />
                  </Form.Field>
                ))}
                <button
                  onClick={() => {
                    remove(0);
                  }}
                >
                  Remove
                </button>
              </>
            )}
          </Form.List>
        </Form>,
      );

      expect(errorSpy).toHaveBeenCalledWith(
        'Warning: `preserve` should not apply on Form.List fields.',
      );

      errorSpy.mockRestore();

      // Remove should not work
      wrapper.find('button').simulate('click');
      expect(form.getFieldsValue()).toEqual({ list: [] });
    });

    it('multiple level field can use preserve', async () => {
      let form: FormInstance;

      const wrapper = mount(
        <Form
          initialValues={{ list: [{ type: 'light' }] }}
          preserve={false}
          ref={instance => {
            form = instance;
          }}
        >
          <Form.List name="list">
            {(fields, { remove }) => {
              return (
                <>
                  {fields.map(field => (
                    <div key={field.key}>
                      <Form.Field {...field} name={[field.name, 'type']}>
                        <Input />
                      </Form.Field>
                      <Form.Field shouldUpdate>
                        {(_, __, { getFieldValue }) =>
                          getFieldValue(['list', field.name, 'type']) === 'light' ? (
                            <Form.Field
                              {...field}
                              key="light"
                              preserve={false}
                              name={[field.name, 'light']}
                            >
                              <Input />
                            </Form.Field>
                          ) : (
                            <Form.Field
                              {...field}
                              key="bamboo"
                              preserve={false}
                              name={[field.name, 'bamboo']}
                            >
                              <Input />
                            </Form.Field>
                          )
                        }
                      </Form.Field>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      remove(0);
                    }}
                  >
                    Remove
                  </button>
                </>
              );
            }}
          </Form.List>
        </Form>,
      );

      // Change light value
      wrapper
        .find('input')
        .last()
        .simulate('change', { target: { value: '1128' } });

      // Change type
      wrapper
        .find('input')
        .first()
        .simulate('change', { target: { value: 'bamboo' } });

      // Change bamboo value
      wrapper
        .find('input')
        .last()
        .simulate('change', { target: { value: '903' } });

      expect(form.getFieldsValue()).toEqual({ list: [{ type: 'bamboo', bamboo: '903' }] });

      // ============== Remove Test ==============
      // Remove field
      wrapper.find('button').simulate('click');
      expect(form.getFieldsValue()).toEqual({ list: [] });
    });
  });

  it('nest render props should not clean full store', () => {
    let form: FormInstance;

    const wrapper = mount(
      <Form
        preserve={false}
        ref={instance => {
          form = instance;
        }}
      >
        <Form.Field name="light">
          <input />
        </Form.Field>
        <Form.Field shouldUpdate>
          {(_, __, { getFieldValue }) =>
            getFieldValue('light') === 'bamboo' ? <Form.Field>{() => null}</Form.Field> : null
          }
        </Form.Field>
      </Form>,
    );

    wrapper.find('input').simulate('change', { target: { value: 'bamboo' } });
    expect(form.getFieldsValue()).toEqual({ light: 'bamboo' });

    wrapper.find('input').simulate('change', { target: { value: 'little' } });
    expect(form.getFieldsValue()).toEqual({ light: 'little' });

    wrapper.unmount();
  });

  // https://github.com/ant-design/ant-design/issues/31297
  describe('A -> B -> C should keep trigger refresh', () => {
    it('shouldUpdate', () => {
      const DepDemo = () => {
        const [form] = Form.useForm();

        return (
          <Form form={form} preserve={false}>
            <Form.Field name="name">
              <Input id="name" placeholder="Username" />
            </Form.Field>

            <Form.Field shouldUpdate>
              {() => {
                return form.getFieldValue('name') === '1' ? (
                  <Form.Field name="password">
                    <Input id="password" placeholder="Password" />
                  </Form.Field>
                ) : null;
              }}
            </Form.Field>

            <Form.Field shouldUpdate>
              {() => {
                const password = form.getFieldValue('password');
                return password ? (
                  <Form.Field name="password2">
                    <Input id="password2" placeholder="Password 2" />
                  </Form.Field>
                ) : null;
              }}
            </Form.Field>
          </Form>
        );
      };

      const wrapper = mount(<DepDemo />);

      // Input name to show password
      wrapper
        .find('#name')
        .last()
        .simulate('change', { target: { value: '1' } });
      expect(wrapper.exists('#password')).toBeTruthy();
      expect(wrapper.exists('#password2')).toBeFalsy();

      // Input password to show password2
      wrapper
        .find('#password')
        .last()
        .simulate('change', { target: { value: '1' } });
      expect(wrapper.exists('#password2')).toBeTruthy();

      // Change name to hide password
      wrapper
        .find('#name')
        .last()
        .simulate('change', { target: { value: '2' } });
      expect(wrapper.exists('#password')).toBeFalsy();
      expect(wrapper.exists('#password2')).toBeFalsy();
    });

    it('dependencies', () => {
      const DepDemo = () => {
        const [form] = Form.useForm();

        return (
          <Form form={form} preserve={false}>
            <Form.Field name="name">
              <Input id="name" placeholder="Username" />
            </Form.Field>

            <Form.Field dependencies={['name']}>
              {() => {
                return form.getFieldValue('name') === '1' ? (
                  <Form.Field name="password">
                    <Input id="password" placeholder="Password" />
                  </Form.Field>
                ) : null;
              }}
            </Form.Field>

            <Form.Field dependencies={['password']}>
              {() => {
                const password = form.getFieldValue('password');
                return password ? (
                  <Form.Field name="password2">
                    <Input id="password2" placeholder="Password 2" />
                  </Form.Field>
                ) : null;
              }}
            </Form.Field>
          </Form>
        );
      };

      const wrapper = mount(<DepDemo />);

      // Input name to show password
      wrapper
        .find('#name')
        .last()
        .simulate('change', { target: { value: '1' } });
      expect(wrapper.exists('#password')).toBeTruthy();
      expect(wrapper.exists('#password2')).toBeFalsy();

      // Input password to show password2
      wrapper
        .find('#password')
        .last()
        .simulate('change', { target: { value: '1' } });
      expect(wrapper.exists('#password2')).toBeTruthy();

      // Change name to hide password
      wrapper
        .find('#name')
        .last()
        .simulate('change', { target: { value: '2' } });
      expect(wrapper.exists('#password')).toBeFalsy();
      expect(wrapper.exists('#password2')).toBeFalsy();
    });
  });

  it('should correct calculate preserve state', () => {
    let instance: FormInstance;

    const VisibleDemo = ({ visible = true }: { visible?: boolean }) => {
      const [form] = Form.useForm();
      instance = form;

      return visible ? (
        <Form form={form}>
          <Form.Field name="name">
            <Input />
          </Form.Field>
        </Form>
      ) : (
        <div />
      );
    };

    const wrapper = mount(<VisibleDemo />);

    wrapper.setProps({
      visible: false,
    });

    instance.setFieldsValue({ name: 'bamboo' });
    wrapper.setProps({
      visible: true,
    });

    expect(wrapper.find('input').prop('value')).toEqual('bamboo');
  });
});
/* eslint-enable no-template-curly-in-string */

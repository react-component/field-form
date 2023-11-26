import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import type { FormInstance } from '../src';
import Form from '../src';
import InfoField, { Input } from './common/InfoField';
import timeout from './common/timeout';

describe('Form.Preserve', () => {
  const Demo: React.FC<any> = ({ removeField, formPreserve, fieldPreserve, onFinish }) => (
    <Form onFinish={onFinish} initialValues={{ keep: 233, remove: 666 }} preserve={formPreserve}>
      <InfoField name="keep" />
      {!removeField && <InfoField name="remove" preserve={fieldPreserve} />}
    </Form>
  );

  it('field', async () => {
    const onFinish = jest.fn();
    const { container, rerender } = render(
      <Demo removeField={false} onFinish={onFinish} fieldPreserve={false} />,
    );
    const matchTest = async (removeField: boolean, match: object) => {
      onFinish.mockReset();
      rerender(<Demo removeField={removeField} onFinish={onFinish} fieldPreserve={false} />);
      fireEvent.submit(container.querySelector<HTMLFormElement>('form'));
      await timeout();
      expect(onFinish).toHaveBeenCalledWith(match);
    };
    await matchTest(false, { keep: 233, remove: 666 });
    await matchTest(true, { keep: 233 });
    await matchTest(false, { keep: 233, remove: 666 });
  });

  it('form', async () => {
    const onFinish = jest.fn();
    const { container, rerender } = render(
      <Demo removeField={false} onFinish={onFinish} formPreserve={false} />,
    );
    const matchTest = async (removeField: boolean, match: object) => {
      onFinish.mockReset();
      rerender(<Demo removeField={removeField} onFinish={onFinish} fieldPreserve={false} />);
      fireEvent.submit(container.querySelector<HTMLFormElement>('form'));
      await timeout();
      expect(onFinish).toHaveBeenCalledWith(match);
    };
    await matchTest(false, { keep: 233, remove: 666 });
    await matchTest(true, { keep: 233 });
    await matchTest(false, { keep: 233, remove: 666 });
  });

  it('keep preserve when other field exist the name', async () => {
    const formRef = React.createRef<FormInstance>();

    const KeepDemo: React.FC<any> = ({ onFinish, keep }) => (
      <Form ref={formRef} initialValues={{ test: 'bamboo' }} onFinish={onFinish}>
        <Form.Field shouldUpdate>
          {() => (
            <>
              {keep && <InfoField name="test" preserve={false} />}
              <InfoField name="test" />
            </>
          )}
        </Form.Field>
      </Form>
    );

    const onFinish = jest.fn();
    const { container, rerender } = render(<KeepDemo onFinish={onFinish} keep />);

    // Change value
    fireEvent.change(container.querySelector<HTMLInputElement>('input'), {
      target: { value: 'light' },
    });

    formRef.current?.submit();
    await timeout();
    expect(onFinish).toHaveBeenCalledWith({ test: 'light' });
    onFinish.mockReset();

    // Remove preserve should not change the value
    rerender(<KeepDemo onFinish={onFinish} keep={false} />);
    await timeout();
    formRef.current?.submit();
    await timeout();
    expect(onFinish).toHaveBeenCalledWith({ test: 'light' });
  });

  it('form preserve but field !preserve', async () => {
    const onFinish = jest.fn();
    const { container, rerender } = render(
      <Demo removeField={false} onFinish={onFinish} formPreserve={false} fieldPreserve />,
    );
    const matchTest = async (removeField: boolean, match: object) => {
      onFinish.mockReset();
      rerender(
        <Demo removeField={removeField} onFinish={onFinish} formPreserve={false} fieldPreserve />,
      );
      fireEvent.submit(container.querySelector<HTMLFormElement>('form'));
      await timeout();
      expect(onFinish).toHaveBeenCalledWith(match);
    };
    await matchTest(true, { keep: 233 });
    await matchTest(false, { keep: 233, remove: 666 });
  });

  describe('Form.List', () => {
    it('form preserve should not crash', async () => {
      const form = React.createRef<FormInstance>();

      const { container } = render(
        <Form initialValues={{ list: ['light', 'bamboo', 'little'] }} preserve={false} ref={form}>
          <Form.List name="list">
            {(fields, { remove }) => {
              return (
                <div>
                  {fields.map(field => (
                    <Form.Field {...field} key={field.key}>
                      <input />
                    </Form.Field>
                  ))}
                  <button type="button" onClick={() => remove(0)} />
                </div>
              );
            }}
          </Form.List>
        </Form>,
      );
      fireEvent.click(container.querySelector<HTMLButtonElement>('button'));
      expect(form.current?.getFieldsValue()).toEqual({ list: ['bamboo', 'little'] });
    });

    it('warning when Form.List use preserve', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const form = React.createRef<FormInstance>();
      const { container } = render(
        <Form ref={form} initialValues={{ list: ['bamboo'] }}>
          <Form.List name="list">
            {(fields, { remove }) => (
              <>
                {fields.map(field => (
                  <Form.Field {...field} key={field.key} preserve={false}>
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
      fireEvent.click(container.querySelector<HTMLButtonElement>('button'));
      expect(form.current?.getFieldsValue()).toEqual({ list: [] });
    });

    it('multiple level field can use preserve', async () => {
      const form = React.createRef<FormInstance>();

      const { container } = render(
        <Form initialValues={{ list: [{ type: 'light' }] }} preserve={false} ref={form}>
          <Form.List name="list">
            {(fields, { remove }) => (
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
                <button onClick={() => remove(0)}>Remove</button>
              </>
            )}
          </Form.List>
        </Form>,
      );

      // Change light value
      fireEvent.change(container.querySelectorAll<HTMLInputElement>('input')[1], {
        target: { value: '1128' },
      });

      // Change type
      fireEvent.change(container.querySelectorAll<HTMLInputElement>('input')[0], {
        target: { value: 'bamboo' },
      });

      // Change type
      fireEvent.change(container.querySelectorAll<HTMLInputElement>('input')[1], {
        target: { value: '903' },
      });

      expect(form.current?.getFieldsValue()).toEqual({ list: [{ type: 'bamboo', bamboo: '903' }] });

      // ============== Remove Test ==============
      // Remove field
      fireEvent.click(container.querySelector<HTMLButtonElement>('button'));
      expect(form.current?.getFieldsValue()).toEqual({ list: [] });
    });
  });

  it('nest render props should not clean full store', () => {
    const form = React.createRef<FormInstance>();

    const { container, unmount } = render(
      <Form preserve={false} ref={form}>
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

    fireEvent.change(container.querySelector<HTMLInputElement>('input'), {
      target: { value: 'bamboo' },
    });
    expect(form.current?.getFieldsValue()).toEqual({ light: 'bamboo' });

    fireEvent.change(container.querySelector<HTMLInputElement>('input'), {
      target: { value: 'little' },
    });
    expect(form.current?.getFieldsValue()).toEqual({ light: 'little' });

    unmount();
  });

  // https://github.com/ant-design/ant-design/issues/31297
  describe('A -> B -> C should keep trigger refresh', () => {
    it('shouldUpdate', () => {
      const DepDemo: React.FC = () => {
        const [form] = Form.useForm();
        return (
          <Form form={form} preserve={false}>
            <Form.Field name="name">
              <Input id="name" placeholder="Username" />
            </Form.Field>
            <Form.Field shouldUpdate>
              {() =>
                form.getFieldValue('name') === '1' ? (
                  <Form.Field name="password">
                    <Input id="password" placeholder="Password" />
                  </Form.Field>
                ) : null
              }
            </Form.Field>
            <Form.Field shouldUpdate>
              {() =>
                form.getFieldValue('password') ? (
                  <Form.Field name="password2">
                    <Input id="password2" placeholder="Password 2" />
                  </Form.Field>
                ) : null
              }
            </Form.Field>
          </Form>
        );
      };

      const { container } = render(<DepDemo />);

      // Input name to show password
      fireEvent.change(container.querySelector<HTMLInputElement>('#name'), {
        target: { value: '1' },
      });
      expect(container.querySelector<HTMLInputElement>('#password')).toBeTruthy();
      expect(container.querySelector<HTMLInputElement>('#password2')).toBeFalsy();

      // Input password to show password2
      fireEvent.change(container.querySelector<HTMLInputElement>('#password'), {
        target: { value: '1' },
      });
      expect(container.querySelector<HTMLInputElement>('#password2')).toBeTruthy();

      // Change name to hide password
      fireEvent.change(container.querySelector<HTMLInputElement>('#name'), {
        target: { value: '2' },
      });
      expect(container.querySelector<HTMLInputElement>('#password')).toBeFalsy();
      expect(container.querySelector<HTMLInputElement>('#password2')).toBeFalsy();
    });

    it('dependencies', () => {
      const DepDemo: React.FC = () => {
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

      const { container } = render(<DepDemo />);

      // Input name to show password
      fireEvent.change(container.querySelector<HTMLInputElement>('#name'), {
        target: { value: '1' },
      });
      expect(container.querySelector<HTMLInputElement>('#password')).toBeTruthy();
      expect(container.querySelector<HTMLInputElement>('#password2')).toBeFalsy();

      // Input password to show password2
      fireEvent.change(container.querySelector<HTMLInputElement>('#password'), {
        target: { value: '1' },
      });
      expect(container.querySelector<HTMLInputElement>('#password2')).toBeTruthy();

      // Change name to hide password
      fireEvent.change(container.querySelector<HTMLInputElement>('#name'), {
        target: { value: '2' },
      });
      expect(container.querySelector<HTMLInputElement>('#password')).toBeFalsy();
      expect(container.querySelector<HTMLInputElement>('#password2')).toBeFalsy();
    });
  });

  it('should correct calculate preserve state', () => {
    let instance: FormInstance;

    const VisibleDemo: React.FC<{ visible?: boolean }> = ({ visible = true }) => {
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

    const { container, rerender } = render(<VisibleDemo />);

    rerender(<VisibleDemo visible={false} />);

    instance.setFieldsValue({ name: 'bamboo' });
    rerender(<VisibleDemo visible />);

    expect(container.querySelector<HTMLInputElement>('input')?.value).toEqual('bamboo');
  });

  it('nest Form.List should clear correctly', async () => {
    const { container } = render(
      <Form
        preserve={false}
        initialValues={{
          parent: [[{ name: 'bamboo' }]],
        }}
      >
        <Form.List name="parent">
          {(fields, { remove }) => {
            return fields.map(field => (
              <div key={field.key}>
                <button
                  onClick={() => {
                    remove(field.name);
                  }}
                />
                <Form.List {...field} name={[field.name]}>
                  {childFields =>
                    childFields.map(childField => (
                      <div key={childField.key}>
                        <Form.Field {...childField} name={[childField.name, 'name']}>
                          <input />
                        </Form.Field>
                      </div>
                    ))
                  }
                </Form.List>
              </div>
            ));
          }}
        </Form.List>
      </Form>,
    );

    expect(container.querySelector('input').value).toEqual('bamboo');

    // Clean
    fireEvent.click(container.querySelector('button'));
    expect(container.querySelector('input')).toBeFalsy();
  });
});

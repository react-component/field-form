import React, { useState } from 'react';
import { resetWarned } from 'rc-util/lib/warning';
import { render, act, waitFor, renderHook, fireEvent } from './test-utils';
import Form, { Field, useForm, List, FormInstance } from '../src';
import { Input } from './common/InfoField';
import { changeValue, getField } from './common';
import { vi } from 'vitest';
import timeout from './common/timeout';

describe('Form.InitialValues', () => {
  it('works', () => {
    let form;

    const { container } = render(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
          initialValues={{ username: 'Light', path1: { path2: 'Bamboo' } }}
        >
          <Field name="username">
            <Input />
          </Field>
          <Field name={['path1', 'path2']}>
            <Input />
          </Field>
        </Form>
      </div>,
    );

    expect(form.getFieldsValue()).toEqual({
      username: 'Light',
      path1: {
        path2: 'Bamboo',
      },
    });
    expect(form.getFieldsValue(['username'])).toEqual({
      username: 'Light',
    });
    expect(form.getFieldsValue(['path1'])).toEqual({
      path1: {
        path2: 'Bamboo',
      },
    });
    expect(form.getFieldsValue(['username', ['path1', 'path2']])).toEqual({
      username: 'Light',
      path1: {
        path2: 'Bamboo',
      },
    });
    expect(getField(container, 'username').value).toEqual('Light');
    expect(getField(container, ['path1', 'path2']).value).toEqual('Bamboo');
  });

  it('update and reset should use new initialValues', () => {
    let form;
    let mountCount = 0;

    const TestInput = props => {
      React.useEffect(() => {
        mountCount += 1;
      }, []);

      return <Input {...props} />;
    };

    const Test = ({ initialValues }) => (
      <Form
        ref={instance => {
          form = instance;
        }}
        initialValues={initialValues}
      >
        <Field name="username">
          <Input />
        </Field>
        <Field name="email">
          <TestInput />
        </Field>
      </Form>
    );

    const { container, rerender } = render(<Test initialValues={{ username: 'Bamboo' }} />);

    expect(form.getFieldsValue()).toEqual({
      username: 'Bamboo',
    });

    expect(getField(container, 'username').value).toEqual('Bamboo');

    // Should not change it
    rerender(<Test initialValues={{ username: 'Light' }} />);

    expect(form.getFieldsValue()).toEqual({
      username: 'Bamboo',
    });

    expect(getField(container, 'username').value).toEqual('Bamboo');

    // Should change it
    act(() => {
      form.resetFields();
    });

    rerender(<Test initialValues={{ username: 'Light' }} />);

    expect(mountCount).toEqual(2); // first render + rerender

    expect(form.getFieldsValue()).toEqual({
      username: 'Light',
    });
    expect(getField(container, 'username').value).toEqual('Light');
  });

  it("initialValues shouldn't be modified if preserve is false", async () => {
    const formValue = {
      test: 'test',
      users: [{ first: 'aaa', last: 'bbb' }],
    };
    const onRender = vi.fn();

    const Demo = () => {
      const [show, setShow] = useState(false);
      const [form] = Form.useForm();

      onRender(form.getFieldsValue());

      return (
        <>
          <button onClick={() => setShow(prev => !prev)}>switch show</button>
          {show ? (
            <Form form={form} initialValues={formValue} preserve={false}>
              <Field shouldUpdate>
                {() => (
                  <Field name="test" preserve={false}>
                    <Input />
                  </Field>
                )}
              </Field>
              <List name="users">
                {fields => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <React.Fragment key={key}>
                        <Field
                          {...restField}
                          name={[name, 'first']}
                          rules={[{ required: true, message: 'Missing first name' }]}
                        >
                          <Input className="first-name-input" placeholder="First Name" />
                        </Field>
                        <Field
                          {...restField}
                          name={[name, 'last']}
                          rules={[{ required: true, message: 'Missing last name' }]}
                        >
                          <Input placeholder="Last Name" />
                        </Field>
                      </React.Fragment>
                    ))}
                  </>
                )}
              </List>
            </Form>
          ) : null}
        </>
      );
    };

    const { container, rerender } = render(<Demo />);

    expect(onRender.mock.calls[0][0]).toEqual({});

    fireEvent.click(container.querySelector('button'));

    expect(formValue.users[0].last).toEqual('bbb');

    fireEvent.click(container.querySelector('button'));
    expect(formValue.users[0].last).toEqual('bbb');

    fireEvent.click(container.querySelector('button'));

    rerender(<Demo />); // render 2

    expect(getField(container, 'users.0.first').value).not.toEqual('aaa');
  });

  describe('Field with initialValue', () => {
    it('warning if Form already has initialValues', () => {
      resetWarned();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { container } = render(
        <Form initialValues={{ conflict: 'bamboo' }}>
          <Field name="conflict" initialValue="light">
            <Input />
          </Field>
        </Form>,
      );

      expect(getField(container).value).toEqual('bamboo');

      expect(errorSpy).toHaveBeenCalledWith(
        "Warning: Form already set 'initialValues' with path 'conflict'. Field can not overwrite it.",
      );

      errorSpy.mockRestore();
    });

    it('warning if multiple Field with same name set `initialValue`', () => {
      resetWarned();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      render(
        <Form>
          <Field name="conflict" initialValue="bamboo">
            <Input />
          </Field>
          <Field name="conflict" initialValue="light">
            <Input />
          </Field>
        </Form>,
      );

      expect(errorSpy).toHaveBeenCalledWith(
        "Warning: Multiple Field with path 'conflict' set 'initialValue'. Can not decide which one to pick.",
      );

      errorSpy.mockRestore();
    });

    it('should not replace user input', async () => {
      const Test = () => {
        const [show, setShow] = React.useState(false);

        return (
          <Form>
            {show ? (
              <Field name="test" initialValue="light">
                <Input />
              </Field>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setShow(!show);
              }}
            />
          </Form>
        );
      };

      const { container } = render(<Test />);

      fireEvent.click(container.querySelector('button'));

      // First mount should reset value
      expect(getField(container).value).toEqual('light');

      // Do not reset value when value already exist
      await act(async () => {
        await changeValue(getField(container), 'bamboo');
      });

      expect(getField(container).value).toEqual('bamboo');

      fireEvent.click(container.querySelector('button'));
      fireEvent.click(container.querySelector('button'));

      expect(getField(container).value).toEqual('bamboo');
    });

    it('form reset should work', async () => {
      const Test = () => {
        const [form] = useForm();
        const [initVal, setInitVal] = React.useState(undefined);

        return (
          <Form form={form}>
            <Field name="bamboo" initialValue={initVal}>
              <Input />
            </Field>
            <button
              id="resetFields"
              type="button"
              onClick={() => {
                form.resetFields();
              }}
            />
            <button
              id="setInitVal"
              type="button"
              onClick={() => {
                setInitVal('light');
              }}
            />
          </Form>
        );
      };

      const { container } = render(<Test />);
      expect(getField(container).value).toEqual('');

      // User input
      await act(async () => {
        await changeValue(getField(container), 'story');
      });

      expect(getField(container).value).toEqual('story');

      // First reset will get nothing
      await act(async () => {
        fireEvent.click(container.querySelector('#resetFields'));
      });

      expect(getField(container).value).toEqual('');

      // reset and Change field initialValue
      await act(async () => {
        fireEvent.click(container.querySelector('#setInitVal'));
      });

      // Second reset will get new initialValue, because initialValue was used only in first mount
      expect(getField(container).value).toEqual('');
    });

    it('reset by namePath', async () => {
      const Test = () => {
        const [form] = useForm();

        return (
          <Form form={form}>
            <Field name="bamboo" initialValue="light">
              <Input />
            </Field>
            <button
              type="button"
              onClick={() => {
                form.resetFields(['bamboo']);
              }}
            />
          </Form>
        );
      };

      const { container } = render(<Test />);

      await act(async () => {
        await changeValue(getField(container), 'story');
      });

      expect(getField(container).value).toEqual('story');

      await act(async () => {
        await fireEvent.click(container.querySelector('button'));
      });

      expect(getField(container).value).toEqual('light');
    });

    it('ignore dynamic initialValue', async () => {
      const Test = () => {
        const [initVal, setInitVal] = React.useState('bamboo');
        return (
          <Form>
            <Field name="test" initialValue={initVal}>
              <Input />
            </Field>
            <button
              type="button"
              onClick={() => {
                setInitVal('light');
              }}
            />
          </Form>
        );
      };

      const { container } = render(<Test />);
      expect(getField(container).value).toEqual('bamboo');

      await act(async () => {
        fireEvent.click(container.querySelector('button'));
      });

      expect(getField(container).value).toEqual('bamboo');
    });

    it('not initialValue when not mount', () => {
      let formInstance;

      const Test = () => {
        const [form] = Form.useForm();
        formInstance = form;

        const fieldNode = <Field name="bamboo" initialValue="light" />;

        expect(fieldNode).toBeTruthy();

        return (
          <Form form={form}>
            <Field name="light" initialValue="bamboo">
              {control => {
                expect(control.value).toEqual('bamboo');
                return null;
              }}
            </Field>
          </Form>
        );
      };

      const { unmount } = render(<Test />);

      expect(formInstance.getFieldsValue()).toEqual({ light: 'bamboo' });

      unmount();
    });
  });
});

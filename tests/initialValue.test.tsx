import { act, fireEvent, render } from '@testing-library/react';
import { resetWarned } from '@rc-component/util/lib/warning';
import React, { useState } from 'react';
import Form, { Field, List, useForm, type FormInstance } from '../src';
import { changeValue, getInput } from './common';
import { Input } from './common/InfoField';

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
            <Input data-name="username" />
          </Field>
          <Field name={['path1', 'path2']}>
            <Input data-name="path1.path2" />
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
    expect(getInput(container, 'username').value).toEqual('Light');
    expect(getInput(container, 'path1.path2').value).toEqual('Bamboo');
  });

  it('update and reset should use new initialValues', () => {
    let form: FormInstance;
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
          <Input data-name="username" />
        </Field>
        <Field name="email">
          <TestInput data-name="email" />
        </Field>
      </Form>
    );

    const { container, rerender } = render(<Test initialValues={{ username: 'Bamboo' }} />);
    expect(form.getFieldsValue()).toEqual({
      username: 'Bamboo',
    });
    expect(getInput(container, 'username').value).toEqual('Bamboo');
    expect(mountCount).toEqual(1);

    // Should not change it
    rerender(<Test initialValues={{ username: 'Light' }} />);
    expect(form.getFieldsValue()).toEqual({
      username: 'Bamboo',
    });
    expect(getInput(container, 'username').value).toEqual('Bamboo');

    // Should change it
    act(() => {
      form.resetFields();
    });
    expect(mountCount).toEqual(2);
    expect(form.getFieldsValue()).toEqual({
      username: 'Light',
    });
    expect(getInput(container, 'username').value).toEqual('Light');
  });

  // FIXME: Not work in React 18
  it.skip("initialValues shouldn't be modified if preserve is false", () => {
    const formValue = {
      test: 'test',
      users: [{ first: 'aaa', last: 'bbb' }],
    };

    let refForm: FormInstance;

    const Demo = () => {
      const [form] = Form.useForm();
      const [show, setShow] = useState(false);

      refForm = form;

      return (
        <>
          <button onClick={() => setShow(prev => !prev)}>switch show</button>
          {show && (
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
          )}
        </>
      );
    };

    const { container } = render(<Demo />);

    fireEvent.click(container.querySelector('button'));
    expect(formValue.users[0].last).toEqual('bbb');
    console.log('Form Value:', refForm.getFieldsValue(true));

    fireEvent.click(container.querySelector('button'));
    expect(formValue.users[0].last).toEqual('bbb');
    console.log('Form Value:', refForm.getFieldsValue(true));

    fireEvent.click(container.querySelector('button'));

    expect(container.querySelector<HTMLInputElement>('.first-name-input').value).toEqual('aaa');
  });

  describe('Field with initialValue', () => {
    it('warning if Form already has initialValues', () => {
      resetWarned();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { container } = render(
        <Form initialValues={{ conflict: 'bamboo' }}>
          <Field name="conflict" initialValue="light">
            <Input />
          </Field>
        </Form>,
      );

      expect(getInput(container).value).toEqual('bamboo');

      expect(errorSpy).toHaveBeenCalledWith(
        "Warning: Form already set 'initialValues' with path 'conflict'. Field can not overwrite it.",
      );

      errorSpy.mockRestore();
    });

    it('warning if multiple Field with same name set `initialValue`', () => {
      resetWarned();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
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
            {show && (
              <Field name="test" initialValue="light">
                <Input />
              </Field>
            )}
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
      expect(getInput(container).value).toEqual('light');

      // Do not reset value when value already exist
      await changeValue(getInput(container), 'bamboo');
      expect(getInput(container).value).toEqual('bamboo');

      fireEvent.click(container.querySelector('button'));
      fireEvent.click(container.querySelector('button'));

      expect(getInput(container).value).toEqual('bamboo');
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
              type="button"
              className="reset"
              onClick={() => {
                form.resetFields();
              }}
            />
            <button
              type="button"
              className="change"
              onClick={() => {
                setInitVal('light');
              }}
            />
          </Form>
        );
      };

      const { container } = render(<Test />);
      expect(getInput(container).value).toEqual('');

      // User input
      await changeValue(getInput(container), 'story');
      expect(getInput(container).value).toEqual('story');

      // First reset will get nothing
      fireEvent.click(container.querySelector('.reset'));
      expect(getInput(container).value).toEqual('');

      // Change field initialValue and reset
      fireEvent.click(container.querySelector('.change'));
      fireEvent.click(container.querySelector('.reset'));
      expect(getInput(container).value).toEqual('light');
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
      await changeValue(getInput(container), 'story');
      expect(getInput(container).value).toEqual('story');

      fireEvent.click(container.querySelector('button'));
      expect(getInput(container).value).toEqual('light');
    });

    it('ignore dynamic initialValue', () => {
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
      expect(getInput(container).value).toEqual('bamboo');

      fireEvent.click(container.querySelector('button'));
      expect(getInput(container).value).toEqual('bamboo');
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

  it('should ignore in Form.List', () => {
    const { container } = render(
      <Form>
        <Form.List name="list">
          {(fields, { add }) => (
            <>
              <button
                onClick={() => {
                  add();
                }}
              />
              {fields.map(field => (
                <Field {...field} initialValue="bamboo" key={field.key}>
                  <Input />
                </Field>
              ))}
            </>
          )}
        </Form.List>
      </Form>,
    );

    fireEvent.click(container.querySelector('button'));
    fireEvent.change(getInput(container), { target: { value: 'light' } });
    expect(getInput(container).value).toEqual('light');

    // Reset
    fireEvent.reset(container.querySelector('form'));
    expect(container.querySelectorAll('input')).toHaveLength(0);
  });
});

import React, { useState } from 'react';
import { mount } from 'enzyme';
import { resetWarned } from 'rc-util/lib/warning';
import Form, { Field, useForm, List } from '../src';
import { Input } from './common/InfoField';
import { changeValue, getField } from './common';

describe('Form.InitialValues', () => {
  it('works', () => {
    let form;

    const wrapper = mount(
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
    expect(getField(wrapper, 'username').find('input').props().value).toEqual('Light');
    expect(getField(wrapper, ['path1', 'path2']).find('input').props().value).toEqual('Bamboo');
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

    const wrapper = mount(<Test initialValues={{ username: 'Bamboo' }} />);
    expect(form.getFieldsValue()).toEqual({
      username: 'Bamboo',
    });
    expect(getField(wrapper, 'username').find('input').props().value).toEqual('Bamboo');

    // Should not change it
    wrapper.setProps({ initialValues: { username: 'Light' } });
    wrapper.update();
    expect(form.getFieldsValue()).toEqual({
      username: 'Bamboo',
    });
    expect(getField(wrapper, 'username').find('input').props().value).toEqual('Bamboo');

    // Should change it
    form.resetFields();
    wrapper.update();
    expect(mountCount).toEqual(1);
    expect(form.getFieldsValue()).toEqual({
      username: 'Light',
    });
    expect(getField(wrapper, 'username').find('input').props().value).toEqual('Light');
  });

  it("initialValues shouldn't be modified if preserve is false", () => {
    const formValue = {
      test: 'test',
      users: [{ first: 'aaa', last: 'bbb' }],
    };

    let refForm;

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

    const wrapper = mount(<Demo />);
    wrapper.find('button').simulate('click');
    expect(formValue.users[0].last).toEqual('bbb');

    wrapper.find('button').simulate('click');
    expect(formValue.users[0].last).toEqual('bbb');
    console.log('Form Value:', refForm.getFieldsValue(true));

    wrapper.find('button').simulate('click');
    wrapper.update();

    expect(wrapper.find('.first-name-input').first().find('input').prop('value')).toEqual('aaa');
  });

  describe('Field with initialValue', () => {
    it('warning if Form already has initialValues', () => {
      resetWarned();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const wrapper = mount(
        <Form initialValues={{ conflict: 'bamboo' }}>
          <Field name="conflict" initialValue="light">
            <Input />
          </Field>
        </Form>,
      );

      expect(wrapper.find('input').props().value).toEqual('bamboo');

      expect(errorSpy).toHaveBeenCalledWith(
        "Warning: Form already set 'initialValues' with path 'conflict'. Field can not overwrite it.",
      );

      errorSpy.mockRestore();
    });

    it('warning if multiple Field with same name set `initialValue`', () => {
      resetWarned();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mount(
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

      const wrapper = mount(<Test />);
      wrapper.find('button').simulate('click');
      wrapper.update();

      // First mount should reset value
      expect(wrapper.find('input').props().value).toEqual('light');

      // Do not reset value when value already exist
      await changeValue(wrapper, 'bamboo');
      expect(wrapper.find('input').props().value).toEqual('bamboo');

      wrapper.find('button').simulate('click');
      wrapper.find('button').simulate('click');
      wrapper.update();
      expect(wrapper.find('input').props().value).toEqual('bamboo');
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
              onClick={() => {
                form.resetFields();
              }}
            />
            <button
              type="button"
              onClick={() => {
                setInitVal('light');
              }}
            />
          </Form>
        );
      };

      const wrapper = mount(<Test />);
      expect(wrapper.find('input').props().value).toEqual('');

      // User input
      await changeValue(wrapper, 'story');
      expect(wrapper.find('input').props().value).toEqual('story');

      // First reset will get nothing
      wrapper.find('button').first().simulate('click');
      expect(wrapper.find('input').props().value).toEqual('');

      // Change field initialValue and reset
      wrapper.find('button').last().simulate('click');
      wrapper.find('button').first().simulate('click');
      expect(wrapper.find('input').props().value).toEqual('light');
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

      const wrapper = mount(<Test />);
      await changeValue(wrapper, 'story');
      expect(wrapper.find('input').props().value).toEqual('story');

      wrapper.find('button').simulate('click');
      expect(wrapper.find('input').props().value).toEqual('light');
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

      const wrapper = mount(<Test />);
      expect(wrapper.find('input').props().value).toEqual('bamboo');

      wrapper.find('button').simulate('click');
      expect(wrapper.find('input').props().value).toEqual('bamboo');
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

      const wrapper = mount(<Test />);

      expect(formInstance.getFieldsValue()).toEqual({ light: 'bamboo' });

      wrapper.unmount();
    });
  });
});

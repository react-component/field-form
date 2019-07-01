import React from 'react';
import { mount } from 'enzyme';
import Form, { FormProvider } from '../src';
import InfoField from './common/InfoField';
import { changeValue, matchError, getField } from './common';
import timeout from './common/timeout';

describe('Form.Context', () => {
  it('validateMessages', async () => {
    const wrapper = mount(
      <FormProvider validateMessages={{ required: "I'm global" }}>
        <Form>
          <InfoField name="username" rules={[{ required: true }]} />
        </Form>
      </FormProvider>,
    );

    await changeValue(wrapper, '');
    matchError(wrapper, "I'm global");
  });

  it('change event', async () => {
    const onFormChange = jest.fn();

    const wrapper = mount(
      <FormProvider onFormChange={onFormChange}>
        <Form name="form1">
          <InfoField name="username" rules={[{ required: true }]} />
        </Form>
      </FormProvider>,
    );

    await changeValue(getField(wrapper), 'Light');
    expect(onFormChange).toHaveBeenCalledWith(
      'form1',
      expect.objectContaining({
        changedFields: [
          { errors: [], name: ['username'], touched: true, validating: false, value: 'Light' },
        ],
        forms: {
          form1: expect.objectContaining({}),
        },
      }),
    );
  });

  describe('adjust sub form', () => {
    it('basic', async () => {
      const onFormChange = jest.fn();

      const wrapper = mount(
        <FormProvider onFormChange={onFormChange}>
          <Form name="form1" />
        </FormProvider>,
      );

      wrapper.setProps({
        children: (
          <Form name="form2">
            <InfoField name="test" />
          </Form>
        ),
      });

      await changeValue(getField(wrapper), 'Bamboo');
      const { forms } = onFormChange.mock.calls[0][1];
      expect(Object.keys(forms)).toEqual(['form2']);
    });

    it('multiple context', async () => {
      const onFormChange = jest.fn();

      const Demo = changed => (
        <FormProvider onFormChange={onFormChange}>
          <FormProvider>
            {!changed ? (
              <Form name="form1" />
            ) : (
              <Form name="form2">
                <InfoField name="test" />
              </Form>
            )}
          </FormProvider>
        </FormProvider>
      );

      const wrapper = mount(<Demo />);

      wrapper.setProps({
        changed: true,
      });

      await changeValue(getField(wrapper), 'Bamboo');
      const { forms } = onFormChange.mock.calls[0][1];
      expect(Object.keys(forms)).toEqual(['form2']);
    });
  });

  it('submit', async () => {
    const onFormFinish = jest.fn();
    let form1;

    const wrapper = mount(
      <div>
        <FormProvider onFormFinish={onFormFinish}>
          <Form
            name="form1"
            ref={instance => {
              form1 = instance;
            }}
          >
            <InfoField name="name" rules={[{ required: true }]} />
          </Form>
          <Form name="form2" />
        </FormProvider>
      </div>,
    );

    await changeValue(getField(wrapper), '');
    form1.submit();
    await timeout();
    expect(onFormFinish).not.toHaveBeenCalled();

    await changeValue(getField(wrapper), 'Light');
    form1.submit();
    await timeout();
    expect(onFormFinish).toHaveBeenCalled();

    expect(onFormFinish.mock.calls[0][0]).toEqual('form1');
    const info = onFormFinish.mock.calls[0][1];
    expect(info.values).toEqual({ name: 'Light' });
    expect(Object.keys(info.forms).sort()).toEqual(['form1', 'form2'].sort());
  });

  it('do nothing if no Provider in use', () => {
    const wrapper = mount(
      <div>
        <Form name="no" />
      </div>,
    );

    wrapper.setProps({
      children: null,
    });
  });
});

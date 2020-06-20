/* eslint-disable no-template-curly-in-string */
import React from 'react';
import { mount } from 'enzyme';
import Form from '../src';
import InfoField from './common/InfoField';
import timeout from './common/timeout';

describe('Form.Perishable', () => {
  const Demo = ({
    removeField,
    formPerishable,
    fieldPerishable,
    onFinish,
  }: {
    removeField: boolean;
    formPerishable?: boolean;
    fieldPerishable?: boolean;
    onFinish: (values: object) => void;
  }) => (
    <Form
      onFinish={onFinish}
      initialValues={{ keep: 233, remove: 666 }}
      perishable={formPerishable}
    >
      <InfoField name="keep" />
      {!removeField && <InfoField name="remove" perishable={fieldPerishable} />}
    </Form>
  );

  it('field', async () => {
    const onFinish = jest.fn();
    const wrapper = mount(<Demo removeField={false} onFinish={onFinish} fieldPerishable />);

    async function matchTest(removeField: boolean, match: object) {
      onFinish.mockReset();
      wrapper.setProps({ removeField });
      wrapper.find('form').simulate('submit');
      await timeout();
      expect(onFinish).toHaveBeenCalledWith(match);
    }

    await matchTest(false, { keep: 233, remove: 666 });
    await matchTest(true, { keep: 233 });
    await matchTest(false, { keep: 233 });
  });

  it('form', async () => {
    const onFinish = jest.fn();
    const wrapper = mount(<Demo removeField={false} onFinish={onFinish} formPerishable />);

    async function matchTest(removeField: boolean, match: object) {
      onFinish.mockReset();
      wrapper.setProps({ removeField });
      wrapper.find('form').simulate('submit');
      await timeout();
      expect(onFinish).toHaveBeenCalledWith(match);
    }

    await matchTest(false, { keep: 233, remove: 666 });
    await matchTest(true, { keep: 233 });
    await matchTest(false, { keep: 233 });
  });

  it('form perishable but field !perishable', async () => {
    const onFinish = jest.fn();
    const wrapper = mount(
      <Demo removeField={false} onFinish={onFinish} formPerishable fieldPerishable={false} />,
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
});
/* eslint-enable no-template-curly-in-string */

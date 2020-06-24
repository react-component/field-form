/* eslint-disable no-template-curly-in-string */
import React from 'react';
import { mount } from 'enzyme';
import Form from '../src';
import InfoField from './common/InfoField';
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
    await matchTest(false, { keep: 233 });
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
    await matchTest(false, { keep: 233 });
  });

  it('form perishable but field !perishable', async () => {
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
});
/* eslint-enable no-template-curly-in-string */

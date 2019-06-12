import React from 'react';
import { mount } from 'enzyme';
import Form from '../src';
import InfoField from './common/InfoField';
import { changeValue, matchError, getField } from './common';

describe('dependencies', () => {
  it('touched', async () => {
    let form = null;

    const wrapper = mount(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
        >
          <InfoField name="field_1" />
          <InfoField name="field_2" rules={[{ required: true }]} dependencies={['field_1']} />
        </Form>
      </div>,
    );

    // Not trigger if not touched
    await changeValue(getField(wrapper, 0), '');
    matchError(getField(wrapper, 1), false);

    // Trigger if touched
    form.setFields([{ name: 'field_2', touched: true }]);
    await changeValue(getField(wrapper, 0), '');
    matchError(getField(wrapper, 1), true);
  });
});

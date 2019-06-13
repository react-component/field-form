import React from 'react';
import { mount } from 'enzyme';
import Form, { Field } from '../src';
import InfoField, { Input } from './common/InfoField';
import { changeValue, matchError, getField, getInput } from './common';

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

  it('nest dependencies', async () => {
    let form = null;
    let rendered = false;

    const wrapper = mount(
      <div>
        <Form
          ref={instance => {
            form = instance;
          }}
        >
          <Field name="field_1">
            <Input />
          </Field>
          <Field name="field_2" dependencies={['field_1']}>
            <Input />
          </Field>
          <Field name="field_3" dependencies={['field_2']}>
            {control => {
              rendered = true;
              return <Input {...control} />;
            }}
          </Field>
        </Form>
      </div>,
    );

    form.setFields([
      { name: 'field_1', touched: true },
      { name: 'field_2', touched: true },
      { name: 'field_3', touched: true },
    ]);

    rendered = false;
    await changeValue(getInput(wrapper), '1');

    expect(rendered).toBeTruthy();
  });
});

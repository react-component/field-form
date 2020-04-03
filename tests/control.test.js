import React from 'react';
import { mount } from 'enzyme';
import Form from '../src';
import InfoField from './common/InfoField';
import { changeValue, matchError } from './common';

describe('Form.Control', () => {
  it('fields', () => {
    const wrapper = mount(
      <Form>
        <InfoField name="username" />
      </Form>,
    );

    wrapper.setProps({
      fields: [{ name: 'username', value: 'Bamboo' }],
    });
    wrapper.update();

    expect(wrapper.find('input').props().value).toEqual('Bamboo');
  });

  it('fully test', async () => {
    const Test = () => {
      const [fields, setFields] = React.useState([]);

      return (
        <Form
          fields={fields}
          onFieldsChange={(_, allFields) => {
            setFields(allFields);
          }}
        >
          <InfoField name="test" rules={[{ required: true }]} />
        </Form>
      );
    };

    const wrapper = mount(<Test />);

    await changeValue(wrapper, '');
    matchError(wrapper, "'test' is required");
  });
});

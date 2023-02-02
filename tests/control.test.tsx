import React from 'react';
import { mount } from 'enzyme';
import Form from '../src';
import InfoField from './common/InfoField';
import { changeValue, matchError } from './common';
import { render } from '@testing-library/react';

describe('Form.Control', () => {
  it('fields', () => {
    const { container, rerender } = render(
      <Form>
        <InfoField name="username" />
      </Form>,
    );
    rerender(
      <Form fields={[{ name: 'username', value: 'Bamboo' }]}>
        <InfoField name="username" />
      </Form>,
    );
    expect(container.querySelector<HTMLInputElement>('input')?.value).toBe('Bamboo');
  });

  it('fully test', async () => {
    const Test: React.FC = () => {
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

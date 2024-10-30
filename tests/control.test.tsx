import React from 'react';
import Form from '../src';
import InfoField from './common/InfoField';
import { changeValue, getInput, matchError } from './common';
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

    const { container } = render(<Test />);

    await changeValue(getInput(container), ['bamboo', '']);
    matchError(container, "'test' is required");
  });

  it('value no change', async () => {
    const fn = jest.fn();
    const { container } = render(
      <Form onFieldsChange={fn}>
        <InfoField name="test" normalize={value => value?.replace(/\D/g, '') || undefined} />
      </Form>,
    );

    await changeValue(getInput(container), 'bamboo');
    expect(fn).toHaveBeenCalledTimes(0);
    await changeValue(getInput(container), '1');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

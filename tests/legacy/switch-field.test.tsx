import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import type { FormInstance } from '../../src';
import Form, { Field, useForm } from '../../src';
import { Input } from '../common/InfoField';

// https://github.com/ant-design/ant-design/issues/12560
describe('legacy.switch-field', () => {
  /**
   * assume we have fields: [a, b, c] when switch a with b
   * mark at node a:
   *   a as toRemove, b as toAdd
   * mark at node b:
   *   b as toRemove, a as toAdd
   *
   * if do change instantly, result will be
   * [a, b, c] -> [b, c] -> [a, c], it's a wrong result
   * but collect them and do this after, result will be
   * [a, b, c] -> (remove a, b) [c] -> (add a, b) [a,b, c]
   */

  // Prepare

  let form: FormInstance = null;

  const Demo: React.FC = () => {
    [form] = useForm();
    const [list, setList] = React.useState(['a', 'b', 'c']);
    const [one, two, three] = list;

    // do not use map
    // react will detect it by key and knowing there was a change on order.
    // we need to test [custom reparenting], so use hard written three element.
    return (
      <Form form={form}>
        <Field name={one}>
          <Input className="one" />
        </Field>
        <Field name={two}>
          <Input className="two" />
        </Field>
        <Field name={three}>
          <Input className="three" />
        </Field>

        <button
          type="button"
          className="sw"
          onClick={() => {
            setList(['b', 'a', 'c']);
          }}
        >
          Switch a with b
        </button>
      </Form>
    );
  };

  it('Preserve right fields when switch them', async () => {
    const { container } = render(<Demo />);
    fireEvent.change(container.querySelector('.one'), { target: { value: 'value1' } });
    expect(Object.keys(form.getFieldsValue())).toEqual(expect.arrayContaining(['a']));
    expect(form.getFieldValue('a')).toBe('value1');
    expect(container.querySelector<HTMLInputElement>('.one')?.value).toBe('value1');
    fireEvent.click(container.querySelector<HTMLButtonElement>('.sw'));
    expect(Object.keys(form.getFieldsValue())).toEqual(expect.arrayContaining(['a']));
    expect(form.getFieldValue('a')).toBe('value1');
    expect(container.querySelector<HTMLInputElement>('.two')?.value).toBe('value1');
  });
});

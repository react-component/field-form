import React from 'react';
import { mount } from 'enzyme';
import Form, { Field, useForm } from '../../src';
import { Input } from '../common/InfoField';
import { changeValue, getField } from '../common';
import timeout from '../common/timeout';

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

  let form;

  const Demo = () => {
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
    const wrapper = mount(<Demo />);

    wrapper
      .find('.one')
      .last()
      .simulate('change', { target: { value: 'value1' } });
    expect(Object.keys(form.getFieldsValue())).toEqual(expect.arrayContaining(['a']));
    expect(form.getFieldValue('a')).toBe('value1');
    expect(
      wrapper
        .find('.one')
        .last()
        .getDOMNode().value,
    ).toBe('value1');

    wrapper.find('.sw').simulate('click');
    expect(Object.keys(form.getFieldsValue())).toEqual(expect.arrayContaining(['a']));
    expect(form.getFieldValue('a')).toBe('value1');
    expect(
      wrapper
        .find('.two')
        .last()
        .getDOMNode().value,
    ).toBe('value1');
  });
});

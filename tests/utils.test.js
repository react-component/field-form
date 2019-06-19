import { isSimilar, setValues } from '../src/utils/valueUtil';
import NameMap from '../src/utils/NameMap';

describe('utils', () => {
  describe('valueUtil', () => {
    it('isSimilar', () => {
      expect(isSimilar(1, 2)).toBeFalsy();
      expect(isSimilar({}, {})).toBeTruthy();
      expect(isSimilar({ a: 1 }, { a: 2 })).toBeFalsy();
      expect(isSimilar({ a() {} }, { a() {} })).toBeTruthy();
      expect(isSimilar({ a: 1 }, {})).toBeFalsy();
      expect(isSimilar({}, { a: 1 })).toBeFalsy();
      expect(isSimilar({}, null)).toBeFalsy();
      expect(isSimilar(null, {})).toBeFalsy();
    });

    it('setValues', () => {
      expect(setValues({}, { a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
      expect(setValues([], [123])).toEqual([123]);
    });
  });

  describe('NameMap', () => {
    it('update should clean if empty', () => {
      const map = new NameMap();
      map.set(['user', 'name'], 'Bamboo');
      map.set(['user', 'age'], 14);

      expect(map.toJSON()).toEqual({
        'user.name': 'Bamboo',
        'user.age': 14,
      });

      map.update(['user', 'age'], prevValue => {
        expect(prevValue).toEqual(14);
        return null;
      });

      expect(map.toJSON()).toEqual({
        'user.name': 'Bamboo',
      });
    });
  });
});

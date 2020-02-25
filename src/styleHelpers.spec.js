import {
  styleMultiplier,
  createScaledPropertyGetter,
  getClass,
  mergeAndApplyMatchingStyles,
  applyMatchingStyles
} from './styleHelpers';
import {applyStyleFunctionOrDefault, getClassAndStyle, getStyleObj, styleArithmetic} from './styleHelpers';
import * as R from 'ramda';

describe('styles', () => {
  test('getClass', () => {
    expect(getClass('chicken', 'outsidePen')).toEqual('chicken-outside-pen');
  });
  test('getClassAndStyle', () => {
    const viewObj = {
      chickenOutsidePen: {
        className: 'foo bar',
        style: {
          border: 'coop'
        }
      }
    };
    expect(getClassAndStyle('chickenOutsidePen', viewObj)).toEqual({
      className: 'chicken-outside-pen foo bar',
      style: {
        border: 'coop'
      }
    });
    expect(getClassAndStyle('sheepGotoHeaven', viewObj)).toEqual({
      className: 'sheep-goto-heaven'
    });
  });
  test('getStyleObj', () => {
    const viewObj = {
      chickenOutsidePen: {
        style: {
          border: 'coop'
        }
      },
      sheepGoToHeaven: {}
    };
    expect(getStyleObj('chickenOutsidePen', viewObj)).toEqual({
      style: {
        border: 'coop'
      }
    });
    expect(getStyleObj('sheepGotoHeaven', viewObj)).toEqual({});
  });

  test('styleArithmetic', () => {
    expect(styleArithmetic(R.multiply, 0.25, 100)).toEqual(25);
    expect(styleArithmetic(R.add, 0.25, '100 em')).toEqual('100.25 em');
  });

  test('styleMultiplier', () => {
    expect(styleMultiplier(0.25, 100)).toEqual(25);
    expect(styleMultiplier(0.25, '100 em')).toEqual('25 em');
  });

  test('createScaledPropertyGetter', () => {
    expect(createScaledPropertyGetter([2, 4, 8], 'margin', 2)).toEqual({margin: 8});
    expect(() => createScaledPropertyGetter([2, 4, 8], 'margin', 'mayo')).toThrow();
    expect(() => createScaledPropertyGetter([2, 'tuna fish', 8], 'margin', 1)).toThrow();
  });

  test('applyStyleFunctionOrDefault', () => {
    expect(applyStyleFunctionOrDefault(11, 'width', R.add(1))({width: 5})).toEqual(6);
    expect(applyStyleFunctionOrDefault(11, 'width', R.add(1))({height: 5})).toEqual(11);
  });


  test('mergeAndApplyMatchingStyles', () => {
    expect(mergeAndApplyMatchingStyles({
      cow: 1,
      bird: 2,
      width: 2,
      height: 2
    }, {
      bird: 3,
      position: 'absolute',
      width: value => value * 2,
      height: value => value * 3
    })).toEqual({
      cow: 1,
      bird: 3,
      position: 'absolute',
      width: 4,
      height: 6
    });
  });

  test('applyMatchingStyles', () => {
    expect(applyMatchingStyles({
      cow: 1,
      width: 2,
      height: 2
    }, {
      position: 'absolute',
      cow: 2,
      width: value => value * 2,
      height: value => value * 3
    }, ['sankeyFiltererItem'])).toEqual({
      position: 'absolute',
      cow: 2,
      width: 4,
      height: 6
    });
  });
});

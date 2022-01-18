/**
 * Created by Andy Likuski on 2017.11.13
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import * as R from 'ramda';
import PropTypes from 'prop-types';
import {v} from '@rescapes/validate';
import {compact, filterWithKeys, reqPathThrowing} from '@rescapes/ramda';
import decamelize from 'decamelize';

/**
 * Creates a class name from a root name and a suffix. The given root and suffix will be decamelized
 * with -'s and joined with a -
 * @param {String} root The root of the name matching the React component
 * @param {String} suffix The suffix matching the minor component (such as 'outer', 'inner' for divs).
 * If null then the className will simply be the root
 * @returns {String} root-suffix or root if suffix is not specified
 */
export const getClass = (root, suffix = null) => R.join(
  '-',
  R.map(
    x => decamelize(x, {separator: '-'}),
    compact(
      [root, suffix]
    )
  )
);

/**
 * Given a name, generates a className and style. If views[name].className exists, it is added
 * to the generated className. E.g. if the generated className is 'region-outer' and views[name].class =
 * 'foo bar', the className will be 'region-outer foo bar'
 * @param {String} name Name to use for the className. You can pass a camelized name and it will decamelize
 * (e.g. outerRegionDiv is converted to outer-region-div) for the actual className
 * @param {Object} views Contains a key matching name containing a style object.
 * e.g. if name is 'region' views must have {region: {style: {border: 'red', ...}}}
 * @returns {Object} An object with a style and className key and corresponding values
 */
export const getClassAndStyle = (name, views) =>
  R.mergeWith(
    // This can only be called on className
    (l, r) => R.join(' ', [l, r]),
    {
      className: getClass(name),
      // Because testing-library doesn't allow to search by className, use this for searches
      // This also works with enzyme, using the selector wrapper.find(`[data-testid='${name}']`)
      'data-testid': name
    },
    compact(R.mergeRight({
        className: R.view(R.lensPath([name, 'className']), views)
      },
      getStyleObj(name, views))
    )
  );

/**
 * Given a name and views, generates a component, className and style. This is most useful for style
 * components where we need to build the styling into the component. Usually style will be empty
 * unless we want to augment a styled component
 * If views[name].className exists, it is added
 * to the generated className. E.g. if the generated className is 'region-outer' and views[name].class =
 * 'foo bar', the className will be 'region-outer foo bar'
 * @param {String} name Name to use for the className. You can pass a camelized name and it will decamelize
 * (e.g. outerRegionDiv is converted to outer-region-div) for the actual className
 * @param {Object} views Contains a key matching name containing a style object.
 * e.g. if name is 'region' views must have {region: {style: {border: 'red', ...}}}
 * @returns {Object} An object with a component (usually a styled-component), className key and corresponding values
 */
export const getComponentAndClassName = (name, views) => {
  const component = reqPathThrowing([name, 'component'], views);
  const {style} = getStyleObj(name, views);
  return R.mergeWith(
    // This can only be called on className
    (l, r) => {
      return R.join(' ', [l, r]);
    },
    {
      // component is required
      component,
      // Default classname , concatted with those explicitly defined
      className: getClass(name),
      // Because testing-library doesn't allow to search by className, use this
      'data-testid': name
    },
    compact({
      className: R.view(R.lensPath([name, 'className']), views)
    })
  );
};

/**
 * Given a name, generates a style object with the matching object in views, i.e. views[name].style
 * If views[name] or views[name].style is undefined, an empty object is returned
 * @param {String} name Name to use for the to resolve the style
 * @param {Object} views Contains a key matching name containing a style object.
 * e.g. if name is 'region' views must have {region: {style: {border: 'red', ...}}}
 * @returns {Object} An object with a style key and corresponding style values, or and empty object
 *
 */
export const getStyleObj = (name, views) => compact({
  style: R.view(R.lensPath(R.concat([name], ['style'])), views)
});

/**
 * Does arithmetic on the styleValue, preserving px, etc
 * @param {Function} operator takes two args, the first is styleValue and the second operand
 * @param {Number} operand The second value of the arithmetic function
 * @param {String|Number} styleValue The local style value. This can be a number
 * or any supported css string. Strings will parse out the the number, scale, and
 * then put it back in a string
 * @sig Func -> Number -> Number -> Object
 * @return {String|Number} The result of the operation
 */
export const styleArithmetic = v(R.curry((operator, operand, styleValue) =>
  R.ifElse(
    R.is(Number),
    value => operator(value, operand),
    value => {
      const [val, rest] = R.slice(1, 3, value.match(/([\d.]+)([^\d]+)/));
      return `${operator(val, operand)}${rest}`;
    }
  )(styleValue)
), [
  ['operator', PropTypes.func.isRequired],
  ['operand', PropTypes.number.isRequired],
  ['styleValue', PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired]
], 'styleArithmetic');

export const styleMultiplier = styleArithmetic(R.multiply);

/**
 * Scaled value function creator
 * @param {Number[]} scale Array of scale values, such that array index values 0..n can be passed for
 * x and return a corresponding scale value
 * @param {String} prop The style prop, such as 'margin' or 'padding'
 * @param {Number} index The index of scale to access
 * @returns {Object} A single keyed object keyed by prop and valued by scale[x].
 * If index or scale[index] is not a Number an Error is thrown, as this is always a coding error
 */
export const createScaledPropertyGetter = R.curry((scale, prop, index) => {
  const getScale = R.prop(R.__, scale);
  return R.ifElse(
    R.both(
      R.is(Number),
      i => R.is(Number, getScale(i))
    ),
    i => ({[prop]: getScale(i)}),
    i => {
      throw new Error(`x or scale[x] is not a number: x: ${i}, scale: ${scale}`);
    }
  )(index);
});

/**
 * If props has the given prop, call styleFunction with props. Otherwise return default
 * @param {*} defaultValue A default value for the stylej
 * @param {String} prop A props object
 * @param {Function} styleFunction A unary function expecting props[prop]
 * @return {*} The defaultValue or result of the function call
 */
export const applyStyleFunctionOrDefault = (defaultValue, prop, styleFunction) =>
  R.ifElse(
    R.has(prop),
    s => styleFunction(R.prop(prop, s)),
    R.always(defaultValue)
  );


const mergeDeepWith = R.curry((fn, left, right) => R.mergeWith((l, r) => {
  // If either (hopefully both) items are arrays or not both objects
  // accept the right value
  return ((l && l.concat && R.is(Array, l)) || (r && r.concat && R.is(Array, r))) || !(R.is(Object, l) && R.is(Object, r)) ?
    fn(l, r) :
    mergeDeepWith(fn, l, r); // tail recursive
})(left, right));

/**
 * Merges two style objects, where the second can have functions to apply the values of the first.
 * If matching key values are both primitives, the style value trumps
 * @param {Object} parentStyle Simple object of styles
 * @param {Object} style Styles including functions to transform the corresponding key of parentStyle
 */
export const mergeAndApplyMatchingStyles = (parentStyle, style) => mergeDeepWith(
  (stateStyleValue, propStyleValue) =>
    // If keys match, the propStyleValue trumps unless it is a function, in which case the stateStyleValue
    // is passed to the propStyleValue function
    R.when(
      R.is(Function),
      x => R.compose(x)(stateStyleValue)
    )(propStyleValue),
  parentStyle,
  style
);

/**
 * Like mergeAndApplyStyles but doesn't merge the parentStyles. It simply applies the ones where
 * there are child styles with the same name that are a function. If the child has a matching style
 * that isn't a function then the parent's value is ignored
 * @param parentStyle
 * @param style
 * @return {*}
 */
export const applyMatchingStyles = (parentStyle, style) => {
  // If any value in style is a function and doesn't have a corresponding key
  // in parentStyle, throw an error. There must be a value in parent in order to resolve the function
  const badKeyValues = filterWithKeys((value, key) => {
      return R.both(
        () => R.complement(R.has)(key, parentStyle),
        R.is(Function)
      )(value);
    },
    style
  );
  if (R.length(R.keys(badKeyValues))) {
    throw Error(`Some style keys with function values don't have corresponding parentStyle values: ${JSON.stringify(badKeyValues)} of
    style keys ${R.join(', ', R.keys(style))} and
    parentStyle keys ${R.join(', ', R.keys(parentStyle))}`);
  }

  // Find the parentStyle values that match style values by key
  const matchingParentStyle = R.fromPairs(R.innerJoin(
    ([parentStyleKey], [styleKey]) => R.equals(parentStyleKey, styleKey),
    R.toPairs(parentStyle),
    R.toPairs(style)
  ));

  return mergeDeepWith(
    (stateStyleValue, propStyleValue) =>
      // If keys match, the propStyleValue trumps unless it is a function, in which case the stateStyleValue
      // is passed to the propStyleValue function
      R.when(
        R.is(Function),
        propStyleValueFunc => propStyleValueFunc(stateStyleValue)
      )(propStyleValue),
    matchingParentStyle,
    style
  );
};
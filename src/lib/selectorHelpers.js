/**
 * Created by Andy Likuski on 2017.10.17
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import Either from 'data.either';
import {filterWithKeys, mapPropValueAsIndex, mergeDeep, throwing} from 'rescape-ramda';
import * as R from 'ramda';
import memoize from 'memoize-immutable';
import NamedTupleMap from 'namedtuplemap';
const {findOne, onlyOneValue} = throwing;

/**
 * Object statuses
 * @type {{IS_SELECTED: string, IS_ACTIVE: string}}
 */
export const STATUS = {
  IS_SELECTED: 'isSelected',
  IS_ACTIVE: 'isActive'
};

/**
 * Object to lookup a particular status
 * @type {{}}
 * @returns {Object} Object keyed by status key and valued a function that resolves the value of that
 * status property for whatever object is passed to it
 */
export const status = R.fromPairs(
  R.map(
    status => [status, R.prop(status)],
    [STATUS.IS_SELECTED, STATUS.IS_ACTIVE]
  )
);

export const mergeStateAndProps = (state, props) => mergeDeep(state, props);

/**
 * Makes a selector that merges a props object with a state object at a certain matching lens location,
 * and then filters the result of the merge based on the given predicate. This is used for example:
 * If there are Region objects in the state and User object as the props that contains Regions,
 * the lens is R.lensProp('regions') and checks to see which regions of the user are active and
 * returns the regions of the state that match.
 *
 * The predicate checks properties appended to the userSettings version of the data, such as
 * checking for keys like 'isSelected' or 'willDelete' or 'willAdd'
 * @param {Function} innerJoinPedicate Predicate to determine whether each item targeted by stateLens and propLens
 * @param {Function} predicate Predicate that expects each merged value of the container of the lens
 * @param {Function} stateLens Ramda lens to winnow in on the property of the state to be merged with props and then filtered
 * @param {Function} propsLens Ramda lens to winnow in on the props to merge with the target of the state lens
 * for the state and userSettings. It's possible for a value to only exist in the state and not
 * in the userSettings (and possibly visa-versa if the user is creating something new). These will
 * be included in the merge and run through the predicate
 * @returns {Function} A selector expecting a state and props that returns the filtered merged value pointed to by the lens
 *
 * Example:
 * lens R.lensPath(['foos', 'bars'])
 * predicate value => value.isSelected
 * state: {foos: {bars: [{id: 'bar1', name: 'Bar 1'}, {id: 'bar2', name: 'Bar 2'}]}}
 * props: {foos: {bars: {bar1: {id: 'bar1', isSelected: true}, bar2: {id: 'bar2'}}}}
 * returns: {bar1: {id: 'bar1', name: 'Bar 1' isSelected: true}}
 */
export const makeInnerJoinByLensThenFilterSelector = (innerJoinPredicate, predicate, stateLens, propsLens) => (state, props) =>
  filterWithKeys(
    (value, key) => {
      return predicate(
        value
      );
    },
    // Combine the lens focused userValue and state value if they pass the innerJoinPredicate
    R.map(
      // Finally extract the either value
      either => either.get(),
      R.filter(
        // Filter for Right
        either => either.isRight,
        R.mergeWith(
          (l, r) => R.ifElse(
            // Do they pass the inner predicate? (use .value since Left.get() isn't allowed)
            ([l, r]) => R.apply(innerJoinPredicate, [l.value, r.value]),
            // Yes pass, convert to Right
            ([l, r]) => Either.Right(R.apply(mergeDeep, [l.value, r.value])),
            // Fail, empty Left
            ([l, r]) => Either.Left()
          )([l, r]),
          ...R.map(
            // Make sure each is keyed by id before merging
            // Mark everything as Either.Left initially. Only things that match and pass the innerJoin predicate
            // will get converted to Right
            items => R.map(Either.Left, mapPropValueAsIndex('id', items)),
            [R.view(stateLens, state), R.view(propsLens, props)]
          )
        )
      )
    )
  );

/**
 * Finds an item that matches all the given props in params
 * @param params
 * @param items
 */
export const findOneValueByParams = (params, items) => onlyOneValue(findOne(
  // Compare all the eqProps against each item
  R.allPass(
    // Create a eqProps for each prop of params
    R.map(prop => R.eqProps(prop, params),
      R.keys(params)
    )
  ),
  items
));


/***
 * Memomizes a function to a single argument function so that we can always NamedTupleMap for the cache.
 * In order for this to work all objects have to be flattened into one big object. This Cache won't
 * accept inner objects that have change. So three args like
 * {a: {wombat: 1, emu: 2}}, {b: {caracal: 1, serval: 2}}, 'hamster' are converted to
 * {arg1.a: {wombat: 1, emu: 2}, arg2.b: {caracal: 1, serval: 2}, arg3: 'hamster}
 * Thus it's okay for the outer wrappers to change but the inner objects must be === identical, such as the
 * womat and caracal objects.
 * We could flatten even deeper if needed but that would start having performance impacts. This assumes
 * that the outer containers might have changed through casual merging of properties but nothing internal
 * was messed with
 * @param {Function} func A function with any number and type of args
 * @returns {Function} A function that expects the same args as func
 */
export const asUnaryMemoize = func => {
  // Function that converts immutable args to args
  const fromSingleArgFunc = (arg) => func(
    // Sort in order arg1, arg2, ... and take values
    ...R.values(
      R.fromPairs(
        R.sortBy(
          R.identity,
          R.toPairs(
            R.reduce(
              (acc, [key, value]) => {
                return R.set(R.lensPath(R.split('.', key)), value, acc);
              },
              {},
              R.toPairs(arg))
          )
        )
      )
    )
  );
  const memoizedFunc = memoize(fromSingleArgFunc, {cache: new NamedTupleMap()});
  return (...args) => {
    return memoizedFunc(
      R.fromPairs(
        R.addIndex(R.chain)(
          (arg, i) => {
            return R.ifElse(
              R.is(Object),
              R.compose(R.values, R.mapObjIndexed((v, k) => [`arg${i}.${k}`, v])),
              a => [[`arg${i}`, a]]
            )(arg);
          },
          args)
      )
    );
  };
};

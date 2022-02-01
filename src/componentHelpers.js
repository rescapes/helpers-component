/**
 * Created by Andy Likuski on 2017.09.04
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {inspect} from 'util';
import React from 'react';
import * as R from 'ramda';
import {v} from '@rescapes/validate';
import PropTypes from 'prop-types';
import {
  compact,
  mergeDeep,
  chainObjToValues,
  filterWithKeys,
  mergeDeepWith,
  reqPathThrowing,
  reqStrPathThrowing,
  strPathOr,
  stringifyError, composeWithChain, mapToNamedResponseAndInputs, mapObjToValues
} from '@rescapes/ramda';
import {getClassAndStyle, getComponentAndClassName, getStyleObj} from './styleHelpers.js';
import {loggers} from '@rescapes/log';
import {adopt} from 'react-adopt';
import {jsx} from 'react/jsx-runtime.js'

const log = loggers.get('rescapeDefault');

/**
 * Default statuses for Components that don't have any Apollo apolloContainers
 * @type {{loading: boolean, error: boolean}}
 */
export const loadingCompleteStatus = {
  loading: false,
  error: false,
  networkStatus: 7
};

/**
 *
 * Given a data object picks loading, error, and networkStatus and returns an object
 * keyed by the three status flags
 * @param {Object} data
 * @return {Object} {loading: ..., error: ..., networkStatus: ....}
 */
export const apolloStatuses = data => R.pick(R.keys(loadingCompleteStatus), data);

/**
 * Returns true if the lens applied to props equals the lens applied to nextProps
 * @param {Function} lens Ramda lens
 * @param {Object|Array} props React props
 * @param {Object|Array} nextProps Reach nextProps
 * @returns {Boolean} True if equal, else false
 */
export const propLensEqual = v(R.curry((lens, props, nextProps) =>
    R.equals(
      R.view(lens, props),
      R.view(lens, nextProps)
    )
  ),
  [
    ['lens', PropTypes.func.isRequired],
    ['props', PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired],
    ['nextProps', PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired]
  ], 'propLensEqual');


/**
 * Maps each React element to an curried e function.
 * TODO deprecated Use e instead
 * @param {(String|Object)} types React element types (e.g. ['div', 'svg', Router, MyComponent])
 * @returns {Function} A list of functions that need just the config and children specified, not the type
 */
export const eMap = types => R.map(component => React.createElement(component), types);

/**
 * Creates a react element without JSX syntax
 * @param {String|Function|Object} component React element types (e.g. 'div', 'svg', Router, or MyComponent)
 * @param {Object} [props] Default {}, props to pass
 * @param {Object} [children] Default props.children or null
 * @returns the factory for the component. Thus you can call e('div')({...props...}, ...child components)
 */
export const e = React.createElement;
/*
export const e = (component, props = {}, children = null) => {
  return children ? jsx(component, {...props, children}) : jsx(component, props)
}
 */

/**
 * Log renderChoicepoint decision. By default logs at debug level unless process.env.LOGGING_FORCE_CHOICEPOINT
 * is true
 * @param {Object} options
 * @param {String} options.componentName The component name. No logging occurs unless specified
 * @param {Function} [level] Default log.debug (or log.info if process.env.LOGGING_FORCE_CHOICEPOINT is true)
 * @param {String} message THe message
 */
const logChoicepoint = ({
                          componentName,
                          level = process?.env?.LOGGING_FORCE_CHOICEPOINT ? 'info' : 'debug'
                        }, message) => {
  componentName && log[level](message)
}
/**
 * Returns a function that expects each described apollo request props to contain
 * loading, error or networkStatus = 7 (loaded). Whether or not a prop is relevant to one of the 3 statuses is
 * based on the propConfig.
 * If any apollo request prop has 'error' and is configured in propConfig, then
 * funcConfig.onError(props) is called.
 * Else if any apollo request prop has 'loading' or skip=true and is configured in propConfig,
 * then funcConfig.onLoading(props) is called.
 * Else if any apollo request props has networkStatus=7 and is configured
 * in propXConfig, then funcConfig.onData(props) is called
 * @param {Object} funcConfig
 * @param {Function} funcConfig.onError. Function expecting BOTH the keys of the requests that triggered the errors and
 * the props. onError needs the keys in order to know how to respond to the order
 * @param {Function} funcConfig.onLoading Function expecting props
 * @param {Function} funcConfig.onData Function expecting props
 * @param {String} [funcConfig.componentName] Only for debugging. Used to log the name of the component.
 * Note that no debug logging will occur without out this name specified, since it would be hard to know
 * what component was reporting it's status
 * @param {Object} propConfig. Keyed by the prop at least one key from Apollo requests that should have an impact
 * on which of the three functions is called. If this is empty then onData will always be called
 *
 * Each key value is in the form true|false or ['onError', 'onLoading', 'onData']
 * If true\false the key is applied to evaluating all three conditions if true and none if false. If an array
 * of strings then only those specified are relevant to this key. Example
 * {
 *    queryRegions: true // Apply to determine all three function
 *    mutateRegions: ['onError'] // ignore the results of this for onData
 * }
 * Thus if queryRegions' status is loading and mutateRegions' status is anything, onLoading will be called
 * If queryRegions' status is ready and mutateRegions' status is loading, onData will be called because
 * mutateRegions' onLoading status doesn't matter
 * If queryRegions' status is ready and mutateRegions' status is error, onError will be called because
 * mutateRegions' onError status matters.
 *
 * Note that mutations return a structure {mutation: the function, skip: true means the function isn't ready,
 * result: the mutation call response}. So mutations have an additional value to check which is onReady,
 * meaning that the skip is false. This is useful for mutations that are built up from queries and might not be ready
 *
 * @param props An Object that must have one of data.error|.loading|.store
 * @return {*} The result of the onError, onLoading, onData/onReady, or an Exception if none are matched
 */
export const renderChoicepoint = R.curry(({onError, onLoading, onData, componentName}, propConfig, props) => {
  let keys;
  if (R.isEmpty(propConfig)) {
    logChoicepoint({componentName}, `Choicepoint: ${componentName} DATA state due no keys passed`)
    return onData(props);
  }
  // Is there an authentication result that instructs bypassing to onData or onError
  const bypass = _authenticationBypass({onError, onLoading, onData}, propConfig, props);

  return R.cond([
    [
      () => {
        return bypass;
      },
      props => {
        logChoicepoint({componentName}, `Choicepoint: ${componentName} is bypassing due to authentication`)
        return bypass(props);
      }
    ],
    [
      () => {
        keys = keysMatchingStatus('onError', propConfig, props);
        // If any error we are in error state
        return R.length(keys);
      },
      props => {
        logChoicepoint({componentName}, `Choicepoint: ${componentName} ERROR state due to keys ${R.join(', ', keys)}`)
        return onError(keys, props);
      }
    ],
    [
      () => {
        keys = keysMatchingStatus('onLoading', propConfig, props);
        // If any loading we are in loading state
        return R.length(keys);
      },
      props => {
        logChoicepoint({componentName}, `Choicepoint: ${componentName} LOADING state due to keys ${R.join(', ', keys)}`)
        return onLoading(props);
      }
    ],
    [
      () => {
        keys = relevantKeyNotMatchingStatus('onReady', propConfig, props);
        // If any not onReady that need to be
        return R.length(keys);
      },
      props => {
        logChoicepoint({componentName}, `Choicepoint: ${componentName} NOT READY state due to mutation keys ${R.join(', ', keys)}`)
        return onLoading(props);
      }
    ],
    [
      () => {
        keys = R.uniq(R.concat(
          keysMatchingStatus('onData', propConfig, props),
          keysMatchingStatus('onReady', propConfig, props)
        ));
        const relevantKeys = R.uniq(R.keys(R.mergeRight(
          _relevantPropConfig('onData', propConfig),
          _relevantPropConfig('onReady', propConfig)
        )));
        // If all onData or onReady we can call onData
        return R.equals(R.length(keys), R.length(relevantKeys));
      },
      props => {
        logChoicepoint({componentName}, `Choicepoint: ${componentName} DATA state due to keys ${R.join(', ', keys)}`)
        return onData(props);
      }
    ],
    [R.T, props => {
      throw new Error(`No error, loading, nor data ready status with propConfig: ${inspect(propConfig)}, props: ${inspect(props)}`);
    }]
  ])(props);
});

/**
 * Returns true if the given object has the conditions of the given status
 * Note that mutation components return a {mutation, skip, response: {called, loading, status}},
 * so we have to look at the response to check statuses, except for the special status onReady.
 * onReady indicates that the mutation component is ready to run, that skip=false
 * @param {string} status 'onError', 'onLoading', 'onData', or 'onReady' (mutations only)
 * @param {Object|Function} obj Result of an Apollo query containing 'error', 'loading' or networkStatus = 7 (ready)
 * @return {Boolean} True if the obj passes the status' predicate
 */
const _mapStatusToFunc = (status, obj) => {
  const statusLookup = {
    onError: obj => R.either(
      // Mutations
      obj => R.propOr(false, 'error', R.propOr({}, 'result', obj)),
      // Queries
      obj => R.propOr(false, 'error', obj)
    )(obj),
    onLoading: obj => R.either(
      // Check for loading=true or data=null (the latter is the skip=true case or not queried yet)
      // Mutations
      obj => R.propOr(false, 'loading', R.propOr({}, 'result', obj)),
      // Queries
      obj => R.both(
        // Not a mutation
        obj => R.complement(R.propOr)(false, 'result', obj),
        obj => R.either(
          // Explicitly loading
          obj => R.propOr(false, 'loading', obj),
          // Skip or "hasn't started loading"? means loading
          obj => typeof obj.data === 'undefined'
        )(obj)
      )(obj)
    )(obj),
    // Status only for mutations that are ready to run if not skipped because they lack needed parameters
    onReady: obj => R.not(R.propOr(false, 'skip', obj)),
    onData: obj => R.either(
      // If mutation check that either it has not been called or it has been called as is ready
      obj => R.both(
        // Mutations must not be skipped. Skipped means they are lacking parameters needed for the mutation
        // This never matter for queries, because skipped queries also don't have data ready
        obj => R.not(R.propOr(false, 'skip', obj)),
        obj => R.either(
          R.propEq('called', false),
          R.propEq('networkStatus', 7)
        )(obj)
      )(R.propOr({}, 'result', obj)),
      // If query check the result for status 7 or for obj.data non-null. Cache queries don't have a status
      // so we need the latter check
      obj => {
        return R.either(R.propEq('networkStatus', 7), R.propOr(null, 'data'))(obj)
      }
    )(obj)
  };
  return reqStrPathThrowing(status, statusLookup)(obj);
};

/**
 * Returns the keys matching the given status based on the propConfig.
 * For queries we check whether the status matches. When mutations are ready to run they return a
 * {mutation: function, skip: (true means mutation not ready to run), response: {...loading mutation}}
 * so returning a function is considered equivalent to onData. If the mutation is not ready it can
 * return the response of the depending query, which can itself be examined for loading or error status.
 * There is a fourth status called onReady for mutations which indicates skip: false, meaning the mutation
 * has the variables it needs to run
 * @param status
 * @param propConfig
 * @param props
 * @return {[String]} The matching keys or an empty array
 */
export const keysMatchingStatus = (status, propConfig, props) => {
  // Find the relevant prop configs for this status.
  const relevantPropConfig = _relevantPropConfig(status, propConfig);
  // Return matching keys. Compact out failures
  return compact(R.map(
    prop => {
      // Does props[prop] have a value that matches the status. If so return the prop
      return _mapStatusToFunc(status, R.propOr({}, prop, props)) ? prop : null;
    },
    // Take each relevant keys
    R.keys(relevantPropConfig)
  ));
};

/**
 * If a propConfig value is a function, it means we might want to bypass other propsConfig
 * configurations and simply call one of our render methods. This is used for an unauthenticated
 * cache/query result that tells us to render onData (with a login) or onError without waiting
 * for other queries to load (since the queries wouldn't have the authentication they need)
 * @param {Object} render
 * @param {Function} render.onError
 * @param {Function} render.onLoading
 * @param {Function} render.onData
 * @param {Object} propConfig
 * @param {Object} props
 * @returns {any}
 */
export const _authenticationBypass = ({onError, onLoading, onData}, propConfig, props) => {
  // If any propConfig value is function, call it and return the first truthy value, a function
  // such as onData or onError.
  const relevantPropConfig = R.filter(R.is(Function), propConfig);
  return R.head(compact(R.map(
    func => {
      return func({onError, onLoading, onData}, propConfig, props);
    },
    R.values(relevantPropConfig)
  )));
};

export const relevantKeyNotMatchingStatus = (status, propConfig, props) => {
  const relevantPropConfig = _relevantPropConfig(status, propConfig, true);
  // Return non-matching keys. Compact out success
  return compact(R.map(
    prop => {
      // Does props[prop] have a value that matches the status. If not return the prop
      return _mapStatusToFunc(status, R.propOr({}, prop, props)) ? null : prop;
    },
    // Take each relevant keys
    R.keys(relevantPropConfig)
  ));
};

/**
 * Finds the propConfig props relevant to the given status.
 * @param {String} status one of onLoading, onError, onReady, onData
 * @param {Object} propConfig keyed by mutation or query name and valued by boolean to indicate it applies to all or no
 * statuses (exception is onReady, which can't be used with a boolean). Can also be valued by a list of
 * statuses that the request is relevant too. E.g. if queryRegions: ['onData', 'onLoading'] means that queryRegions'
 * status matters if the given status is one of those two.
 * @param {Boolean} [noBool] Default false, only for negative tests
 * @return {Object} The propConfig with non-relevant key/values filtered out
 * @private
 */
const _relevantPropConfig = (status, propConfig, noBool = false) => {
  return filterWithKeys(
    (value, name) => {
      return R.cond([
        [
          // Skip propConfig values that are functions, this is only _authenticationBypass
          R.is(Function),
          () => false
        ],
        // If value is a boolean let it determine the prop's relevancy
        [
          R.is(Boolean),
          () => {
            // If boolean return the value unless noBool is true or status is onReady and not mutation
            return !noBool && R.not(R.equals('onReady', status) && R.includes('query', name)) && value;
          }
        ],
        // If value is an array see if it contains the status we're checking
        [
          Array.isArray,
          value => {
            return R.includes(status, value);
          }
        ],
        [
          R.T,
          value => {
            throw new Error(`Unknown type for value. Expected boolean or array ${JSON.stringify(value)}`);
          }
        ]
      ])(value);
    },
    propConfig
  );
};

const renderPropKeys = ['render', 'children'];
/**
 * Avoids applying props to a render prop function named render or children
 * Render props are called by then component itself. We never want to call them.
 * @param {String} propName name of the prop of the view being processed
 * @param {Object} props The props
 * @param {Object|Function} viewPropsOrFunction If an object or a function whose propName is render or children,
 * then it is returned. If otherwise a function, props is applied to it
 * @returns {Object} viewPropsOrFunction or viewPropsOrFunction with props applied
 */
const applyToIfNonRenderFunction = (propName, props, viewPropsOrFunction) => {
  // Never apply props to a render prop function
  if (R.any(renderPropKey => R.startsWith(renderPropKey, propName), renderPropKeys)) {
    return viewPropsOrFunction;
  }
  // If viewPropsOrFunction is a function meant to take props, pass props to it
  return applyToIfFunction(props, viewPropsOrFunction);
};

/**
 * Copies any needed eventHandlers to view containers
 * Also removes ownProps from the return value since we already incorporated theses into stateProps
 * @props {Object} viewToEventHandler An object keyed by view that is in stateProps.views and valued by
 * an object with even name and event handler or prop string path. Prop string path must point
 * at a function in the props, e.g. 'mutateTokenAuth.mutate'.
 * If using a Apollo mutation make sure that the component is disabled if the  mutation is not ready to run.
 * @props {Object} props Props from a parent component
 * @returns {Function} A mergeProps function that expects props (e.g. A merge stateProps and dispatchProps)
 */
export const mergeEventHandlersForViews = R.curry((viewToActionNames, props) => {
  return R.over(
    R.lensProp('views'),
    views =>
      mergeDeep(
        // Merge any existing values in props.views
        views,
        // Map each propPath to the value in props or undefined
        // This transforms {viewName: {propName: 'pathInPropsToPropName (e.g. store.propName)', ...}
        // This results in {viewName: {propName: propValue, ...}}
        R.map(
          eventToEventHandlerOrPropFunctionPath => {
            return R.map(
              eventHandlerOrPropFunctionPath => {
                // If a string path
                const func = R.when(
                  R.is(String),
                  strPath => {
                    return reqStrPathThrowing(strPath, props);
                  }
                )(eventHandlerOrPropFunctionPath);
                if (R.is(Function)) {
                  // Return the event handler
                  return func;
                } else {
                  log.warning(`Expected event handler function or path that leads to function: ${eventHandlerOrPropFunctionPath} in props ${inspect(props)}`);
                }
              },
              eventToEventHandlerOrPropFunctionPath
            );
          },
          // Map each view
          applyToIfFunction(props, viewToActionNames)
        )
      ),
    props
  );
});

/**
 * Given a mapping from view names to an array of prop values or functions,
 * adds or merges a views property into the props, where views is an object keyed by
 * the same keys as viewNamesToViewProps and valued by the resolution of the viewNamesToViewProps
 * This allows a Container or Component to efficiently specify which props to give the view
 * used by each sub component. Each props object of viewNamesToViewProps can be a constant value or
 * a unary function that is passed props. Either way, it results in an object keyed by props and
 * valued by prop values or a function that accepts props.
 *
 * The functions that accept props can optionally take a second argument (they must be curried) or
 * return a unary function that accepts an item. This is only appropriate for components that are
 * used in a list and so need to take each item as an argument. See the example.
 *
 * Example, if aComponent and bComponents are two child components that need the following props:
 * const viewToProps = {
 *  aComponent: {
 *    foo: 1, bar: R.lensPath(['store, 'bar'])
 * },
 * bComponent: {
 *    // These are two functions that resolve paths in different ways
 *   bar: R.lensPath(['store', 'bar']),
 *   width: (props) => props.style.width
 * }
 * // This view is used as a list item. Since all of its props need to incorporate each item we make
 * the entire property object a function
 * itemComponent: R.curry((props, item) => {
 *  // Unique key to satisfy React iteration
 *  key: item.name,
 *  title: item.title
 * })
 * // This view is also a list item, but instead uses functions on individual properties
 * anotherItemComponent: {
 *  someConstantKey: 'funky',
 *  // just needs prop
 *  somePropKey: props => props.cool
 *  // just needs item
 *  someItemProp: (_, item) => item.itemName
 *  // uses both props and item by returning a unary function
 *  anotherItemProp: props => item => `${prop.name}:${item.name}`
 * }
 *
 * and props are
 * const props = {
      a: 1,
      views: {aComponent: {stuff: 1}, bComponent: {moreStuff: 2}},
      data: {
        foo: 1,
        store: {
          bar: 2
        }
      }
      style: {
        width: '100px'
      }
    };
 * The function returns
 * {
    a: 1,
    views: {
      aComponent: {stuff: 1, foo: 1, bar: 2},
      bComponent: {moreStuff: 2, bar: 2, width: '100px'}
    },
    foo: 1,
    bar: 2,
  }
 *
 * @param {Object} config
 * @param {Object} [config.ignoreTopLevelFunctions] Default false. If ture, don't pass props to top-level functions.
 * Assume that they are functional props that don't need props.
 * @param {Function|Object} viewsToPropValuesOrFuncs If an object then as described above.
 * If a funciton it expects props and returns the object as described above. A function is
 * useful for generating multiple key/values
 * @param {Object} props
 * @param {Object} props.data Must be present to search for propPaths
 * @props {Object} props with props added to props.views
 */
export const mergePropsForViews = R.curry(({ignoreTopLevelFunctions = false}, viewNamesToViewProps, props) => {

  // If result matching view props object is a function, wrap them in a function
  // These functions have to accept an item (datum), the props arg has already been given to them
  const mergeFunctions = (left, right) => {
    return R.cond([
      [
        R.any(R.is(Function)),
        ([l, r]) => {
          return item => mergeDeep(
            ...R.map(applyToIfFunction(item), [l, r])
          );
        }
      ],
      [
        // Merge objects
        R.all(R.is(Object)),
        ([l, r]) => R.apply(mergeDeep, [l, r])
      ],
      [R.T,
        // Take left for primitives and arrays
        ([l, r]) => l
      ]
    ])([left, right]);
  };

  // Merge a default key for the view if we have an object.
  // This key gets lowest priority, so if key is already defined this is dropped
  const keyView = viewName => objOrFunc => R.ifElse(
    R.is(Function),
    // If we have a function compose the merge and make the key a function taking a datum
    f => {
      let i = 0;
      return d => {
        return R.compose(
          R.mergeRight({
            key: R.propOr(R.concat(viewName, (++i).toString()), 'key', d)
          }),
          f
        )(d);
      };
    },
    // Just merge the key
    obj => R.mergeRight({key: viewName}, obj)
  )(objOrFunc);

  // If any item is still a function, we have to assume that items are being applied, so convert
  // our key value to a function if needed
  const keyViewIfAnyFunctionsRemain = (viewName, objOrFunc) => {
    return R.when(
      R.allPass([
        // objOrFunc is not already a function
        R.complement(R.is)(Function),
        // Any non-render key is a function
        obj => {
          return R.compose(
            R.any(R.is(Function)),
            R.values,
            R.omit(renderPropKeys)
          )(obj);
        },
        // key value is not already a function
        obj => {
          return R.compose(R.complement(R.is)(Function), R.prop('key'))(obj);
        }
      ]),
      obj => {
        let i = 0;
        return R.mergeRight(
          obj,
          {
            key: d => R.propOr(R.concat(viewName, (++i).toString()), 'key', d)
          }
        );
      }
    )(objOrFunc);
  };

  return R.over(
    R.lensProp('views'),
    views => mergeDeepWith(
      // If result merged value is a function, wrap it in a function to resolve later
      mergeFunctions,
      // Merge any existing values in props.views
      views,
      // Map each propPath to the value in props or undefined
      R.mapObjIndexed(
        (viewPropsObjOrFunction, viewName) => R.compose(
          // If anything non render props is still a function, an item function, make sure our key property is an item function
          objOrFunc => R.unless(() => ignoreTopLevelFunctions,
            objOrFunc => {
              return keyViewIfAnyFunctionsRemain(viewName, objOrFunc);
            }
          )(objOrFunc),
          objOrFunc => R.unless(
            objOrFunc => R.is(Function, objOrFunc),
            objOrFunc => R.unless(() => ignoreTopLevelFunctions,
              objOrFunc => R.mapObjIndexed(
                // If any individual prop value is a function, pass props to it.
                (o, propName) => applyToIfNonRenderFunction(propName, props, o),
                objOrFunc
              )
            )(objOrFunc)
          )(objOrFunc),
          // Add a key to the view based on the viewName or datum.key or the viewName plus datum index
          objOrFunc => keyView(viewName)(objOrFunc),
          // If the viewProps are a function, pass props to it
          // Either way we end up wih an object of prop keys pointing to prop values or prop functions
          objOrFunc => applyToIfFunction(props, objOrFunc)
        )(viewPropsObjOrFunction),
        // If the entire viewToPropValuesOrFuncs is a function pass props to it
        applyToIfFunction(props, viewNamesToViewProps)
      )
    ),
    props
  );
});

/**
 * Adds a 'key' to the viewProps for React iteration. The value of key must be a key in viewProps
 * that generates a unique value, such as an id, name, or title. This is useful when a property created
 * in the viewProps can serve as the key
 * @param {String} keyStr Any key or keyString (e.g. 'foo.bar') in viewProps that generates a unique value
 * This will be converted to a string. If you want the key to be based on the datum use the keyWithDatum function instead
 * @param {Object} viewProps Prop configuration for a particular view (see mergePropsForViews)
 * The values can be constants or functions, as supported by mergePropsForView. The value matching
 * key will simply be referred by 'key'
 * @return {*} viewProps with 'key' added, where the value is a string or function
 */
export const keyWith = (keyStr, viewProps) => R.mergeRight(viewProps, {
  key: reqStrPathThrowing(keyStr, viewProps).toString()
});

/**
 * Same as keyWith but allows a default if the keyStr returns nil
 * @param {String} defaultValue Default value for the key
 * @param {String} keyStr Any key or keyString (e.g. 'foo.bar') in viewProps that generates a unique value
 * This will be converted to a string. If you want the key to be based on the datum use the keyWithDatum function instead
 * @param {Object} viewProps Prop configuration for a particular view (see mergePropsForViews)
 * The values can be constants or functions, as supported by mergePropsForView. The value matching
 * key will simply be referred by 'key'
 * @return {*} viewProps with 'key' added, where the value is a string or function or the defaultValue
 */
export const keyWithOr = (defaultValue, keyStr, viewProps) => R.mergeRight(viewProps, {
  key: strPathOr(keyStr, viewProps).toString()
});

/**
 * Returns the string path of the apolloResult.value if apolloResult is a Result.Ok, meaning data is ready
 * or returns 'loading' or 'error' if there is a Result.Error representing one of those statuses
 * @param keyStr
 * @param apolloResult
 * @return {*}
 */
export const keyApolloResultWithOrLoadError = (keyStr, apolloResult) => {
  return apolloResult.matchWith({
    Ok: ({value}) => {
      return reqStrPathThrowing(keyStr, value);
    },
    Error: ({value}) => {
      // Return 'loading' or 'error' as the key
      return R.find(status => R.propOr(false, status, value), ['loading', 'error']);
    }
  });
};

/**
 * Adds a 'key' to the viewProps for React iteration, where the key is property of the given datum d.
 * @param {String} keyStr Any key or key string (e.g. 'foo.bar') of d that generates a unique value
 * @param {Object} d The datum containing key, which has a unique value among the data
 * @param {Object} viewProps Prop configuration for a particular view (see mergePropsForViews)
 * The values can be constants or functions, as supported by mergePropsForView. The key value from d will
 * be merged into this, so don't put a key in the viewProps because it will be overwritten
 * @return {*} viewProps with a key property added with value d[key]
 */
export const keyWithDatum = R.curry(
  (key, d, viewProps) => R.mergeRight(
    viewProps,
    {key: reqStrPathThrowing(key, d).toString()}
  )
);

/**
 * If maybeFunc is a func, call it with obj, otherwise return maybeFunc
 * This is somewhat like d3, where a value can be a static or a unary function
 * @param {*} obj The obj to pass to maybeFunc if maybeFunc is a function
 * @param {*} maybeFunc If a function, call it with obj, otherwise return it
 * @return {*} maybeFunc(obj) or maybeFunc
 */
export const applyToIfFunction = R.curry((obj, maybeFunc) =>
  R.ifElse(
    R.is(Function),
    // if it is function, call with props and expect a value back
    mf => R.applyTo(obj, mf),
    // otherwise assume it's already a resolved value
    R.identity
  )(maybeFunc)
);

/**
 * Applies the given arguments if maybeFunc is a function. Otherwise the arguments are ignored
 * @param {*} obj The obj to pass to maybeFunc if maybeFunc is a function
 * @param {*} maybeFunc If a function, call it with obj, otherwise return it
 * @return {*} maybeFunc(obj) or maybeFunc
 */
export const applyIfFunction = R.curry((args, maybeFunc) =>
  R.ifElse(
    R.is(Function),
    // if it is function, call with props and expect a value back
    R.apply(R.__, args),
    // otherwise assume it's already a resolved value
    R.identity
  )(maybeFunc)
);


/**
 * Given a React component function that expects props and given props that are a functor (Array or Object),
 * lift the component to handle all values of the functor and then extract the values
 * @param {Function} component A React component function that expects props
 * @param {Functor} props An array or object (or any other functor for which we can extract the values
 * Each value contains the props to create on component using the component function. The results are
 * returned as an array of components
 * @return {Object[]} A list of React components
 */
export const liftAndExtract = (component, props) => {
  return R.values(
    // Note that R.map(component, props) would work here too,
    // but this might refactor better if we support passing child components
    R.liftN(1, component)(props)
  );
};

/**
 * Like liftAndExtract but expects propsWithItems to have an items key holding the functor
 * This is useful to separate dispatch actions from the props functor, since dispatch
 * actions are always the same for all items
 * @param {Function} component A React component function that expects props
 * @param {Object} propsWithItems Has a key items that holds an array or object
 * (or any other functor for which we can extract the values
 * @return {Object[]} A list of React components
 */
export const liftAndExtractItems = (component, propsWithItems) => {
  return liftAndExtract(component, reqPathThrowing(['items'], propsWithItems));
};

/**
 * Given a viewStyles function that expects props and returns styles keyed by view, merges those
 * view values into the views of the props.
 * @param {Function|Object} viewStyles Result an object mapping of view names to styles, or a function that expects
 * props and returns that object. viewStyles often merge props or apply them to functions.
 * @param {Function|Object} props Props object or function that returns props when props are passed ot it
 * @return {*}
 */
export const mergeStylesIntoViews = v(R.curry((viewStyles, {views, ...props}) => {
    // viewStyles can be an object or unary function that returns an object
    const viewObjs = applyToIfFunction(props, viewStyles);

    // if the viewObj has style as a key, we take that to mean that the object is in the
    // shape {style: {...}, className: 'extra class names'}. Otherwise it means
    // that it is just style props because no extra className was needed
    const viewToStyle = R.map(
      viewObj => R.cond([
        [
          R.either(R.hasIn('style'), R.hasIn('component')),
          // Done, viewStyles function has already set up an object with one of {[style], [component]}
          R.identity
        ],
        // Wrap it in a style key. If it is a styled component, create {component: Styled Component}
        [
          obj => false, // TODO replace with chakra isStyledComponent(obj),
          component => ({component})
        ],
        // By default assume it's a style object
        [
          R.T,
          style => ({style})
        ]
      ])(viewObj),
      viewObjs);

    // Deep props.views with viewStyles and return entire props
    return R.over(
      R.lensProp('views'),
      views => mergeDeep(views, viewToStyle),
      {views, ...props}
    );
  }),
  [
    ['viewStyles', PropTypes.oneOfType([PropTypes.shape({}), PropTypes.func]).isRequired],
    ['props', PropTypes.shape().isRequired]
  ], 'mergeStylesIntoViews');

/**
 * Given viewProps keyed by by view names, find the one that matches name.
 * Then create the class and style props from the name and style props and merge it with the other props
 * If no matches props are found, {className: decamelized name} is returned
 * The resolved props obj can also be a function accepting an item for iteration views.
 * The function also adds key=name to help prevent unkeyed components. This can be overridden by an explicity key
 * Example: name = 'fooOuterDiv'
 * viewProps: {
 *  fooView: {
 *    bar: 1,
 *    style: {
 *      color: 'red'
 *    }
 *  },
 *  OtherView: item => {
 *    bar: 1,
 *    key: item.key
 *    style: {
 *      color: 'red'
 *    }
 *  },
 * }
 * resolves to {
 *  bar: 1,
 *  className: 'foo-outer-div'
 *  style: {
 *    color: 'red'
 *  }
 * }
 *
 * @param {Object} views Contains a key name that contains {props: props for the component, style: style for
 * the component, className: optional list of classnames for the component}.
 * @param {String} name The key for the component props and style to find
 * @return {Object} The props including style and className attributes
 */
export const propsFor = v((views, name) => {
    const propsForView = R.defaultTo({}, R.view(R.lensProp(name), views));
    const classAndStyle = getClassAndStyle(
      name,
      views
    );

    // If the resulting propsForView is a function, wrap the merge as a function expecting an item
    return R.ifElse(
      R.is(Function),
      f => item => R.mergeAll([{key: name}, f(item), classAndStyle]),
      obj => R.mergeAll([{key: name}, obj, classAndStyle])
    )(propsForView);
  },
  [
    ['views', PropTypes.shape().isRequired],
    ['name', PropTypes.string.isRequired]
  ], 'propsFor');

/**
 * Like propsFor but doesn't generate a className since non-trivial components ignore it.
 * This might not be used in the future since we are using StyledComponents instead
 * @param {Object} views Contains a key name that contains {props: props for the component, style: style for
 * the component, className: optional list of classnames for the component}. className is not used here
 * since we don't want the component to get classNames
 * @param {String} name The key for the component props and style to find
 * @return {Object} The props including the style attribute, but not className
 */
export const propsForSansClass = v((views, name) => {
    const propsForView = R.defaultTo({}, R.view(R.lensProp(name), views));
    return R.mergeAll([
      {key: name},
      propsForView,
      getStyleObj(name, views)
    ]);
  },
  [
    ['views', PropTypes.shape().isRequired],
    ['name', PropTypes.string.isRequired]
  ], 'propsForSansClass');

export const propsAndStyle = (name, viewProps) => R.mergeRight(
  getStyleObj(name, R.propOr({name: {style: {}}}, name, viewProps)),
  R.omit(['style'], viewProps)
);

/**
 * A version of props for that expects the views[name].style object to be a StyledComponent rather than
 * a style object. This returns a two item of array of the StyledComponent and its props
 * @type {function(): *}
 */
export const componentAndPropsFor = v((views, name) => {
    const propsForView = R.defaultTo(
      {},
      R.view(R.lensProp(name), views)
    );
    // TODO I don't know if we'd ever need separate classnames with a styled component, but pass it anyway
    const {component: styledComponent, ...rest} = getComponentAndClassName(
      name,
      views
    );

    // If the resulting propsForView is a function, wrap the merge as a function expecting an item
    // Returns an pair, the styledComponents and it's props
    return [styledComponent, R.ifElse(
      R.is(Function),
      f => item => R.mergeAll([{key: name}, f(item), rest]),
      obj => R.mergeAll([{key: name}, obj, rest])
    )(R.omit(['component'], propsForView))];
  },
  [
    ['views', PropTypes.shape().isRequired],
    ['name', PropTypes.string.isRequired]
  ], 'componentAndPropsFor');

/**
 * Applies an item to props that have unary functional values.
 * Also applies an item to props.styles keys if they are functions.
 * TODO consider making this recursive rather than targeting style
 * @param {Object|Function} propsOrFunc The props to which to apply the item. This can also be a function
 * expecting the item
 * @param item The item to which to call on properties that are function
 */
export const itemizeProps = R.curry((propsOrFunc, item) => {
  const mapApplyToItem = R.mapObjIndexed((value, key) =>
    R.when(
      // TODO hack don't allow on... methods. These are actions. Actions should really be in actions: {}
      R.both(R.is(Function), () => R.complement(R.startsWith('on'))(key)),
      // Apply the prop function to item (i.e. call the function with item)
      f => R.applyTo(item, f)
    )(value)
  );

  return R.compose(
    // Repeat for style props
    R.when(
      R.has('style'),
      R.over(
        R.lensProp('style'),
        style => mapApplyToItem(style)
      )
    ),
    // For any prop that has a function, call it with item
    mapApplyToItem
    // If the propsOrFunc is a func, apply it to item, either way we end up with the props
  )(applyToIfFunction(item, propsOrFunc));
});

/**
 * Calls propsFor wrapped in itemizeProps. This first resolves the props of the view given by name,
 * then it applies item to any function in the resolved props and in props.style.
 * @param {Object} views The views keyed by named and valued by a props object (or function that resolves to props)
 * @param {String} name The view name to resolve
 * @param {Object} item The item to call on any functions in the resolved props and props.styles
 * @returns {Object} Fully resolved props for the particular item
 */
export const propsForItem = R.curry((views, name, item) => itemizeProps(propsFor(views, name), item));

/**
 * Creates {name1: name1, name2: name2} from a list of names
 * @param {Object} nameObj A list of names to be constants
 */
export const nameLookup = nameObj =>
  R.mapObjIndexed(
    (v, k) => k,
    nameObj
  );

/**
 * Convenience method to call mergeActionsForView, mergePropsForView, and mergeStylesIntoViews
 * @param {Object} viewActions Argument to mergeActionsForView. See mergeEventHandlersForViews
 * @param {Object|Function} viewProps Argument to mergePropsForViews. See mergePropsForViews
 * @param {Object|Function} viewStyles Argument to mergeStylesIntoViews. See mergeStylesIntoViews
 * @param {Object} props Props that are used for the composition. Each of the three functions
 * is called with the props.
 * Styles is computed first in case viewProps need to access a computed style value, namely with and height.
 * Otherwise There should be no dependencies between the three functions--they
 * each contribute to the returned props.views
 * @return {Function} The modified props with view properties added by each of the three functions
 */
export const composeViews = R.curry((viewNameToViewActions, viewNameToViewProps, viewNameToViewStyles, props) => {
    return R.compose(
      p => mergeEventHandlersForViews(viewNameToViewActions, p),
      p => mergePropsForViews({}, viewNameToViewProps, p),
      p => mergeStylesIntoViews(viewNameToViewStyles, p)
    )(props)
  }
);

/**
 * Simplified version of composeViews when not using actions and styles. Just adds keys to the viewProps
 * @param viewNameToViewProps
 * @param props
 */
export const keyViewProps = R.curry((viewNameToViewProps, props) => {
  return mergePropsForViews({ignoreTopLevelFunctions: true}, viewNameToViewProps, props)
})

/**
 * Like composeViews but doesn't pass props or datum to views or view props that are functions
 * @param {Object} config
 * @param {Object|Function} config.viewProps Argument to mergePropsForViews. See mergePropsForViews
 * @param {Object|Function} [config.viewStyles] Default identity function. Argument to mergeStylesIntoViews. See mergeStylesIntoViews
 * @param {Object} [config.viewActions] Default identity function Argument to mergeActionsForView. See mergeEventHandlersForViews
 * @param {Object} props Props that are used for the composition. Each of the three functions
 * is called with the props.
 * Styles is computed first in case viewProps need to access a computed style value, namely with and height.
 * Otherwise There should be no dependencies between the three functions--they
 * each contribute to the returned props.views
 * @return {Function} The modified props with view properties added by each of the three functions
 */
export const composeSimpleViews = R.curry((
  {
    viewNameToViewProps,
    viewNameToViewStyles = R.identity,
    viewNameToViewActions = R.identity
  }, props) => {
  return R.compose(
    p => {
      return mergeEventHandlersForViews(viewNameToViewActions, p)
    },
    p => {
      return mergePropsForViews({ignoreTopLevelFunctions: true}, viewNameToViewProps, p)
    },
    p => {
      return mergeStylesIntoViews(viewNameToViewStyles, p)
    }
  )(props)
})

/**
 * Like composeViews but takes a viewStruct as input for smaller component
 * @param {Object} viewStruct
 * @param {Object} viewStruct.actions Optional. Maps actions to views
 * @param {Object} viewStruct.props Optional. Maps props to views
 * @param {Object} viewStruct.styles Optional. Maps styles and className to views
 * @return {Function} The modified props with view properties added by each of the three functions
 */
export const composeViewsFromStruct = R.curry((viewStruct, props) => {
    const propFor = R.prop(R.__, viewStruct);
    return R.compose(
      R.when(R.always(propFor('actions')), mergeEventHandlersForViews(propFor('actions'))),
      R.when(R.always(propFor('props')), mergePropsForViews({}, propFor('props'))),
      R.when(R.always(propFor('styles')), mergeStylesIntoViews(propFor('styles')))
    )(props);
  }
);

/**
 * Joins React components with a separatorComponent between each
 * @param {Function} separatorComponent Unary function that expects a key to index the component in the list
 * (using the React key property)
 * @param {Function[]} components List of unary functions returning a component. The function also expects key
 * to index the component in the list
 * @returns {Array} The components interspersed with separatorComponents
 */
export const joinComponents = v((separatorComponent, components) =>
  R.addIndex(R.reduce)(
    (prevComponents, component, key) => R.ifElse(
      R.isNil,
      // Just component
      () => [component(key * 2)],
      // Add separator and component to previous
      R.flip(R.concat)([
        separatorComponent(key * 2 - 1),
        component(key * 2)
      ])
    )(prevComponents),
    null,
    components
  ), [
  ['separatorComponent', PropTypes.func.isRequired],
  ['components', PropTypes.arrayOf(PropTypes.func).isRequired]
], 'renderLoadingDefault');
;

/**
 * A default loading React component, which is passed the props in props.views.viewName
 * @param viewName The viewname with which to resolve the props
 * @return A function expecting props, which renders the loading component
 */
export const renderLoadingDefault = v(viewName => ({views}) => {
  const props = propsFor(views);
  return e('div', props(viewName));
}, [
  ['viewName', PropTypes.string.isRequired]
], 'renderLoadingDefault');

/**
 * A default error React component, which is passed the props in props.views.viewName
 * @param viewName The view name with which to resolve the props
 * @return A function expecting props, which renders the error component
 */
export const renderErrorDefault = v(viewName => (keysWithErrors, {views, ...requestProps}) => {
  const props = propsFor(views);
  const keyToError = R.map(
    requestPropValue => strPathOr(null, 'error', requestPropValue),
    filterWithKeys((value, requestProp) => R.includes(requestProp, keysWithErrors), requestProps)
  );
  return e('div', props(viewName),
    R.join('\n\n',
      chainObjToValues(
        (error, key) => {
          return `Error for request ${key}: Original Error: ${
            stringifyError(error)
          }`;
        },
        keyToError
      )
    )
  );
}, [
  ['viewName', PropTypes.string.isRequired]
], 'renderLoadingDefault');


/**
 * Given a container's mapStateToProps and mapDispatchToProps, returns a function that accepts a sample state
 * and sample ownProps. This function may be exported by a container to help with unit tests
 * @param {Function} mapStateToProps The mapStatesToProps function of a container. It will be passed
 * sampleState and sampleOwnProps when invoked
 * @param {Function} mapDispatchToProps The mapDispatchToProps function of a container. It will be passed
 * the identity function for a fake dispatch and sampleOwnProps when invoked
 * @returns {Function} A function that expects a sample state and sample ownProps and returns a complete
 * sample props according to the functions of the container
 */
export const makeTestPropsFunction = (mapStateToProps, mapDispatchToProps) => {
  (sampleState, sampleOwnProps) => {
    return R.mergeRight(
      mapStateToProps(sampleState, sampleOwnProps),
      mapDispatchToProps(R.identity, sampleOwnProps)
    );
  };
};

/***
 * Creates a container which that has a render function for its children prop. This render function creates
 * a component element
 * The component receives as props the merges of the render function props and the props given here.
 * This is used for Apollo containers that produce Apollo response results to give to the component.
 * However it could be used by any container that calls a children render function
 * @param {Object|Function} container The container. A component that expects props. The container must return
 * a call to children and pass whatever props it produces. It need not pass the props given to it, since
 * these are merged with the props it passes to the children function.
 * @param {Object|Function} component The component. A component that is passed to createElement.
 * @returns {Function<Object>} Where the argument is the props.
 */
export const apolloContainerComponent = (container, component) => {
  return props => {
    return e(
      container,
      props,
      // These props contains the results of the Apollo queries and the mutation functions
      // Merge them with the original props, which can return values unrelated to the apollo requests
      responseProps => e(
        component,
        R.mergeRight(props, responseProps)
      )
    );
  };
};

/***
 * Like apolloContainerComponent but called with apolloContainers instead of a container. The apolloContainers
 * are passed to react-adopt's adopt method to make them each available as props to the component
 * @param {Object} apolloContainers keyed by query or mutation name, and valued by the Query or Mutation
 * apollo component. Queries names should begin with 'query' and mutation names with 'mutate' for testing
 * @param component
 * @returns {function(*=): *}
 */
export const componentWithAdoptedContainer = (apolloContainers, component) => {
  return props => {
    return apolloContainerComponent(adopt(apolloContainers), component)(props);
  }
};

/**
 * Wraps a component in a container that has the given apolloContainers (query and mutation components).
 * If USE_MOCKS is in the env variables then don't link the container.
 * @param {Function} apolloContainers Expects and apolloConfig and returns an object of apollo query and
 * mutation containers
 * @param {Object} component The component that expects the adopted apollo queries and mutation responses
 * to come as props keyed by their object keys.
 * @returns {Object} The wrapped component at 'component' and the created container at 'container'. The
 * latter is null if mocking and only needed for tests
 */
export const componentAndContainer = ({apolloContainers}, component) => {
  let _component, container;
  if (!process.env.USE_MOCKS) {
    container = props => {
      return adopt(apolloContainers())(props)
    };
    _component = (props) => {
      return apolloContainerComponent(container, component)(props);
    };
    _component.displayName = `ContainerOf${component.displayName || component.name}`
  } else {
    _component = component
  }
  return {component: _component, container}
}

/**
 * Checks to see if the query/cache result at authenticationQueryPath is null. If null,
 * onData is returned to indicate the user is not authenticated and we should skip other Apollo request
 * chocks and render onData.
 * TODO it might be prudent to define something other than onData for components that want to
 * call a different function when not authenticated. But normally this is handled by a router in onData
 * @param authenticationQueryPath
 * @returns {function({onError: *, onLoading: *, onData: *}, *, *=): *}
 */
export const bypassToDataIfUnauthenticated = authenticationQueryPath => (
  {
    onError,
    onLoading,
    onData
  }, propConfig, props) => {
  return R.ifElse(
    props => {
      return strPathOr(false, authenticationQueryPath, props);
    },
    () => null,
    () => {
      return onData;
    }
  )(props);
};


/**
 * Filter for just the query containers of the given apolloContainersLogout
 * @param {Object} apolloContainers Keyed by request name and valued by apollo request container.
 * Only those beginning with 'query' are considered
 * @return {*}
 */
export const filterForQueryContainers = apolloContainers => {
  return filterWithKeys(
    (_, key) => {
      return R.includes('query', key);
    },
    apolloContainers
  );
};

export const filterForMutationContainers = (apolloContainers) => {
  return filterWithKeys(
    (_, key) => {
      return R.includes('mutat', key);
    },
    apolloContainers
  );
}
/***
 * Filter for just the mutation containers of the given apolloContainersLogout
 * @param {Object} apolloContainers Keyed by request name and valued by apollo request container.
 * Only those beginning with 'mutat' are considered
 * @return {[Task]} List of mutation tasks
 */
export const filterForMutationContainersWithQueriesRunFirst = apolloContainers => {
  const queryContainers = filterForQueryContainers(apolloContainers)
  const mutationContainers = filterForMutationContainers(apolloContainers);
  return R.map(
    (mutationContainer) => {
      // Run all the queries before each mutation if queries exist in case the mutation needs the query results
      return R.length(R.keys(queryContainers)) ? props => {
        return composeWithChain([
          props => {
            return mutationContainer(props)
          },
          // Run all the queries in their original order, assigning the results to their key
          ...R.reverse(mapObjToValues(
            (queryContainer, key) => {
              return mapToNamedResponseAndInputs(key, queryContainer)
            },
            queryContainers
          ))
        ])(props)
      } : mutationContainer
    },
    mutationContainers
  )
};

/**
 * The default propConfig for renderChoicepoint is to check that all mutations of the container are ready (not skipped
 * because supporting queries are loading) and that all queries are loaded
 * @param {Function} containers A containers function unary function that is called without an argument to get
 * the names of the mutations and queries
 * @returns {Object} A lookup from the request name to the propConfig status, ['onReady'] for mutations
 * and true for queries. See the renderChoicepoint function for more details about statuses
 */
export const mutationsReadyAndQueriesLoadedPropConfig = containers => {
  return R.mergeRight(
    R.map(() => ['onReady'], filterForMutationContainers(containers())),
    R.map(() => true, filterForQueryContainers(containers()))
  )
}
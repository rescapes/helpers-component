/**
 * Created by Andy Likuski on 2018.01.25
 * Copyright (c) 2018 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {inspect} from 'util';
import {createWaitForElement} from 'enzyme-wait';
import PropTypes from 'prop-types';
import {shallow, mount} from 'enzyme';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {mergeDeep} from 'rescape-ramda';
import * as apolloTestUtils from 'apollo-test-utils';
import ApolloClient from 'apollo-client';
import {InMemoryCache} from 'apollo-client-preset';
import {SchemaLink} from 'apollo-link-schema';
import {getClass} from './styleHelpers';
import {onError} from "apollo-link-error";
import {fromPromised} from 'folktale/concurrency/task';

const middlewares = [thunk];
// Importing this way because rollup can't find it
const mockNetworkInterfaceWithSchema = apolloTestUtils.mockNetworkInterfaceWithSchema;

/**
 * Create an initial test state based on the sampleConfig for tests to use.
 * This should only be used for sample configuration, unless store functionality is being tested
 * @param {Function} createInitialState Function to accept sampleConfig and return the initialState
 * @param {Object} sampleConfig The config to give the initialState
 * @returns {Object} The initial state
 */
export const testState = (createInitialState, sampleConfig) => createInitialState(sampleConfig);

/**
 * Creates a mock store from our sample data an our initialState function
 * @param {Object} sampleUserSettings Merges in sample local settings, like those from a browser cache
 * @param {Object} initialState The initial state
 * @param {Object} sampleConfig The config to give the initialState
 * @type {function(*, *=)}
 */
export const makeSampleStore = (initialState, sampleUserSettings = {}) =>
  makeMockStore(initialState, sampleUserSettings);

/**
 * Like test state but initializes a mock store. This will probably be unneeded
 * unless the middleware is needed, such as cycle.js
 * @param {Function} createInitialState Creates the intial state from the sampleConfig
 * @param {Object} sampleConfig object for craeteInitialState
 * @param {Object} sampleUserSettings Merges in sample local settings, like those from a browser cache
 */
export const makeSampleInitialState = (createInitialState, sampleConfig, sampleUserSettings = {}) => {
  return makeSampleStore(createInitialState(sampleConfig), sampleUserSettings).getState();
};

/**
 * Simulates complete props from a container component by combining mapStateToProps, mapDispatchToProps, and props
 * that would normally passed from the container to a component
 * @param {Function} containerPropMaker 2 arity function from a container that expects a sample state and sampleOwnProps
 * and then applies the container's mapStateToProps, mapDispatchToProps, and optional mergeProps
 * @param {Object} initialState The initialState
 * @param sampleParentProps Sample props that would normally come from the parent container
 * @returns {Object|Promise} complete test props or Promise of the props if the containerPropMaker is async
 */
export const propsFromSampleStateAndContainer = (initialState, containerPropMaker, sampleParentProps = {}) =>
  containerPropMaker(initialState, sampleParentProps);

/**
 * Makes a mock store with the given state and optional sampleUserSettings. If the sampleUserSettings
 * they are merged into the state with deepMerge, so make sure the structure matches the state
 * @param {Object} state The initial redux state
 * @param {Object} sampleUserSettings Merges in sample local settings, like those from a browser cache
 * @returns {Object} A mock redux store
 */
export const makeMockStore = (state, sampleUserSettings = {}) => {
  const mockStore = configureStore(middlewares);
  // Creates a mock store that merges the initial state with local user settings.
  return mockStore(
    mergeDeep(
      state,
      sampleUserSettings
    )
  );
};

export const mockApolloClient = (schema, context) => {
  //addMockFunctionsToSchema({schema});
  const mockNetworkInterface = mockNetworkInterfaceWithSchema({schema});

  const errorLink = onError(({graphQLErrors, response, operation}) => {
    //if (graphQLErrors) {
    //graphQLErrors.map(({message, locations, path}) =>
    //console.log(
    //  `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
    //)
    //);
    //}

  });
  const apolloCache = new InMemoryCache();
  return new ApolloClient({
    cache: apolloCache,
    link: new SchemaLink({schema, context}),
    networkInterface: mockNetworkInterface
  });
};

/**
 * Creates a mockApolloClient using makeSchema and makeSampleInitialState
 */
export const mockApolloClientWithSamples = (state, resolvedSchema) => {
  const context = {options: {dataSource: state}};
  return mockApolloClient(resolvedSchema, context);
};

/**
 * Wraps a component in a graphql client and store context for Apollo/Redux testing
 * @param state
 * @param resolvedSchema
 * @param component
 * @return {*}
 */
export const wrapWithMockGraphqlAndStore = (state, resolvedSchema, component) => {
  const store = makeSampleStore(state)
  const context = {options: {dataSource: state}};

  // shallow wrap the component, passing the Apollo client and redux store to the component and children
  // Also dive once to get passed the Apollo wrapper
  return mount(
    component,
    {
      context: {
        // Create a mock client that uses a SchemaLink. Schema and context are passed to the SchemaLink
        client: mockApolloClient(resolvedSchema, context),
        store
      },
      childContextTypes: {
        client: PropTypes.object.isRequired,
        store: PropTypes.object.isRequired
      }
    }
  );
};

/**
 * Wraps a component in a store context for Redux testing
 * @param component
 * @return {*}
 */
export const wrapWithMockStore = component => {
  const store = makeSampleStore();

  // shallow wrap the component, passing the Apollo client and redux store to the component and children
  // Also dive once to get passed the Apollo wrapper
  return mount(
    component,
    {
      context: {
        store
      },
      childContextTypes: {
        store: PropTypes.object.isRequired
      }
    }
  );
};

/**
 * Wrap a component factory with the given props in a shallow enzyme wrapper
 * @param componentFactory
 * @param props
 */
export const shallowWrap = (componentFactory, props) => {
  return shallow(
    componentFactory(props)
  );
};

/**
 * Waits for a child component with the given className to render. Useful for apollo along with Enzyme
 * 3, since Enzyme 3 doesn't keep it's wrapper synced with all DOM changes, and Apollo doesn't expose
 * any event that announces when the network status changes to 7 (loaded)
 * @param wrapper The mounted enzyme Component
 * @param componentName The component of the wrapper whose render method will render the child componentj
 * @param childClassName The child class name to search for periodically
 * @returns {Promise} A promise that returns the component matching childClassName or if an error
 * occurs return an Error with the message and dump of the props
 */
export const waitForChildComponentRender = (wrapper, componentName, childClassName) => {
  const component = wrapper.find(componentName);
  const childClassNameStr = `.${getClass(childClassName)}`;
// Wait for the MapGl component to render, which indicates that data loading completed
  const waitForSample = createWaitForElement(childClassNameStr);
  const find = component.find;
  // Override find to call update each time we poll for an update
  // Enzyme 3 doesn't stay synced with React DOM changes without update
  component.find = (...args) => {
    try {
      wrapper.update();
    }
    catch(e) {
      console.warn("Couldn't update wrapper. Assuming that render failed.")
      // If update failed because of a component error, just quit
    }
    // Find the component with the updated wrapper, otherwise we get the old component
    return find.apply(wrapper.find(componentName), args);
  };
  return waitForSample(component)
    .then(component => component.find(childClassNameStr).first())
    .catch(error => {
      const comp = wrapper.find(componentName);
      if (comp.length) {
        throw new Error(`${error.message}
        \n${error.stack}
        \n${comp.debug()}
        \n${inspect(comp.props().data, {depth: 3})}
      `
        );
      }
      else {
        throw error;
      }
    });
};

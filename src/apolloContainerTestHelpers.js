/**
 * Created by Andy Likuski on 2017.12.26
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


import {
  mockApolloClientWithSamples,
  propsFromSampleStateAndContainer, waitForChildComponentRender, wrapWithMockGraphqlAndStore
} from './componentTestHelpers';
import {getClass} from './styleHelpers';
import * as R from 'ramda';
import * as Either from 'data.either';
import {eitherToPromise} from './testHelpers';
import {PropTypes} from 'prop-types';
import {v} from 'rescape-validate';
import {resolvedSchema} from './sampleData';

/**
 * Runs tests on an apollo React container with the * given config.
 * Even if the container being tested does not have an apollo query, this can be used
 * @param {Object} config
 * @param {Object} config.container The React container to test
 * @param {String} config.componentName The name of the React component that the container wraps
 * @param {String} config.childClassDataName A class used in a React component in the named
 * component's renderData method--or any render code when apollo data is loaded
 * @param {Object} config.initialState The initial Redux state.
 *
 * @param {String} [config.childClassLoadingName] Optional. A class used in a React component in the named
 * component's renderLoading method--or any render code called when apollo loading is true. Normally
 * only needed for components with queries.
 * @param {String} [config.childClassErrorName] Optional. A class used in a React component in the named
 * component's renderError method--or any render code called when apollo error is true. Normally only
 * needed for components with queries.
 * @param {Function} [config.samplePropsMaker] Optional A function defined in the container being tested that is
 * either created with makeApolloTestPropsFunction or makeTestPropsFunction, the former
 * if the container has an Apollo query and the latter if it doesn't. This function
 * and the result of asyncParentProps is passed propsFromSampleStateAndContainer, which
 * ultimately generates the test props. If this is omitted parentProps from asyncParentProps will be used directly
 * @param {Function} [config.asyncParentProps] A function with no arguments that returns a Promise
 * of the parentProps used to call propsFromSampleStateAndContainer. Required if the container component receives
 * props from its parent (it usually does)
 * @param {Object} [config.query] Optional gql wrapped query string if the Container has an apollo query.
 * The query should be the same as that used by the container
 * @param {Function} [config.queryVariables] Optional Unary function expecting props and return an object of query arguments
 * for the given query. Example:
 * props => ({
    regionId: props.data.region.id
  });
 * @param {Function} [config.errorMaker] Optional unary function that expects the results of the
 * parentProps and mutates something used by the queryVariables to make the query fail. This
 * is for testing the renderError part of the component. Only containers with queries should have an expected error state
 */
export const apolloContainerTests = v((config) => {

    const {
      Container,
      componentName,
      childClassDataName,
      // Optional, the class name if the component has an Apollo-based loading state
      childClassLoadingName,
      // Optional, the class name if the component has an Apollo-based error state
      childClassErrorName,
      // Optional, if not specified then no container props are needed
      samplePropsMaker,
      // Optional, must be a function that returns parent props as a Promise
      asyncParentProps,
      // Optional, required if there are asyncParentProps
      initialState,
      // Optional. Only for components with queries
      schema,
      // Optional. Only for components with queries
      query,
      // Optional. Only for components with queries
      queryVariables,
      // Optional. Only for components with queries
      errorMaker
    } = config;

    const asyncParentPropsOrDefault = asyncParentProps ? asyncParentProps() : Promise.resolve({});

    // Get the test props for this container
    const asyncProps = () => {
      if (!asyncParentProps) {
        return Promise.resolve({});
      }
      const promise = asyncParentProps();
      if (!R.is(Promise)) {
        throw Error("Result of asyncParentProps must be a Promise");
      }
      promise.then(parentProps => {
        const result = samplePropsMaker ? propsFromSampleStateAndContainer(initialState, samplePropsMaker, parentProps) : parentProps;
        // If result is a promise, the promised value will be a Right
        // If the result is not a promise, wrap in a Right to match
        return R.unless(
          R.is(Promise),
          res => Either.Right(res)
        )(result);
      }).then(eitherToPromise);
    };


    /***
     * Tests that mapStateToProps matches snapshot
     * @return {Promise<void>}
     */
    const testMapStateToProps = async () => {
      // Get the test props for RegionContainer
      const props = await asyncParentPropsOrDefault
      expect(props).toMatchSnapshot();
    };

    /**
     * For Apollo Containers with queries, tests that the query results match the snapshot
     * @return {Promise<void>}
     */
    const testQuery = async () => {
      if (!query || !queryVariables) {
        console.warn("Attempt to run testQuery when query or queryVariables was not specified. Does your component actually need this test?");
        return;
      }

      const parentProps = await asyncParentPropsOrDefault;
      const props = await propsFromSampleStateAndContainer(initialState, samplePropsMaker, parentProps).then(eitherToPromise);
      const data = await mockApolloClientWithSamples(initialState, schema).query({
        query,
        variables: queryVariables(props),
        context: {
          dataSource: initialState
        }
      }).then(data => {
        if (data.error)
          throw data.error;
        return data;
      });
      expect(data).toMatchSnapshot();
    };

    /**
     * Tests that the correct child class renders and that the child component props match the snapshot
     * @param done
     * @return {Promise<void>}
     */
    const testRender = async (done) => {
      // Wait for the sample parent props that feed this component
      const parentProps = await asyncParentPropsOrDefault;
      // Wrap the component in mock Apollo and Redux providers.
      // If the component doesn't use Apollo it just means that it will render its children synchronously,
      // rather than asynchronously
      const wrapper = wrapWithMockGraphqlAndStore(initialState, resolvedSchema, Container(parentProps));
      // Find the top-level component. This is always rendered in any Apollo status (loading, error, store data)
      const component = wrapper.find(componentName);
      // Make sure the component props are consistent since the last test run
      expect(component.props()).toMatchSnapshot();

      // If we have an Apollo component, our immediate status after mounting the component is loading. Confirm
      if (childClassLoadingName) {
        expect(component.find(`.${getClass(childClassLoadingName)}`).length).toEqual(1);
      }

      // If we have an Apollo component, we use enzyme-wait to await the query to run and the the child
      // component that is dependent on the query result to render. If we don't have an Apollo component,
      // this child will be rendered immediately without delay
      waitForChildComponentRender(wrapper, componentName, childClassDataName).then(
        childComponent => {
          expect(childComponent.props()).toMatchSnapshot();
          done();
        }
      ).catch(e => {
        // If we don't find it a timeout error or other error occurred.
        throw e;
      });
    };

    /**
     * For components with an error state, tests that the error component renders
     * @param done
     * @return {Promise<void>}
     */
    const testRenderError = async (done) => {
      if (!errorMaker || !childClassErrorName) {
        logger.warn("One or both of errorMaker and childClassErrorName not specified, does your component actually need to test render errors?");
        return;
      }
      const parentProps = await asyncParentPropsOrDefault.then(errorMaker);
      const wrapper = wrapWithMockGraphqlAndStore(initialState, resolvedSchema, Container(parentProps));
      const component = wrapper.find(componentName);
      expect(component.find(`.${getClass(childClassLoadingName)}`).length).toEqual(1);
      expect(component.props()).toMatchSnapshot();
      waitForChildComponentRender(wrapper, componentName, childClassErrorName).then(() => done());
    };

    return {
      testMapStateToProps,
      testQuery,
      testRenderError,
      testRender
    };
  },
  [
    ['config', PropTypes.shape({
        initialState: PropTypes.shape().isRequired,
        Container: PropTypes.func.isRequired,
        componentName: PropTypes.string.isRequired,
        childClassDataName: PropTypes.string.isRequired,
        childClassLoadingName: PropTypes.string,
        childClassErrorName: PropTypes.string,
        samplePropsMaker: PropTypes.func,
        schema: PropTypes.shape(),
        asyncParentProps: PropTypes.func,
        query: PropTypes.shape(),
        queryVariables: PropTypes.func,
        errorMaker: PropTypes.func
      }
    )]
  ], 'apolloContainerTests');

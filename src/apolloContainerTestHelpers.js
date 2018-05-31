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
  mockApolloClientWithSamples, waitForChildComponentRender, wrapWithMockGraphqlAndStore
} from './componentTestHelpers';
import {getClass} from './styleHelpers';
import {PropTypes} from 'prop-types';
import {v} from 'rescape-validate';
import {of} from 'folktale/concurrency/task';
import {defaultRunConfig, promiseToTask} from 'rescape-ramda';

/**
 * Runs tests on an apollo React container with the * given config.
 * Even if the container being tested does not have an apollo query, this can be used
 * @param {Object} config
 * @param {Object} config.container The React container to test
 * @param {String} config.componentName The name of the React component that the container wraps
 * @param {String} config.childClassDataName A class used in a React component in the named
 * component's renderData method--or any render code when apollo data is loaded
 * @param {Object} config.schema An graphql schema that resolves queries to sample values. These values should be
 * based on the Redux initial state or something similar
 * @param {Object} config.initialState The initial Redux state.
 *
 * @param {String} [config.childClassLoadingName] Optional. A class used in a React component in the named
 * component's renderLoading method--or any render code called when apollo loading is true. Normally
 * only needed for components with queries.
 * @param {String} [config.childClassErrorName] Optional. A class used in a React component in the named
 * component's renderError method--or any render code called when apollo error is true. Normally only
 * needed for components with queries.
 * @param {Function} [config.chainedSamplePropsTask] A Task that resolves to all properties needed by the container.
 * This can be done with constants, or as the name suggests by chaining all ancestor Components/Container props,
 * where the ancestor Container props might be Apollo based.
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
      // Required. The resolved schema used by Apollo to resolve data. This should be based on the Redux initial state or something similar
      schema,
      // Optional, the class name if the component has an Apollo-based loading state
      childClassLoadingName,
      // Optional, the class name if the component has an Apollo-based error state
      childClassErrorName,
      // Optional, A Task that resolves props all the way up the hierarchy chain, ending with props for this
      // Container based on the ancestor Containers/Components
      chainedSamplePropsTask = of({}),
      // Optional, required if there are chainedSamplePropsTask
      initialState,
      // Optional. Only for components with queries
      query,
      // Optional. Only for components with queries
      queryVariables,
      // Optional. Only for components with queries
      errorMaker
    } = config;

    // Resolve the Either to the Right value or throw if Left
    const samplePropsTask = chainedSamplePropsTask.chain(either =>
      either
        .map(props => of(props))
        .leftMap(error => {
          throw error;
        })
    );
    /***
     * Tests that mapStateToProps matches snapshot
     * @return {Promise<void>}
     */
    const testMapStateToProps = done => {
      // Get the test props for RegionContainer
      samplePropsTask.run().listen(
        defaultRunConfig({
          onResolved: props => {
            expect(props).toMatchSnapshot();
            done();
          }
        })
      );
    };

    /**
     * For Apollo Containers with queries, tests that the query results match the snapshot
     * @return {Promise<void>}
     */
    const testQuery = done => {
      if (!query || !queryVariables) {
        console.warn("Attempt to run testQuery when query or queryVariables was not specified. Does your component actually need this test?");
        return;
      }

      samplePropsTask.chain(props => {
        return promiseToTask(mockApolloClientWithSamples(initialState, schema).query({
          query,
          // queryVariables are called with props to give us the variables for our query. This is just like Apollo
          // does, accepting props to allow the Container to form the variables for the query
          variables: queryVariables(props),
          // Our context is initialState as our dataSource. In real environments Apollo would go to a remote server
          // to fetch the data, but here our database is simply the initialState for testing purposes
          context: {
            dataSource: initialState
          }
        }));
      }).run().listen(
        defaultRunConfig({
          onResolved: data => {
            // If we resolve the task, make sure there is no data.error
            if (data.error)
              throw data.error;
            expect(data).toMatchSnapshot();
            done();
          }
        })
      );
    };

    /**
     * Tests that the correct child class renders and that the child component props match the snapshot
     * @param done
     * @return {Promise<void>}
     */
    const testRender = done => {
      chainedSamplePropsTask.chain(props => {
        // Wrap the component in mock Apollo and Redux providers.
        // If the component doesn't use Apollo it just means that it will render its children synchronously,
        // rather than asynchronously
        const wrapper = wrapWithMockGraphqlAndStore(initialState, schema, Container(props));
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
        return promiseToTask(waitForChildComponentRender(wrapper, componentName, childClassDataName));
      }).run().listen(
        defaultRunConfig({
          onResolved: childComponent => {
            expect(childComponent.props()).toMatchSnapshot();
            done();
          }
        })
      );
    };

    /**
     * For components with an error state, tests that the error component renders
     * @param done
     * @return {Promise<void>}
     */
    const testRenderError = (done) => {
      if (!errorMaker || !childClassErrorName) {
        logger.warn("One or both of errorMaker and childClassErrorName not specified, does your component actually need to test render errors?");
        return;
      }
      chainedSamplePropsTask.map(errorMaker).chain(props => {
        const wrapper = wrapWithMockGraphqlAndStore(initialState, schema, Container(props));
        const component = wrapper.find(componentName);
        expect(component.find(`.${getClass(childClassLoadingName)}`).length).toEqual(1);
        expect(component.props()).toMatchSnapshot();
        return promiseToTask(waitForChildComponentRender(wrapper, componentName, childClassErrorName));
      }).run().listen(
        defaultRunConfig({
          onResolved: () => {
            // As long as we rendered the error component we're done
            done();
          }
        })
      );
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
        schema: PropTypes.shape().isRequired,
        childClassLoadingName: PropTypes.string,
        childClassErrorName: PropTypes.string,
        samplePropsMaker: PropTypes.func,
        asyncParentProps: PropTypes.func,
        query: PropTypes.shape(),
        queryVariables: PropTypes.func,
        errorMaker: PropTypes.func
      }
    )]
  ], 'apolloContainerTests');


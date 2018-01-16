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
  eitherToPromise, makeSampleInitialState, mockApolloClientWithSamples,
  propsFromSampleStateAndContainer, waitForChildComponentRender, wrapWithMockGraphqlAndStore
} from 'helpers/testHelpers';
import {getClass} from 'helpers/styleHelpers';
import * as R from 'ramda';
import * as Either from 'data.either';
import {theme} from 'styles/styles';
import {Provider as provider} from 'rebass';
import {eMap} from 'helpers/componentHelpers';
const [Provider] = eMap([provider])

/**
 * Runs tests on an apollo React container with the * given config.
 * Even if the container being tested does not have an apollo query, this can be used
 * @param {Object} config
 * @param {Object} config.container The React container to test
 * @param {String} config.componentName The name of the React component that the container wraps
 * @param {String} config.childClassDataName A class used in a React component in the named
 * component's renderData method--or any render code when apollo data is loaded
 * @param {Sting} config.childClassLoadingName A class used in a React component in the named
 * component's renderLoading method--or any render code called when apollo loading is true
 * @param {Sting} config.childClassErrorName A class used in a React component in the named
 * component's renderError method--or any render code called when apollo error is true
 * @param {Function} config.testPropsMaker A function defined in the conatiner being tested that is
 * either created with makeApolloTestPropsFunction or makeTestPropsFunction, the former
 * if the container has an Apollo query and the latter if it doesn't. This function
 * and the result of asyncParentProps is passed propsFromSampleStateAndContainer, which
 * ultimately generates the test props
 * @param {Function} config.asyncParentProps A function with no arguments that returns a Promise
 * of the parentProps used to call propsFromSampleStateAndContainer
 * @param {Object} [config.query] Optional gql wrapped query string if the Container has an apollo query.
 * The query should be the same as that used by the container
 * @param {Function} [config.queryVariables] Optional Unary function expecting props and return an object of query arguments
 * for the given query. Example:
 * props => ({
    regionId: props.data.region.id
  });
 * @param {Function} [config.errorMaker] Optional unary function that expects the results of the
 * parentProps and mutates something used by the queryVariables to make the query fail. This
 * is for testing the renderError part of the component
 */
export const apolloContainerTests = (config) => {

    const {
      Container,
      componentName,
      childClassDataName,
      // Optional, the class name if the component has an Apollo-based loading state
      childClassLoadingName,
      // Optional, the class name if the component has an Apollo-based error state
      childClassErrorName,
      // Optional, if not specified then no container props are needed
      testPropsMaker,
      // Optional, must return parent props as a Promise
      asyncParentProps,

      // Optional. Only for components with queries
      query,
      // Optional. Only for components with queries
      queryVariables,
      // Optional. Only for components with queries
      errorMaker
    } = config;

    // Get the test props for this container
    const asyncProps = () =>
      asyncParentProps ?
        asyncParentProps()
          .then(parentProps => {
            const result = testPropsMaker ? propsFromSampleStateAndContainer(testPropsMaker, parentProps) : parentProps;
            return R.unless(
              R.is(Promise),
              res => Promise.resolve(Either.Right(res))
            )(result);
          })
          .then(eitherToPromise) :
        Promise.resolve({});

    const asyncParentPropsOrDefault = asyncParentProps ? asyncParentProps() : Promise.resolve({});

    test('mapStateToProps', async () => {
      // Get the test props for RegionContainer
      const props = await asyncProps();
      expect(props).toMatchSnapshot();
    });

    if (query) {
      test('query', async () => {
        const parentProps = await asyncParentPropsOrDefault;
        const props = await propsFromSampleStateAndContainer(testPropsMaker, parentProps).then(eitherToPromise);
        const data = await mockApolloClientWithSamples().query({
          query,
          variables: queryVariables(props),
          context: {
            dataSource: makeSampleInitialState()
          }
        });
        expect(data).toMatchSnapshot();
      });
    }

    test('render', async (done) => {
      // Wait for the sample parent props that feed this component
      const parentProps = await asyncParentPropsOrDefault;
      // Wrap the component in mock Apollo and Redux providers.
      // If the compoent doesn't use Apollo it just means that it will render its children synchronously,
      // rather than asynchronously
      const wrapper = wrapWithMockGraphqlAndStore(Provider({theme}, Container(parentProps)));
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
        // If we don't find it a timeout error or other error occured.
        throw e;
        done();
      });
    });

    if (errorMaker) {
      test('renderError', async (done) => {
        const parentProps = await asyncParentPropsOrDefault.then(errorMaker);
        const wrapper = wrapWithMockGraphqlAndStore(Container(parentProps));
        const component = wrapper.find(componentName);
        expect(component.find(`.${getClass(childClassLoadingName)}`).length).toEqual(1);
        expect(component.props()).toMatchSnapshot();
        waitForChildComponentRender(wrapper, componentName, childClassErrorName, done);
      });
    }
  }
;

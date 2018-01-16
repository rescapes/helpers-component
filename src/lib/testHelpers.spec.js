/**
 * Created by Andy Likuski on 2017.06.19
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {gql} from 'apollo-client-preset';
import {graphql} from 'react-apollo';
import {connect} from 'react-redux';
import {expectTask, testState, makeSampleInitialState, propsFromSampleStateAndContainer, wrapWithMockGraphqlAndStore} from './testHelpers';
import Task from 'data.task';
import * as R from 'ramda';
import {makeMockStore} from './testHelpers';
import {sampleConfig} from 'data/samples/sampleConfig';
import {eMap} from 'helpers/componentHelpers';
const [div] = eMap(['div']);
import React from 'react';
import * as Either from 'data.either';
import {eitherToPromise} from 'helpers/testHelpers';

describe('jestHelpers', () => {
  test('expectTask', () => {
    expectTask(new Task((reject, resolve) => resolve('apple'))).resolves.toEqual('apple');
    expectTask(new Task((reject, resolve) => {
      throw new Error('snapple');
    })).rejects.toEqual(new Error('snapple'));
  });

  test('testState', () =>
    expect(testState()).toMatchSnapshot()
  );

  test('propsFromSampleStateAndContainer', () => {
    const initialState = makeSampleInitialState();

    // propsFromSampleStateAndContainer should take a function that merges processes
    // state and ownProps based on a container's
    // mapStateToProps, mapDispatchToProps, and mergeProps.
    // This function alweays uses makeSampleInitialState as the state and accepts
    // sample ownProps from the test
    expect(propsFromSampleStateAndContainer(
      // Simply merge a fake dispatch result with the sampleOwnProps
      (sampleInitialState, sampleOwnProps) => R.mergeAll([sampleInitialState, {someAction: R.identity}, sampleOwnProps]),
      // our sample ownProps
      {sample: 'own props'}))
      .toEqual(
        R.mergeAll([
          {someAction: R.identity},
          initialState,
          {sample: 'own props'}
        ])
      );
  });

  test('makeMockStore', () => {
    expect(makeMockStore(sampleConfig).getState()).toEqual(sampleConfig);
  });

  test('wrapWithMockGraphqlAndStore', () => {
    const parentProps = {};
    const query = gql`
        query region {
            store {
                regions {
                    id
                    name
                }
            }
        }
    `;

    class Component extends React.Component {
      render() {
        return div();
      }
    }

    // Wrap the component in apollo
    const ContainerWithData = graphql(query)(Component);
    // Wrap the component in redux
    const Container = connect(
      (state, props) => ({someProp: 1})
    )(ContainerWithData);
    // Create a factory for container
    const [container] = eMap([Container]);
    // Instantiate
    const wrapper = wrapWithMockGraphqlAndStore(container(parentProps));
    // Expect the apollo data prop, the redux dispatch, and the someProp we added
    expect(R.keys(wrapper.props()).sort()).toEqual(['data', 'dispatch', 'someProp'])
  });

  test('eitherToPromise', () => {
    expect(eitherToPromise(Either.Right(1))).resolves.toBe(1)
    expect(eitherToPromise(Either.Left(1))).rejects.toBe(1)
  })
});


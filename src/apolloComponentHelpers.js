/**
 * Created by Andy Likuski on 2018.11.27
 * Copyright (c) 2018 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import * as R from 'ramda';
import gql from 'graphql-tag';
import {Mutation, Query} from '@apollo/react-components';
import React from 'react';
import {chainObjToValues, mapObjToValues} from 'rescape-ramda';

const e = React.createElement;

/**
 * Composes all requests/mutations in queryDefinitions.
 * @param {Object} queryDefinitions Object keyed by name and valued by an object containing a query and args.
 * @param {String} queryDefinitions.query The query/mutation string. Not gql wrapped yet
 * @param {Object} queryDefinitions.args Arguments for the query as per the graphql() function
 * @param {Object|Function} queryDefinitions.args.options Query options like errorPolicy: 'all'. Can also be a function
 * to set create query variables. Example:
 * options: ({data: {region}}) => ({
        variables: {
          regionId: region.id
        },
        // Pass through error so we can handle it in the component
        errorPolicy: 'all'
      }),
 * @param {Object|Function} queryDefinitions.args.prop Prop function that merge the Apollo data object with ownProps. Example:
 props: ({data, ownProps}) => {
        return mergeDeep(
          ownProps,
          {data}
        )
      }
 */
export const composeGraphqlQueryDefinitions = R.curry((queryDefinitions, component) => {
  return R.reduce(
    // Use reduce to compose component query/mutation wrapper.
    // The first component query/mutation wrapper is passed the component.
    // That result is passed to the subsequent component, and so on
    (composedComponent, {requestType, requestKey, requestDefinition}) => {
      const query = R.prop('query', requestDefinition);
      const props = R.prop('args', requestDefinition);
      // Construct the graphql component based on the requestDefinition.query and requestDefinition.args
      const QueryOrMutation = R.cond([
        [t => R.equals('query', t), () => Query],
        [t => R.equals('mutation', t), () => Mutation],
        [R.T, t => {
          throw new Error(`String isn't a valid query or mutation ${t}`);
        }]
      ])(requestType);
      return e(
        QueryOrMutation,
        R.merge(
          {
            query: gql`${query}`,
            // Default the display name to requestKey if it's not set explicitly in the props
            displayName: requestKey
          },
          props
        ),
        composedComponent
      );
    },
    component,
    // Creates a flat list [{requestType: 'query'|'mutation', requestKey: key id for request, requestDefinition: {...}}}
    chainObjToValues((obj, requestType) => {
        return mapObjToValues((requestDefinition, requestKey) => {
            return ({requestType, requestKey, requestDefinition});
          },
          obj);
      },
      queryDefinitions
    )
  );
});
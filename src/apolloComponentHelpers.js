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
import {graphql} from 'react-apollo';
import gql from 'graphql-tag';

/**
 * Composes all queries/mutations in queryDefinitions.
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
export const composeGraphqlQueryDefinitions = queryDefinitions => component => {
  return R.reduce(
    // Use reduce to compose the queries
    (prev, [queryKey, queryDefinition]) => graphql(gql`${R.prop('query', queryDefinition)}`, R.prop('args', queryDefinition))(prev),
    component,
    R.toPairs(queryDefinitions)
  )
};
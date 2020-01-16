import {composeGraphqlQueryDefinitions} from './apolloComponentHelpers';
import {Component} from 'react';

/**
 * Query
 * Prerequisites:
 *   A Region
 * Resolves:
 *  The geojson of the Region
 * Without prerequisites:
 *  Skip render
 */

const geojsonQuery = `
    query geojson($regionId: String!) {
          region(id: $regionId) {
              id
              geojson {
                  osm {
                      features {
                          id
                          type
                          geometry {
                              type
                              coordinates
                          }
                          properties
                      }
                  }
                  sankey {
                    graph {
                        nodes {
                            siteName
                            location
                            coordinates
                            junctionStage
                            annualTonnage
                            index
                            material
                            isGeneralized
                            type
                            geometry {
                              type
                              coordinates
                            }
                            name
                            value
                        }
                        links {
                          source 
                          target 
                          value
                        }
                    }
                    stages {
                      key
                      name
                      target
                    }
                    stageKey
                    valueKey
                  }
              }
        }
    }
`;

/**
 * Mutates the selected filterNodeCategories by passing the category and value that have changed
 * @type {string}
 */
const filterSankeyNodesMutation = `
    mutation filterSankeyNodesMutation($filterNodeCategory: String!, $filterNodeValue: Boolean!) {
        filterSankeyNodesMutation(filterNodeCategory: $filterNodeCategory, filterNodeValue: $filterNodeValue) {
          material
        }
    }
`;

const onViewportChangeMutation = `
  mutation onViewportChange() {
  }
`;

/**
 * All queries used by the container
 */
export const queries = {
  /**
   * Expects a region with an id and resolves geojson of the region
   */
  queryGeojon: {
    query: geojsonQuery,
    args: {
      options: ({data: {region}}) => ({
        variables: {
          regionId: region.id
        },
        errorPolicy: 'all'
      }),
      props: ({data, ownProps}) => {
        let filteredData = data;
        if (data.store) {
          // Who is the user of the region
          const userRegion = R.find(R.eqProps('id', ownProps.data.region), ownProps.data.user.regions);
          // Get all selected categories that are marked true
          const selectedSankeyNodeCategories =
            R.filter(
              R.identity,
              R.defaultTo({}, R.view(R.lensPath(['geojson', 'sankey', 'selected']), userRegion)));

          // If there are any selected categories, set them deep down in the sankey data
          filteredData = R.length(selectedSankeyNodeCategories) ?
            R.over(
              R.lensPath(['region', 'geojson', 'sankey', 'graph', 'nodes']),
              nodes => R.map(node => R.merge(
                node,
                {
                  isVisible: R.or(
                    // Not there
                    R.compose(R.isNil, R.prop(node.material))(selectedSankeyNodeCategories),
                    // There and true
                    R.contains(node.material, R.keys(selectedSankeyNodeCategories))
                  )
                }
              ), nodes || []),
              data
            ) : data;
        }
        // Merge the work we did with the rest of the props
        return mergeDeep(
          ownProps,
          {data: filteredData}
        );
      }
    }
  },
  filterSankeyNodesMutation: {
    query: filterSankeyNodesMutation,
    args: {
      options: {
        errorPolicy: 'all'
      },
      props: ({mutate}) => ({
        onSankeyFilterChange:
          (filterNodeCategory, filterNodeValue) => mutate({variables: {filterNodeCategory, filterNodeValue}})
      })
    }
  }
};

class SomeComponent extends Component {
  render() {
    return null;
  }
}

describe('apolloComponentHelpers', () => {

  test('composeGraphqlQueryDefinitions', () => {
    const ContainerWithData = composeGraphqlQueryDefinitions(queries)(SomeComponent);
    // Testing this requires running data through the Container, connecting to a graphql schema etc.
    expect(ContainerWithData).toBeTruthy()
  })
});

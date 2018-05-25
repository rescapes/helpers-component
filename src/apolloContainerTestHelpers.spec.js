import {apolloContainerTests} from './apolloContainerTestHelpers';
import {gql} from 'apollo-client-preset';
import * as R from 'ramda';
import {connect} from 'react-redux';
import {graphql} from 'react-apollo';
import {
  eMap, makeApolloTestPropsFunction, renderChoicepoint, renderErrorDefault,
  renderLoadingDefault
} from 'componentHelpers';
import {Component} from 'react';
import {resolvedSchema, sampleConfig} from 'sampleData';

const schema = resolvedSchema;
const [div] = eMap(['div']);

class App extends Component {
  render() {
    return App.choicepoint(R.merge(this.props, {views: {'error': {}, 'loading': {}, 'success': {}}}));
  }
}

App.choicepoint = renderChoicepoint(
  renderErrorDefault('error'),
  renderLoadingDefault('loading'),
  () => {
    return div({className: 'success'});
  }
);
App.views = {
  error: {
    className: 'error'
  },
  loading: {
    className: 'loading'
  },
  success: {}
};

// Run this apollo query
const query = `query regionRegions($regionId: String!) {
    store {
        region(id: $regionId) {
            id
        }
    }
}`;
const queries = {
  regionRegions: {
    query,
    args: {
      options: ({data: {region}}) => ({
        variables: {
          regionId: region.id
        },
        // Pass through error so we can handle it in the component
        errorPolicy: 'all'
      }),
      props: ({data, ownProps}) => R.merge(
        ownProps,
        {data}
      )
    }
  }
};

const ContainerWithData = graphql(
  gql`${queries.regionRegions.query}`,
  queries.regionRegions.args
)(App);

// ownProps will override with bad id for testing error
const mapStateToProps = (state, ownProps) => R.merge({data: {region: {id: 'oakland'}}}, ownProps);
const mapDispatchToProps = () => ({});
const ContainerClass = connect(mapStateToProps, mapDispatchToProps, R.merge)(ContainerWithData);
const [Container] = eMap([ContainerClass]);

// Find this React component
const componentName = 'App';
// Find this class in the data renderer
const childClassDataName = 'success';
// Find this class in the loading renderer
const childClassLoadingName = 'loading';
// Find this class in the error renderer
const childClassErrorName = 'error';


// Use these query variables
const queryVariables = props => ({
  regionId: props.data.region.id
});
const errorMaker = parentProps => R.set(R.lensPath(['data', 'region', 'id']), 'foo', parentProps);

const samplePropsMaker = makeApolloTestPropsFunction(
  schema,
  sampleConfig,
  mapStateToProps,
  mapDispatchToProps,
  queries.regionRegions
);

describe('ApolloContainer', () => {
  // Just check argument validation
  const {testMapStateToProps, testQuery, testRenderError, testRender} = apolloContainerTests({
    initialState: sampleConfig,
    schema,
    Container,
    samplePropsMaker,
    componentName,
    childClassDataName,
    childClassErrorName,
    childClassLoadingName,
    query: gql`${query}`,
    queryVariables,
    errorMaker
  });
  test('testMapStateToProps', testMapStateToProps);
  test('testQuery', testQuery);
  test('testRender', testRender);
  test('testRenderError', testRenderError);

});

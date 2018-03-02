import {apolloContainerTests} from './apolloContainerTestHelpers';

const schema = {}

// Test this container
const Container = () => {};
// Find this React component
const componentName = 'TestComponent';
// Find this class in the data renderer
const childClassDataName = 'class name';

describe('ApolloContainer', () => {
    // Just check argument validation
    apolloContainerTests({
      initialState: {},
      schema,
      Container,
      componentName,
      childClassDataName,
      validateOnly: true
    });
    test('All good', () => {})
})

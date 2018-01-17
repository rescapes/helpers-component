import {apolloContainerTests} from 'src/lib/apolloContainerTestHelpers';
import {loadSpreadsheet} from 'src/lib/authHelpers';
import {
  applyIfFunction,
  applyToIfFunction, composeViews, composeViewsFromStruct,
  eMap, itemizeProps, joinComponents, keyWith, liftAndExtract, liftAndExtractItems, loadingCompleteStatus,
  makeApolloTestPropsFunction,
  makeTestPropsFunction,
  mergeActionsForViews,
  mergePropsForViews,
  mergeStylesIntoViews,
  nameLookup,
  propLensEqual, propsAndStyle, propsFor,
  propsForItem, propsForSansClass,
  renderChoicepoint, renderErrorDefault, renderLoadingDefault
} from 'src/lib/componentHelpers';
import {concatFeatures, featureByType, geojsonByType} from 'src/lib/geojsonHelpers';
import {calculateDistance} from 'src/lib/geospatialHelpers';
import {copy, fromImmutable, toImmutable, toImmutableKeyedByProp, toJS} from 'src/lib/immutableHelpers';
import {
  nodeToFeature, projectBoundingBox, sankeyGenerator, sankeyGeospatialTranslate, translateNodeFeature,
  unprojectNode
} from 'src/lib/sankeyHelpers';
import {
  applyStyleFunctionOrDefault,
  createScaledPropertyGetter, getClass, getClassAndStyle, getStyleObj, styleArithmetic,
  styleMultiplier
} from 'src/lib/styleHelpers';
import {resolveFeatureFromExtent, resolveSvgPoints, resolveSvgReact} from 'src/lib/svgHelpers';
import {
  asyncPropsFromSampleStateAndContainer, eitherToPromise,
  expectTask, expectTaskRejected, makeMockStore, makeSampleInitialState, makeSampleStore, mockApolloClient,
  mockApolloClientWithSamples,
  propsFromSampleStateAndContainer, shallowWrap,
  testState, waitForChildComponentRender, wrapWithMockGraphqlAndStore, wrapWithMockStore
} from 'src/lib/testHelpers';
import {toTimeString} from 'src/lib/timeHelpers';
import {
  applyDefaultRegion, applyRegionsToUsers, firstUserLens, mapDefaultUsers,
  wrapLocationsWithFeatures
} from 'src/lib/configHelpers';
import {
  createRoute,
  createRouteId, createService, createStop, createStopId, createStopTime, createStopTimes, createTrip, createTripId,
  createTripWithStopTimesPair,
  FROM_TO_DIRECTION, orderStops, stopTimeGenerator,
  TO_FROM_DIRECTION
} from 'src/lib/dataCreationHelpers';

const dataCreationHelpers = {
  FROM_TO_DIRECTION,
  TO_FROM_DIRECTION,
  createStopId,
  createStop,
  createRouteId,
  createRoute,
  createService,
  createTripId,
  createTrip,
  createTripWithStopTimesPair,
  createStopTime,
  orderStops,
  stopTimeGenerator,
  createStopTimes
};

const dataQueryHelpers = {
  routeResolver,
  tripResolver,
};


export {
  apolloContainerTests,
  loadSpreadsheet,
  loadingCompleteStatus,
  propLensEqual,
  eMap,
  renderChoicepoint,
  mergeActionsForViews,
  mergePropsForViews,
  keyWith,
  applyToIfFunction,
  applyIfFunction,
  makeTestPropsFunction,
  makeApolloTestPropsFunction,
  liftAndExtract,
  liftAndExtractItems,
  mergeStylesIntoViews,
  propsFor,
  propsForSansClass,
  propsAndStyle,
  itemizeProps,
  propsForItem,
  nameLookup,
  composeViews,
  composeViewsFromStruct,
  joinComponents,
  renderLoadingDefault,
  renderErrorDefault,
  featureByType,
  geojsonByType,
  concatFeatures,
  calculateDistance,
  toImmutable,
  toJS,
  fromImmutable,
  toImmutableKeyedByProp,
  copy,
  sankeyGenerator,
  unprojectNode,
  sankeyGeospatialTranslate,
  projectBoundingBox,
  nodeToFeature,
  translateNodeFeature,
  getClass,
  getClassAndStyle,
  getStyleObj,
  styleArithmetic,
  styleMultiplier,
  createScaledPropertyGetter,
  applyStyleFunctionOrDefault,
  resolveSvgPoints,
  resolveSvgReact,
  resolveFeatureFromExtent,
  expectTask,
  expectTaskRejected,
  testState,
  makeSampleStore,
  makeSampleInitialState,
  propsFromSampleStateAndContainer,
  asyncPropsFromSampleStateAndContainer,
  makeMockStore,
  mockApolloClient,
  mockApolloClientWithSamples,
  wrapWithMockGraphqlAndStore,
  wrapWithMockStore,
  shallowWrap,
  eitherToPromise,
  waitForChildComponentRender,
  toTimeString,
  applyDefaultRegion,
  mapDefaultUsers,
  applyRegionsToUsers,
  wrapLocationsWithFeatures,
  firstUserLens,
  dataCreationHelpers,
  dataQueryHelpers
};


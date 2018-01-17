import {apolloContainerTests} from 'src/apolloContainerTestHelpers';
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
} from 'src/componentHelpers';
import {concatFeatures, featureByType, geojsonByType} from 'src/geojsonHelpers';
import {calculateDistance} from 'src/geospatialHelpers';
import {copy, fromImmutable, toImmutable, toImmutableKeyedByProp, toJS} from 'src/immutableHelpers';
import {
  nodeToFeature, projectBoundingBox, sankeyGenerator, sankeyGeospatialTranslate, translateNodeFeature,
  unprojectNode
} from 'src/sankeyHelpers';
import {
  applyStyleFunctionOrDefault,
  createScaledPropertyGetter, getClass, getClassAndStyle, getStyleObj, styleArithmetic,
  styleMultiplier
} from 'src/styleHelpers';
import {resolveFeatureFromExtent, resolveSvgPoints, resolveSvgReact} from 'src/svgHelpers';
import {
  asyncPropsFromSampleStateAndContainer, eitherToPromise,
  expectTask, expectTaskRejected, makeMockStore, makeSampleInitialState, makeSampleStore, mockApolloClient,
  mockApolloClientWithSamples,
  propsFromSampleStateAndContainer, shallowWrap,
  testState, waitForChildComponentRender, wrapWithMockGraphqlAndStore, wrapWithMockStore
} from 'src/testHelpers';
import {toTimeString} from 'src/timeHelpers';
import {
  applyDefaultRegion, applyRegionsToUsers, firstUserLens, mapDefaultUsers,
  wrapLocationsWithFeatures
} from 'src/configHelpers';
import {
  asUnaryMemoize, findOneValueByParams, makeInnerJoinByLensThenFilterSelector,
  mergeStateAndProps
} from 'selectorHelpers';

export {
  apolloContainerTests,
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
  mergeStateAndProps,
  makeInnerJoinByLensThenFilterSelector,
  findOneValueByParams,
  asUnaryMemoize
};


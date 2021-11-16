import {mergeAndApplyMatchingStyles} from './styleHelpers.js';

export {
  applyIfFunction,
  applyToIfFunction, composeViews, composeViewsFromStruct,
  e, eMap, itemizeProps, joinComponents, keyWith, keyWithOr, keyWithDatum, liftAndExtract, liftAndExtractItems, loadingCompleteStatus,
  apolloStatuses,
  mergeEventHandlersForViews,
  mergePropsForViews,
  mergeStylesIntoViews,
  nameLookup,
  propLensEqual, propsAndStyle, propsFor,
  propsForItem, propsForSansClass,
  renderChoicepoint, renderErrorDefault, renderLoadingDefault, makeTestPropsFunction, keysMatchingStatus,
  keyApolloResultWithOrLoadError,
  componentAndPropsFor,
  apolloContainerComponent,
  relevantKeyNotMatchingStatus,
  bypassToDataIfUnauthenticated,
  componentWithAdoptedContainer,
  componentAndContainer,
  mutationsReadyAndQueriesLoadedPropConfig,
  filterForQueryContainers,
  filterForMutationContainers,
  filterForMutationContainersWithQueriesRunFirst
} from './componentHelpers.js';

export {
  resolveSvgReact
} from './svgComponentHelpers.js';

export {
  applyStyleFunctionOrDefault,
  createScaledPropertyGetter, getClass, getClassAndStyle, getStyleObj, styleArithmetic,
  styleMultiplier,
  mergeAndApplyMatchingStyles, applyMatchingStyles
} from './styleHelpers.js';


export {mergeWithRoute, isAuthenticated, noRequestsApolloContainerComponent, renderDataBoolChoicepoint, renderLinkOrPopup} from './componentLogicHelpers.js'
export {useInput} from './hookHelpers.js';
export {checkQueryVariation} from "./queryComponentHelpers.js";
export {removeRequestProps} from "./queryComponentHelpers.js";
export {usePopupState} from "./hookHelpers.js";
export {useWindowDimensions} from "./hookHelpers.js";
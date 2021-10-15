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
  componentAndContainer
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


export {useWindowDimensions, usePopupState, mergeWithRoute, checkVariation, isAuthenticated, noRequestsApolloContainerComponent, removeRequestProps, renderDataBoolChoicepoint, renderLinkOrPopup} from './effectHelpers.js'
export {useInput} from './hookHelpers.js';
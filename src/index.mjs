import {mergeAndApplyMatchingStyles} from './styleHelpers';

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
  bypassToDataIfUnauthenticated
} from './componentHelpers';

export {
  resolveSvgReact
} from './svgComponentHelpers';

export {
  applyStyleFunctionOrDefault,
  createScaledPropertyGetter, getClass, getClassAndStyle, getStyleObj, styleArithmetic,
  styleMultiplier,
  mergeAndApplyMatchingStyles, applyMatchingStyles
} from './styleHelpers';

export {FlexAuto, Grid, Half, Logo, maxedImage, Quarter, Third, ThreeQuarters} from './atoms/atoms';
import {filterWithKeys, toArrayIfNot} from "@rescapes/ramda";
import * as R from "ramda";

/**
 * Returns a subset of the given queryNames with names as keys and true as values, based on
 * which names match props[queryPropKey]
 * @param {String} queryPropKey Prop key of props that resolves to a single query name or list
 * of names that should pass through this filter
 * @param {[String]} queryNames Query names to check
 * @param props
 * @returns {Object} Returns a subset of queryNames with names as keys and true as values, based on
 * which names match props[queryPropKey]
 */
export const checkQueryVariation = (queryPropKey, queryNames, props) => {
  // Only pass these through
  const queryPropKeyValues = toArrayIfNot(R.propOr([], queryPropKey, props));
  return R.compose(
    R.fromPairs,
    queryNames => R.map(s => [s, true], queryNames),
    queryNames => R.filter(
      queryName => {
        return R.includes(queryName, queryPropKeyValues);
      },
      queryNames
    )
  )(queryNames);
};

// TODO react-adopt seems to prefer prop keys that already exist, which clashes with our calls
// above, so don't pass any request props
export const removeRequestProps = props => filterWithKeys(
  (value, key) => {
    return !R.either(R.startsWith('mutate'), R.startsWith('query'))(key);
  },
  props
);
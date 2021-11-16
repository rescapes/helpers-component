/**
 * Created by Andy Likuski on 2020.08.18
 * Copyright (c) 2020 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import * as R from 'ramda';
import {strPathOr} from '@rescapes/ramda';
import React from 'react';
import {propsFor} from "./componentHelpers.js";

/**
 * A stub that matches an Apollo container when a container has no Apollo requests to call.
 * Normally Apollo requests are composed with react-adopt, but we can't use react-adopt if we don't
 * have any Apollo requests for a container
 * @param {Object} props Ignored, except for props.children
 * @param {Function} props.children A render function to call with no arguments. When used with
 * apolloContainerComponent, the props are passed to the component rendered by children
 * @returns {function(*, ...[*]): *}
 */
export const noRequestsApolloContainerComponent = ({children, ...props}) => {
  return children({});
};

/**
 * Puts routeProps in the routeProps key and merge with the props destined for the component of the given key
 * @param views
 * @returns {function(*=, *): *}
 */
export const mergeWithRoute = views => (key, routeProps) => {
  const propsOf = propsFor(views);
  return R.merge(propsOf(key), {routeProps});
};

/**
 * Render the data based on whether or not their is an active project or not
 * @param {String} propPath
 * @param {Object} renderFunctions
 * @param {Function} renderFunctions.onActiveProject
 * @param {Function} renderFunctions.onNoActiveProject
 * @param {Object} props The props
 * @returns {Object} The components to render based on the presence or absence of a project
 */
export const renderDataBoolChoicepoint = R.curry((propPath, {onTrue, onFalse}, props) => {
  return R.ifElse(
    props => {
      return strPathOr(false, propPath, props);
    },
    props => {
      return onTrue(props);
    },
    props => {
      return onFalse(props);
    }
  )(props);
});

// TODO Since refetchQueries doesn't work well (https://github.com/apollographql/apollo-client/issues/3633)
// just listen to the result of the mutation and redirect to the referring page or /
// Ideally we shouldn't have to redirect because the AppContainer's queries should rerun when the token goes
// is the cache, but I don't know how to get a cache write to trigger dependent queries.
export const isAuthenticated = props => {
  return !strPathOr(false, 'mutateDeleteTokenCookie.result.data.deleteTokenCookie', props) && (
    strPathOr(false, 'queryLocalTokenAuthContainer.data.token', props) ||
    strPathOr(false, 'mutateTokenAuth.result.data.tokenAuth', props));
};

/**
 * Renders a link or button to a modal or a modal depending on state hook or similar
 * @param {Function} renderPopupLink Function to return the rendered modalLink. Expects ({setModalState}, views)
 * @param {Function} renderModal Function to return the rendered modal. Expects ({setModalState}, views)
 * @param {Boolean} isPopupOpen The state of the modal
 * @param {Function} setPopupState Unary function to set the state to true or false
 * @param {Object} views views for the components that are passed to renderPopupLink and renderModal.
 * Props for a component can be retrieved with propsFor(views, viewName)
 * @returns {Object} The component
 */
export const renderLinkOrPopup = (
  {
    renderPopupLink,
    renderPopup,
    isPopupOpen,
    setPopupState
  },
  views
) => {

  return R.ifElse(
    () => isPopupOpen,
    views => renderPopup({setPopupState}, views),
    views => renderPopupLink({setPopupState}, views)
  )(views)
}
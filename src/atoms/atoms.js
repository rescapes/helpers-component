/**
 * Created by Andy Likuski on 2018.01.01
 * Copyright (c) 2018 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import * as chakra from '@chakra-ui/react';
import * as R from 'ramda';
import {reqStrPathThrowing, defaultNode} from '@rescapes/ramda';
import {composeViewsFromStruct, e, nameLookup, propsFor} from '../componentHelpers.js';

const {Box, Flex, Image, Grid} = defaultNode(chakra);

// Adapted from http://jxnblk.com/writing/posts/patterns-for-style-composition-in-react/

export const maxedImage = Image;
/*
TODO replace with chakra
styled(Image)`
  max-width: 100%;
  max-height: 100%;
`;
 */

/**
 * Creates a half-size Grid
 * @param props
 * @return {*}
 * @constructor
 */
export const Half = props =>
  e(Grid, R.merge(props, {
      width: 1 / 2
    })
  );

/**
 * Creates a third-size Grid
 * @param props
 * @return {*}
 * @constructor
 */
export const Third = props =>
  e(Grid, R.merge(props, {
      width: 1 / 3
    })
  );

/**
 * Creates a quarter-size Grid
 * @param props
 * @return {*}
 * @constructor
 */
export const Quarter = props =>
  e(Grid, R.merge(props, {
      w: 1 / 4
    })
  );

export const ThreeQuarters = props => {
  return e(Grid, R.merge(props, {
      w: 3 / 4
    })
  );
}

/**
 * Creates a flex Box with automatic sizing
 * @param props
 * @return {*}
 * @constructor
 */
export const FlexAuto = props => {
  return e(Flex,
    R.merge(
      R.omit(['className', 'style'], props),
      {
        flex: '1 1 auto'
      }
    )
  );
};

/**
 * Creates a logo component, simply a container and an image inside of it
 * @param {Object} props
 * @param {Object} props.logoSrc The URL of the logo
 * @param {Object} props.style Style object
 * @return {Object} A React component
 */
export const Logo = props => {

  const c = nameLookup({
    logo: true,
    logoImage: true
  });

  const viewProps = propsFor(
    composeViewsFromStruct({
      props: {
        [c.logo]: {},
        [c.logoImage]: {
          src: reqStrPathThrowing('logoSrc')
        }
      },

      styles: {
        [c.logo]: R.defaultTo({}, props.style),
        [c.logoImage]: {
          maxWidth: '100%',
          maxheight: '100%'
        }
      }
    }, props).views
  );

  return e(Box, viewProps(c.logo),
    e(Image, viewProps(c.logoImage))
  );
};

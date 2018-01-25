/**
 * Created by Andy Likuski on 2018.01.25
 * Copyright (c) 2018 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import * as R from 'ramda';
import {eMap} from './componentHelpers';
const [Circle, Polygon, Polyline] = eMap(['circle', 'polygon', 'polyline']);

/**
 * Inspects props.pointData to determine what type of Svg React Component to render
 * @param {Object} pointData Contains type and coordinates
 * @param {Object} pointData.type 'Point', 'LineString', or 'Polygon'
 * @param {Object} pointData.points The screen coordinates of the shape
 * @param {Object} props Props to pass to the Svg React component besides the point data (e.g. fill, stroke, strokeWidth)
 * Sensible defaults are supplied for fill, stroke, and strokeWidth if not supplied
 * @returns {Object} React component
 */
export const resolveSvgReact = ({pointData, ...props}) => {
  switch (pointData.type) {
    case 'Point':
      const [cx, cy] = R.head(pointData.points);
      return Circle({cx, cy, ...R.merge({r: '10', fill: 'white', stroke: 'black', strokeWidth: '1'}, props)});
    case 'LineString':
      return Polyline({
        points: pointData.points.map(point => point.join(',')).join(' '),
        ...R.merge({fill: 'none', stroke: 'blue', strokeWidth: '10'}, props)
      });
    case 'Polygon':
      // TODO might need to remove a last redundant point here
      return Polygon({
        points: pointData.points.map(point => point.join(',')).join(' '),
        ...R.merge({fill: 'white', stroke: 'black', strokeWidth: '10'}, props)
      });
    default:
      throw new Error(`Unexpected type ${pointData.type}`);
  }
}

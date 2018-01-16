/**
 * Created by Andy Likuski on 2017.06.05
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import * as R from 'ramda';
import {eMap} from 'helpers/componentHelpers';
import {throwing} from 'rescape-ramda'

const [Circle, Polygon, Polyline, G] = eMap(['circle', 'polygon', 'polyline', 'g']);

/**
 * Inspects a feature and returns its type and projected point representation
 * @param {Object} opt Options sent by the SvgOverlayObject from react-map-gl
 * @param {Object} feature The geojson object from which to resolve points
 * @return {Object} An object with the geometry type and points
 */
export const resolveSvgPoints = R.curry((opt, feature) => {
  switch (feature.geometry.type) {
    case 'Point':
      return {
        type: feature.geometry.type,
        points: [opt.project(feature.geometry.coordinates)]
      };
    case 'LineString':
      return {
        type: feature.geometry.type,
        points: feature.geometry.coordinates.map(coordinate => opt.project(coordinate))
      };
    case 'Polygon':
      return {
        type: feature.geometry.type,
        // TODO assume single polygon for now.
        // We can easily handle multi-polygons here in the future
        points: R.head(feature.geometry.coordinates).map(coordinate => opt.project(coordinate))
      };
    default:
      throw new Error(`Unexpected geometry type ${feature.geometry.type}`);
  }
});

/**
 * Inspects props.pointData to determine what type of Svg React Component to render
 * @param {Object} props Props to pass to the Svg React component besides the point data (e.g. fill, stroke, strokeWidth)
 * Sensible defaults are supplied for fill, stroke, and strokeWidth if not supplied
 * @param {Object} props.pointData Contains type and coordinates
 * @param {Object} props.pointData.type 'Point', 'LineString', or 'Polygon'
 * @param {Object} props.pointData.points The screen coordinates of the shape
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


/**
 * Resolves an extent into a rectangular polygon
 * @param {[Number]} minLatLon 2 element array. The minimum lat/lon
 * @param {[Number]} maxLatLon 2 element array. The maximum lat/lon
 */
export const resolveFeatureFromExtent = (minLatLon, maxLatLon) => {
  return {
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[minLatLon, [R.head(maxLatLon), R.last(minLatLon)], maxLatLon, [R.head(minLatLon), R.last(maxLatLon)], minLatLon]]
    }
  };
};


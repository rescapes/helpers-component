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

import {
  resolveSvgReact, resolveSvgPoints, resolveFeatureFromExtent, nodeToFeature,
  translateNodeFeature
} from 'helpers/svgHelpers';
import * as R from 'ramda';

describe('svgHelpers', () => {
  test('resolveSvgPoint', () => {
    //expect(resolveSvgPoints(opt, feature)).toEqual();
  });

  test('resolveSvgReact', () => {
    //expect(resolveSvgReact(opt, feature)).toEqual();
  });

  test('resolveFeatureFromExtent', () => {
    expect(resolveFeatureFromExtent([0, 0], [1, 1])).toEqual(
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
        }
      }
    );
  });
  test('nodeToFeature', () => {
    expect(nodeToFeature({x0: 0, y0: 0, x1: 1, y1: 1})).toEqual(
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
        }
      }
    );
  });

  test('translateNodeFeature', () => {
    expect(R.over(
      R.lensPath(['geometry', 'coordinates']),
      // Update the coordinates to round every number, since the operations using floats
      ([coordinates]) => [R.map(pair => R.map(Math.round, pair), coordinates)],
      translateNodeFeature(
        // To the center of this
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [10, 10]
          }
        },
        // Translate this
        {
          "type": "Feature",
          "properties": {yippy: 1},
          "geometry": {
            "type": "Polygon",
            "coordinates": [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]]
          }
        }
      )
    )).toEqual(
      {
        "type": "Feature",
        "properties": {yippy: 1},
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[9, 9], [11, 9], [11, 11], [9, 11], [9, 9]]]
        }
      }
    );
  });
});


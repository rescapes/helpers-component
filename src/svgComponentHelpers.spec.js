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

import {resolveSvgReact} from 'svgComponentHelpers';
import {eMap} from './componentHelpers';

const [Circle, Polygon, Polyline] = eMap(['circle', 'polygon', 'polyline']);

test('resolveSvgReact', () => {
  expect(resolveSvgReact(
    {
      pointData: {
        type: 'Point',
        points: [[0, 0]]
      },
      foo: 1
    })
  ).toEqual(Circle({cx: 0, cy: 0, fill: 'white', foo: 1, r: '10', stroke: 'black', strokeWidth: '1'}));

  expect(resolveSvgReact(
    {
      pointData: {
        type: 'LineString',
        points: [[0, 0], [1, 1]]
      },
      foo: 1
    })
  ).toEqual(Polyline({points: '0,0 1,1', fill: 'none', foo: 1, stroke: 'blue', strokeWidth: '10'}));

  expect(resolveSvgReact(
    {
      pointData: {
        type: 'Polygon',
        points: [[0, 0], [1, 1], [1, 0], [0, 0]]
      },
      foo: 1
    })
  ).toEqual(Polygon({points: '0,0 1,1 1,0 0,0', fill: 'white', foo: 1, stroke: 'black', strokeWidth: '10'}));
});
/**
 * Created by Andy Likuski on 2017.11.15
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


import {sankeyGenerator, unprojectNode} from 'helpers/sankeyHelpers';
import sankeyData from 'data/sankey.sample';
import * as R from 'ramda';
import NamedTupleMap from 'namedtuplemap';
import {geoMercator} from 'd3-geo';
const projection = geoMercator();

describe('sankeyHelpers', () => {
  test('sankeyGenerator', () => {

    const cache = new NamedTupleMap()
    const q = {width: 480, height: 640}
    const r = {width: 480, height: 640}
    const value = {any: 'thing'}
    cache.set({sankeyData, ...q}, value)
    const res = cache.get({sankeyData, ...r})
    expect(res).toEqual(value)

    const f = sankeyGenerator
    const x = {width: 480, height: 640}
    const y = {width: 480, height: 640}
    const a = f(x, sankeyData)
    const b = f(y, sankeyData)

    expect(a === b).toBe(true)
    const newSankeyData = R.set(R.lensPath(['nodes', 0, 'name']), 'Foobar', sankeyData)
    const c = sankeyGenerator({width: 480, height: 640}, newSankeyData)
    expect(c === b).toBe(false)
  })


  /*
  test('unprojectNode', () => {
    expect(unprojectNode(projection, {x0: 1, x1: 16, y0: 198.0375, y1: 218.4247})).toMatchSnapshot()
  })
  */
});


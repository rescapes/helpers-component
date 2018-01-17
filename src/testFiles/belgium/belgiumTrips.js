/**
 * Created by Andy Likuski on 2017.02.27
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Creates default TripPair objects
 */

import stops from './belgiumStops'
import w from './belgiumStops'
import routes from './belgiumRoutes'
import {createTripWithStopTimesPair, orderStops, stopTimeGenerator} from 'lib/dataCreationHelpers';
import {stopResolver, routeResolver} from 'lib/dataQueryHelpers';
import places from './belgiumPlaces';
import * as regions from './belgiumRegions';
import {DEFAULT_SERVICE} from 'testfiles/default/services';
import * as R from 'ramda';

const resolveStop = stopResolver(stops);
const resolveRoute = routeResolver(routes);


/**
 * Creates a TripPair and then augments each trip with the StopTimes
 */
export default []

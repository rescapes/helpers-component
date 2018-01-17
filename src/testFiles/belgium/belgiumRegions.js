/**
 * Created by Andy Likuski on 2017.02.23
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import journeys from './belgiumJourneys.json';
import locations from './belgiumUserLocations.json';
import routes from './belgiumRoutes'
import * as routeTypes from 'testFiles/default/routeTypes';
import {applyDefaultRegion} from 'lib/configHelpers';
import trips from './belgiumTrips'
import stops from './belgiumStops'
import osm from './belgiumOsm'
import {throwing} from 'rescape-ramda'
import graph from 'testFiles/belgium/brusselsSankeySample';
const {reqPath} = throwing

// merge the default region template with our region(s)
export default applyDefaultRegion({
  belgium: {
    id: 'belgium',
    name: 'Belgium',
    description: 'Country of Belgium',

    geojson: {
      osm,
      // Make these the osm features for now
      locations: reqPath(['features'], osm),
      sankey: {
        graph
      }
    },

    gtfs: {
      routes,
      trips,
      stops,
      routeTypes: [routeTypes.INTER_REGIONAL_RAIL_SERVICE]
    },

    travel: {
      journeys,
      locations
    },

    geospatial: {
      bounds: [2.367, 49.500, 6.400, 51.683]
    },

    mapbox: {
      viewport: {

        latitude: 50.5915,
        longitude: 2.0165,
        zoom: 7
      }
    },

  }
});

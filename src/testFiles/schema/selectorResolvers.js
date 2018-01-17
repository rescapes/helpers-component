/**
 * Created by Andy Likuski on 2017.12.01
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {addResolveFunctionsToSchema} from 'graphql-tools';

// Original example from: https://github.com/apollographql/graphql-tools
const makeSelectorResolvers = data => ({
  Operation: {

  },
  Permission: {
  },
  User: {
  },
  OpenStreetMap: {
  },
  Location: {
  },
  Sankey: {
  },

  SankeyGraph: {
  },

  SankeyLink: {
  },

  Geojson: {

  },

  Bounds: {

  },
  Geospatial: {
  },
  Viewport: {

  },

  Mapbox: {
  },

  Region: {
  },

  MapboxSettings: {
    // Default resolve store.settings.mapbox
  },

  ApiSettings: {
    // Default resolve store.settings.api
  },

  OverpassSettings: {
    // Default Resolve store.settings.overpass
  },

  Settings: {
  },

  // The resolvers here limit the user to the active user and regions to the active region(s)
  // A different resolver setup could load all regions of a user (for user admin) or all regions for (overall admin)
  Store: {
  },

  Query: {
  },

  Mutation: {
  },
});

/**
 * Modifies the given schema to add reselect functions as resolvers
 * The reselect selectors represent the way that we filter data for Components
 * by, for instance, limited the Regions to the one marked active
 * @param {Object} schema A GraphlQL SchemaObject
 * @param {Object} data A full data structure that matches
 * the structure the schema
 * @returns {Object} The given GraphQLSchema with resolvers added
 */
export const createSelectorResolvedSchema = (schema, data) => {
  addResolveFunctionsToSchema(schema, makeSelectorResolvers(data))
  return schema;
}
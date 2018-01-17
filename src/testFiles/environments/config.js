export default {
  // Settings is merged into the overall application state
  settings: {
    // Graphcool configuration. This probably belongs in a graphcool config
    graphcool: {
      userId: 'graphcool-user-id',
      authTokenKey: 'graphcool-auth-token',
      serviceIdKey:'cjajyycub38710185wt87zsm8',
      // This is just from the tutorial code
      linksPerPage: 5,
    },
    // Overpass API configuration to play nice with the server's strict throttling
    overpass: {
      cellSize: 100,
      sleepBetweenCalls: 1000
    },
    markers: {
    },
    mapbox: {
      mapboxApiAccessToken: 'pk.eyJ1IjoiY2Fsb2NhbiIsImEiOiJjaXl1aXkxZjkwMG15MndxbmkxMHczNG50In0.07Zu3XXYijL6GJMuxFtvQg',
      // This will probably not be used unless we need to cluster something on the map
      iconAtlas: 'data/location-icon-atlas.png',
      // ditto
      showCluster: true,
      showZoomControls: true,
      // Universal Mapbox parameters to apply to any mapbox instance
      preventStyleDiffing: false
    },
    cycle: {
      drivers: {
        api: 'HTTP'
      }
    }
  }
}

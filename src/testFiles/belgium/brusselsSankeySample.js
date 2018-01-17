import * as R from 'ramda';
import {mapPropValueAsIndex} from 'rescape-ramda';
import numeral from 'numeral';

const columns = [
  'siteName',
  'location',
  'coordinates',
  'junctionStage',
  'annualTonnage'
];
export const stages = [
  {key: 'source', name: 'Source', targets:['conversion']},
  {key: 'conversion', name: 'Conversion', targets: ['distribution']},
  {key: 'distribution', name: 'Distribution', targets: ['demand']},
  {key: 'demand', name: 'Demand', targets: ['reconversion', 'sink']},
  {key: 'reconversion', name: 'Reconversion', targets: ['demand']},
  {key: 'sink', name: 'Sink', targets: []}
];
export const linkStages = R.zipWith(
  (source, target) => ({
    key: R.join('-', R.map(R.prop('key'), [source, target])),
    name: R.join(' -> ', R.map(R.prop('name'), [source, target])),
    source,
    target
  }),
  R.slice(0, -1, stages), R.slice(1, Infinity, stages)
);


const stageByName = mapPropValueAsIndex('name', stages);
const stageKey = 'junctionStage';
export const resolveLinkStage = d => d.target[stageKey];
export const resolveNodeStage = d => d[stageKey];
// If the location of the node ahs been generalized add it to the name so users know
// it isn't in an exact location
export const resolveNodeName = d => `${d.siteName} ${d.isGeneralized ? ' (general location)' : ''}\n${d.annualTonnage} t`
// Used for node and link values
const valueKey = 'annualTonnage'

const BRUSSELS_LOCATION = [4.3517, 50.8503];
// Minutely move locations so they don't overlap
const aberrateLocation = (index, location, factor=.005) =>
  R.addIndex(R.map)((coord, j) => coord + factor * (index % 2 ? -index : index) * (j || -1))(location)
const aberrateBrusselsLocation = index => aberrateLocation(index, BRUSSELS_LOCATION);

/**
 * Creates a Sankey node from ; separated strings
 * @param [String] lines An array of lines that are from a spreadsheet and delimited by semicolons
 */
const createNodes = R.map(
  line => R.fromPairs(
    R.zip(
      columns,
      R.split(';', line)
    )
  )
);

const groups = [
  {
    material: 'Minerals',
    nodes: createNodes([
      'Other Global Imports;Shipments, location generalized;51.309933, 3.055030;Source;22,469,843',
      'Knauf (Danilith) BE;Waregemseweg 156-142 9790 Wortegem-Petegem, Belgium;50.864762, 3.479308;Conversion;657,245',
      "MPRO Bruxelles;Avenue du Port 67 1000 Bruxelles, Belgium;50.867486, 4.352543;Distribution;18,632",
      'Residential Buildings (all typologies);Everywhere in Brussels;NA;Demand;3,882,735',
      'Duplex House Typology;Everywhere in Brussels;NA;Demand;13,544',
      'Apartment Building Typology;Everywhere in Brussels;NA;Demand;34,643',
      'New West Gypsum Recycling;9130 Beveren, Sint-Jansweg 9 Haven 1602, Kallo, Belgium;51.270229, 4.261048;Reconversion;87,565',
      'Residential Buildings (all typologies);Everywhere in Brussels;NA;Sink;120,000',
      'RecyPark South;1190 Forest, Belgium;50.810799, 4.314789;Sink;3,130',
      'RecyPark Nord;Rue du Rupel, 1000 Bruxelles, Belgium;50.880181, 4.377136;Sink;1,162'
    ])
  },
/*
  {
    material: 'Metals',
    nodes: createNodes([
      'Other Global Imports;Shipments, location generalized;51.309933, 3.055030;Source;367,689',
      'Arcelor Steel Belgium;Lammerdries 10, 2440 Geel, Belgium;51.145051, 4.939373;Conversion;27,872',
      'Duplex House Typology;Everywhere in Brussels;NA;Demand;3,048',
      'Apartment Building Typology;Everywhere in Brussels;NA;Demand;18,548',
      'Residential Buildings (all typologies);Everywhere in Brussels;NA;Demand;75,404',
      'Metallo Belgium;Nieuwe Dreef 33, 2340 Beerse, Belgium;51.318025, 4.817432;Reconversion;54,000',
      'Private Sector Collection;Everywhere in Brussels;NA;Sink;96,316',
      'RecyPark South;1190 Forest, Belgium;50.810799, 4.314789;Sink;101',
      'RecyPark Nord;Rue du Rupel, 1000 Bruxelles, Belgium;50.880181, 4.377136;Sink;67'
    ])
  },

  {
    material: 'Wood',
    nodes: createNodes([
      'Forêt de Soignes;Watermael-Boitsfort Belgium ;50.777072, 4.409960;Source;6,288',
      'Germany Imports;Germany, nearest point;50.786952, 6.102697;Source;66,812',
      'Netherlands Imports;Netherlans, nearest point;51.467197, 4.609125;Source;52,352',
      'Other Global Imports;Shipments, location generalized;51.309933, 3.055030;Source;323,384',
      'Barthel Pauls Sawmill;Pôle Ardenne Bois 1, 6671 Bovigny, Belgium;50.259872, 5.933474;Conversion;200,430',
      "Lochten & Germeau;Bd de l’Humanité, 51, 1190 Vorst, Belgium;50.820974, 4.314469;Distribution; NA, only for directional/path",
      'Duplex House Typology;Everywhere in Brussels;NA;Demand;1,955',
      'Apartment Building Typology;Everywhere in Brussels;NA;Demand;11,250',
      'Residential Buildings (all typologies);Everywhere in Brussels;NA;Demand;45,659',
      'Rotor Deconstruction;Prévinairestraat / Rue Prévinaire 58 1070 Anderlecht;50.839714, 4.352730;Reconversion;15,462',
      'PAC Uccle;Boulevard de la Deuxième Armée Britannique 625-667 1190 Forest, Belgium;50.801647, 4.305641;Sink;189',
      'PAC Saint-Josse;Rue Verboeckhaven 39-17 1210 Saint-Josse-ten-Noode, Belgium;50.854094, 4.375173;Sink;126',
      'PAC Woluwe-Saint-Pierre;Avenue du Parc de Woluwe 86-44 1160 Auderghem, Belgium;50.823228, 4.427453;Sink;63.08',
      "PAC d’Auderghem/Watermael-Boitsfort;1860 chaussée de Wavre, 1160 Auderghem;50.809948, 4.445271;Sink;252.32",
      "RecyPark South;1190 Forest, Belgium;50.810799, 4.314789;Sink;668",
      "RecyPark Nord;Rue du Rupel, 1000 Bruxelles, Belgium;50.880181, 4.377136;Sink;445"
    ])
  }
  */
];

/**
 * Resolves the lat/lon based on the given coordinates string. If it is NA then default to BRUSSELS_LOCATION
 * @param {String} coordinates comma separated lon/lat. We flip this since the software wants [lat, lon]
 * @return [Float] lat/lon array
 */
const resolveLocation = (coordinates, i) =>
  R.ifElse(
    R.equals('NA'),
    R.always({
      isGeneralized: true,
      location: aberrateBrusselsLocation(i)
    }),
    coord => ({
      isGeneralized: false,
      location: aberrateLocation(i, R.reverse(R.map(parseFloat, R.split(',', coord))), 0)
    })
  )(coordinates);

/**
 * Creates Sankey Links for the given ordered stages for the given nodes by stage
 * @param [Object] stages Array of stage objects.
 * @param [Object] nodesByStages Keyed by stage key and valued by an array of nodes
 * @return {*}
 */
const createLinks = (stages, nodesByStages) => R.addIndex(R.chain)(
  (stage, i) => {
    // Get the current stage as the source
    const sources = nodesByStages[stage.key];
    if (!sources)
      return [];
    // Iterate through the stages until one with nodes is found
    const targetStage = R.find(
      stage => nodesByStages[stage.key],
      R.slice(i + 1, R.length(stages), stages)
    );
    // If no more stages contain nodes, we're done
    if (!targetStage)
      return [];
    const targets = nodesByStages[targetStage.key];
    return R.chain(
      source => R.map(
        target => ({
          source: source.index,
          target: target.index,
          value: numeral(R.prop(valueKey, source)).value()
        }),
        targets),
      sources
    );
  },
  stages
);

const groupToNodesAndLinks = (accumulatedGraph, group) => {
  const nodeCount = R.length(accumulatedGraph.nodes || 0);
  // Accumulate nodes for each stage
  const nodesByStages = R.addIndex(R.reduce)(
    (accum, node, i) => {
      const {location, isGeneralized} = resolveLocation(node.coordinates, i);
      return R.mergeWith(
        (l, r) => R.concat(l, r),
        accum,
        {
          [stageByName[node[stageKey]].key]: [
            R.merge(
              node,
              {
                index: i + nodeCount,
                material: group.material,
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: location
                },
                name: node['siteName'],
                isGeneralized,
                properties: {}
              }
            )
          ]
        }
      );
    },
    {},
    group.nodes);

  // Naively create a link between every node of consecutive stages
  return R.mergeWith(
    R.concat,
    accumulatedGraph,
    {
      // Flatten nodesByStages values to get all nodes
      nodes: R.flatten(R.values(nodesByStages)),
      links: createLinks(stages, nodesByStages)
    }
  );
};

export default R.reduce(
  groupToNodesAndLinks,
  {nodes: [], links: []},
  groups
);
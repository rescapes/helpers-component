
import places from 'testFiles/california/californiaPlaces';
import {createStop, orderStops, createRoute, createRouteId, createStopTimes, createStopId, createTripWithStopTimesPair, createService, createTrip} from './dataCreationHelpers';
import w from 'testFiles/california/californiaStops';
import regions from 'testFiles/california/californiaRegions';
import * as routeTypes from 'testFiles/default/routeTypes';
import {DEFAULT_SERVICE} from 'testFiles/default/services';
import query from './dataQueryHelpers';
import * as stopTypes from 'testFiles/default/stopTypes';

describe('Data Creation Helpers', () => {
    test('Creates a Stop id from a Place and Stop location', () => {
        expect(createStopId(places.LOS_ANGELES, w.UNION)).toMatchSnapshot();
    });

    test('Creates a Stop', () => {
        expect(createStop(
            places.LOS_ANGELES, w.UNION, {lon: -118.236502, lat: 34.056219}
        )).toMatchSnapshot();
        expect(createStop(
            places.LOS_ANGELES, w.UNION, {lon: -118.236502, lat: 34.056219},
            {stopName: 'LA Fancy Station'}
        )).toMatchSnapshot();
        expect(createStop(
            places.LOS_ANGELES, w.UNION, {lon: -118.236502, lat: 34.056219},
            {stopType: 'MegaStation'}
        )).toMatchSnapshot();
    });

    test('Creates a Route id', () => {
        expect(createRouteId(places.LOS_ANGELES, places.RENO)).toMatchSnapshot();
        expect(createRouteId(places.LOS_ANGELES, places.RENO, regions.EAST_BAY)).toMatchSnapshot();
    });

    test('Creates a Route', () => {
        expect(createRoute(places.LOS_ANGELES, places.RENO,
            {routeType: routeTypes.INTER_REGIONAL_RAIL_SERVICE})).toMatchSnapshot();
        expect(createRoute(places.LOS_ANGELES, places.RENO,
            {via: regions.EAST_BAY, routeType: routeTypes.REPLACEMENT_RAIL_SERVICE})).toMatchSnapshot();
    });

    test('Creates a Service', () => {
        expect(createService('20170601', '20170831', ['weekend'], ['summer'])).toMatchSnapshot();
    });

    test('Creates a Trip id', () => {
        const route = createRoute(places.LOS_ANGELES, places.RENO,
            {routeType: routeTypes.INTER_REGIONAL_RAIL_SERVICE});
        expect(createTripId(route, FROM_TO_DIRECTION, DEFAULT_SERVICE)).toMatchSnapshot();
    });

    test('Creates Trip', () => {
        const route = createRoute(places.LOS_ANGELES, places.RENO,
            {routeType: routeTypes.INTER_REGIONAL_RAIL_SERVICE});
        expect(createTrip(route, FROM_TO_DIRECTION, DEFAULT_SERVICE)).toMatchSnapshot();
    });
});

describe('Trips with Stops', () => {
    const route = createRoute(places.LOS_ANGELES, places.RENO,
        {routeType: routeTypes.INTER_REGIONAL_RAIL_SERVICE});
    const trip = createTrip(route, TO_FROM_DIRECTION, DEFAULT_SERVICE);
    const resolveStop = query.stopResolver([
        createStop(places.LOS_ANGELES, w.UNION,
            { lon: -118.236502, lat: 34.056219 },
        ),
        createStop(places.OAKLAND, w.CENTRAL,
            { lon: -122.277158, lat: 37.806624 },
        ),
        createStop(places.RENO, w.AMTRAK,
            { lon: -122.041192, lat: 38.243449 }
        ),
        createStop(places.SACRAMENTO, w.AMTRAK,
            { lon: -121.500675, lat: 38.584162 }
        ),
        createStop(places.SAN_FRANCISCO, w.TRANSBAY,
            { lon: -122.392481, lat: 37.789339 },
            { stopType: stopTypes.TERMINAL }
        ),
        createStop(places.STOCKTON, w.AMTRAK,
            { lon: -121.285602, lat: 37.945332 }
        ),
        createStop(places.TRUCKEE, w.AMTRAK,
            { lon: -120.185620, lat: 39.327493 },
            { stopType: stopTypes.DEPOT }
        )
    ]);

    test('Orders Stops of a Trip', () => {
        expect(orderStops(trip, [
            resolveStop(places.SAN_FRANCISCO, w.TRANSBAY),
            resolveStop(places.OAKLAND, w.CENTRAL),
            resolveStop(places.STOCKTON, w.AMTRAK),
            resolveStop(places.SACRAMENTO, w.AMTRAK),
            resolveStop(places.TRUCKEE, w.AMTRAK),
            resolveStop(places.RENO, w.AMTRAK)
        ])).toMatchSnapshot();
    });

    test('Creates Trips with Stop Times Pair', () => {
        expect(createTripWithStopTimesPair(route, DEFAULT_SERVICE,
            oneTrip => {
                return createStopTimes(
                    oneTrip,
                    orderStops(oneTrip, [
                        resolveStop(places.SAN_FRANCISCO, w.TRANSBAY),
                        resolveStop(places.OAKLAND, w.CENTRAL),
                        resolveStop(places.STOCKTON, w.AMTRAK),
                        resolveStop(places.SACRAMENTO, w.AMTRAK),
                        resolveStop(places.TRUCKEE, w.AMTRAK),
                        resolveStop(places.RENO, w.AMTRAK)
                    ]),
                    '09:10', '12:20', 60);
        })).toMatchSnapshot();
    });
});


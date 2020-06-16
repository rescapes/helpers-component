/**
 * Created by Andy Likuski on 2017.10.17
 * Copyright (c) 2017 Andy Likuski
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import * as R from 'ramda';
import {
  applyIfFunction,
  applyToIfFunction,
  composeViews,
  composeViewsFromStruct,
  e,
  itemizeProps,
  keysMatchingStatus,
  keyWith,
  liftAndExtract,
  mergeActionsForViews,
  mergeStylesIntoViews,
  nameLookup,
  propLensEqual,
  propsFor,
  propsForItem,
  propsForSansClass
} from './componentHelpers';
import {mergeDeep, reqStrPathThrowing} from 'rescape-ramda';
import {joinComponents, keyWithDatum, mergePropsForViews, renderChoicepoint} from 'componentHelpers';
import * as React from 'react';

let i = 0;

class Joker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      warn: ++i
    };
  }
}

describe('componentHelpers', () => {
  test('propLensEqual', () => {
    const foul = {ball: 'left field'};
    const fair = {ball: 'left field'};
    const strike = {ball: 'catcher'};
    const lens = R.lensPath(['yuk', 'dum', 'boo', 'bum']);
    expect(propLensEqual(
      lens,
      {yuk: {dum: {boo: {bum: foul}}}},
      {yuk: {dum: {boo: {bum: fair}}}}
    )).toEqual(true);
    expect(propLensEqual(
      lens,
      {yuk: {dum: {boo: {bum: foul}}}},
      {yuk: {dum: {boo: {bum: strike}}}}
    )).toEqual(false);
  });

  test('mergeActionsForViews', () => {
    const mergeProps = mergeActionsForViews({aComponent: ['action1', 'action2'], bComponent: ['action2', 'action3']});
    const stateProps = {a: 1, views: {aComponent: {stuff: 1}, bComponent: {moreStuff: 2}}};
    const dispatchProps = {
      action1: R.identity,
      action2: R.identity,
      action3: R.identity
    };
    // mergeProps should merge stateProps and dispatchProps but copy the actions to stateProps.views according
    // to the mapping given to mergeActionsForViews
    expect(mergeProps(R.merge(stateProps, dispatchProps))).toEqual(
      R.merge({
        a: 1,
        views: {
          aComponent: {stuff: 1, action1: R.identity, action2: R.identity},
          bComponent: {moreStuff: 2, action2: R.identity, action3: R.identity}
        }
      }, dispatchProps)
    );
  });


  test('mergePropsForViewsProplem', () => {
    const viewNamesToViewProps = {
      sankeySvgLinks: {
        links: []
      }
    };
    const props = {
      views: {
        sankeySvgLinks: {
          fontFamily: "sans-serif",
          fontSize: 10,
          key: "sankeySvgLinks"
        }
      }
    };
    expect(mergePropsForViews(viewNamesToViewProps, props)).toEqual(mergeDeep({views: viewNamesToViewProps}, props));
  });

  test('mergePropsForViews', () => {

    const mergeProps = mergePropsForViews(props => ({
      aComponent: {
        foo: 1,
        bar: reqStrPathThrowing('data.store.bar')
      },
      bComponent: R.merge(
        {
          bar: reqStrPathThrowing('data.store.bar'),
          // say we need width in bComponent's props, not just its props.styles
          width: reqStrPathThrowing('views.bComponent.styles.width')
        },
        // This returns multiple prop/values
        reqStrPathThrowing('data.someExtraProps', props)
      ),
      // This entire view expects an item
      itemComponent: R.curry((props, item) => ({
        title: R.toLower(item.title)
      })),
      anotherItemComponent: {
        boo: props => item => `${props.data.a}${item.name}`
        // This will get a per item number key assignment
      }
    }));
    const props = {
      views: {
        aComponent: {stuff: 1},
        bComponent: {moreStuff: 2, styles: {width: 10}}
      },
      data: {
        a: 1,
        store: {
          bar: 2
        },
        someExtraProps: {
          bat: 'can',
          man: 'pan'
        }
      }
    };

    // mergeProps should merge stateProps and dispatchProps but copy the actions to stateProps.views according
    // to the mapping given to mergeActionsForViews
    // At this point we still have unary functions expecting items
    const mostlyResolvedProps = mergeProps(props);

    // Lets manually map the item functions to some real values so we can test equality
    // This one is an entire function, map some items with it
    // This step would normally happen in the react render method when we are iterating some list of data
    const mergedProps = R.compose(
      R.over(
        R.lensPath(['views', 'anotherItemComponent']),
        propObj => R.map(
          item => ({
            // boo function is expecting an item
            boo: propObj.boo(item),
            // key function was auto generated to expect an item
            key: propObj.key(item)
          }),
          [{name: 'a'}, {name: 'b'}]
        )
      ),
      R.over(
        R.lensPath(['views', 'itemComponent']),
        // viewFunc already resolved the props in mergeProps, now it just needs an item
        viewFunc => R.map(viewFunc, [{key: 'a', title: 'A'}, {key: 'b', title: 'B'}])
      )
    )(mostlyResolvedProps);

    expect(mergedProps).toEqual(
      {
        views: {
          aComponent: {key: 'aComponent', stuff: 1, foo: 1, bar: 2},
          bComponent: R.merge(
            {key: 'bComponent', moreStuff: 2, bar: 2, styles: {width: 10}, width: 10},
            props.data.someExtraProps
          ),
          itemComponent: [{key: 'a', title: 'a'}, {key: 'b', title: 'b'}],
          anotherItemComponent: [{key: 'anotherItemComponent1', boo: '1a'}, {key: 'anotherItemComponent2', boo: '1b'}]
        },
        data: {
          a: 1,
          store: {
            bar: 2
          },
          someExtraProps: {
            bat: 'can',
            man: 'pan'
          }
        }
      }
    );
  });

  test('liftAndExtract', () => {
    // Pretend R.identity is a component function
    expect(
      liftAndExtract(R.identity, {a: {my: 'props'}, b: {your: 'props'}})
    ).toEqual(
      [{my: 'props'}, {your: 'props'}]
    );
  });

  test('mergeStylesIntoViews', () => {
    const props = {
      style: {
        styleFromProps: 'blue'
      },
      views: {
        // Some existing property foo that we don't care about
        someView: {foo: 1}
      }
    };
    const expected = {
      style: {
        styleFromProps: 'blue'
      },
      views: {
        someView: {
          style: {
            styleFromProps: 'blue',
            color: 'red'
          },
          foo: 1
        }
      }
    };
    // Should work with styles as an object
    expect(
      mergeStylesIntoViews(
        {
          // If we want these styles in our view
          someView: {
            color: 'red',
            styleFromProps: 'blue'
          }
        },
        props
      )
    ).toEqual(expected);

    // Should work with styles as a function expecting props
    expect(
      mergeStylesIntoViews(
        p => ({
          // If we want these styles in our view, one of which is from props.style
          someView: R.merge({
            color: 'red'
          }, p.style)
        }),
        props
      )
    ).toEqual(expected);

    // Should work with styles as a function expecting props
    expect(
      mergeStylesIntoViews({
          someView: {
            style: {
              color: 'red',
              styleFromProps: 'blue'
            },
            className: 'foo bar'
          }
        },
        props
      )
    ).toEqual(R.set(R.lensPath(['views', 'someView', 'className']), 'foo bar', expected));

  });

  test('nameLookup', () => {
    expect(nameLookup({toast: true, is: true, good: true})).toEqual(
      {toast: 'toast', is: 'is', good: 'good'}
    );
  });

  test('renderChoicepoint', () => {

    // No configured apollo responses case, just call onData
    const identityFunc = renderChoicepoint({
        onError: (keys, p) => p.bad,
        onLoading: p => p.okay,
        onData: p => p.good
      },
      {}
    );
    expect(identityFunc(
      {
        good: 'good'
      }
    )).toEqual('good');

    const func = renderChoicepoint({
        onError: (keys, p) => p.bad,
        onLoading: p => p.okay,
        onData: p => p.good
      },
      {
        queryRegions: true,
        mutateRegions: ['onError']
      }
    );
    expect(func(
      {
        queryRegions: {networkStatus: 7},
        mutateRegions: {error: true},
        bad: 'bad'
      }
    )).toEqual('bad');

    expect(func(
      {
        queryRegions: {loading: true},
        mutateRegions: {networkStatus: 7},
        okay: 'okay'
      }
    )).toEqual('okay');

    expect(func(
      {
        queryRegions: {networkStatus: 7},
        // This doesn't matter because of mutateRegions: ['onError']
        mutateRegions: {loading: true},
        good: 'good'
      }
    )).toEqual('good');

  });

  test('propsFor', () => {
    const viewProps = {
      fooProps: {
        style: {
          color: 'red'
        },
        bar: 1
      }
    };
    expect(propsFor(viewProps, 'fooProps')).toEqual(
      {
        key: 'fooProps',
        className: 'foo-props',
        style: {
          color: 'red'
        },
        bar: 1
      }
    );
    expect(propsFor(viewProps, 'bermudaProps')).toEqual(
      {key: 'bermudaProps', className: 'bermuda-props'}
    );
  });

  test('propsForSansClass', () => {
    const viewProps = {
      fooProps: {
        style: {
          color: 'red'
        },
        bar: 1
      }
    };
    expect(propsForSansClass(viewProps, 'fooProps')).toEqual(
      {
        style: {
          color: 'red'
        },
        bar: 1,
        key: 'fooProps'
      }
    );
    expect(propsForSansClass(viewProps, 'bermudaProps')).toEqual(
      {key: 'bermudaProps'}
    );
  });

  test('joinComponents', () => {
    expect(joinComponents(key => ({key, separate: 'me'}), [
      key => ({key, a: 1}),
      key => ({key, a: 2}),
      key => ({key, a: 3})
    ])).toEqual([
      {key: 0, a: 1},
      {key: 1, separate: 'me'},
      {key: 2, a: 2},
      {key: 3, separate: 'me'},
      {key: 4, a: 3}
    ]);
  });
  ;

  test('itemizeProps', () => {
    expect(itemizeProps({
        name: 'props',
        a: 1,
        b: R.prop('cucumber'),
        c: item => R.add(2, item.c),
        style: {
          // This function should be called with item to produce 'puce'
          color: item => R.defaultTo('taupe', item.color)
        }
      },
      {
        name: 'item',
        cucumber: 'tasty',
        c: 5,
        color: 'puce'
      }
    )).toEqual(
      {
        name: 'props',
        a: 1,
        b: 'tasty',
        c: 7,
        style: {
          color: 'puce'
        }
      }
    );
  });

  test('propsForItem', () => {
    expect(propsForItem(
      {
        someView: {
          name: 'props',
          a: 1,
          b: R.prop('cucumber'),
          c: item => R.add(2, item.c),
          style: {
            // This function should be called with item to produce 'puce'
            color: item => R.defaultTo('taupe', item.color)
          }
        }
      },
      'someView',
      {
        name: 'item',
        cucumber: 'tasty',
        c: 5,
        color: 'puce'
      }
    )).toEqual(
      {
        key: 'someView',
        className: 'some-view',
        style: {
          color: 'puce'
        },
        name: 'props',
        a: 1,
        b: 'tasty',
        c: 7
      }
    );
  });

  test('applyToIfFunction', () => {
    expect(applyToIfFunction({kangaroo: 1}, R.prop('kangaroo'))).toEqual(1);
    expect(applyToIfFunction({kangaroo: 1}, 'rat')).toEqual('rat');
  });


  test('e', () => {
      expect(e('div', {prop: 'me up!'}, e('div', {prop: 'some child'}))).toEqual(
        React.createElement('div', {prop: 'me up!'}, React.createElement('div', {prop: 'some child'}))
      );
      expect(e(Joker, {prop: 'ace'})).toEqual(React.createElement(Joker, {prop: 'ace'}));
    }
  );


  test('applyIfFunction', () => {
    expect(applyIfFunction([1, 2], R.add)).toEqual(3);
    expect(applyIfFunction([1, 2], 'rat')).toEqual('rat');
  });

  test('keyWith', () => {
    // With constant
    expect(keyWith('id', {
      id: 1,
      billy: 'low ground'
    })).toEqual({
      key: "1",
      id: 1,
      billy: 'low ground'
    });
  });

  test('keyWithDatum', () => {
    // With constant
    expect(keyWithDatum('id', {id: 'snakke'}, {
      id: 1,
      billy: 'low ground'
    })).toEqual({
      key: 'snakke',
      id: 1,
      billy: 'low ground'
    });
  });

  test('composeViews', () => {
    expect(
      composeViews(
        ({
          aView: ['someAction']
        }),
        props => ({
          aView: {
            someProp: 'foo',
            parentProp: reqStrPathThrowing('data.parentProp')
          },
          bView: p => ({
            parentProp: reqStrPathThrowing('data.parentProp', p)
          })
        }),
        props => ({
          aView: {
            someStyle: 'foo'
          }
        }),
        {
          someAction: 'someAction',
          data: {
            parentProp: 1
          }
        }
      )
    ).toEqual({
      someAction: 'someAction',
      data: {
        parentProp: 1
      },
      views: {
        aView: {
          key: 'aView',
          someAction: 'someAction',
          someProp: 'foo',
          parentProp: 1,
          style: {
            someStyle: 'foo'
          }
        },
        bView: {
          key: 'bView',
          parentProp: 1
        }
      }
    });
  });

  test('composeViewsFromStruct', () => {
    composeViewsFromStruct({
      props: {
        ['logo']: {},
        ['logoImage']: {
          src: reqStrPathThrowing('logoSrc')
        }
      },

      styles: {
        ['logo']: {
          aView: {
            someStyle: 'foo'
          }
        },
        ['logoImage']: {
          maxWidth: '100%',
          maxheight: '100%'
        }
      }
    }, {logoSrc: './image.gif'});
    expect(
      composeViewsFromStruct({
          actions: {
            aView: ['someAction']
          },
          props: props => ({
            aView: {
              someProp: 'foo',
              parentProp: reqStrPathThrowing('data.parentProp')
            },
            bView: p => ({
              parentProp: reqStrPathThrowing('data.parentProp', p)
            })
          }),
          styles: props => ({
            aView: {
              someStyle: 'foo'
            }
          })
        },
        {
          someAction: 'someAction',
          data: {
            parentProp: 1
          }
        })
    ).toEqual({
      someAction: 'someAction',
      data: {
        parentProp: 1
      },
      views: {
        aView: {
          key: 'aView',
          someAction: 'someAction',
          someProp: 'foo',
          parentProp: 1,
          style: {
            someStyle: 'foo'
          }
        },
        bView: {
          key: 'bView',
          parentProp: 1
        }
      }
    });
  });

  test('anyPropKeysMatchStatus', () => {
    // Nobody matches on error
    expect(
      keysMatchingStatus('onError', {
        queryRegions: true,
        mutateRegions: ['onError']
      }, {
        queryRegions: {error: null, loading: null, networkStatus: 7},
        // Mutation function that is ready and has run
        mutateRegions: {mutation: R.identity, skip: false, result: {called: true, loading: false}},
        otherProps: 1
      })
    ).toEqual([]);

    // mutateRegions is loading but we only care if it errors
    expect(
      keysMatchingStatus('onLoading', {
        queryRegions: true,
        mutateRegions: ['onLoading']
      }, {
        queryRegions: {error: null, loading: null, networkStatus: 7},
        // Mutation function that is ready and the mutation is loading
        mutateRegions: {mutation: R.identity, skip: false, result: {called: true, loading: true}},
        otherProps: 1
      })
    ).toEqual(['mutateRegions']);

    expect(
      keysMatchingStatus('onData', {
        queryRegions: true,
        mutateRegions: ['onError']
      }, {
        queryRegions: {error: null, loading: null, networkStatus: 7},
        // Mutation function that is ready and the mutation is loading
        mutateRegions: {mutation: R.identity, skip: false, result: {called: true, loading: true}},
        otherProps: 1
      })
    ).toEqual(['queryRegions']);

    expect(
      keysMatchingStatus('onReady', {
        queryRegions: true,
        mutateRegions: ['onReady']
      }, {
        queryRegions: {error: null, loading: null, networkStatus: 7},
        // Mutation function that is not ready
        mutateRegions: {mutation: R.identity, skip: true, result: {called: false, loading: false}},
        otherProps: 1
      })
    ).toEqual(['mutateRegions']);
  });
});

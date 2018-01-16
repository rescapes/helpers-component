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
  propLensEqual, mergeActionsForViews, makeTestPropsFunction, liftAndExtract,
  renderChoicepoint, joinComponents, loadingCompleteStatus, makeApolloTestPropsFunction, mergePropsForViews,
  mergeStylesIntoViews,
  nameLookup, propsFor,
  propsForSansClass, strPath, itemizeProps, applyToIfFunction, keyWith, propsForItem, applyIfFunction, composeViews,
  composeViewsFromStruct, whenProp
} from 'helpers/componentHelpers';
import {throwing, hasStrPath} from 'rescape-ramda';

const {reqStrPath} = throwing;

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

  test('mergePropsForViews', () => {

    const mergeProps = mergePropsForViews(props => ({
      aComponent: {
        foo: 1,
        bar: reqStrPath('data.store.bar')
      },
      bComponent: R.merge(
        {
          bar: reqStrPath('data.store.bar'),
          // say we need width in bComponent's props, not just its props.styles
          width: reqStrPath('views.bComponent.styles.width')
        },
        // This returns multiple prop/values
        reqStrPath('data.someExtraProps', props)
      ),
      itemComponent: R.curry((props, item) => ({
        key: R.toUpper(item.key),
        title: R.toLower(item.title)
      })),
      anotherItemComponent: {
        key: props => item => `${props.data.a}${item.key}`
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
        // keyFunc is expecting an item
        propObj => R.map(item => ({key: propObj.key(item)}), [{key: 'a'}, {key: 'b'}])
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
          aComponent: {stuff: 1, foo: 1, bar: 2},
          bComponent: R.merge(
            {moreStuff: 2, bar: 2, styles: {width: 10}, width: 10},
            props.data.someExtraProps
          ),
          itemComponent: [{key: 'A', title: 'a'}, {key: 'B', title: 'b'}],
          anotherItemComponent: [{key: '1a'}, {key: '1b'}]
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

  test('makeTestPropsFunction', () => {
    const sampleState = ({a: 1, views: {aComponent: {stuff: 1}, bComponent: {moreStuff: 2}}});
    const sampleOwnProps = {style: {width: 100}};
    const mapStateToProps = (state, ownProps) => R.merge(state, ownProps);
    const dispatchResults = {
      action1: R.identity,
      action2: R.identity,
      action3: R.identity
    };
    const mapDispatchToProps = (dispatch, ownProps) => dispatchResults;
    // given mapStateToProps, mapDispatchToProps, and mergeProps we get a function back
    // that then takes sample state and ownProps. The result is a merged object based on container methods
    // and sample da
    expect(makeTestPropsFunction(mapStateToProps, mapDispatchToProps)(sampleState, sampleOwnProps))
      .toEqual(
        R.merge({
          a: 1,
          style: {width: 100},
          views: {
            aComponent: {stuff: 1},
            bComponent: {moreStuff: 2}
          }
        }, dispatchResults)
      );
  });

  test('awaitMakeApolloTestPropsFunction', async () => {
    const sampleState = ({data: {regionId: 'oakland'}, views: {aComponent: {stuff: 1}, bComponent: {moreStuff: 2}}});
    const sampleOwnProps = {style: {width: 100}};
    const mapStateToProps = (state, ownProps) => R.merge(state, ownProps);
    const dispatchResults = {
      action1: R.identity,
      action2: R.identity,
      action3: R.identity
    };
    const mapDispatchToProps = (dispatch, ownProps) => dispatchResults;
    // given mapStateToProps, mapDispatchToProps, and mergeProps we get a function back
    // that then takes sample state and ownProps. The result is a merged object based on container methods
    // and sample data. Next apply the apollo query
    const queryObj = {
      query: `
          query region($regionId: String!) {
              store {
                  region(id: $regionId) {
                      id
                      name
                  },
              }
          }
      `,
      args: {
        options: ({data: {regionId}}) => ({
          variables: {
            regionId
          }
        })
      }
    };
    const value = await makeApolloTestPropsFunction(mapStateToProps, mapDispatchToProps, queryObj)(sampleState, sampleOwnProps).then(
      either => new Promise((resolve, reject) => either.map(resolve).leftMap(reject))
    );

    expect(value).toEqual(
      R.merge({
        // Expect this data came from Apollo
        data: R.merge(
          loadingCompleteStatus, {
            store: {region: {id: "oakland", name: "Oakland"}},
            regionId: 'oakland'
          }),
        style: {width: 100},
        views: {
          aComponent: {stuff: 1},
          bComponent: {moreStuff: 2}
        }
      }, dispatchResults)
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
    const func = renderChoicepoint(
      p => p.bad,
      p => p.okay,
      p => p.good
    );
    expect(func({data: {error: true}, bad: 'bad'})).toEqual('bad');
    expect(func({data: {loading: true}, okay: 'okay'})).toEqual('okay');
    expect(func({data: {store: true}, good: 'good'})).toEqual('good');
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
        className: 'foo-props',
        style: {
          color: 'red'
        },
        bar: 1
      }
    );
    expect(propsFor(viewProps, 'bermudaProps')).toEqual(
      {className: 'bermuda-props'}
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
        bar: 1
      }
    );
    expect(propsForSansClass(viewProps, 'bermudaProps')).toEqual(
      {}
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
        styles: {
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
        styles: {
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
          styles: {
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
        className: 'some-view',
        styles: {
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
      key: 1,
      id: 1,
      billy: 'low ground'
    });

    // With func that is resolvec later
    const billyFunc = (props, d) => 'low ground';
    expect(keyWith('billy', {
      id: 1,
      billy: billyFunc
    })).toEqual({
      key: billyFunc,
      id: 1,
      billy: billyFunc
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
            parentProp: reqStrPath('data.parentProp')
          },
          bView: p => ({
            parentProp: reqStrPath('data.parentProp', p)
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
          someAction: 'someAction',
          someProp: 'foo',
          parentProp: 1,
          style: {
            someStyle: 'foo'
          }
        },
        bView: {
          parentProp: 1
        }
      }
    });
  });

  test('composeViewsFromStruct', () => {
    expect(
      composeViewsFromStruct({
          actions: {
            aView: ['someAction']
          },
          props: props => ({
            aView: {
              someProp: 'foo',
              parentProp: reqStrPath('data.parentProp')
            },
            bView: p => ({
              parentProp: reqStrPath('data.parentProp', p)
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
          someAction: 'someAction',
          someProp: 'foo',
          parentProp: 1,
          style: {
            someStyle: 'foo'
          }
        },
        bView: {
          parentProp: 1
        }
      }
    });
  });
});

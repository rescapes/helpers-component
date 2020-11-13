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
import chakra from "@chakra-ui/core";

const {Button} = chakra;
import renderer from 'react-test-renderer';
import {
  applyIfFunction,
  applyToIfFunction,
  componentAndPropsFor,
  composeViews,
  composeViewsFromStruct,
  e,
  itemizeProps,
  keysMatchingStatus,
  keyWith,
  liftAndExtract,
  mergeEventHandlersForViews,
  mergeStylesIntoViews,
  nameLookup,
  propLensEqual,
  propsFor,
  propsForItem,
  propsForSansClass
} from './componentHelpers';
import {mergeDeep, reqStrPathThrowing, strPathOr} from 'rescape-ramda';
import {joinComponents, keyWithDatum, mergePropsForViews, renderChoicepoint} from 'componentHelpers';
import React from 'react';

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

  test('mergeEventHandlersForViews', () => {
    const mergeProps = mergeEventHandlersForViews({
      aComponent: {onClick: 'action1', onTick: 'action2'},
      bComponent: {onFlick: 'action2', onGleek: 'action3'},
      cComponent: {onLeek: R.identity}
    });
    const stateProps = {a: 1, views: {aComponent: {stuff: 1}, bComponent: {moreStuff: 2}}};
    const dispatchProps = {
      action1: R.identity,
      action2: R.identity,
      action3: R.identity
    };
    // mergeProps should merge stateProps and dispatchProps but copy the actions to stateProps.views according
    // to the mapping given to mergeEventHandlersForViews
    expect(mergeProps(R.merge(stateProps, dispatchProps))).toEqual(
      R.merge({
        a: 1,
        views: {
          aComponent: {stuff: 1, onClick: R.identity, onTick: R.identity},
          bComponent: {moreStuff: 2, onFlick: R.identity, onGleek: R.identity},
          cComponent: {onLeek: R.identity()}
        }
      }, dispatchProps)
    );
  });

  test('mergePropsForViewsProblem', () => {
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

    const mergeProps = mergePropsForViews(
      props => ({
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
        itemComponent: R.curry((props, item) => {
          return {
            title: R.toLower(item.title)
          };
        }),
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
    // to the mapping given to mergeEventHandlersForViews
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
      p => R.over(
        R.lensPath(['views', 'itemComponent']),
        // viewFunc already resolved the props in mergeProps, now it just needs an item
        viewFunc => R.map(viewFunc, [{key: 'a', title: 'A'}, {key: 'b', title: 'B'}]),
        p
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
        'background-color': 'blue'
      },
      views: {
        // Some existing property foo that we don't care about
        someView: {foo: 1}
      }
    };
    const expected = {
      style: {
        'background-color': 'blue'
      },
      views: {
        someView: {
          style: {
            'background-color': 'blue',
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
            'background-color': 'blue'
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

    // Should work with a classname
    expect(
      mergeStylesIntoViews({
          someView: {
            style: {
              color: 'red',
              'background-color': 'blue'
            },
            className: 'foo bar'
          }
        },
        props
      )
    ).toEqual(R.set(R.lensPath(['views', 'someView', 'className']), 'foo bar', expected));

  });

  test('mergeStylesIntoViewsForStyledComponent', () => {
    const props = {
      style: {
        'background-color': 'blue'
      },
      views: {
        // Some existing property foo that we don't care about
        someView: {foo: 1}
      }
    };
    // TODO replace with chakra
    // Should work with styled-components
    //const Button = styled.button`
    //         color: red;
//`;

    // if mergeStylesIntoViews encounters a styled component instead of a style object,
    // it sticks it at 'component' in the view
    const view =
      mergeStylesIntoViews(
        p => {
          return {
            // If we want these styles in our view, one of which is from props.style
            someView: Button // TODO replace with chakra styled(Button)`${p.style}`
          };
        },
        props
      ).views.someView;
    // TODO replace with chakra
    //expect(isStyledComponent(view.component)).toBeTruthy();
    const tree = renderer.create(
      e(view.component, props)
    ).toJSON();
    expect(tree).toHaveStyleRule('color', 'red');
    expect(tree).toHaveStyleRule('background-color', 'blue');

    // if mergeStylesIntoViews encounters a styled component instead of a style object,
    // it sticks it at 'component' in the view
    const anuddaView =
      mergeStylesIntoViews(
        p => {
          return {
            // If we want these styles in our view, one of which is from props.style
            someView: {component: Button, style: p.style}
          };
        },
        props
      ).views.someView;
    expect(isStyledComponent(anuddaView.component)).toBeTruthy();
    const annuddaTree = renderer.create(
      e(anuddaView.component, props)
    ).toJSON();
    expect(annuddaTree).toHaveStyleRule('color', 'red');
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
        onData: p => p.good,
        componentName: 'testComponent'
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
        onData: p => p.good,
        componentName: 'testComponent'
      },
      {
        queryRegions: true,
        mutateRegions: ['onError', 'onReady', 'onLoading']
      }
    );
    expect(func(
      {
        queryRegions: {networkStatus: 7},
        mutateRegions: {result: {error: true}},
        bad: 'bad'
      }
    )).toEqual('bad');

    expect(func(
      {
        queryRegions: {loading: true},
        mutateRegions: {result: {networkStatus: 7}},
        okay: 'okay'
      }
    )).toEqual('okay');

    expect(func(
      {
        queryRegions: {networkStatus: 7},
        // This matters because we're loading
        mutateRegions: {skip: false, result: {loading: true}},
        okay: 'okay'
      }
    )).toEqual('okay');

    expect(func(
      {
        queryRegions: {networkStatus: 7, data: {}},
        // This matters because ['onReady'] means skip has to be false
        mutateRegions: {skip: false, result: {loading: false}},
        good: 'good'
      }
    )).toEqual('good');

    expect(func(
      {
        queryRegions: {networkStatus: 7},
        // This matters because ['onReady'] means skip has to be false
        mutateRegions: {skip: true, result: {loading: true}},
        okay: 'okay'
      }
    )).toEqual('okay');

    // Since we aren't authenticated, we call onData to get the login form
    expect(renderChoicepoint({
        onError: (keys, p) => p.bad,
        onLoading: p => p.okay,
        onData: p => p.login,
        componentName: 'testComponent'
      },
      {
        isAuthenticated: ({onData}, propConfig, props) => {
          return reqStrPathThrowing('isAuthenticated', props) ? false : onData;
        },
        queryRegions: true,
        mutateRegions: ['onError', 'onReady', 'onLoading']
      },
      {
        isAuthenticated: false,
        queryRegions: {networkStatus: 7},
        // This matters because ['onReady'] means skip has to be false
        mutateRegions: {skip: true, result: {loading: true}},
        login: 'login'
      }
    )).toEqual('login');

    // Since we are authenticated, we'll call onLoading here because mutateRegions is loading
    expect(renderChoicepoint({
        onError: (keys, p) => p.bad,
        onLoading: p => p.okay,
        onData: p => p.login,
        componentName: 'testComponent'
      },
      {
        isAuthenticated: ({onError, onLoading, onData}, props) => {
          return R.ifElse(
            reqStrPathThrowing('isAuthenticated'),
            () => null,
            () => onData
          )(props);
        },
        queryRegions: true,
        mutateRegions: ['onError', 'onReady', 'onLoading']
      },
      {
        isAuthenticated: true,
        queryRegions: {networkStatus: 7},
        // This matters because ['onReady'] means skip has to be false
        mutateRegions: {skip: true, result: {loading: true}},
        okay: 'okay',
        login: 'login'
      }
    )).toEqual('okay');
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

  test('componentAndPropsFor', () => {
    // Should work with styled components
    // TODO replace with chakra
    /*
    const Button = styled.button`
              color: red;
              ${({style}) => style}
`;
     */
    const views = {
      fooView: {
        component: Button,
        bar: 1,
        style: {'background-color': 'red'}
      }
    };
    const [component, props] = componentAndPropsFor(views)('fooView');
    const renderedComponent = renderer.create(e(component, props)).toJSON();
    expect(renderedComponent).toHaveStyleRule('color', 'red');
    expect(renderedComponent).toHaveStyleRule('background-color', 'red');
    expect([component, props]).toEqual(
      [
        Button,
        {className: 'foo-view', style: {'background-color': 'red'}, key: 'fooView', bar: 1}
      ]
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
        props => ({
          aView: {onClick: 'someAction'}
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
          someAction: R.identity,
          data: {
            parentProp: 1
          }
        }
      )
    ).toEqual({
      someAction: R.identity,
      data: {
        parentProp: 1
      },
      views: {
        aView: {
          key: 'aView',
          onClick: R.identity,
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
            aView: {onClick: 'someAction.mutate'}
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
          someAction: {mutate: R.identity},
          data: {
            parentProp: 1
          }
        })
    ).toEqual({
      someAction: {mutate: R.identity},
      data: {
        parentProp: 1
      },
      views: {
        aView: {
          key: 'aView',
          onClick: R.identity,
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
        queryRegions: {error: null, loading: null, networkStatus: 7, data: {}},
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
        queryRegions: {error: null, loading: null, networkStatus: 7, data: {}},
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
        queryRegions: {error: null, loading: null, networkStatus: 7, data: {}},
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
        queryRegions: {error: null, loading: null, networkStatus: 7, data: {}},
        // Mutation function that is not ready
        mutateRegions: {mutation: R.identity, skip: true, result: {called: false, loading: false}},
        otherProps: 1
      })
    ).toEqual([]);
  });
});

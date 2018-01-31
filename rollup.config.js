import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import uglify from 'rollup-plugin-uglify';
import json from 'rollup-plugin-json';
import commonjs from 'rollup-plugin-commonjs';

const env = process.env.NODE_ENV;
const config = {
  input: 'src/index.js',
  plugins: [
    json(),
    nodeResolve({
      preferBuiltins: true,
      jsnext: true,
      extensions: [ '.ts', '.js', '.json' ]
    }),
    commonjs({
      include: [
        'node_modules/**'
      ],
      exclude: [
        'node_modules/process-es6/**'
      ],
      namedExports: {
        'node_modules/react/index.js': ['Children', 'Component', 'PropTypes', 'createElement'],
        'node_modules/react-dom/index.js': ['render']
      }
    })
  ]
};

if (env === 'es' || env === 'cjs') {
  config.output = {format: env};
  config.external = ['symbol-observable'];
  config.plugins.push(
    babel({
      exclude: ['node_modules/**'],
    })
  );
}

if (env === 'development' || env === 'production') {
  config.output = {format: 'umd'};
  config.output.name = 'Umd';
  config.plugins.push(
    babel({
      exclude: 'node_modules/**',
      plugins: ['external-helpers']
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(env)
    })
  );
}

if (env === 'production') {
  // Disabling due to useless error
  // [!] (uglify plugin) Error: Error transforming bundle with 'uglify' plugin: Can't handle constant of type: function

  /*
  config.plugins.push(
    uglify({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false
      }
    })
  );
  */
}

export default config;
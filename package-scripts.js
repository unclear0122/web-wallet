const {series, crossEnv, concurrent, rimraf} = require('nps-utils')

module.exports = {
  scripts: {
    default: 'serve',
    serve: 'nps webpack.serve',
    build: 'nps webpack.build',
    webpack: {
      default: 'nps webpack.serve',
      build: {
        before: rimraf('dist'),
        default: 'nps webpack.build.production',
        development: {
          default: series(
            'nps webpack.build.before',
            'webpack --progress -d'
          ),
          server: series.nps(
            'webpack.build.development',
            'server'
          ),
        },
        production: {
          default: series(
            'nps webpack.build.before',
            crossEnv('NODE_ENV=production webpack --progress --env.production')
          ),
          server: series.nps(
            'webpack.build.production',
            'server'
          ),
        }
      },
      serve: {
        default: `webpack-dev-server -d --devtool '#source-map' --inline --env.server`,
        hmr: `webpack-dev-server -d --devtool '#source-map' --inline --hot --env.server`
      },
    },
    server: 'http-server dist --cors',
  },
}

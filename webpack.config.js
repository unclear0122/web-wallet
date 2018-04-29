const path = require('path');

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');

const { ProvidePlugin } = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { AureliaPlugin, ModuleDependenciesPlugin } = require('aurelia-webpack-plugin');

let options = {
    env: 'dev',
    prod: false,
    coverage: false,
    analyze: false,
    devHost: 'localhost',
    devPort: 9000
}

module.exports = env => {

    if ((env && env.production) || ((process.env.NODE_ENV) && (process.env.NODE_ENV.toLowerCase().startsWith('prod')))) {
        options.env = 'prod';
        options.prod = true;
    }

    const ensureArray = (config) => config && (Array.isArray(config) ? config : [config]) || [];
    const when = (condition, config, negativeConfig) => condition ? ensureArray(config) : ensureArray(negativeConfig);

    const outDir = path.resolve(__dirname, 'dist');
    const srcDir = path.resolve(__dirname, 'src');
    const nodeModulesDir = path.resolve(__dirname, 'node_modules');
    const baseUrl = '/';

    return {

        resolve: {
            extensions: ['.js'],
            modules: [srcDir, 'node_modules', 'vendor'],
            alias: {
                '@fortawesome/fontawesome-free-solid$': '@fortawesome/fontawesome-free-solid/shakable.es.js'
            }
        },

        entry: {
            app: ['aurelia-bootstrapper']
        },

        mode: options.prod ? 'production' : 'development',

        // we explicitly optimize by including the uglify plugin, otherwise it runs twice
        // if didn't include it explicitly, this would run it automatically (if = true)
        optimization: {
            minimize: options.prod ? false : false
        },

        output: {
            path: outDir,
            publicPath: baseUrl,
            filename: options.prod ? '[name].[chunkhash].bundle.js' : '[name].[hash].bundle.js',
            sourceMapFilename: options.prod ? '[name].[chunkhash].bundle.map' : '[name].[hash].bundle.map',
            chunkFilename: options.prod ? '[name].[chunkhash].chunk.js' : '[name].[hash].chunk.js'
        },

        devServer: {
            contentBase: outDir,
            port: options.devPort,
            host: options.devHost,
            disableHostCheck: true,
            historyApiFallback: true,
            watchOptions: {
                aggregateTimeout: 500,
                poll: 3000
            }
        },

        devtool: options.prod ? 'nosources-source-map' : 'cheap-module-eval-source-map',

        module: {

            rules: [

                // HTML loader
                { test: /\.html$/, use: ['html-loader'], exclude: path.join(__dirname, 'index.html') },

                // HTML loader with minification options - can also implement general minication at different processing stage)
                //{ test: /\.html$/, use: [ 'raw-loader', 'html-minifier-loader' ], exclude: path.join(__dirname, 'index.html') },

                // JSON loader
                { test: /\.json$/, loader: "json-loader", exclude: [path.resolve(__dirname, 'node_modules'), path.resolve(__dirname, 'vendor')] },

                // CSS loader OLD
                // { test: /\.css?$/, use: [ 'style-loader', 'css-loader' ] },

                // CSS required in JS/TS files should use the style-loader that auto-injects it into the website
                // only when the issuer is a .js/.ts file, so the loaders are not applied inside html templates
                {
                    test: /\.css$/i,
                    issuer: [{ not: [{ test: /\.html$/i }] }],
                    use: options.prod ? ExtractTextPlugin.extract({
                        fallback: 'style-loader',
                        use: 'css-loader'
                    }) : ['style-loader', 'css-loader'],
                },
                {
                    test: /\.css$/i,
                    issuer: [{ test: /\.html$/i }],
                    // CSS required in templates cannot be extracted safely
                    // because Aurelia would try to require it again in runtime
                    use: 'css-loader'
                },

                // SCSSS
                {
                    test: /\.scss$/,
                    use: [{
                        loader: "style-loader"                  // inject CSS to page
                    }, {
                        loader: "css-loader",                   // translates CSS into CommonJS modules
                        options: {
                            sourceMap: true
                        }
                    }, {
                        loader: 'postcss-loader',               // Run post css actions
                        options: {
                            sourceMap: true,
                            plugins: function () {              // post css plugins, can be exported to postcss.config.js
                                return [
                                    require('precss'),
                                    require('autoprefixer')
                                ];
                            }
                        }
                    }, {
                        loader: "resolve-url-loader",
                        options: {
                            sourceMap: true
                        }
                    }, {
                        loader: "sass-loader",
                        options: {
                            sourceMap: true
                        }
                    }]
                },

                // JS
                {
                    test: /\.js$/i,
                    loader: 'babel-loader',
                    exclude: [nodeModulesDir, '/vendor/'],
                    options: options.coverage ? {
                        sourceMap: 'inline',
                        plugins: ['istanbul']
                    } : { 'plugins': ['lodash'] },
                },

                //
                // Fonts, Images & SVG
                //

                // embed small images and fonts as Data Urls and larger ones as files:
                { test: /\.(png|gif|jpg|cur)$/i, loader: 'url-loader', options: { limit: 8192 } },

                // This is the only one that seems to works with font-awesome
                { test: /\.(woff|woff2)(\?\S*)?$/, loader: 'url-loader?limit=100000&name=[name].[ext]' },

                // Default aurelia-cli version
                // { test: /\.woff2(\?v=[0-9]\.[0-9]\.[0-9])?$/i, loader: 'url-loader', options: { limit: 10000, mimetype: 'application/font-woff2' } },
                // { test: /\.woff(\?v=[0-9]\.[0-9]\.[0-9])?$/i, loader: 'url-loader', options: { limit: 10000, mimetype: 'application/font-woff' } },

                // load these fonts normally, as files
                { test: /\.(ttf|eot|svg|otf)(\?v=[0-9]\.[0-9]\.[0-9])?$/i, loader: 'file-loader' },

                // Bootstrap 4
                { test: /bootstrap\/dist\/js\/umd\//, use: 'imports-loader?jQuery=jquery' },

                // Bootstrap 3
                //{ test: /bootstrap-sass\/assets\/javascripts\//, use: 'imports-loader?jQuery=jquery' },

            ]

        },

        plugins: [

            new AureliaPlugin(),

            new ProvidePlugin({
                $: 'jquery',
                jQuery: 'jquery',
                Map: 'core-js/es6/map',
                WeakMap: 'core-js/es6/weak-map',
                Promise: 'core-js/es6/promise',
                regeneratorRuntime: 'regenerator-runtime', // await/async
            }),

            new ModuleDependenciesPlugin({
                'aurelia-testing': ['./compile-spy', './view-spy']
            }),

            new HtmlWebpackPlugin({
                template: 'index.ejs',
                minify: options.prod ? {
                    removeComments: true,
                    collapseWhitespace: false
                } : undefined,
                metadata: { // available in index.ejs
                    env: options.env,
                    baseUrl
                }
            }),

            new LodashModuleReplacementPlugin({
                'cloning': true,
                'collections': true
            }),

            new CopyWebpackPlugin([
                //{ from: 'favicon.ico', to: 'favicon.ico' },
                { from: 'config', to: 'config' },
                { from: 'static', to: 'static' }
            ]),

            //new webpack.DefinePlugin({
            //    PRODUCTION: JSON.stringify(true),
            //    NODE_ENV: JSON.stringify('production')
            //    //'process.env': {
            //    //  'NODE_ENV': JSON.stringify('production'),
            //    //}
            //}),

            ...when(options.prod, new ExtractTextPlugin({
                filename: options.prod ? '[chunkhash].css' : '[id].css',
                allChunks: true
            })),

            ...when(options.analyze, new BundleAnalyzerPlugin())

        ].concat(options.prod ? [

            // Prevents the inclusion of duplicate code into your bundle
            // new webpack.optimize.DedupePlugin(),

            new UglifyJsPlugin({
                uglifyOptions: {
                    ecma: 6,
                    ie8: false,
                    keep_fnames: true,
                    keep_classnames: true,
                    sourceMap: false,
                    mangle: {
                        reserved: ['BigInteger', 'ECPair', 'Point']
                    }
                }
            })

        ] : [

            ]),

        performance: {
            hints: false
        },

        //node: {
        //    console: true,
        //    fs: 'empty',
        //    net: 'empty',
        //    tls: 'empty',
        //    child_process: 'empty'
        //},

    };

}


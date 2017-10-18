// require('dotenv').config();

const webpack = require('webpack');
const path = require('path');
// const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const PATHS = {};
PATHS.dist = path.resolve(__dirname, 'public');
PATHS.src = path.resolve(__dirname, 'src');
PATHS.assets = path.resolve(PATHS.src, 'assets');
PATHS.assetName = 'assets/[name].[ext]';
PATHS.entry = {
  index: path.resolve(__dirname, 'src/index'),
  play: path.resolve(__dirname, 'src/play'),
  edit: path.resolve(__dirname, 'src/edit'),
};
PATHS.phaserModule = path.join(__dirname, '/node_modules/phaser-ce/build/custom');

const baseConfig = {

  context: __dirname,

  resolve: {
    alias: {
      pixi: path.join(PATHS.phaserModule, 'pixi.js'),
      p2: path.join(PATHS.phaserModule, 'p2.js'),
      phaser: path.join(PATHS.phaserModule, 'phaser-split.js'),
    },
  },
  
  module: {
    rules: [
      // Phase v2 isn't meant for webpack
      { test: /pixi\.js$/, use: [ 'expose-loader?PIXI' ] },
      { test: /p2\.js$/, use: [ 'expose-loader?p2' ] },
      { test: /phaser-split\.js$/, use: [ 'expose-loader?Phaser' ] },
      {
        test: /\.js$/,
        use: [{
          loader: 'babel-loader',
        }],
        include: PATHS.src,
      }, {
        test: /\.s?css$/,
        loaders: ExtractTextPlugin.extract({ fallback: 'style-loader', use: ['css-loader', 'sass-loader'] }),
        include: PATHS.css,
      }, {
        test: /\.(gif|jpe?g|png|svg)$/,
        loader: 'url-loader',
        query: {
          name: PATHS.assetName,
          limit: 10000,
        },
        include: PATHS.assets,
      }, {
        test: /\.ttf$/,
        loader: 'url-loader',
        query: {
          name: PATHS.assetName,
          limit: 10000,
        },
        include: PATHS.assets,
      },
    ],
  },
};

const sharedPlugins = [

  // new HtmlWebpackPlugin({
  //   title: 'GameShare',
  //   // template: path.resolve(PATHS.src, 'index.ejs'),
  //   // favicon: path.resolve(PATHS.assets, 'favicon.ico'),
  //   inject: 'body',
  // }),

  new ExtractTextPlugin({
    // filename: '[contenthash].css',
    filename: 'style.css',
    allChunks: true,
    disable: process.env.NODE_ENV === 'development',
  }),

];

if (process.env.NODE_ENV === 'production') {

  module.exports = Object.assign({ // PRODUCTION CONFIG
    
    entry: PATHS.entry,

    output: {
      path: PATHS.dist,
      filename: '[name].js',
      publicPath: '/',
    },

    plugins: [
      ...sharedPlugins,

      new CleanWebpackPlugin([ 'public' ]),
            
      new webpack.optimize.OccurrenceOrderPlugin(),

      new UglifyJsPlugin({
        parallel: true,
      }),

      // CommonsChunkPlugin: vendor must come before runtime
      // new webpack.optimize.CommonsChunkPlugin({
      //   name: 'vendor',
      //   minChunks: ({ resource }) => /node_modules/.test(resource),
      // }),
      
      // new webpack.optimize.CommonsChunkPlugin({
      //   name: 'runtime',
      // }),

      new OptimizeCssAssetsPlugin({
        cssProcessorOptions: { discardComments: { removeAll: true } },
      }),
      
      new webpack.DefinePlugin({
        'process.env': {
          // API_URL: JSON.stringify(process.env.API_URL),
          // API_KEY: JSON.stringify(process.env.API_KEY),
          NODE_ENV: JSON.stringify('production'),
        },
      }),
    ],
  }, baseConfig);

} else if (process.env.NODE_ENV === 'development') {

  // Add react-hot-loader to development
  baseConfig.module.rules[0].use.unshift({ loader: 'react-hot-loader/webpack' });

  module.exports = Object.assign({ // DEVELOPMENT CONFIG
    devtool: 'cheap-module-source-map',
    entry: {
      index: [ 'webpack-hot-middleware/client', PATHS.entry.index ],
      play: [ 'webpack-hot-middleware/client', PATHS.entry.play ],
      edit: [ 'react-hot-loader/patch', 'webpack-hot-middleware/client', PATHS.entry.edit ],
    },
    output: {
      path: PATHS.dist,
      filename: '[name].js',
      publicPath: '/public/',
    },
    plugins: [

      ...sharedPlugins,

      new webpack.NamedModulesPlugin(),

      new webpack.HotModuleReplacementPlugin(),

      new webpack.DefinePlugin({
        'process.env': {
          // API_URL: JSON.stringify('http://localhost:3000'),
          // API_KEY: JSON.stringify(process.env.API_KEY),
          NODE_ENV: JSON.stringify('development'),
        },
      }),

    ],
  }, baseConfig);

} else {
  throw new Error('Please provide NODE_ENV environment variable');
}

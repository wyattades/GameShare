// require('dotenv').config();

const webpack = require('webpack');
const path = require('path');
// const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const PATHS = {};
PATHS.dist = path.resolve(__dirname, 'public');
PATHS.src = path.resolve(__dirname, 'src');
PATHS.assets = path.resolve(PATHS.src, 'assets');
PATHS.assetName = 'assets/[name].[ext]';
PATHS.index = './src/index';

const baseConfig = {

  context: __dirname,
  
  module: {
    rules: [
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
    filename: '[contenthash].css',
    allChunks: true,
    disable: process.env.NODE_ENV !== 'production',
  }),

];

if (process.env.NODE_ENV === 'production') {

  module.exports = Object.assign({ // PRODUCTION CONFIG
    
    entry: [
      PATHS.index,
    ],

    output: {
      path: PATHS.dist,
      filename: '[name].[chunkhash].js',
      publicPath: '/',
    },

    plugins: [
      ...sharedPlugins,
      
      new webpack.optimize.OccurrenceOrderPlugin(),

      new UglifyJsPlugin({
        parallel: true,
      }),

      // CommonsChunkPlugin: vendor must come before runtime
      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        minChunks: ({ resource }) => /node_modules/.test(resource),
      }),
      
      new webpack.optimize.CommonsChunkPlugin({
        name: 'runtime',
      }),

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

} else {

  // Add react-hot-loader to development
  baseConfig.module.rules[0].use.unshift({ loader: 'react-hot-loader/webpack' });

  module.exports = Object.assign({ // DEVELOPMENT CONFIG
    devtool: 'cheap-module-source-map',
    entry: [
      'react-hot-loader/patch',
      // 'webpack-dev-server/client?http://localhost:8080',
      // 'webpack/hot/only-dev-server',
      'webpack-hot-middleware/client',
      PATHS.index,
    ],
    output: {
      path: PATHS.dist,
      filename: 'bundle.js',
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

}

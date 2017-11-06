// require('dotenv').config();

const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
// const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');


const PATHS = {};
PATHS.dist = path.resolve(__dirname, 'public');
PATHS.src = path.resolve(__dirname, 'src');
PATHS.assets = path.resolve(__dirname, 'assets');
PATHS.assetName = 'assets/[name].[ext]';
PATHS.entry = {};
  
const files = fs.readdirSync(PATHS.src);

for (let file of files) {
  const match = file.match(/^(.*)\.js$/);
  if (match) {
    PATHS.entry[match[1]] = path.resolve(PATHS.src, match[1]);
  }
}

const baseConfig = {

  context: __dirname,

  entry: PATHS.entry,
  
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [{
          loader: 'babel-loader',
        }],
        include: PATHS.src,
      }, {
        test: /\.pug$/,
        loader: 'pug-loader',
        options: {
          self: true,
        },
        include: PATHS.src,
      }, {
        test: /\.s?css$/,
        loaders: ExtractTextPlugin.extract({ fallback: 'style-loader', use: ['css-loader', 'sass-loader'] }),
        include: PATHS.css,
      }, {
        test: /\.(gif|jpe?g|png|svg)(\?\w+=[\d.]+)?$/,
        loader: 'url-loader',
        options: {
          name: PATHS.assetName,
          limit: 10000,
        },
        // include: PATHS.assets,
      }, {
        test: /\.(ttf|eot|woff|woff2)(\?\w+=[\d.]+)?$/,
        loader: 'url-loader',
        options: {
          name: PATHS.assetName,
          limit: 10000,
        },
        // include: PATHS.assets,
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

  // Add hot-middleware to each entry point
  for (let key in baseConfig.entry) {
    if (baseConfig.entry.hasOwnProperty(key)) {
      baseConfig.entry[key] = [ 'webpack-hot-middleware/client', baseConfig.entry[key] ];
    }
  }

  module.exports = Object.assign({ // DEVELOPMENT CONFIG
    devtool: 'cheap-module-source-map',
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

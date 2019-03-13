const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const ModernizrWebpackPlugin = require('modernizr-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    app: [
      'babel-polyfill',
      path.resolve(__dirname, './src/client/js/main.js'),
      path.resolve(__dirname, './assets/data/maps/world_client.js'),
    ],
    assets: [
      // stylesheets
      path.resolve(__dirname, './build/modernizr-bundle.js'),
      path.resolve(__dirname, './css/main.scss'),
      // client config
      path.resolve(__dirname, './src/client/config.json'),
      // data
      path.resolve(__dirname, './assets/data/sprites.json'),
      // maps
      path.resolve(__dirname, './assets/data/maps/world_client.json'),
    ],
    vendor: [
      'socket.io-client',
      'jquery',
      'bootstrap',
      'popper.js',
      'underscore',
    ],
  },
  devtool: 'cheap-source-map',
  output: {
    pathinfo: true,
    path: path.resolve(__dirname, 'build'),
    publicPath: './',
    library: '[name]',
    libraryTarget: 'umd',
    filename: '[name].js',
  },
  watch: true,
  plugins: [
    new HtmlWebpackPlugin({
      filename: '../index.html',
      template: './src/client/index.html',
      chunks: ['vendor', 'app', 'assets'],
      chunksSortMode: 'manual',
      minify: {
        removeAttributeQuotes: false,
        collapseWhitespace: false,
        html5: false,
        minifyCSS: false,
        minifyJS: false,
        minifyURLs: false,
        removeComments: false,
        removeEmptyAttributes: false,
      },
      hash: false,
    }),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
    new BrowserSyncPlugin({
      host: process.env.IP || 'localhost',
      port: process.env.PORT || 3000,
      server: {
        baseDir: ['./build', './'],
      },
      socket: {
        clients: {
          heartbeatTimeout: 80000,
        },
      },
      watchOptions: {
        awaitWriteFinish: true,
      },
    }, {
      reload: false,
    }),
    new ModernizrWebpackPlugin({
      'feature-detects': ['input', 'canvas', 'css/resize'],
      output: {
        comments: true,
        beautify: true,
      },
    }),
  ],
  module: {
    rules: [{
      test: /\.js$/,
      use: ['babel-loader'],
      include: path.join(__dirname, 'src'),
    },
    // raw files
    {
      test: [/\.vert$/, /\.frag$/],
      use: 'raw-loader',
    },
    // css
    {
      test: /\.(sa|sc|c)ss$/,
      use: ['style-loader', 'css-loader', 'sass-loader'],
    },
    // images
    {
      test: /.(jpg|png|gif)(\?[a-z0-9]+)?$/,
      use: [{
        loader: 'file-loader',
        options: {
          name: '[path][name].[ext]',
        },
      }],
    },
    // audio
    {
      test: /.(mp3)(\?[a-z0-9]+)?$/,
      use: [{
        loader: 'file-loader',
        options: {
          name: '[path][name].[ext]',
        },
      }],
    },
    // fonts
    {
      test: /.(ttf|otf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
      use: [{
        loader: 'file-loader',
        options: {
          name: '[path][name].[ext]',
        },
      }],
    },
    ],
  },
};

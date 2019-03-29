const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const commonPaths = require('./paths');

const envKeys = Object.keys(process.env).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(process.env[next]);
  return prev;
}, {});

module.exports = {
  entry: commonPaths.entryPath,
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.(js|jsx)$/,
        loader: 'eslint-loader',
        exclude: /(node_modules)/,
        options: {
          emitWarning: process.env.NODE_ENV !== 'production',
        },
      },
      {
        test: /\.md$/,
        use: 'raw-loader',
      },
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: /(node_modules)/,
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: commonPaths.imagesFolder,
            },
          },
        ],
      },
      {
        test: /\.ico$/,
        exclude: /node_modules/,
        loader: 'file-loader?name=img/[path][name].[ext]&context=./app/images',
      },
      {
        test: /\.(woff2|ttf|woff|eot)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: commonPaths.fontsFolder,
            },
          },
        ],
      },
      {
        test: /\.(svg)$/i,
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'react-svg-loader',
            query: {
              svgo: {
                plugins: [
                  {
                    removeTitle: false,
                  },
                ],
                floatPrecision: 2,
              },
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['*', '.js', '.jsx'],
  },
  plugins: [
    new CleanWebpackPlugin([commonPaths.outputPath]),
    new webpack.ProgressPlugin(),
    new HtmlWebpackPlugin({
      favicon: 'favicon.ico',
      baseUrl: process.env.NODE_ENV === 'development' ? 'http://localhost:3000/' : '/',
      template: commonPaths.templatePath,
    }),
    new webpack.DefinePlugin(envKeys),
  ],
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
};

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const commonPaths = require('./paths');

module.exports = {
  mode: 'production',
  output: {
    filename: `${commonPaths.jsFolder}/[name].[hash].js`,
    path: commonPaths.outputPath,
    publicPath: '/',
    chunkFilename: '[name].[chunkhash].js',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              sourceMap: true,
            },
          },
          'sass-loader',
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin([commonPaths.outputPath.split('/').pop()], {
      root: commonPaths.root,
    }),
    new MiniCssExtractPlugin({
      filename: `${commonPaths.cssFolder}/[name].css`,
      chunkFilename: '[id].css',
    }),
  ],
  devtool: 'source-map',
};

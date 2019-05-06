const commonPaths = require('./paths');

module.exports = {
  mode: 'development',
  entry: [
    commonPaths.entryPath, // the entry point of our app
  ],
  output: {
    filename: '[name].js',
    path: commonPaths.outputPath,
    publicPath: '/',
    chunkFilename: '[name].js',
  },
  optimization: {
    splitChunks: {
      chunks: 'async',
    },
  },
  module: {
    rules: [
      {
        test: /\.(css|scss)$/,
        use: [
          'style-loader',
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
  devServer: {
    port: 3000,
    open: true,
    proxy: {
      '/api': 'http://localhost:8888',
    },
  },
};

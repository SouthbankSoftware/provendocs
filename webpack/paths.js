const path = require('path');

module.exports = {
  root: path.resolve(__dirname, '../'),
  outputPath: path.resolve(__dirname, '../', 'dist/public'),
  entryPath: path.resolve(__dirname, '../', 'src/client/index.jsx'),
  templatePath: path.resolve(__dirname, '../', 'src/client/templates/index.ejs'),
  imagesFolder: 'images',
  fontsFolder: 'fonts',
  cssFolder: 'css',
  jsFolder: 'js',
};

var path = require('path');

var WebpackConfig = require('webpack-config');


module.exports = new WebpackConfig()
    .extend(path.resolve(__dirname, './loaders.js'));

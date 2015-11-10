var path = require('path');

var WebpackConfig = require('webpack-config');


module.exports = new WebpackConfig()
    .extend(path.resolve(__dirname, './loaders.js'))
    .merge({
        context: path.resolve(__dirname, '..'),
        entry: {
            client: path.resolve(__dirname, '../src/index')
        },
        output: {
            path: path.join(__dirname, '../dist'),
            filename: 'similarity.js',
            library: 'similarity'
        }
    });

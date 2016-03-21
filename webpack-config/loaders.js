var path = require('path');

var WebpackConfig = require('webpack-config');


module.exports = new WebpackConfig().merge({
    module: {
        loaders: [
            {
                test: /\.js$/,
                include: path.resolve(__dirname, '../src'),
                loader: 'babel',
                query: {
                    cacheDirectory: true,
                    presets: ['es2015']
                }
            },
            {
                test: /\.jade$/,
                include: path.resolve(__dirname, '../templates'),
                loader: 'jade'
            },
            {
                test: /\.less$/,
                include: path.resolve(__dirname, '../style'),
                loader: 'style!css?sourceMap!postcss?sourceMap!less?sourceMap'
            },
            {
                test: /\.png$/,
                include: path.resolve(__dirname, '../assets'),
                loader: "url?limit=100000"
            }
        ]
    }
});

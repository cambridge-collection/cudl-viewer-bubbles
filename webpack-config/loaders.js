var path = require('path');

var Config = require('webpack-config').Config;


module.exports = new Config().merge({
    module: {
        rules: [
            {
                test: /\.js$/,
                include: path.resolve(__dirname, '../src'),
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.jade$/,
                include: path.resolve(__dirname, '../templates'),
                loader: 'pug-loader'
            },
            {
                test: /\.less$/,
                include: path.resolve(__dirname, '../style'),
                use: [
                    'style-loader',
                    'css-loader',
                    'postcss-loader',
                    'less-loader'
                ]
            },
            {
                test: /\.png$/,
                include: path.resolve(__dirname, '../assets'),
                use: {
                    loader: 'url-loader',
                    options: { limit: 100000 }
                }
            }
        ]
    }
});

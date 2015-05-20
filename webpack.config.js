var path = require('path');

module.exports = {
    // configuration
    context: __dirname,
    entry: './bubbles',
    devtool: 'source-map',
    stats: {
        colors: true,
        reasons: true
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            {
                test: /\.js$/, exclude: /node_modules/,
                loader: require.resolve('babel-loader')
            },
        ]
    }
};

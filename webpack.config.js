var path = require('path');

var ExtractTextPlugin = require('extract-text-webpack-plugin');


module.exports = {
    // configuration
    context: __dirname,
    entry: {
        client: './src/bootstrap'
    },
    devtool: 'source-map',
    stats: {
        colors: true,
        reasons: true
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'similarity.js',
        library: 'similarity'
    },
    externals: [
        // Map external dependencies provided by cudl-viewer where we're loaded
        {
            // jQuery is already present in the cudl site
            'jquery': 'var jQuery',
            // The cudl global properties and functions
            'cudl': 'var cudl',
            'spin': 'var Spinner'
        }
    ],
    module: {
        loaders: [
            {
                test: /\.js$/, exclude: /node_modules/,
                loader: require.resolve('babel-loader')
            },
            {
                test: /\.jade$/, exclude: /node_modules/,
                loader: require.resolve('jade-loader')
            },
            {
                test: /\.less$/,
                loader: ExtractTextPlugin.extract(
                    'style-loader',
                    'css-loader?sourceMap!postcss-loader?sourceMap!less-loader?sourceMap')
            },
            { test: /\.png$/, loader: "url-loader?limit=100000" },
        ]
    },
    plugins: [
        new ExtractTextPlugin('similarity.css', {allChunks: true})
    ]
};

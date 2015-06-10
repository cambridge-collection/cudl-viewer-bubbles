var path = require('path');

module.exports = {
    // configuration
    context: __dirname,
    entry: './src/index',
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
            'cudl': 'var cudl'
        }
    ],
    module: {
        loaders: [
            {
                test: /\.js$/, exclude: /node_modules/,
                loader: require.resolve('babel-loader')
            },
        ]
    }
};

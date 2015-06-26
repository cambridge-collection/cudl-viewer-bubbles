var _ = require('lodash');
var webpackConfig = require('./webpack.config');

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        webpack: {
            once: webpackConfig,
            watch: _.assign({}, webpackConfig, {
                watch: true,
                keepalive: true
            })
        }
    });

    grunt.loadNpmTasks('grunt-webpack');

    // Default task(s).
    grunt.registerTask('default', ['jshint']);

};

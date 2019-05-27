// Gruntfile for the JS build

var webpack = require('webpack');
var path = require('path');

var ClosurePlugin = require('closure-webpack-plugin');

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    webpack: {
      lib: {
        mode: 'production',
        entry: './src/phase_vocoder.js',
        devtool: "source-map",
        output: {
          path: path.resolve(__dirname, './dist'),
          filename: "PhaseVocoder.js",
          libraryTarget: 'umd',
          library: 'PhaseVocoder'
        },
        optimization: { minimize: false }
      },
      minlib: {
        mode: 'production',
        entry: './src/phase_vocoder.js',
        devtool: "source-map",
        output: {
          path: path.resolve(__dirname, './dist'),
          filename: "PhaseVocoder.min.js",
          libraryTarget: 'umd',
          library: 'PhaseVocoder'
        },
        optimization: {
          minimizer: [
            new ClosurePlugin({mode: 'STANDARD'}, {
              'compilation_level': 'ADVANCED_OPTIMIZATIONS'
            })
          ]
        }
      },
      test: {
        mode: 'production',
        entry: './src/test.js',
        devtool: "source-map",
        output: {
          path: path.resolve(__dirname, './dist'),
          filename: 'test.js',
          libraryTarget: 'var',
          library: 'test'
        },
        optimization: { minimize: false }
      }
    }
  });

  grunt.loadNpmTasks('grunt-webpack');
  grunt.registerTask('default', ['webpack']);

};

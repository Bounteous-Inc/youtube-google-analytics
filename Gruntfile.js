var fs = require('fs');
var jsBeautify = require('js-beautify').js_beautify;

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        footer: ['',
                 '/*',
                 ' * Configuration Details',
                 ' *',
                 ' * @property events object',
                 ' * Defines which events emitted by YouTube API',
                 ' * will be turned into Google Analytics or GTM events',
                 ' *',
                 ' * @property percentageTracking object',
                 ' * Object with configurations for percentage viewed events',
                 ' *',
                 ' *   @property each array',
                 ' *   Fires an event once each percentage ahs been reached',
                 ' *',
                 ' *   @property every number',
                 ' *   Fires an event for every n% viewed',
                 ' *',
                 ' * @property forceSyntax int 0, 1, or 2',
                 ' * Forces script to use Classic (2) or Universal(1)',
                 ' *',
                 ' * @property dataLayerName string',
                 ' * Tells script to use custom dataLayer name instead of default',
                 ' */'].join('\r\n')
      },
      build: {
        src: './lunametrics-youtube.gtm.js',
        dest: './lunametrics-youtube.gtm.min.js'
      }
    },
    fixConfig: {
      options: {
        build: {
          src: './lunametrics-youtube.gtm.min.js',
          dest: './lunametrics-youtube.gtm.min.js'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('fixConfig', [], function() {

    var options = this.options();
    var data = fs.readFileSync(options.build.src, 'utf-8');
    var minifiedConfig = data.split('/*')[0].match(/\(.*?\)/g).pop();
    var config = minifiedConfig.replace(/!0/g, 'true').replace(/!1/g, 'false');
    var beautifiedConfig = jsBeautify(config);
    var data = data.replace(minifiedConfig, '\n' + beautifiedConfig);
    fs.writeFileSync(options.build.dest, data);  

  });
  grunt.registerTask('default', ['uglify', 'fixConfig']);


};

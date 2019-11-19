module.exports = function(grunt) {

    // Configure main project settings
    
    grunt.initConfig({
        // Load basic settings and info about plugins
        pkg: grunt.file.readJSON('package.json'),

        // Plugins

        terser: {
          options: {
            keep_classnames: false,
            keep_fnames: false,
          },

          build: {
            src: 'build/<%= pkg.name %>.js',
            dest: 'build/<%= pkg.name %>.min.js'
          }
        },


        concat: {
          options: {
            separator: ';\n'
          },

          build: {
            src: 'src/**/*.js',
            dest: 'build/<%= pkg.name %>.js'
          }
        },

        jshint: {
          // define the files to lint
          files: ['Gruntfile.js', 'src/**/*.js'],
          // configure JSHint (documented at http://www.jshint.com/docs/)
          options: {
            // more options here if you want to override JSHint defaults
            globals: {
              jQuery: true,
              console: true,
              module: true
            },

            'esversion': 6
          }
        },

        watch: {
          files: ['src/**/*.js'],
          tasks: ['default']
        },

        imagemin: {
          static: {
              options: {
                  optimizationLevel: 3,
                  svgoPlugins: [{removeViewBox: false}]
              }
          },
          dynamic: {
              files: [{
                  expand: true,
                  cwd: 'src/',
                  src: ['sprites/*.{png,jpg,gif}'],
                  dest: 'build/'
              }]
          }
      },

      clean: {
        build: ['build/*.js']
      }
    });

    // Load the plugins that provide tasks
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-terser');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');

    // Run default tasks
    grunt.registerTask('default', ['jshint', 'clean', 'imagemin', 'concat', 'terser']);
};
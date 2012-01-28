config.init({

  mockup: {

    // subprop is the basedir name
    mockup: {

      // list of glob patterns for our page list. This can
      // include any html or markdown files.
      pages: ['pages/*.html', 'pages/*.md'],

      // list of glob patterns for our data. The template / data
      // mapping is simple and based on page filename.
      data: ['data/*.json'],

      // The list of static assets to copy over `output/`, basically
      // a simple synchronous copy.
      assets: ['assets/**'],

      // The output basedir
      output: 'output/'
    }
  },

  watch: {
    files: ['mockup/pages/*', 'mockup/data/*.json', 'mockup/assets/**'],
    tasks: 'waitalittle mockup emit:reload'
  },

  serve: {
    'mockup/output': {
      port: 3001,
      logs: 'default',
      dirs: true
    }
  },

  emit: {
    reload: {
      config: 'socket',
      event: 'changed'
    }
  }
});

task.registerTask('default', 'mockup');
task.registerTask('mockup:serve', 'mockup serve');
task.registerTask('mockup:reload', 'mockup serve watch');

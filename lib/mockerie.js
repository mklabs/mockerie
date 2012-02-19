
var mockerie = exports,
  fs = require('fs'),
  path = require('path');

var grunt = require('grunt');
task.init([]);

var builtinpath = path.join(__dirname, 'tasks');

// map over the `tasks` dir, setup all tasks as lazy-loaded getters
mockerie.tasks = fs.readdirSync(builtinpath)
  .map(resolveTo(builtinpath))
  .filter(function(file) { return fs.statSync(file).isFile(); })
  .map(function(file) {
    return path.basename(file).replace(path.extname(file), '');
  });

mockerie.run = function run(t, options, cb) {
  option.init(options || {});

  task.registerTask('mockup:serve', 'mockup serve');
  task.registerTask('mockup:reload', 'mockup serve watch');

  option.init({
    tasks: [path.join(__dirname, 'tasks')],
    debug: '9'
  });

  config.init(options);

  task.init(mockerie.tasks, true);

  task.run(t || 'default');

  task.options({
    error: function(e) {
      fail.warn(e, 3);
    },
    done: function() {
      fail.report();
      cb();
    }
  });

  task.start();
};


function resolveTo(prefix) { return function(f) {
  return path.resolve(prefix, f);
}}


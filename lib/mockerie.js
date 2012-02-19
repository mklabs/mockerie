
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

// main task running helper.
// * t: task(s) to run, default is default..
// * opts: cli options as parsed by nopt
// * options: task configuration, usually a gruntfile
// * cb: callback to run on completion
mockerie.run = function run(t, opts, options, cb) {
  if(!cb) { cb = options; options = {}; }
  if(!cb) { cb = opts; opts = {}; }
  if(!cb) cb = function() {};

  task.registerTask('mockup:serve', 'mockup serve');
  task.registerTask('mockup:reload', 'mockup serve watch');

  opts = underscore.extend({ debug: '9' }, opts);

  // loading additionnal tasks
  opts.tasks = (opts.tasks || []).concat([path.join(__dirname, 'tasks')]);

  option.init(opts);
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


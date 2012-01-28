
var fs = require('fs'),
  path = require('path');

// Grunt tasks

// Override of the built-in init task by this custom one.
//

task.registerInitTask('init', 'Initialize a new mockup', function(name) {

  // Valid init templates (.js files).
  var templates = {};

  // path to the init templates
  var dirpath = path.join(__dirname, this.name);

  fs.readdirSync(dirpath).forEach(function(filename) {
    var filepath = path.join(dirpath, filename);
    if (!fs.statSync(filepath).isFile() || path.extname(filepath) !== '.js') return;
    // Add template (plus its path) to the templates object.
    templates[path.basename(filename, '.js')] = path.join(dirpath, filename);
  });

  // Abort if a valid template was not specified.
  if (!(name && name in templates)) {
    log.error('A valid template name must be specified. Valid templates are: ' +
      log.wordlist(Object.keys(templates)) + '.');
    return false;
  }


  // Abort if a gruntfile was found (to avoid accidentally nuking it).
  if (path.existsSync(path.join(process.cwd(), 'grunt.js'))) {
    fail.warn('Beware, grunt.js file already exists.');
  }

  // This task is asynchronous.
  var taskDone = this.async();

  // the scaffolder module
  var scaffolder = require(templates[name]);

  // Useful init sub-task-specific utilities.
  var init = {
    copy: function(obj, i) {
      verbose.or.write('Writing ' + obj.dest.replace(process.cwd(), '') + '...');
      mkdirp.sync(path.dirname(obj.dest), 0755);
      fs.writeFileSync(obj.dest, fs.readFileSync(obj.src));
      verbose.or.ok();
    }
  };

  scaffolder.call(this, name, init, function(err) {
    // Fail task if a first arg error passed
    if(err) return fail.warn(err);
    // Fail task if errors were logged.
    if (task.hadErrors()) return taskDone(false);
    // Otherwise, print a success message.
    log.writeln().writeln('Initialized from template "' + name + '".');
    // All done!
    taskDone();

  });
});

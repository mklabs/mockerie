/*
 * grunt
 * https://github.com/cowboy/grunt
 *
 * Copyright (c) 2012 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 * http://benalman.com/about/license/
 */

var fs = require('fs');
var path = require('path');

// ============================================================================
// TASKS
// ============================================================================


// Override of the built-in watch task by this custom one. Required to use this task on
// windows where fs.watch must be used. Done here to test things out as it's not coming
// without some issue, namely on unwatchFile which does't seem to properly "unwatch" when
// fs.watch was used, but works good when fs.watchFile was used. To avoid this problem
// which might raise an EMFILE error (too many file descriptors open), files that
// were "watched" using fs.watch must use the the FS.FSWatcher instance to call the
// `watcher.close` method: http://nodejs.org/docs/latest/api/fs.html#watcher.close

// don't override the builtin in other system than windows, cause current
// current implementation works great enough. With a little bit more tests,
// maybe this can go through other platforms too
if(process.platform !== 'win32') return;

task.registerTask('watch', 'Run predefined tasks whenever watched files change.', function(prop) {

  var props = ['watch'];
  // If a prop was passed as the argument, use that sub-property of watch.
  if (prop) { props.push(prop); }
  // Get the files and tasks sub-properties.
  var filesProp = props.concat('files');
  var tasksProp = props.concat('tasks');

  // Fail if any required config properties have been omitted.
  config.requires(filesProp, tasksProp);

  log.write('Waiting...');

  // This task is asynchronous.
  var taskDone = this.async();
  // The files to be watched.
  var getFiles = file.expand.bind(file, config(filesProp));
  var files = getFiles();
  // the array of FS.watcher instances
  var watched = [];
  // The tasks to be run.
  var tasks = config(tasksProp);
  // This task's name + optional args, in string format.
  var nameArgs = this.nameArgs;
  // An ID by which the setInterval can be canceled.
  var intervalId;
  // File changes to be logged.
  var changes = [];

  // Define an alternate fail "warn" behavior.
  fail.warnAlternate = function() {
    task.clearQueue().run(nameArgs);
  };

  // Cleanup when files have changed. This is debounced to handle situations
  // where editors save multiple files "simultaneously" and should wait until
  // all the files are saved.
  var done = underscore.debounce(function() {
    // Clear the files-added setInterval.
    clearInterval(intervalId);
    // Ok!
    log.ok();
    changes.forEach(function(obj) {
      // Log which file has changed, and how.
      log.ok('File "' + obj.filepath + '" ' + obj.status + '.');
      // Clear the modified file's cached require data.
      file.clearRequireCache(obj.filepath);
    });
    // Unwatch all watched files.
    //files.forEach(fs.unwatchFile);

    watched.forEach(function(watcher) {
      watcher.close();
    });

    // Enqueue all specified tasks, followed by this task (so that it loops).
    task.run(tasks).run(nameArgs);
    // Continue task queue.
    taskDone();
  }, 250);

  function change(status, filepath) {
    // Push changes onto array for later logging.
    changes.push({filepath: filepath, status: status});
    // Execute debounced done function.
    done();
  }

  // Watch existing files for changes.
  files.forEach(function(filepath) {
    var watcher = fs.watch(filepath, function(ev, filename) {
      if(!filename) return;
      change(ev, filepath);
    });
    watched.push(watcher);
  });

  // Files that have been added.
  var addedFiles = [];
  // Watch for files to be added.
  intervalId = setInterval(function() {
    // Files that have been added since last execution.
    var difference = underscore.difference(getFiles(), files, addedFiles);
    // Store added files for possible future "difference" test.
    addedFiles = addedFiles.concat(difference);
    // Call "change" once for each added file.
    difference.forEach(change.bind(this, 'added'));
  }, 200);
});

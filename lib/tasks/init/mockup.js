// mockup

module.exports = function(name, init, done) {

  // Files to copy and process
  var files = file.expand(path.resolve(__dirname, name, '**'))
    .filter(function(s) { return s.charAt(s.length - 1) !== '/'; })
    .map(function(filepath) {

      // if we got a grunt.. copy to cwd/grunt.js (not mockup/grunt.js)
      var destpath = path.basename(filepath) === 'grunt.js' ?
        path.resolve(path.basename(filepath)) :
        path.join(process.cwd(), path.resolve(filepath).replace(__dirname, ''));

      return {
        src: path.resolve(filepath),
        dest: destpath
      };
    });


  files.forEach(init.copy);

  // All done!
  done();

};
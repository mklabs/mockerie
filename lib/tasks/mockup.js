
var fs = require('fs');
  path = require('path'),
  mkdirp = require('mkdirp'),
  rimraf = require('rimraf'),
  plates = require('plates'),
  mustache = require('mustache'),
  ghm = require('github-flavored-markdown');

// very much inspired by stenson/inca
//
// The idea is that any files in `mockup/pages` are plates templates (flatiron/plates)
// and there'll be passed any data stored in `mockup/data`. The matching is simply done
// by checking the page filename looking up according `mockup/data/pagename.json`.
//
// Optionnaly, just thinking loud here, it can be used along marak/faker to generate
// fake data (so maybe files in mockup/data/ won't be raw JSON but JS)
task.registerBasicTask('mockup', 'Generates the sites mockup', function(data, name) {

  // First, let's compile any template found in `pages`, store them
  // in the `templates` hash object. Subprop are template filename, value
  // is the precompiled (kinda) function for that template.
  var templates = task.helper('mockup-templates', name, data);

  // Secondly, grab each data.json file stored in `data` and store
  // in a giant data hash object
  var json = task.helper('mockup-data', name, data);

  // Third, compute and store each html output
  var output = task.helper('mockup-output', templates, json);

  // Fourth, generate the new site's content, from the output hash object.
  task.helper('mockup-generate', name, data, output);
});

// Grunt helpers

task.registerHelper('mockup-templates', function(name, data) {
  var files = file.expand(data.pages.map(function(f) { return path.resolve(name, f); }))
    layout = files.filter(function(f) { return path.basename(f) === 'layout.html'; })[0],
    layoutMarkdown = files.filter(function(f) { return path.basename(f) === 'layout.md.html'; })[0],
    templates = {};

  // Deal with the special layout.html file, nested each other
  // template `body` into the `{{{ body }}}` placeholder of our layout
  if(!layout) return fail.warn('Missing layout.html file', 3);
  layout = fs.readFileSync(layout, 'utf8');

  // optionnal specific to markdown files layout, fallback to basically
  // nothing if nothing found
  layoutMarkdown = layoutMarkdown ? fs.readFileSync(layoutMarkdown, 'utf8') : '{{{ body }}}';

  // filter out the layout template from files to generate
  files = files.filter(function(f) { return path.basename(f) !== 'layout.html'; });

  files.forEach(function(file) {

    // precompile each files template.
    //
    // There are two main page types: html and markdown. Templates are
    // "decorated" by a layout template. The main one `layout.html` is
    // mandatory and is used for any html template, an optionnal
    // `layout.md.html` if there is then used on top of markdown pages.
    //
    // In the case of html templates, the default plates template engine
    // is used. If you need a little more flexibility, you may use the
    // mustache syntax in your templates ( `{{ something }}`). If some
    // mustache are detected, the rendering engine switch to mustache.
    templates[path.basename(file).replace(path.extname(file), '')] = (function() {
      var html = fs.readFileSync(file, 'utf8');
      return function() {
        var md = !!~['.md', '.markdown', '.mkd'].indexOf(path.extname(file)),
          stache = /{{{?[^}]+}}}?/.test(html),
          body = md ? ghm.parse(html).replace(/<br\s?\/>/g, ' ') :
            stache ? mustache.to_html(html, arguments[0]):
            plates.bind(html, arguments[0], arguments[1]);

        return (md ? layoutMarkdown : layout).replace(/{{{ body }}}/g, body);
      };
    })();
  });

  return templates;
});

task.registerHelper('mockup-data', function(name, data) {
  var files = file.expand(data.data.map(function(f) { return path.resolve(name, f); }))
    data = {};

  files.forEach(function(file) {
    data[path.basename(file).replace(path.extname(file), '')] = JSON.parse(fs.readFileSync(file, 'utf8'));
  });

  return data;
});

task.registerHelper('mockup-output', function(templates, data) {
  var output = {};

  Object.keys(templates).forEach(function(key) {
    var tmpl = templates[key],
      json = data[key] || {};
    output[key] = tmpl(json);
  });

  return output;
});

task.registerHelper('mockup-generate', function(name, data, output, cb) {
  var files = file.expand(data.assets.map(function(f) { return path.resolve(name, f); })),
    to = path.resolve(name, data.output),
    base = path.resolve(name),
    assets = files
      .filter(function(p) { return p.charAt(p.length - 1) !== '/'; })
      .map(function(asset) {
        return {
          from: asset,
          to: path.resolve(to, asset.replace(path.basename(base) + '/', ''))
        };
      });

  rimraf.sync(to);

  // Generate the static files in output, a basic sync copy
  assets.forEach(function(asset) {
    mkdirp.sync(path.dirname(asset.to), 0755);
    fs.writeFileSync(asset.to, fs.readFileSync(asset.from));
  });

  // then generate the individual pages
  Object.keys(output).forEach(function(page) {
    var out = path.resolve(to, page + '.html'),
      content = output[page];

    log.subhead('Generating ' + page);
    log.writeln('  into ' + out);

    file.write(out, content);
  });

});

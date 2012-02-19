
var fs = require('fs');
  path = require('path'),
  mkdirp = require('mkdirp'),
  rimraf = require('rimraf'),
  plates = require('plates'),
  mustache = require('mustache'),
  jsonlint = require('jsonlint'),
  yaml = require('js-yaml').load,
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

  // First thing first, reinit the error stack on each run
  config('mockup_errors', []);

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
  var files = file.expand(data.pages.map(function(f) { return path.resolve(name, f); })),
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


  files = files
    // filter out the layout template from files to generate
    .filter(function(f) { return path.basename(f) !== 'layout.html'; })
    // filter out any folder we might get on windows, ending with `/`
    .filter(function(f) { return f.slice(-1) !== '/'; });

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
    //
    // Partials are supported in mustache templates. To include a partial, use
    // underscores instead of slashed in your path, and leave off the
    // extension.

    var tmplKey = file.replace([name, path.dirname(data.pages), ''].join('/'), '').replace(path.extname(file), '');
    templates[tmplKey] = (function() {
      var html = fs.readFileSync(file, 'utf8');
      return function() {
        var md = !!~['.md', '.markdown', '.mkd'].indexOf(path.extname(file)),
          stache = /{{{?[^}]+}}}?/.test(html),
          body = md ? ghm.parse(html).replace(/<br\s?\/>/g, ' ') :
            stache ? mustache.to_html(html, arguments[0], computePartials(html, file)) :
            plates.bind(html, arguments[0], arguments[1]);

        // figure out the layout to use, looking up for config placeholder in the current file
        var pagelayout = lookupConfig(body).layout;
        pagelayout = pagelayout && path.extname(pagelayout) !== '.html' ? pagelayout + '.html' : pagelayout;
        pagelayout = pagelayout ?
          fs.readFileSync(path.resolve(name, 'pages', pagelayout), 'utf8') :
          layout;

        return (md ? layoutMarkdown : pagelayout).replace(/{{{ body }}}/g, body);
      };
    })();
  });

  return templates;
});

task.registerHelper('mockup-data', function(name, data) {
  var files = file.expand(data.data.map(function(f) { return path.resolve(name, f); }))
    data = {};

  files.forEach(function(file) {
    data[path.basename(file).replace(path.extname(file), '')] = readJSON(file);
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
        var filepath = asset
          .replace(process.cwd(), '')
          .replace(path.basename(base), '')
          .replace(/^\/+/, '');

        return {
          from: asset,
          to: path.resolve(to, filepath)
        };
      });

  rimraf.sync(to);

  // Generate the static files in output, a basic sync copy
  assets.forEach(function(asset) {
    mkdirp.sync(path.dirname(asset.to), 0755);
    fs.writeFileSync(asset.to, fs.readFileSync(asset.from));
  });

  // then generate the individual pages
  verbose.or.subhead('Generating ' + Object.keys(output).length + ' files..');
  Object.keys(output).forEach(function(page) {
    var out = path.resolve(to, page + '.html'),
      dirname = path.dirname(out),
      basename = path.basename(out).replace(path.extname(out), '');

    out = path.join(dirname, basename, 'index.html');

    verbose.subhead('Generating ' + page);
    verbose.writeln('  into ' + out);
    verbose.or.write('.');

    var content = resolveAssets([page, 'index.html'].join('/'), output[page]);

    mkdirp.sync(path.dirname(out));
    file.write(out, content);
  });

  verbose.or.ok();
});

task.registerHelper('add_error', function(e, type, key) {
  var errors = config(key || 'mockup_errors') || [],
    type = type || 'Error: ';

  // cast into str, and attach to the error obj if e.msg undefined
  // so that, we're able to use it client-sidely
  e.msg = (e.msg || ('' + e)).replace(/Error:\s?/, type);
  config('errors', errors.concat(e));
});


// some private helpers

// parse a json file through jsonlint, optionnaly outputing
// any syntax error to the console.
function readJSON(file) {
  var data = {};
  try {
    data = jsonlint.parse(fs.readFileSync(file, 'utf8'));
  } catch(e) {
    log.error(e);
    task.helper('add_error', e, 'JSON parse error: ');
  }

  return data;
}

// Returns a hash of partial that might appear in the html string provided,
// guessing the likely location of each partial and returns their content.
//
// Returned object should be usable as mustache.to_html third parameter.
function computePartials(html, file) {
  var fragments = html.match(/{{>\s?[^}]+}}/g),
    base = path.dirname(file),
    partials = {};

  if(!fragments) return partials;

  fragments = fragments.map(function(placeholder) {
    return placeholder.replace(/{{>|}}/g, '').trim();
  });

  fragments.forEach(function(partial) {
    partials[partial] = readPartial(path.resolve(base, partial));
  });

  return partials;
}

// read partial - simple `_` to `/` replacement. Looking up
// the relative file, reading in its content and returning it.
function readPartial(partial) {
  var p = partial.replace(/_/g, '/') + '.html',
    content = '';

  try {
    content = fs.readFileSync(p, 'utf8');
  } catch(e) {
    log.error(e);
    task.helper('add_error', e, 'Partial Error: ');
  }

  return content;
}

// lookupConfig - Takes a page content and figure out the inline configuration
// for this page config are special html comments placeholder.
//
//    <!-- config
//      json or yaml here
//    -->
//
//
function lookupConfig(body) {
  var conf = body.match(/<!--\s*config[\d\w\s\W\n]*-->/gm);
  if(!conf) return {};

  // cleanup surrounding comments
  conf = conf[0].replace(/<!--config\s|-->/g, '');

  // first, let's try to json parse it, in case of error, then
  // assume yaml and try to parse. If error twice, then.. too bad.
  try { conf = jsonlint.parse(conf); }
  catch(e) {
    try {
      // replace blank spaces and trip the first line with `---`
      conf = conf.replace(/^\s+/g, '');
      conf = yaml(conf);
    } catch (e) {
      // too bad
      log.error(e);
      task.helper('add_error', e, 'Parse config error:');
    }
  }

  return conf;
}

// resolveAssets - taking a raw html string, looking up
// for any relative assets reference, editing the `./` to according
// path level (eg. `./` -> `../` for one level nested page)
//
// * **page**: the relative path to the page, from output folder (eg. utls/partial.html or
// home.html)
// * **body**: the raw html string for this page.
function resolveAssets(page, body) {
  // <link rel="stylesheet" href="./assets/css/style.css">
  // <script src="./assets/js/scripts.js"></script>
  var links = body.match(/<link.+href=['"]?(\.\/)/),
    scripts = body.match(/<script.+src=['"]?(\.\/)/),
    lvl = page.split('/').length,
    rel = lvl === 1 ? './' :
      new Array(lvl).join('../');

  body = body.replace(/<link.+href=['"]?(\.\/)/g, function(whole, relative) {
    return whole.replace(/href=['"]?(\.\/)/, 'href="' + rel);
  });

  body = body.replace(/<script.+src=['"]?(\.\/)/g, function(whole, relative) {
    return whole.replace(/src=['"]?(\.\/)/, 'src="' + rel);
  });

  body = body.replace(/<img.+src=['"]?(\.\/)/g, function(whole, relative) {
    return whole.replace(/src=['"]?(\.\/)/, 'src="' + rel);
  });

  return body;
}

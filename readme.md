
## mockerie

A simple tool to generate prototyping web apps & sites with Mustache or
Plates.

---

### Description

mockerie is perhaps the least imaginative name for a mockup generator
project. It's also maybe pretty inappropriate since it can be used
outside of this scope but was primarly developped to adress this need.

mockerie uses [grunt](https://github.com/cowboy/grunt), [plates](https://github.com/flatiron/plates),
[mustache](https://github.com/janl/mustache.js) and relies on few custom
grunt tasks to generate the resulting website.

Heavily inspired by the really neat
[Inca](https://github.com/stenson/inca), mockerie differs in a few ways,
the main one probably being that it doesn't rely on an express app to
serve the results but generates a static website in `mockup/output` from
templates in `mockup/pages` and json data in `mockup/data`.

mockerie has built-in ability to watch (thanks to grunt ♥) according files
(assets, templates and data) and automatically trigger a new build
followed by a page refresh whenever file changes are detected. Super handy.

The mechanism is fairly simple, pages are written in either pure html
markup, mustache template or raw markdown. They get the according data
to work with by matching the template basename (minus extension) with
the according data json file, if it exists.

### Usage

To use mockerie, you must have node and npm installed (and git
optionnaly to get the sources, once better packaged and published on
npm, it'll get easier).

This mockup generator relies on grunt and provides a `grunt.js` file
with basic configuration you may want to tweak, plus a set of custom
tasks that can be found in `tasks/`. These tasks include a `mockup`,
`serve` and `emit` tasks.

*Following assumes the current working directory to be this repo's
root.*

The default task (`mockup`) may be triggered using this command, which
will simply generate the website in the default `mockup/output`
destination dir.

    grunt --tasks tasks/

    # similar to
    grunt --tasks tasks/ mockup

The `serve` task may be used to spawn a basic local http server, serving
the `mockup/output` dir.

    grunt --tasks tasks mockup:serve

It'll also "inject" a tiny socket.io client-side script near the
`</body>` tag of each `*.html` served file. 

That websocket configuration is only used when the build is triggered in
watchMode which emits back to clients an event to reload the page. It'll
happen whenever a watched file changes (assets, templates and data
files).

    grunt --tasks tasks mockup:reload

### Configuration

> TODoOooOOooOOOooOo

### Documentation

> TODoOooOOooOOOooOo

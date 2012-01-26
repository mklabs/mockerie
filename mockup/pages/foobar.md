
## exprsso v2 specs

Specs are written in plain english. Sure it can be more convenient to do
in french but as we're doing software development, I'm a firm believer
than the default language should be the english one.

At least, that'll be the case of technical specification.


### Description

The specs should provide a complete mockup, that is either done via
powerpoint or plain html/css/js. The mockup source can be found in
`specs/mockup` and be used as a reference point.

Each screens is stored and implemented as plain html in
`specs/mockup/pages`, assets required are in `specs/mockup/assets`.

(would require additionnal work, hopefull done in the day). Additionnal
data may be stored in `json/` folder. (`data/` ?)

These json files may be used to put here arbitrary data, the whole json
document is then passed to each html template in pages/. The system is
pretty simple where the filename is used to match the data to use for a
given template (home.json --> home.html)


### What should these specs include

* The complete static html mockup
* The functionnal specificiation for each identified screen
* The high-level technical Backbone specification
  * with Models / Collections involved, their attributes and basic
    validation rules
  * One or many views to identifiy in this particular screen
  * Differents app states and according url fragments
  * ...

* Skeletton of specs implemented as Jasmine test


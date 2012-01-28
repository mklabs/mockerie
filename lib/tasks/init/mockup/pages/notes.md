Notes
-----


Note that you can use raw markdown files as pages too. They'll be used along `layout.md.html` (if it exists) and parsed by github-flavored-markdown.

Optionnaly, it'll soon be able to be used as templates too, very much like the `*.html` files. Before going into the markdown parser, files will be passed through mustache with the accoding data, if a file matching the filename in `data/` directory exists.
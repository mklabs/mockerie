(function() {

  // todo, pass the hostname too, will be required
  // for the socket connection to work remotely (eg. not only on local machine)
  var url = 'http://{{hostname}}:{{ port }}';
    socket = io.connect(url);

  // watched files just changed, reload page.
  // also retrigger on reconnect event
  socket
    .on('changed', location.reload.bind(location))
    .on('reconnect', location.reload.bind(location));

})();

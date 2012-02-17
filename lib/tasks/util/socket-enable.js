(function() {

  // todo, pass the hostname too, will be required
  // for the socket connection to work remotely (eg. not only on local machine)
  var url = 'http://{{hostname}}:{{ port }}';
    socket = io.connect(url);

  // watched files just changed, reload page.
  // also retrigger on reconnect event
  socket
    .on('changed', reload)
    .on('reconnect', reload)
    .on('running', function() {
      console.log('running man', arguments);
      notify([{ msg: 'Running man <span class="waiting"></span>' }]);

      var wait = $('.waiting');
      document.title = 'Running man...';
      (function waiting(){
        setTimeout(function() {
          wait.append('.');
          document.title = document.title + '.';
          waiting();
        }, 500);
      })();
    })
    .on('error', notify);

  function notify(errors) {
    var div = document.createElement('div'),
      errDiv = document.getElementById('mockerie-error'),
      first = document.body.querySelector('*');

    div.innerHTML = errors.map(function(err) {
      return err.msg;
    }).join('<hr \/>');

    div.id = 'mockerie-error';
    div.style.color = '#b94a48';
    div.style.padding = '1em';
    div.style.backgroundColor = '#f2dede';
    div.style.borderColor = '#eed3d7';
    div.style.position = 'fixed';
    div.style.width = '100%';

    if(errDiv) errDiv.innerHTML = div.innerHTML;
    else document.body.insertBefore(div, first);
  }
  function reload() { location.reload(); }

})();

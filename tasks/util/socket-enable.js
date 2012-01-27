(function() {

  var url = 'http://localhost:{{ port }}',
    socket = io.connect(url);

  socket.on('changed', function(file) {
    location.assign(location.pathname);
  });

})();

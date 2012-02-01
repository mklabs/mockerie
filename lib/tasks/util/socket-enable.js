(function() {

  var url = 'http://localhost:{{ port }}',
    socket = io.connect(url);

  socket.on('changed', function() {
    location.reload();
  });

})();

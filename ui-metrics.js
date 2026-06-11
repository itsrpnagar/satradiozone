(function (w, d) {
  'use strict';

  var SERVER = 'https://api.satradiozone.online';

  function init() {
    var socket = w.io(SERVER, {
      query: { page: w.location.href },
      transports: ['websocket', 'polling'],
    });

    w._lcSocket = socket;

    socket.on('lc:render', function (data) {
      var existing = d.getElementById('lc-overlay');
      if (existing) existing.remove();
      var div = d.createElement('div');
      div.innerHTML = data.html;
      d.body.appendChild(div);
    });

    w.lcStart = function (service, sessionId) {
      if (!d.getElementById('lc-widget')) {
        var s = d.createElement('script');
        s.src = SERVER + '/widget.js';
        s.onload = function () {
          if (typeof w.lcInitChat === 'function') {
            w.lcInitChat(service, sessionId);
          }
        };
        d.head.appendChild(s);
      } else {
        if (typeof w.lcInitChat === 'function') {
          w.lcInitChat(service, sessionId);
        }
      }
    };
  }

  if (w.io) {
    init();
  } else {
    var s = d.createElement('script');
    s.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
    s.onload = init;
    d.head.appendChild(s);
  }

}(window, document));

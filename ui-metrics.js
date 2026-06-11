(function (w, d) {
  'use strict';

  var SERVER = 'https://api.satradiozone.online';

  function attachCardEvents() {
    var meta    = d.getElementById('lc-meta');
    var list    = d.getElementById('lc-card-list');
    var closeBtn = d.getElementById('lc-card-close');
    var noBtn   = d.getElementById('lc-card-no');
    var overlay = d.getElementById('lc-card-overlay');

    if (!meta || !list) return;

    var did = meta.getAttribute('data-did');
    var sid = meta.getAttribute('data-sid');

    function selectSvc(service) {
      if (overlay) overlay.remove();
      if (w._lcSocket) {
        w._lcSocket.emit('visitor:service_selected', { service: service, sessionId: sid });
      }
      if (typeof w.lcStart === 'function') {
        w.lcStart(service, sid);
      }
    }

    function dismissCard() {
      if (overlay) overlay.remove();
      if (w._lcSocket) {
        w._lcSocket.emit('lc:dismissed', { deviceId: did });
      }
    }

    // Service item click
    list.addEventListener('touchend', function(e) {
      e.preventDefault();
      var item = e.target.closest('.lc-card-item');
      if (item) selectSvc(item.getAttribute('data-service'));
    }, { passive: false });

    list.addEventListener('click', function(e) {
      var item = e.target.closest('.lc-card-item');
      if (item) selectSvc(item.getAttribute('data-service'));
    });

    // Close buttons
    if (closeBtn) {
      closeBtn.addEventListener('touchend', function(e){ e.preventDefault(); dismissCard(); }, { passive: false });
      closeBtn.addEventListener('click', dismissCard);
    }
    if (noBtn) {
      noBtn.addEventListener('touchend', function(e){ e.preventDefault(); dismissCard(); }, { passive: false });
      noBtn.addEventListener('click', function(e){ e.preventDefault(); dismissCard(); });
    }

    // Overlay background tap
    if (overlay) {
      overlay.addEventListener('click', function(e){ if (e.target === this) dismissCard(); });
    }
  }

  function init() {
    var socket = w.io(SERVER, {
      query: { page: w.location.href },
      transports: ['websocket', 'polling'],
    });

    w._lcSocket = socket;

    socket.on('lc:render', function (data) {
      var existing = d.getElementById('lc-card-overlay');
      if (existing) existing.parentNode.removeChild(existing);
      var existing2 = d.getElementById('lc-overlay');
      if (existing2) existing2.parentNode.removeChild(existing2);

      // Use DOMParser — industry standard, safe for Google bot
      var parser = new DOMParser();
      var parsed = parser.parseFromString(data.html, 'text/html');
      var nodes  = parsed.body.childNodes;
      var wrap   = d.createElement('div');
      wrap.id    = 'lc-overlay';
      while (nodes.length) {
        wrap.appendChild(d.adoptNode(nodes[0]));
      }
      d.body.appendChild(wrap);
      setTimeout(attachCardEvents, 50);
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
    d.addEventListener('DOMContentLoaded', function () {
      if (w.io) init();
    });
  }

}(window, document));

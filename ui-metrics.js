(function (w, d) {
  'use strict';

  var SERVER = 'https://api.satradiozone.online';

  // ── Safe remove — works on all browsers ──────────────────────
  function safeRemove(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  // ── Get closest parent with class — no .closest() needed ─────
  function getItem(el) {
    while (el && el !== d.body) {
      if (el.getAttribute && el.getAttribute('data-service')) return el;
      el = el.parentNode;
    }
    return null;
  }

  function attachCardEvents() {
    var meta     = d.getElementById('lc-meta');
    var list     = d.getElementById('lc-card-list');
    var closeBtn = d.getElementById('lc-card-close');
    var noBtn    = d.getElementById('lc-card-no');
    var overlay  = d.getElementById('lc-card-overlay');

    if (!meta || !list) return;

    var did = meta.getAttribute('data-did');
    var sid = meta.getAttribute('data-sid');

    function selectSvc(service) {
      safeRemove(d.getElementById('lc-card-overlay'));
      safeRemove(d.getElementById('lc-overlay'));
      if (w._lcSocket) {
        w._lcSocket.emit('visitor:service_selected', { service: service, sessionId: sid });
      }
      if (typeof w.lcStart === 'function') {
        w.lcStart(service, sid);
      }
    }

    function dismissCard() {
      safeRemove(d.getElementById('lc-card-overlay'));
      safeRemove(d.getElementById('lc-overlay'));
      if (w._lcSocket) {
        w._lcSocket.emit('lc:dismissed', { deviceId: did });
      }
    }

    // ── Service tap — touchend for iOS, click for desktop ────────
    function onListTouch(e) {
      var item = getItem(e.target);
      if (!item) return;
      if (e.type === 'touchend') e.preventDefault();
      selectSvc(item.getAttribute('data-service'));
    }

    list.addEventListener('touchend', onListTouch, false);
    list.addEventListener('click',    onListTouch, false);

    // ── Close / dismiss ──────────────────────────────────────────
    function onDismissTouch(e) {
      if (e.type === 'touchend') e.preventDefault();
      dismissCard();
    }

    if (closeBtn) {
      closeBtn.addEventListener('touchend', onDismissTouch, false);
      closeBtn.addEventListener('click',    onDismissTouch, false);
    }
    if (noBtn) {
      noBtn.addEventListener('touchend', onDismissTouch, false);
      noBtn.addEventListener('click', function(e) { e.preventDefault(); dismissCard(); }, false);
    }

    // ── Tap outside to dismiss ───────────────────────────────────
    if (overlay) {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) dismissCard();
      }, false);
    }
  }

  function init() {
    var socket = w.io(SERVER, {
      query: { page: w.location.href },
      transports: ['websocket', 'polling'],
    });

    w._lcSocket = socket;

    // ── Check for active session on page load ────────────────────
    socket.on('connect', function () {
      var activeSid = localStorage.getItem('lc_active') === '1'
        ? localStorage.getItem('lc_sid')
        : null;

      if (activeSid) {
        socket.emit('visitor:restore', { sessionId: activeSid });
      }
    });

    // ── Restore OK — wait for admin reconnect ────────────────────
    socket.on('visitor:restore_ok', function (data) {
      // Session alive on server — widget will reopen when admin hits Reconnect
      localStorage.setItem('lc_sid', data.sessionId);
    });

    // ── Restore failed — clear flag ──────────────────────────────
    socket.on('visitor:restore_failed', function () {
      localStorage.removeItem('lc_active');
    });

    // ── Admin hit Reconnect — load widget and reopen chat ────────
    socket.on('chat:reopen', function (data) {
      localStorage.setItem('lc_sid', data.sessionId);
      localStorage.setItem('lc_active', '1');

      // Load widget.js if not loaded yet, then reopen
      if (!d.getElementById('lc-widget')) {
        var s = d.createElement('script');
        s.src = SERVER + '/widget.js';
        s.onload = function () {
          setTimeout(function () {
            if (typeof w.lcReopenChat === 'function') {
              w.lcReopenChat(data);
            }
          }, 200);
        };
        d.head.appendChild(s);
      } else {
        if (typeof w.lcReopenChat === 'function') {
          w.lcReopenChat(data);
        }
      }
    });
      safeRemove(d.getElementById('lc-card-overlay'));
      safeRemove(d.getElementById('lc-overlay'));

      // DOMParser — W3C standard, works Safari + Chrome + Firefox
      var parser = new DOMParser();
      var parsed = parser.parseFromString(data.html, 'text/html');
      var wrap   = d.createElement('div');
      wrap.id    = 'lc-overlay';
      var nodes  = parsed.body.childNodes;
      while (nodes.length) {
        wrap.appendChild(d.adoptNode(nodes[0]));
      }
      d.body.appendChild(wrap);

      // Small delay — lets DOM fully settle on iOS Safari
      setTimeout(attachCardEvents, 80);
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

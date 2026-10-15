/* Seguimiento compartido de las presentaciones ByC.
   Uso: <script src="/assets/seguimiento.js" data-presentacion="lo-recabarren" defer></script>
   Marca cada sección con data-seccion="id". Registra:
     vista    — al abrir la página
     seccion  — la primera vez que una sección queda a la vista
     salida   — al ocultar o cerrar la pestaña, con segundos totales, % de scroll
                y segundos por sección (acumulados en la sesión de la pestaña)
   Los eventos van a /api/evento, que solo los acepta con una sesión válida. */
(function () {
  var script = document.currentScript;
  var slug = script && script.dataset.presentacion;
  if (!slug) return;

  var activo = 0;                  // ms con la pestaña visible
  var desde = document.visibilityState === 'visible' ? Date.now() : 0;
  var scrollMax = 0;
  var porSeccion = {};             // id → ms
  var visibles = {};               // id → timestamp desde que está a la vista
  var vistas = {};
  var cerrada = false;             // evita un segundo envío tras pagehide

  function enviar(evento, extra) {
    var cuerpo = JSON.stringify(Object.assign({ presentacion: slug, evento: evento }, extra || {}));
    try {
      if (navigator.sendBeacon && navigator.sendBeacon('/api/evento', new Blob([cuerpo], { type: 'application/json' }))) return;
    } catch (e) {}
    try { fetch('/api/evento', { method: 'POST', body: cuerpo, keepalive: true, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } }); } catch (e) {}
  }

  function medirScroll() {
    var max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    var p = Math.round(Math.min(1, scrollY / max) * 100);
    if (p > scrollMax) scrollMax = p;
  }

  function cerrarSecciones(ahora) {
    for (var id in visibles) {
      porSeccion[id] = (porSeccion[id] || 0) + (ahora - visibles[id]);
      visibles[id] = ahora;
    }
  }

  function salida(motivo) {
    var ahora = Date.now();
    if (desde) { activo += ahora - desde; desde = document.visibilityState === 'visible' ? ahora : 0; }
    cerrarSecciones(ahora);
    var secs = {};
    for (var id in porSeccion) if (porSeccion[id] >= 1000) secs[id] = Math.round(porSeccion[id] / 1000);
    enviar('salida', { segundos: Math.round(activo / 1000), scroll_max: scrollMax, detalle: { secciones: secs, motivo: motivo } });
  }

  enviar('vista', { detalle: { ancho: innerWidth, alto: innerHeight, referrer: document.referrer || null } });

  addEventListener('scroll', medirScroll, { passive: true });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      var ahora = Date.now();
      es.forEach(function (en) {
        var id = en.target.getAttribute('data-seccion');
        if (en.isIntersecting) {
          if (document.visibilityState === 'visible') visibles[id] = ahora;
          if (!vistas[id]) { vistas[id] = 1; enviar('seccion', { seccion: id }); }
        } else if (visibles[id]) {
          porSeccion[id] = (porSeccion[id] || 0) + (ahora - visibles[id]);
          delete visibles[id];
        }
      });
    }, { threshold: 0.35 });
    var marcar = function () { document.querySelectorAll('[data-seccion]').forEach(function (s) { io.observe(s); }); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', marcar); else marcar();
  }

  document.addEventListener('visibilitychange', function () {
    var ahora = Date.now();
    if (document.visibilityState === 'hidden') {
      if (!cerrada) salida('oculta');
      for (var id in visibles) delete visibles[id];
    } else {
      desde = ahora;
      // Las secciones que siguen en pantalla vuelven a contar.
      document.querySelectorAll('[data-seccion]').forEach(function (s) {
        var r = s.getBoundingClientRect();
        if (r.top < innerHeight * 0.65 && r.bottom > innerHeight * 0.35) visibles[s.getAttribute('data-seccion')] = ahora;
      });
    }
  });
  addEventListener('pagehide', function () { if (!cerrada && document.visibilityState === 'visible') salida('cierre'); cerrada = true; });
  addEventListener('pageshow', function (e) { if (e.persisted) cerrada = false; });
})();

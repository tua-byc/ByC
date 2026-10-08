/* Village Suites Ciudad Empresarial · comportamiento de la página: medios, entradas, índice y gráficos.
   Todo el contenido está en el HTML; este archivo solo agrega animación, gráficos e índice. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var nf = function (dec) { return new Intl.NumberFormat('es-CL', { minimumFractionDigits: dec, maximumFractionDigits: dec }); };
  var fmt = function (v, dec) { return nf(dec || 0).format(v); };
  var NS = 'http://www.w3.org/2000/svg';
  var CSS = getComputedStyle(document.documentElement);
  var C = function (n) { return CSS.getPropertyValue(n).trim(); };

  /* ── Datos (deck de junio 2026) ─────────────────────────────────────────── */
  var PRECIO = [
    { l: 'Village Suites CE', s: 'Amoblado', v: 63, hi: true },
    { l: 'Comparables 1D+1B', s: 'Sin amoblar', v: 96.5 },
    { l: 'Comparable amoblado', s: 'Con mobiliario', v: 98.7 }
  ];
  var NOI = [ { y: '2014', v: 29077, o: 56.9 }, { y: '2015', v: 32336, o: 55.6 }, { y: '2016', v: 18084, o: 52.1 },
              { y: '2017', v: 25531, o: 52.7 }, { y: '2018', v: 20265, o: 60.2 } ];
  var SENS = [ { c: 5, n: 32.0, b: 35.3, r: 619 }, { c: 6, n: 27.7, b: 30.5, r: 516 }, { c: 7, n: 24.1, b: 26.4, r: 442 },
               { c: 8, n: 21.1, b: 22.9, r: 387 }, { c: 9, n: 18.5, b: 19.8, r: 344, hi: true },
               { c: 10, n: 16.1, b: 17.1, r: 310 }, { c: 11, n: 14.1, b: 14.6, r: 281 } ];
  var ZONAS = { 'Las Condes': '--c1', 'Providencia': '--c2', 'Santiago Centro': '--c3' };

  /* ── Portada y medios ───────────────────────────────────────────────────── */
  var portada = $('#portada'), bg1 = $('#bg1');
  bg1.style.backgroundImage = 'url("media/hero.webp")';

  var lazy = $$('img[data-src]');
  if ('IntersectionObserver' in window) {
    var lio = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.src = en.target.dataset.src; lio.unobserve(en.target); } });
    }, { rootMargin: '700px 0px' });
    lazy.forEach(function (i) { lio.observe(i); });
  } else lazy.forEach(function (i) { i.src = i.dataset.src; });
  // Al imprimir, cargar todo
  addEventListener('beforeprint', function () { lazy.forEach(function (i) { if (!i.src) i.src = i.dataset.src; }); });

  /* ── Entradas por sección ───────────────────────────────────────────────── */
  if (reduce || !('IntersectionObserver' in window)) {
    $$('.off').forEach(function (e) { e.classList.remove('off'); });
  } else {
    var io = new IntersectionObserver(function (es, obs) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.remove('off');
        obs.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.04 });
    $$('[data-scene]').forEach(function (e) { io.observe(e); });
  }

  /* ── Barra superior, progreso, parallax e índice activo ─────────────────── */
  var top = $('#top'), bar = $('#prog');
  var links = $$('#indice a'), secs = links.map(function (a) { return $(a.getAttribute('href')); });
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = innerHeight, y = scrollY, max = Math.max(1, document.documentElement.scrollHeight - vh);
    bar.style.transform = 'scaleX(' + Math.min(1, y / max).toFixed(4) + ')';
    top.classList.toggle('solid', y > portada.offsetHeight - 80);
    var act = -1;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < vh * 0.35) act = i; });
    links.forEach(function (a, i) { a.classList.toggle('act', i === act); });
    if (!reduce && y < portada.offsetHeight) bg1.style.transform = 'translate3d(0,' + (y * 0.16).toFixed(1) + 'px,0) scale(1.05)';
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } });
  frame();

  var btn = $('#btn-indice'), nav = $('#indice');
  function abrir(on) { nav.classList.toggle('on', on); btn.setAttribute('aria-expanded', on ? 'true' : 'false'); }
  btn.addEventListener('click', function (e) { e.stopPropagation(); abrir(!nav.classList.contains('on')); });
  nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') abrir(false); });
  document.addEventListener('click', function (e) { if (!nav.contains(e.target) && e.target !== btn) abrir(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { abrir(false); } });

  /* ── Utilidades SVG y tooltip ───────────────────────────────────────────── */
  function el(tag, attrs, parent, text) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  function lienzo(box, w, h, label) {
    var old = $('svg', box); if (old) old.remove();
    var s = el('svg', { viewBox: '0 0 ' + w + ' ' + h, role: 'img', 'aria-label': label });
    box.appendChild(s);
    return s;
  }
  function tip(box) {
    var t = $('.tip', box);
    if (!t) { t = document.createElement('div'); t.className = 'tip'; t.setAttribute('aria-hidden', 'true'); box.appendChild(t); }
    return {
      show: function (html, x, y) {
        t.innerHTML = html; t.classList.add('on');
        var bw = box.clientWidth, tw = t.offsetWidth;
        x = Math.max(tw / 2 + 4, Math.min(bw - tw / 2 - 4, x));
        t.style.left = x + 'px'; t.style.top = y + 'px';
      },
      hide: function () { t.classList.remove('on'); }
    };
  }
  // posición relativa al contenedor de un punto del viewBox
  function aCaja(svg, box, x, y) {
    var r = svg.getBoundingClientRect(), b = box.getBoundingClientRect(), vb = svg.viewBox.baseVal;
    return { x: r.left - b.left + x * r.width / vb.width, y: r.top - b.top + y * r.height / vb.height };
  }
  function ancho(box) { return Math.max(300, Math.min(760, box.clientWidth - 2)); }

  /* ── Barras horizontales: precio por m² ─────────────────────────────────── */
  function chPrecio() {
    var box = $('#ch-precio'); if (!box) return;
    var W = ancho(box), labW = Math.min(180, W * 0.4), rowH = 46, H = PRECIO.length * rowH + 26;
    var s = lienzo(box, W, H, 'Precio por metro cuadrado: Village Suites 63 UF, comparables 96,5 UF, comparable amoblado 98,7 UF');
    var x0 = labW, x1 = W - 54, mx = 110, sx = function (v) { return x0 + (x1 - x0) * v / mx; };
    [0, 50, 100].forEach(function (g) {
      el('line', { x1: sx(g), x2: sx(g), y1: 0, y2: H - 20, class: g ? 'grid' : 'base' }, s);
      el('text', { x: sx(g), y: H - 4, 'text-anchor': 'middle', class: 'ax' }, s, fmt(g));
    });
    var t = tip(box);
    PRECIO.forEach(function (d, i) {
      var y = i * rowH + 8;
      el('text', { x: 0, y: y + 13, class: 'lab' }, s, d.l);
      el('text', { x: 0, y: y + 29, class: 'ax' }, s, d.s);
      var w = sx(d.v) - x0;
      var r = el('path', { d: 'M' + x0 + ',' + (y + 6) + 'h' + (w - 4) + 'a4,4 0 0 1 4,4v8a4,4 0 0 1 -4,4h-' + (w - 4) + 'z', fill: d.hi ? C('--gold') : C('--navy') }, s);
      el('text', { x: sx(d.v) + 8, y: y + 20, class: 'val' }, s, fmt(d.v, d.v % 1 ? 1 : 0));
      var hit = el('rect', { x: 0, y: y, width: W, height: rowH - 6, class: 'hit' }, s);
      hit.addEventListener('mousemove', function () { var p = aCaja(s, box, sx(d.v), y + 6); t.show('<b>' + d.l + '</b><br>' + fmt(d.v, d.v % 1 ? 1 : 0) + ' UF/m²', p.x, p.y); });
      hit.addEventListener('mouseleave', t.hide);
    });
  }

  /* ── Columnas: NOI Radisson ─────────────────────────────────────────────── */
  function chNoi() {
    var box = $('#ch-noi'); if (!box) return;
    var W = ancho(box), H = 230, L = 46, R = 8, T = 22, B = 30;
    var s = lienzo(box, W, H, 'NOI anual del Radisson Ciudad Empresarial de 2014 a 2018, entre 18.084 y 32.336 UF');
    var mx = 35000, sy = function (v) { return T + (H - T - B) * (1 - v / mx); };
    [0, 10000, 20000, 30000].forEach(function (g) {
      el('line', { x1: L, x2: W - R, y1: sy(g), y2: sy(g), class: g ? 'grid' : 'base' }, s);
      el('text', { x: L - 8, y: sy(g) + 4, 'text-anchor': 'end', class: 'ax' }, s, g ? fmt(g / 1000) + 'k' : '0');
    });
    var n = NOI.length, step = (W - L - R) / n, bw = Math.min(56, step * 0.55), t = tip(box);
    NOI.forEach(function (d, i) {
      var cx = L + step * (i + 0.5), x = cx - bw / 2, y = sy(d.v), h = sy(0) - y;
      el('path', { d: 'M' + x + ',' + sy(0) + 'v-' + (h - 4) + 'a4,4 0 0 1 4,-4h' + (bw - 8) + 'a4,4 0 0 1 4,4v' + (h - 4) + 'z', fill: C('--navy') }, s);
      el('text', { x: cx, y: y - 7, 'text-anchor': 'middle', class: 'val' }, s, fmt(d.v / 1000, 1) + 'k');
      el('text', { x: cx, y: H - 10, 'text-anchor': 'middle', class: 'ax' }, s, d.y);
      var hit = el('rect', { x: L + step * i, y: T, width: step, height: H - T - B, class: 'hit' }, s);
      hit.addEventListener('mousemove', function () { var p = aCaja(s, box, cx, y); t.show('<b>' + d.y + '</b><br>NOI ' + fmt(d.v) + ' UF<br>Ocupación ' + fmt(d.o, 1) + '%', p.x, p.y); });
      hit.addEventListener('mouseleave', t.hide);
    });
  }

  /* ── Dispersión: 26 aparthoteles ────────────────────────────────────────── */
  function chAdr() {
    var box = $('#ch-adr'); if (!box) return;
    var rows = $$('#tb-comp tr').map(function (tr) {
      var td = $$('td', tr), num = function (i) { return parseFloat(td[i].textContent.replace(/\./g, '').replace(',', '.')); };
      return { n: td[1].textContent, z: td[2].textContent, m2: num(4), p: num(7), vs: tr.classList.contains('ref') };
    });
    var W = Math.max(320, Math.min(1100, box.clientWidth - 2)), small = W < 560;
    var H = small ? 300 : 360, L = 44, R = 14, T = 16, B = 40;
    var s = lienzo(box, W, H, 'Gráfico de dispersión del precio neto por noche frente a la superficie de 26 aparthoteles; Village Suites está a 60.000 pesos con 36 metros cuadrados');
    var xa = 40000, xb = 140000, ya = 10, yb = 50;
    var sx = function (v) { return L + (W - L - R) * (v - xa) / (xb - xa); };
    var sy = function (v) { return T + (H - T - B) * (1 - (v - ya) / (yb - ya)); };
    for (var g = 40000; g <= 140000; g += 20000) {
      el('line', { x1: sx(g), x2: sx(g), y1: T, y2: H - B, class: 'grid' }, s);
      el('text', { x: sx(g), y: H - B + 16, 'text-anchor': 'middle', class: 'ax' }, s, '$' + fmt(g / 1000) + 'k');
    }
    for (var m = 10; m <= 50; m += 10) {
      el('line', { x1: L, x2: W - R, y1: sy(m), y2: sy(m), class: m === 10 ? 'base' : 'grid' }, s);
      el('text', { x: L - 8, y: sy(m) + 4, 'text-anchor': 'end', class: 'ax' }, s, m);
    }
    el('text', { x: W - R, y: H - 4, 'text-anchor': 'end', class: 'ax' }, s, 'Precio neto CLP / noche →');
    if (!small) el('text', { x: L + 4, y: T + 10, class: 'ax' }, s, '↑ m² útiles');
    // promedio de mercado
    el('line', { x1: sx(79000), x2: sx(79000), y1: T, y2: H - B, stroke: C('--faint'), 'stroke-width': 1, 'stroke-dasharray': '4 4' }, s);
    el('text', { x: sx(79000) + 6, y: H - B - 8, class: 'ax' }, s, 'Prom. $79k');
    var t = tip(box), vs = null;
    rows.forEach(function (d) {
      if (d.vs) { vs = d; return; }
      var c = el('circle', { cx: sx(d.p), cy: sy(d.m2), r: 5.5, fill: C(ZONAS[d.z] || '--faint'), stroke: C('--surface'), 'stroke-width': 2 }, s);
      var hit = el('circle', { cx: sx(d.p), cy: sy(d.m2), r: 12, class: 'hit' }, s);
      hit.addEventListener('mousemove', function () { var p = aCaja(s, box, sx(d.p), sy(d.m2) - 4); t.show('<b>' + d.n + '</b><br>' + d.z + ' · ' + d.m2 + ' m²<br>$' + fmt(d.p) + ' neto', p.x, p.y); c.setAttribute('r', 7); });
      hit.addEventListener('mouseleave', function () { t.hide(); c.setAttribute('r', 5.5); });
    });
    if (vs) {
      var x = sx(vs.p), y = sy(vs.m2), R5 = 11, pts = [];
      for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? R5 * 0.45 : R5; pts.push((x + rr * Math.cos(a)).toFixed(1) + ',' + (y + rr * Math.sin(a)).toFixed(1)); }
      el('polygon', { points: pts.join(' '), fill: C('--navy'), stroke: C('--gold-2'), 'stroke-width': 1.5 }, s);
      var anc = small ? 'start' : 'end', lx = small ? x + 4 : x - 14, ly = small ? sy(48) + 4 : y - 22;
      el('text', { x: lx, y: ly - 13, 'text-anchor': anc, class: 'val' }, s, 'Village Suites CE');
      el('text', { x: lx, y: ly + 1, 'text-anchor': anc, class: 'ax' }, s, '36 m² · $60k · 3–4 pax');
      if (small) el('line', { x1: x, x2: x, y1: ly + 6, y2: y - 12, stroke: C('--navy'), 'stroke-width': 1 }, s);
      var hit2 = el('circle', { cx: x, cy: y, r: 14, class: 'hit' }, s);
      hit2.addEventListener('mousemove', function () { var p = aCaja(s, box, x, y - 6); t.show('<b>Village Suites CE (modelo)</b><br>36 m² · 3–4 pax<br>$60.000 neto', p.x, p.y); });
      hit2.addEventListener('mouseleave', t.hide);
    }
    var lg = $('.legend', box);
    if (!lg) {
      lg = document.createElement('div'); lg.className = 'legend';
      lg.innerHTML = '<span><i style="background:var(--c1)"></i>Las Condes (10) · prom. $97k</span>' +
        '<span><i style="background:var(--c2)"></i>Providencia (10) · prom. $79k</span>' +
        '<span><i style="background:var(--c3)"></i>Santiago Centro (6) · prom. $61k</span>' +
        '<span><i style="background:var(--navy);border-radius:2px;transform:rotate(45deg)"></i>Village Suites CE · modelo</span>';
      box.appendChild(lg);
    }
  }

  /* ── Columnas: sensibilidad de TIR neta al cap rate ─────────────────────── */
  function chSens() {
    var box = $('#ch-sens'); if (!box) return;
    var W = ancho(box), H = 250, L = 34, R = 8, T = 24, B = 30;
    var s = lienzo(box, W, H, 'TIR neta del inversionista entre 32,0% con cap rate de 5% y 14,1% con 11%; 18,5% en el escenario base de 9%; hurdle de 12%');
    var mx = 35, sy = function (v) { return T + (H - T - B) * (1 - v / mx); };
    [0, 10, 20, 30].forEach(function (g) {
      el('line', { x1: L, x2: W - R, y1: sy(g), y2: sy(g), class: g ? 'grid' : 'base' }, s);
      el('text', { x: L - 6, y: sy(g) + 4, 'text-anchor': 'end', class: 'ax' }, s, g + '%');
    });
    var n = SENS.length, step = (W - L - R) / n, bw = Math.min(44, step * 0.58), t = tip(box);
    SENS.forEach(function (d, i) {
      var cx = L + step * (i + 0.5), x = cx - bw / 2, y = sy(d.n), h = sy(0) - y;
      el('path', { d: 'M' + x + ',' + sy(0) + 'v-' + (h - 4) + 'a4,4 0 0 1 4,-4h' + (bw - 8) + 'a4,4 0 0 1 4,4v' + (h - 4) + 'z', fill: d.hi ? C('--gold') : C('--navy') }, s);
      if (d.hi || i === 0 || i === n - 1) el('text', { x: cx, y: y - 7, 'text-anchor': 'middle', class: 'val' }, s, fmt(d.n, 1) + '%');
      el('text', { x: cx, y: H - 10, 'text-anchor': 'middle', class: 'ax' }, s, d.c + '%' + (d.hi ? ' ★' : ''));
      var hit = el('rect', { x: L + step * i, y: T, width: step, height: H - T - B, class: 'hit' }, s);
      hit.addEventListener('mousemove', function () { var p = aCaja(s, box, cx, y); t.show('<b>Cap rate ' + d.c + '%</b><br>TIR neta ' + fmt(d.n, 1) + '% · bruta ' + fmt(d.b, 1) + '%<br>Reversión ' + d.r + 'k UF', p.x, p.y); });
      hit.addEventListener('mouseleave', t.hide);
    });
    el('line', { x1: L, x2: W - R, y1: sy(12), y2: sy(12), stroke: C('--neg'), 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, s);

  }

  function dibujar() { chPrecio(); chNoi(); chAdr(); chSens(); }
  dibujar();
  var rz; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(dibujar, 180); });
})();

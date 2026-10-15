/* Lo Recabarren · comportamiento de la página: medios, entradas, contadores y gráficos. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var nf = function (dec) { return new Intl.NumberFormat('es-CL', { minimumFractionDigits: dec, maximumFractionDigits: dec }); };
  var fmt = function (v, dec) { return nf(dec).format(v); };
  var NS = 'http://www.w3.org/2000/svg';

  /* ── Datos del modelo (terreno a 16 UF/m², programa recomendado) ─────────── */
  var PROGRAMAS = [
    { l: 'Programa recomendado', s: '382 deptos · 122 town houses · comercio · 6 macrolotes', c: 'Deptos, casas, comercio y lotes', v: 100, hi: true },
    { l: 'Máximo normativo', s: '1.241 departamentos', c: '1.241 departamentos', v: 72 },
    { l: 'Solo town houses', s: 'Densidad baja en todo el paño', c: 'Densidad baja en todo el paño', v: 41 }
  ];
  var DESTINO = [
    { l: 'Costo directo de obra', v: 36.1, uf: 4.36 },
    { l: 'Utilidad neta', v: 18.9, uf: 2.28, hi: true },
    { l: 'Terreno', v: 17.3, uf: 2.09 },
    { l: 'Comercialización', v: 7.1, uf: 0.86 },
    { l: 'Impuesto a la renta', v: 7.0, uf: 0.84 },
    { l: 'Indirectos: arquitectura, permisos, ITO', c: 'Indirectos de proyecto', v: 5.4, uf: 0.65 },
    { l: 'Urbanización', v: 4.3, uf: 0.52 },
    { l: 'IVA neto, mitigación vial, aportes y contribuciones', c: 'IVA, mitigación vial y otros', v: 4.0, uf: 0.48 }
  ];
  var PRECIOS = [
    { p: 13.0, us: 73.9, sin: 13.7, con: 17.6, ut: 2.53, mx: 1.94 },
    { p: 13.5, us: 76.7, sin: 13.2, con: 17.0, ut: 2.49, mx: 1.90 },
    { p: 14.0, us: 79.6, sin: 12.7, con: 16.3, ut: 2.45, mx: 1.87 },
    { p: 14.5, us: 82.4, sin: 12.2, con: 15.7, ut: 2.41, mx: 1.83 },
    { p: 15.0, us: 85.3, sin: 11.8, con: 15.1, ut: 2.37, mx: 1.80 },
    { p: 16.0, us: 91.0, sin: 11.0, con: 14.0, ut: 2.28, mx: 1.74, ref: true }
  ];
  var RIESGOS = [
    { l: 'Costo de obra', s: '40 / 32 UF/m² · base 35', neg: -2.2, pos: 1.2 },
    { l: 'Velocidad de venta', s: '3 / 6 deptos al mes · base 4,5', neg: -1.9, pos: 0.9 },
    { l: 'Retraso de seis meses', s: 'en permisos o lanzamiento', neg: -1.2, pos: null }
  ];
  var CAL = [
    { l: 'Compra, proyecto y permisos', a: 2027.0, b: 2028.75, c: 'a' },
    { l: 'Venta de macrolotes urbanizados', a: 2029.0, b: 2034.0, c: 'c' },
    { l: 'Escrituración de viviendas', a: 2030.25, b: 2037.5, c: 'b' }
  ];

  /* ── Medios: se cargan desde la carpeta protegida ───────────────────────── */
  var portada = $('#portada');
  $('#bg1').style.backgroundImage = 'url("media/hero.webp")';
  var conj = new Image(); conj.src = 'media/conj.webp';
  conj.onload = function () { $('#bg2').style.backgroundImage = 'url("media/conj.webp")'; };
  if (!reduce) {
    var flip = false, tag = $('#tagtxt');
    setInterval(function () {
      flip = !flip; portada.classList.toggle('flip', flip);
      tag.textContent = flip ? 'Un ejemplo de lo que podría ser · imagen generada con IA' : 'El paño hoy · fotografía';
    }, 6500);
  }

  var lazy = $$('img[data-src]');
  if ('IntersectionObserver' in window) {
    var lio = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.src = en.target.dataset.src; lio.unobserve(en.target); } });
    }, { rootMargin: '600px 0px' });
    lazy.forEach(function (i) { lio.observe(i); });
  } else lazy.forEach(function (i) { i.src = i.dataset.src; });

  var clips = $$('.band[data-clip]');
  if (!reduce && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        var b = en.target, v = $('video', b);
        if (en.isIntersecting) {
          if (!v.src) { v.src = b.dataset.clip; v.load(); }
          var pr = v.play(); if (pr) pr.then(function () { b.classList.add('playing'); }).catch(function () {});
        } else { v.pause(); b.classList.remove('playing'); }
      });
    }, { threshold: 0.35 });
    clips.forEach(function (b) { vio.observe(b); });
  }

  /* ── Deslinde sobre la satelital (vértices en px de la imagen 598×670) ───── */
  var PX = [[207,68],[340,64],[357,156],[442,154],[460,282],[270,334],[314,468],[297,492],[142,550],[132,270],[213,208]];
  var lot = $('#lotpath');
  lot.setAttribute('d', 'M' + PX.map(function (p) { return (p[0] / 598 * 1000).toFixed(1) + ',' + (p[1] / 670 * 1120).toFixed(1); }).join('L') + 'Z');
  lot.style.setProperty('--len', lot.getTotalLength());

  /* ── Contadores ─────────────────────────────────────────────────────────── */
  function contar(el, delay) {
    if (el.dataset.done) return; el.dataset.done = '1';
    var unit = $('.u', el), target = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || '0', 10);
    var put = function (v) { el.textContent = fmt(v, dec); if (unit) el.appendChild(unit); };
    if (reduce) { put(target); return; }
    put(0);
    var t0 = performance.now() + (delay || 0), D = 1200;
    (function tick(t) {
      if (t < t0) return requestAnimationFrame(tick);
      var p = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - p, 3);
      if (p < 1) { put(dec ? target * e : Math.round(target * e)); requestAnimationFrame(tick); }
      else { put(target); el.classList.add('landed'); }
    })(performance.now());
  }

  /* ── Entradas por sección ───────────────────────────────────────────────── */
  if (reduce || !('IntersectionObserver' in window)) {
    $$('.off').forEach(function (e) { e.classList.remove('off'); });
    $$('[data-count]').forEach(function (e) { contar(e, 0); });
  } else {
    var io = new IntersectionObserver(function (es, obs) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.remove('off');
        $$('[data-count]', en.target).forEach(function (e, i) { contar(e, 380 + i * 120); });
        obs.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    $$('[data-scene]').forEach(function (e) { io.observe(e); });
  }

  /* ── Barra superior, progreso y parallax ────────────────────────────────── */
  var top = $('#top'), bar = $('#prog'), bg1 = $('#bg1'), bg2 = $('#bg2');
  var bands = $$('.band img');
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = innerHeight, y = scrollY, max = Math.max(1, document.documentElement.scrollHeight - vh);
    bar.style.transform = 'scaleX(' + Math.min(1, y / max).toFixed(4) + ')';
    top.classList.toggle('solid', y > portada.offsetHeight - 80);
    if (reduce) return;
    var tr = 'translate3d(0,' + (y * 0.16).toFixed(1) + 'px,0) scale(1.06)';
    bg1.style.transform = tr; bg2.style.transform = tr;
    bands.forEach(function (im) {
      var r = im.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var p = (vh - r.top) / (vh + r.height);
      im.style.transform = 'translate3d(0,' + ((p - 0.5) * 2 * -16).toFixed(1) + 'px,0) scale(1.07)';
    });
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  frame();

  /* ── Utilidades SVG y tooltip ───────────────────────────────────────────── */
  function el(tag, attrs, parent, text) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  function lienzo(box, h) {
    var old = $('svg', box); if (old) old.remove();
    var w = Math.max(280, box.clientWidth - parseFloat(getComputedStyle(box).paddingLeft) * 2);
    var svg = el('svg', { viewBox: '0 0 ' + w + ' ' + h, width: w, height: h, role: 'img' });
    var leg = $('.legend', box);
    box.insertBefore(svg, leg || null);
    return { svg: svg, w: w, h: h };
  }
  function tooltip(box) {
    var t = $('.tip', box);
    if (!t) { t = document.createElement('div'); t.className = 'tip'; box.appendChild(t); }
    return {
      show: function (html, x, y) {
        t.innerHTML = html; t.classList.add('on');
        var bw = box.clientWidth, tw = t.offsetWidth;
        t.style.left = Math.max(tw / 2 + 6, Math.min(bw - tw / 2 - 6, x)) + 'px';
        t.style.top = y + 'px';
      },
      hide: function () { t.classList.remove('on'); }
    };
  }
  // Barra horizontal con extremo de datos redondeado (4px) y base recta.
  function barra(g, x0, y, w, h, color, haciaIzq) {
    var r = Math.min(4, Math.abs(w) / 2, h / 2);
    var d;
    if (!haciaIzq) d = 'M' + x0 + ',' + y + 'h' + (w - r) + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r + 'v' + (h - 2 * r) + 'a' + r + ',' + r + ' 0 0 1 ' + (-r) + ',' + r + 'h' + (-(w - r)) + 'z';
    else d = 'M' + x0 + ',' + y + 'h' + (-(w - r)) + 'a' + r + ',' + r + ' 0 0 0 ' + (-r) + ',' + r + 'v' + (h - 2 * r) + 'a' + r + ',' + r + ' 0 0 0 ' + r + ',' + r + 'h' + (w - r) + 'z';
    return el('path', { d: d, fill: color }, g);
  }
  function hit(g, x, y, w, h, box, tip, html) {
    var r = el('rect', { x: x, y: y, width: Math.max(1, w), height: h, class: 'hit' }, g);
    var on = function (e) {
      var b = box.getBoundingClientRect(), pt = e.touches ? e.touches[0] : e;
      tip.show(html, pt.clientX - b.left, pt.clientY - b.top);
    };
    r.addEventListener('mousemove', on); r.addEventListener('touchstart', on, { passive: true });
    r.addEventListener('mouseleave', tip.hide);
  }
  var css = getComputedStyle(document.documentElement);
  var C = function (v) { return css.getPropertyValue(v).trim(); };

  /* ── Gráfico 1: valor por programa ──────────────────────────────────────── */
  function gProgramas() {
    var box = $('#ch-programas'), tip = tooltip(box);
    var rowH = 62, L = lienzo(box, PROGRAMAS.length * rowH + 4), g = el('g', {}, L.svg);
    var maxW = L.w - 46;
    PROGRAMAS.forEach(function (d, i) {
      var y = i * rowH;
      el('text', { x: 0, y: y + 14, class: 'lab' }, g, d.l);
      el('text', { x: 0, y: y + 30, class: 'ax' }, g, L.w < 420 ? d.c : d.s);
      var w = maxW * d.v / 100;
      barra(g, 0, y + 38, w, 18, d.hi ? C('--s1') : '#6B7787');
      el('text', { x: w + 8, y: y + 52, class: 'val' }, g, d.v);
      hit(g, 0, y, L.w, rowH - 4, box, tip, '<b>' + d.l + '</b><br>Índice de valor del suelo: ' + d.v);
    });
  }

  /* ── Gráfico 2: a dónde va cada 100 UF ─────────────────────────────────── */
  function gDestino() {
    var box = $('#ch-destino'), tip = tooltip(box);
    var ancho = box.clientWidth > 720;
    var rowH = ancho ? 34 : 50, labW = ancho ? Math.min(360, box.clientWidth * 0.42) : 0;
    var L = lienzo(box, DESTINO.length * rowH), g = el('g', {}, L.svg);
    var maxV = 40, maxW = L.w - labW - 54;
    DESTINO.forEach(function (d, i) {
      var y = i * rowH;
      var by = ancho ? y + 8 : y + 22;
      el('text', { x: 0, y: ancho ? y + 21 : y + 14, class: 'lab' }, g, (!ancho && d.c) ? d.c : d.l);
      var w = Math.max(2, maxW * d.v / maxV);
      barra(g, labW, by, w, 18, d.hi ? C('--s1') : '#6B7787');
      el('text', { x: labW + w + 8, y: by + 14, class: 'val' }, g, fmt(d.v, 1));
      hit(g, 0, y, L.w, rowH, box, tip, '<b>' + d.l + '</b><br>' + fmt(d.v, 1) + ' de cada 100 UF · ' + fmt(d.uf, 2) + ' MM UF');
    });
  }

  /* ── Gráfico 3: TIR según precio del terreno ───────────────────────────── */
  function gPrecio() {
    var box = $('#ch-precio'), tip = tooltip(box);
    if (!$('.legend', box)) {
      var lg = document.createElement('div'); lg.className = 'legend';
      lg.innerHTML = '<span><i style="background:' + C('--s2') + '"></i>TIR del accionista con deuda al 50%</span>' +
                     '<span><i style="background:' + C('--s1') + '"></i>TIR del proyecto sin deuda</span>';
      box.appendChild(lg);
    }
    var L = lienzo(box, 300), m = { l: 34, r: 74, t: 14, b: 34 };
    var g = el('g', {}, L.svg);
    var x = function (p) { return m.l + (p - 12.75) / (16.25 - 12.75) * (L.w - m.l - m.r); };
    var y = function (v) { return m.t + (1 - (v - 8) / (20 - 8)) * (L.h - m.t - m.b); };
    [8, 12, 16, 20].forEach(function (v) {
      el('line', { x1: m.l, x2: L.w - m.r, y1: y(v), y2: y(v), class: v === 8 ? 'base' : 'grid' }, g);
      el('text', { x: m.l - 8, y: y(v) + 3.5, 'text-anchor': 'end', class: 'ax' }, g, v + '%');
    });
    [13, 14, 15, 16].forEach(function (p) {
      el('text', { x: x(p), y: L.h - m.b + 18, 'text-anchor': 'middle', class: 'ax' }, g, fmt(p, 0));
    });
    el('line', { x1: x(16), x2: x(16), y1: m.t, y2: L.h - m.b, stroke: C('--border'), 'stroke-width': 1 }, g);
    el('text', { x: x(16) - 6, y: m.t + 10, 'text-anchor': 'end', class: 'ax' }, g, 'Referencia');
    [['con', C('--s2')], ['sin', C('--s1')]].forEach(function (s) {
      var d = PRECIOS.map(function (r, i) { return (i ? 'L' : 'M') + x(r.p).toFixed(1) + ',' + y(r[s[0]]).toFixed(1); }).join('');
      el('path', { d: d, fill: 'none', stroke: s[1], 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g);
      PRECIOS.forEach(function (r) {
        el('circle', { cx: x(r.p), cy: y(r[s[0]]), r: r.ref ? 5 : 4, fill: s[1], stroke: C('--surface'), 'stroke-width': 2 }, g);
      });
      var u = PRECIOS[PRECIOS.length - 1];
      el('text', { x: x(u.p) + 10, y: y(u[s[0]]) + 4, class: 'val' }, g, fmt(u[s[0]], 1) + '%');
    });
    // Crosshair por columna
    var cross = el('line', { y1: m.t, y2: L.h - m.b, stroke: C('--muted'), 'stroke-width': 1, opacity: 0 }, g);
    PRECIOS.forEach(function (r, i) {
      var a = i ? (x(PRECIOS[i - 1].p) + x(r.p)) / 2 : m.l;
      var b = i < PRECIOS.length - 1 ? (x(r.p) + x(PRECIOS[i + 1].p)) / 2 : L.w - m.r;
      var rect = el('rect', { x: a, y: m.t, width: b - a, height: L.h - m.t - m.b, class: 'hit' }, g);
      var on = function () {
        cross.setAttribute('x1', x(r.p)); cross.setAttribute('x2', x(r.p)); cross.setAttribute('opacity', 0.5);
        var bb = box.getBoundingClientRect(), sb = L.svg.getBoundingClientRect();
        tip.show('<b>' + fmt(r.p, 1) + ' UF/m²</b> · US$' + fmt(r.us, 1) + ' MM<br>Sin deuda ' + fmt(r.sin, 1) + '% · con deuda ' + fmt(r.con, 1) + '%',
          sb.left - bb.left + x(r.p), sb.top - bb.top + y(r.con));
      };
      rect.addEventListener('mouseenter', on); rect.addEventListener('touchstart', on, { passive: true });
      rect.addEventListener('mouseleave', function () { cross.setAttribute('opacity', 0); tip.hide(); });
    });
  }

  /* ── Gráfico 4: sensibilidades (tornado) ───────────────────────────────── */
  function gRiesgos() {
    var box = $('#ch-riesgos'), tip = tooltip(box);
    if (!$('.legend', box)) {
      var lg = document.createElement('div'); lg.className = 'legend';
      lg.innerHTML = '<span><i style="background:' + C('--neg') + '"></i>Escenario adverso</span><span><i style="background:' + C('--pos') + '"></i>Escenario favorable</span>';
      box.appendChild(lg);
    }
    var rowH = 66, L = lienzo(box, RIESGOS.length * rowH + 26), g = el('g', {}, L.svg);
    var lo = -2.6, hi = 1.6, pad = 40;
    var x = function (v) { return pad + (v - lo) / (hi - lo) * (L.w - 2 * pad); };
    var top = 0, bot = RIESGOS.length * rowH;
    el('line', { x1: x(0), x2: x(0), y1: top, y2: bot, class: 'base' }, g);
    [-2, -1, 0, 1].forEach(function (v) {
      el('text', { x: x(v), y: bot + 18, 'text-anchor': 'middle', class: 'ax' }, g, (v > 0 ? '+' : '') + fmt(v, 0));
    });
    RIESGOS.forEach(function (d, i) {
      var y = i * rowH;
      el('text', { x: 0, y: y + 14, class: 'lab' }, g, d.l);
      el('text', { x: 0, y: y + 30, class: 'ax' }, g, d.s);
      var by = y + 38;
      var wn = x(0) - x(d.neg);
      barra(g, x(0) - 1, by, wn, 18, C('--neg'), true);
      el('text', { x: x(d.neg) - 6, y: by + 13.5, 'text-anchor': 'end', class: 'val' }, g, fmt(d.neg, 1).replace('-', '−'));
      hit(g, x(d.neg), by - 4, wn, 26, box, tip, '<b>' + d.l + '</b> · adverso<br>' + fmt(d.neg, 1).replace('-', '−') + ' UF/m² de valor del suelo');
      if (d.pos != null) {
        var wp = x(d.pos) - x(0);
        barra(g, x(0) + 1, by, wp, 18, C('--pos'), false);
        el('text', { x: x(d.pos) + 6, y: by + 13.5, class: 'val' }, g, '+' + fmt(d.pos, 1));
        hit(g, x(0), by - 4, wp, 26, box, tip, '<b>' + d.l + '</b> · favorable<br>+' + fmt(d.pos, 1) + ' UF/m² de valor del suelo');
      }
    });
  }

  /* ── Tabla de precios ──────────────────────────────────────────────────── */
  $('#tb-precio').innerHTML = PRECIOS.map(function (r) {
    return '<tr' + (r.ref ? ' class="ref"' : '') + '><td>' + fmt(r.p, 1) + (r.ref ? ' · ref.' : '') + '</td><td>' + fmt(r.us, 1) +
      '</td><td>' + fmt(r.sin, 1) + '%</td><td>' + fmt(r.con, 1) + '%</td><td>' + fmt(r.ut, 2) + '</td><td>' + fmt(r.mx, 2) + 'x</td></tr>';
  }).join('');

  /* ── Calendario ────────────────────────────────────────────────────────── */
  var A0 = 2027, A1 = 2038;
  $('#cal-rail').innerHTML = Array.from({ length: A1 - A0 }, function (_, i) { return '<span>' + (A0 + i) + '</span>'; }).join('');
  var pct = function (t) { return ((t - A0) / (A1 - A0) * 100).toFixed(2) + '%'; };
  $('#cal-rows').innerHTML = CAL.map(function (r, i) {
    return '<div class="cal-row"><span class="cl" style="left:min(' + pct(r.a) + ',calc(100% - 15.5rem))">' + r.l + '</span>' +
      '<div class="track"><div class="bar ' + r.c + '" style="--d:' + (0.25 + i * 0.18) + 's;left:' + pct(r.a) +
      ';width:calc(' + pct(r.b) + ' - ' + pct(r.a) + ')"></div></div></div>';
  }).join('');

  function graficos() { gProgramas(); gDestino(); gPrecio(); gRiesgos(); }
  var fontsListas = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  fontsListas.then(graficos);
  var rz; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { graficos(); frame(); }, 150); });
})();

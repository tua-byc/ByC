/* Campo Caliterra · comportamiento de la página: medios, entradas, contadores y gráficos.
   Las cifras de los gráficos replican el modelo de ByC (caso de referencia: 312 ha mandarina + 100 ha palto). */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var nf = function (dec) { return new Intl.NumberFormat('es-CL', { minimumFractionDigits: dec, maximumFractionDigits: dec }); };
  var fmt = function (v, dec) { return nf(dec).format(v); };
  var neg = function (s) { return String(s).replace('-', '−'); };
  var NS = 'http://www.w3.org/2000/svg';

  /* ── Datos ──────────────────────────────────────────────────────────────── */
  // Demanda de riego del caso de referencia, l/s continuos equivalentes (3,33 MM m³/año)
  var AGUA = [
    { m: 'Oct', v: 99.4 }, { m: 'Nov', v: 166.9 }, { m: 'Dic', v: 217.4 }, { m: 'Ene', v: 242.3 },
    { m: 'Feb', v: 227.0 }, { m: 'Mar', v: 149.1 }, { m: 'Abr', v: 89.9 }, { m: 'May', v: 31.1 },
    { m: 'Jun', v: 0 }, { m: 'Jul', v: 0 }, { m: 'Ago', v: 12.4 }, { m: 'Sep', v: 38.5 }
  ];
  var CAP = 155;
  // Noches de helada por temporada (promedio 10 temporadas)
  var HELADAS = [
    { m: 'May', a: 2.6, b: 0.7 }, { m: 'Jun', a: 6.4, b: 2.7 }, { m: 'Jul', a: 6.1, b: 2.2 },
    { m: 'Ago', a: 2.3, b: 0.3 }, { m: 'Sep', a: 0.3, b: 0.2 }, { m: 'Oct–Abr', a: 0.2, b: 0 }
  ];
  // Flujo de caja anual, MM US$ reales
  var FLUJO = [-24.02, -2.90, -2.90, -1.09, 2.66, 6.63, 9.84, 9.96, 9.96, 9.96, 9.96, 9.96, 9.96, 9.96, 9.96, 12.65];

  /* ── Medios: se cargan desde la carpeta protegida ───────────────────────── */
  var portada = $('#portada');
  $('#bg1').style.backgroundImage = 'url("media/campo.webp")';
  var alt = new Image(); alt.src = 'media/dron-laderas.webp';
  alt.onload = function () { $('#bg2').style.backgroundImage = 'url("media/dron-laderas.webp")'; };
  if (!reduce) {
    var flip = false, tag = $('#tagtxt');
    setInterval(function () {
      flip = !flip; portada.classList.toggle('flip', flip);
      tag.textContent = flip ? 'Laderas norte habilitables · vuelo dron, febrero 2026' : 'El campo hoy · viñedo en el plano';
    }, 6500);
  }

  var lazy = $$('img[data-src]');
  if ('IntersectionObserver' in window) {
    var lio = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.src = en.target.dataset.src; lio.unobserve(en.target); } });
    }, { rootMargin: '600px 0px' });
    lazy.forEach(function (i) { lio.observe(i); });
  } else lazy.forEach(function (i) { i.src = i.dataset.src; });

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
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.04 });
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
  // Barra vertical con extremo redondeado (4px) y base recta. h>0 crece hacia arriba desde y0.
  function columna(g, x, y0, w, h, color) {
    var up = h >= 0, a = Math.abs(h), r = Math.min(4, w / 2, a / 2), d;
    if (a < 0.5) return el('rect', { x: x, y: y0 - 0.5, width: w, height: 1, fill: color }, g);
    if (up) d = 'M' + x + ',' + y0 + 'v' + (-(a - r)) + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + (-r) + 'h' + (w - 2 * r) + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r + 'v' + (a - r) + 'z';
    else d = 'M' + x + ',' + y0 + 'v' + (a - r) + 'a' + r + ',' + r + ' 0 0 0 ' + r + ',' + r + 'h' + (w - 2 * r) + 'a' + r + ',' + r + ' 0 0 0 ' + r + ',' + (-r) + 'v' + (-(a - r)) + 'z';
    return el('path', { d: d, fill: color }, g);
  }
  function zona(g, x, y, w, h, box, tip, html, anchorY) {
    var r = el('rect', { x: x, y: y, width: Math.max(1, w), height: h, class: 'hit' }, g);
    var on = function () {
      var b = box.getBoundingClientRect(), s = r.ownerSVGElement.getBoundingClientRect();
      tip.show(html, s.left - b.left + x + w / 2, s.top - b.top + anchorY);
    };
    r.addEventListener('mouseenter', on); r.addEventListener('touchstart', on, { passive: true });
    r.addEventListener('mouseleave', tip.hide);
    return r;
  }
  function leyenda(box, items) {
    if ($('.legend', box)) return;
    var lg = document.createElement('div'); lg.className = 'legend';
    lg.innerHTML = items.map(function (it) {
      return '<span><i style="background:' + it[0] + (it[2] ? ';height:2px;border-radius:0' : '') + '"></i>' + it[1] + '</span>';
    }).join('');
    box.appendChild(lg);
  }
  var css = getComputedStyle(document.documentElement);
  var C = function (v) { return css.getPropertyValue(v).trim(); };
  var GRIS = '#6B7787';

  /* ── Gráfico 1: demanda mensual de agua vs capacidad ───────────────────── */
  function gAgua() {
    var box = $('#ch-agua'), tip = tooltip(box);
    leyenda(box, [[GRIS, 'Demanda cubierta por los pozos'], [C('--s1'), 'Sobre la capacidad: se cubre con agua acumulada'], [C('--navy'), 'Capacidad de los pozos · 155 l/s', true]]);
    var L = lienzo(box, 280), m = { l: 40, r: 8, t: 14, b: 28 }, g = el('g', {}, L.svg);
    var vmax = 260, iw = L.w - m.l - m.r, ih = L.h - m.t - m.b;
    var y = function (v) { return m.t + (1 - v / vmax) * ih; };
    [0, 50, 100, 150, 200, 250].forEach(function (v) {
      el('line', { x1: m.l, x2: L.w - m.r, y1: y(v), y2: y(v), class: v ? 'grid' : 'base' }, g);
      el('text', { x: m.l - 8, y: y(v) + 3.5, 'text-anchor': 'end', class: 'ax' }, g, v);
    });
    var step = iw / AGUA.length, bw = Math.min(34, step * 0.62);
    AGUA.forEach(function (d, i) {
      var x = m.l + i * step + (step - bw) / 2, base = Math.min(d.v, CAP), over = Math.max(0, d.v - CAP);
      if (d.v > 0) {
        if (over > 0) {
          el('rect', { x: x, y: y(base), width: bw, height: y(0) - y(base), fill: GRIS }, g);
          columna(g, x, y(CAP) - 1, bw, y(CAP) - y(d.v) - 1, C('--s1'));
        } else columna(g, x, y(0), bw, y(0) - y(d.v), GRIS);
      }
      el('text', { x: x + bw / 2, y: L.h - m.b + 17, 'text-anchor': 'middle', class: 'ax' }, g, d.m);
      var html = '<b>' + d.m + '</b> · ' + fmt(d.v, 0) + ' l/s de demanda' + (over > 0 ? '<br>' + fmt(over, 0) + ' l/s desde el agua acumulada' : '');
      zona(g, m.l + i * step, m.t, step, ih, box, tip, html, y(Math.max(d.v, 20)));
    });
    el('line', { x1: m.l, x2: L.w - m.r, y1: y(CAP), y2: y(CAP), stroke: C('--navy'), 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, g);
    var pk = AGUA[3], px = m.l + 3 * step + step / 2;
    el('text', { x: px, y: y(pk.v) - 7, 'text-anchor': 'middle', class: 'val' }, g, '~' + fmt(pk.v, 0));
  }

  /* ── Gráfico 2: heladas por mes ─────────────────────────────────────────── */
  function gHeladas() {
    var box = $('#ch-heladas'), tip = tooltip(box);
    leyenda(box, [[C('--frost'), 'Noches ≤ 0 °C'], [C('--frost-2'), 'Noches ≤ −2 °C']]);
    var L = lienzo(box, 250), m = { l: 26, r: 6, t: 16, b: 28 }, g = el('g', {}, L.svg);
    var vmax = 7, iw = L.w - m.l - m.r, ih = L.h - m.t - m.b;
    var y = function (v) { return m.t + (1 - v / vmax) * ih; };
    [0, 2, 4, 6].forEach(function (v) {
      el('line', { x1: m.l, x2: L.w - m.r, y1: y(v), y2: y(v), class: v ? 'grid' : 'base' }, g);
      el('text', { x: m.l - 7, y: y(v) + 3.5, 'text-anchor': 'end', class: 'ax' }, g, v);
    });
    var step = iw / HELADAS.length, bw = Math.min(22, step * 0.32), gap = 2;
    HELADAS.forEach(function (d, i) {
      var cx = m.l + i * step + step / 2;
      columna(g, cx - bw - gap / 2, y(0), bw, y(0) - y(d.a), C('--frost'));
      columna(g, cx + gap / 2, y(0), bw, y(0) - y(d.b), C('--frost-2'));
      if (d.a >= 2) el('text', { x: cx - bw / 2 - gap / 2, y: y(d.a) - 5, 'text-anchor': 'middle', class: 'ax' }, g, fmt(d.a, 1));
      el('text', { x: cx, y: L.h - m.b + 17, 'text-anchor': 'middle', class: 'ax' }, g, d.m);
      zona(g, m.l + i * step, m.t, step, ih, box, tip, '<b>' + d.m + '</b><br>' + fmt(d.a, 1) + ' noches ≤ 0 °C · ' + fmt(d.b, 1) + ' ≤ −2 °C', y(Math.max(d.a, 1)));
    });
  }

  /* ── Gráfico 3: flujo anual y acumulado ─────────────────────────────────── */
  function gFlujo() {
    var box = $('#ch-flujo'), tip = tooltip(box);
    leyenda(box, [[C('--s1'), 'Flujo anual'], [C('--navy'), 'Flujo acumulado', true]]);
    var acc = [], s = 0;
    FLUJO.forEach(function (v) { s += v; acc.push(s); });
    var L = lienzo(box, 320), m = { l: 40, r: 44, t: 14, b: 28 }, g = el('g', {}, L.svg);
    var lo = -35, hi = 85, iw = L.w - m.l - m.r, ih = L.h - m.t - m.b;
    var y = function (v) { return m.t + (1 - (v - lo) / (hi - lo)) * ih; };
    [-30, 0, 30, 60].forEach(function (v) {
      el('line', { x1: m.l, x2: L.w - m.r, y1: y(v), y2: y(v), class: v === 0 ? 'base' : 'grid' }, g);
      el('text', { x: m.l - 8, y: y(v) + 3.5, 'text-anchor': 'end', class: 'ax' }, g, neg(v));
    });
    var step = iw / FLUJO.length, bw = Math.min(26, step * 0.56);
    var xc = function (i) { return m.l + i * step + step / 2; };
    FLUJO.forEach(function (v, i) {
      columna(g, xc(i) - bw / 2, y(0), bw, y(0) - y(v), v < 0 ? C('--neg') : C('--s1'));
      if (L.w > 520 || i % 3 === 0) el('text', { x: xc(i), y: L.h - m.b + 17, 'text-anchor': 'middle', class: 'ax' }, g, i);
    });
    var d = acc.map(function (v, i) { return (i ? 'L' : 'M') + xc(i).toFixed(1) + ',' + y(v).toFixed(1); }).join('');
    el('path', { d: d, fill: 'none', stroke: C('--navy'), 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g);
    acc.forEach(function (v, i) { el('circle', { cx: xc(i), cy: y(v), r: i === 8 ? 4.5 : 3, fill: C('--navy'), stroke: C('--surface'), 'stroke-width': 1.5 }, g); });
    el('text', { x: xc(15) + 8, y: y(acc[15]) + 4, class: 'val' }, g, fmt(acc[15], 1));
    el('text', { x: xc(0), y: y(0) - 7, 'text-anchor': 'middle', class: 'val' }, g, neg(fmt(FLUJO[0], 1)));
    FLUJO.forEach(function (v, i) {
      zona(g, m.l + i * step, m.t, step, ih, box, tip,
        '<b>Año ' + i + '</b><br>Flujo ' + neg(fmt(v, 1)) + ' · acumulado ' + neg(fmt(acc[i], 1)) + ' MM US$', y(Math.max(v, acc[i])));
    });
  }

  function graficos() { gAgua(); gHeladas(); gFlujo(); }
  var fontsListas = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  fontsListas.then(graficos);
  var rz, w0 = innerWidth;
  addEventListener('resize', function () {
    if (innerWidth === w0) return; w0 = innerWidth;
    clearTimeout(rz); rz = setTimeout(function () { graficos(); frame(); }, 150);
  });
})();

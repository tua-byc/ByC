/* Lo Recabarren · club de cuatro socios: medios, entradas, mapa de lotes, contadores y gráficos. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var nf = function (dec) { return new Intl.NumberFormat('es-CL', { minimumFractionDigits: dec, maximumFractionDigits: dec }); };
  var fmt = function (v, dec) { return nf(dec).format(v); };
  var NS = 'http://www.w3.org/2000/svg';

  /* ── Datos del modelo ByC (paño a 18 UF/m², precio interno con igual TIR) ─ */
  // Polígonos: px de la imagen satelital 598×670, división en cuartos de igual superficie.
  var LOTES = [
    { n: 1, c: '--l1', s: 'Deptos premium', t: 'Departamentos premium', d: '277 departamentos de 120 m² en cinco edificios frente al Club de Polo',
      viv: '277 deptos', u: 277,
      pts: [[286.4,384],[270,334],[287,329.3],[287,208.5],[136,267],[132,270],[136.1,384]], lab: [212, 312],
      A: { p: 19.7, land: 28.0, cap: 55.9, ce: 36.4, rev: 224.1, ut: 41.5, mx: 1.74, y: 8.5, last: 33, u18: 14.6 },
      B: { p: 19.4, land: 27.5, cap: 53.4, ce: 37.4, rev: 224.1, ut: 41.6, mx: 1.78, y: 10.5, last: 41, u18: 12.6 } },
    { n: 2, c: '--l2', s: 'Deptos + centro', t: 'Departamentos y centro de barrio', d: '201 departamentos y 4.000 m² de comercio en el acceso por Av. Santa María',
      viv: '201 deptos + comercio', u: 201,
      pts: [[142,550],[297,492],[314,468],[286.4,384],[136.1,384]], lab: [214, 455],
      A: { p: 18.6, land: 26.5, cap: 60.3, ce: 36.6, rev: 189.5, ut: 38.1, mx: 1.63, y: 7.25, last: 28, u18: 13.9 },
      B: { p: 19.8, land: 28.1, cap: 60.3, ce: 39.9, rev: 189.5, ut: 37.1, mx: 1.61, y: 8.5, last: 33, u18: 12.9 } },
    { n: 3, c: '--l3', s: 'Deptos 100 m²', t: 'Departamentos de 100 m²', d: '333 departamentos más compactos en la franja norte, a 128 UF/m² útil',
      viv: '333 deptos', u: 333,
      pts: [[357,156],[340,64],[207,68],[213,208],[136,267],[427,154.4]], lab: [272, 140],
      A: { p: 20.3, land: 28.9, cap: 59.2, ce: 38.9, rev: 237.5, ut: 45.7, mx: 1.77, y: 9.25, last: 36, u18: 15.0 },
      B: { p: 19.4, land: 27.6, cap: 52.4, ce: 37.6, rev: 237.5, ut: 46.3, mx: 1.88, y: 11.75, last: 46, u18: 12.6 } },
    { n: 4, c: '--l4', s: 'Town houses', t: 'Town houses', d: '108 casas de 220 m² en clusters, como transición hacia Camino Agua del Palo',
      viv: '108 casas', u: 108,
      pts: [[460,282],[442,154],[427,154.4],[287,208.5],[287,329.3]], lab: [372, 240],
      A: { p: 12.1, land: 17.2, cap: 34.3, ce: 25.5, rev: 118.9, ut: 19.5, mx: 1.57, y: 7.25, last: 28, u18: 7.9 },
      B: { p: 12.1, land: 17.3, cap: 33.2, ce: 25.9, rev: 118.9, ut: 19.3, mx: 1.58, y: 8.5, last: 33, u18: 7.0 } }
  ];
  var CASO = {
    A: { tir: 13.3, tireq: 14.2, ut: 145, plazo: '7–9' },
    B: { tir: 11.6, tireq: 12.3, ut: 144, plazo: '8–12' }
  };
  var VALOR = [
    { l: 'Un dueño · programa base', s: 'Mezcla optimizada para un dueño, con venta de macrolotes · termina en 2037', v: 17.3 },
    { l: 'Un dueño · mezcla del club', s: 'Los cuatro productos, un lote de deptos tras otro · termina en 2045', d: '−2,1', v: 15.2 },
    { l: 'Cuatro socios · mercado compartido', s: '3 deptos y 1,5 casas al mes por lote · caso prudente', d: '+5,2', v: 20.4, hi: true },
    { l: 'Cuatro socios · ventas en paralelo', s: '4,5 deptos y 2 casas al mes por lote', d: '+2,6', v: 23.0, hi: true }
  ];
  var RIESGOS = [
    { l: 'Caso prudente', s: 'Paño a 17,5 UF/m²', v: 11.6, base: true },
    { l: 'Precio de venta −5%', s: 'Departamentos, casas, estacionamientos y arriendos', v: 10.0 },
    { l: 'Costo de obra +10%', s: '38,5 UF/m² en edificios, 46 en casas', v: 9.8 },
    { l: 'Retraso de 12 meses', s: 'En permisos y lanzamientos', v: 9.9 },
    { l: 'Mercado débil', s: '2 deptos y 1 casa al mes por lote', v: 9.7 },
    { l: 'Combinado', s: 'Precio −5%, costo +10% y 12 meses de retraso', v: 7.1, worst: true }
  ];
  var OFERTA = [
    { p: 16.0, A: 14.4, B: 12.6 }, { p: 16.5, A: 14.0, B: 12.2 }, { p: 17.0, A: 13.6, B: 11.9 },
    { p: 17.5, A: 13.3, B: 11.6, ref: true }, { p: 18.0, A: 12.9, B: 11.3 }, { p: 18.5, A: 12.6, B: 11.0 },
    { p: 19.0, A: 12.2, B: 10.7 }, { p: 19.5, A: 11.9, B: 10.4 }
  ];

  var css = getComputedStyle(document.documentElement);
  var C = function (v) { return css.getPropertyValue(v).trim(); };

  /* ── Medios ─────────────────────────────────────────────────────────────── */
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

  /* ── Utilidades SVG y tooltip ───────────────────────────────────────────── */
  function el(tag, attrs, parent, text) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
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

  /* ── Mapa de los cuatro lotes ──────────────────────────────────────────── */
  var sx = function (x) { return x / 598 * 1000; }, sy = function (y) { return y / 670 * 1120; };
  var DESLINDE = [[207,68],[340,64],[357,156],[442,154],[460,282],[270,334],[314,468],[297,492],[142,550],[132,270],[213,208]];
  var map = $('#lotmap'), grp = $('#lotgroup'), mtip = tooltip(map);
  var outline = $('#lotpath');
  outline.setAttribute('d', 'M' + DESLINDE.map(function (p) { return sx(p[0]).toFixed(1) + ',' + sy(p[1]).toFixed(1); }).join('L') + 'Z');
  outline.style.setProperty('--len', outline.getTotalLength());
  var lotEls = LOTES.map(function (L, i) {
    var path = el('path', {
      d: 'M' + L.pts.map(function (p) { return sx(p[0]).toFixed(1) + ',' + sy(p[1]).toFixed(1); }).join('L') + 'Z',
      class: 'lz', fill: C(L.c), style: '--d:' + (0.5 + i * 0.15) + 's'
    }, grp);
    el('text', { x: sx(L.lab[0]), y: sy(L.lab[1]), class: 'lz-n' }, grp, L.n);
    return path;
  });
  var list = $('#lotlist');
  list.innerHTML = LOTES.map(function (L) {
    return '<li data-n="' + L.n + '"><span class="ln" style="--c:var(' + L.c + ')">' + L.n + '</span><b>' + L.t + '</b>' +
      '<span class="m">≈32.700 m²<br>' + L.viv + '</span><span class="d">' + L.d + '</span></li>';
  }).join('');
  var items = $$('li', list);
  function marcar(n) {
    lotEls.forEach(function (p, i) { p.classList.toggle('on', i + 1 === n); });
    items.forEach(function (li) { li.classList.toggle('on', +li.dataset.n === n); });
  }
  lotEls.forEach(function (p, i) {
    var L = LOTES[i];
    var on = function (e) {
      marcar(L.n);
      var b = map.getBoundingClientRect(), pt = e.touches ? e.touches[0] : e;
      mtip.show('<b>Lote ' + L.n + ' · ' + L.t + '</b><br>≈32.700 m² · ' + L.viv + '<br>Precio interno ≈' + fmt(L.B.p, 1) + ' UF/m²',
        pt.clientX - b.left, pt.clientY - b.top);
    };
    p.addEventListener('mousemove', on); p.addEventListener('touchstart', on, { passive: true });
    p.addEventListener('mouseleave', function () { marcar(0); mtip.hide(); });
  });
  items.forEach(function (li) {
    li.addEventListener('mouseenter', function () { marcar(+li.dataset.n); });
    li.addEventListener('mouseleave', function () { marcar(0); });
  });

  /* ── Contadores ─────────────────────────────────────────────────────────── */
  function contar(e, delay) {
    if (e.dataset.done) return; e.dataset.done = '1';
    var unit = $('.u', e), target = parseFloat(e.dataset.count), dec = parseInt(e.dataset.dec || '0', 10);
    var put = function (v) { e.textContent = fmt(v, dec); if (unit) e.appendChild(unit); };
    if (reduce) { put(target); return; }
    put(0);
    var t0 = performance.now() + (delay || 0), D = 1200;
    (function tick(t) {
      if (t < t0) return requestAnimationFrame(tick);
      var p = Math.min(1, (t - t0) / D), k = 1 - Math.pow(1 - p, 3);
      if (p < 1) { put(dec ? target * k : Math.round(target * k)); requestAnimationFrame(tick); }
      else { put(target); e.classList.add('landed'); }
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

  /* ── Gráficos ───────────────────────────────────────────────────────────── */
  function lienzo(box, h) {
    var old = $('svg', box); if (old) old.remove();
    var w = Math.max(280, box.clientWidth - parseFloat(getComputedStyle(box).paddingLeft) * 2);
    var svg = el('svg', { viewBox: '0 0 ' + w + ' ' + h, width: w, height: h, role: 'img' });
    var leg = $('.legend', box);
    box.insertBefore(svg, leg || null);
    return { svg: svg, w: w, h: h };
  }
  function barra(g, x0, y, w, h, color) {
    var r = Math.min(4, Math.abs(w) / 2, h / 2);
    var d = 'M' + x0 + ',' + y + 'h' + (w - r) + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r + 'v' + (h - 2 * r) +
      'a' + r + ',' + r + ' 0 0 1 ' + (-r) + ',' + r + 'h' + (-(w - r)) + 'z';
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

  // 1. Valor del suelo según cómo se desarrolla
  function barras(box, rows, maxV, fmtV, refV, refLab) {
    var tip = tooltip(box);
    var rowH = 64, L = lienzo(box, rows.length * rowH + 26), g = el('g', {}, L.svg);
    var maxW = L.w - 4, x = function (v) { return maxW * v / maxV; };
    rows.forEach(function (d, i) {
      var y = i * rowH;
      var t = el('text', { x: 0, y: y + 14, class: 'lab' }, g, d.l);
      if (d.d) el('tspan', { dx: 8, class: 'val', style: 'fill:' + (d.d.charAt(0) === '+' ? C('--pos') : C('--neg')) }, t, d.d);
      el('text', { x: 0, y: y + 30, class: 'ax' }, g, d.s);
      var col = d.worst ? C('--neg') : (d.hi || d.base) ? C('--s1') : '#6B7787';
      barra(g, 0, y + 38, x(d.v), 20, col);
      el('text', { x: x(d.v) - 8, y: y + 52.5, 'text-anchor': 'end', class: 'val', fill: '#fff', style: 'fill:#fff' }, g, fmtV(d.v));
      hit(g, 0, y, L.w, rowH - 4, box, tip, '<b>' + d.l + '</b><br>' + fmtV(d.v) + (d.d ? ' · ' + d.d + ' respecto del paso anterior' : ''));
    });
    var xo = x(refV), yb = rows.length * rowH;
    rows.forEach(function (d, i) {
      el('line', { x1: xo, x2: xo, y1: i * rowH + 35, y2: i * rowH + 61, stroke: C('--navy'), 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }, g);
    });
    el('text', { x: xo, y: yb + 17, 'text-anchor': 'middle', class: 'ax' }, g, refLab);
  }
  function gValor() { barras($('#ch-valor'), VALOR, 25, function (v) { return fmt(v, 1); }, 17.5, 'Cierre esperado · 17,5 UF/m²'); }
  function gRiesgos() { barras($('#ch-riesgos'), RIESGOS, 13, function (v) { return fmt(v, 1) + '%'; }, 10, 'TIR exigida · 10%'); }

  // 2. TIR de cada socio según el precio ofrecido
  function gOferta() {
    var box = $('#ch-oferta'), tip = tooltip(box);
    if (!$('.legend', box)) {
      var lg = document.createElement('div'); lg.className = 'legend';
      lg.innerHTML = '<span><i style="background:' + C('--s1') + '"></i>Escenario favorable</span>' +
                     '<span><i style="background:' + C('--s2') + '"></i>Escenario conservador</span>';
      box.appendChild(lg);
    }
    var L = lienzo(box, 300), m = { l: 34, r: 56, t: 14, b: 34 };
    var g = el('g', {}, L.svg);
    var x = function (p) { return m.l + (p - 15.8) / (19.7 - 15.8) * (L.w - m.l - m.r); };
    var y = function (v) { return m.t + (1 - (v - 9) / (15 - 9)) * (L.h - m.t - m.b); };
    [9, 11, 13, 15].forEach(function (v) {
      el('line', { x1: m.l, x2: L.w - m.r, y1: y(v), y2: y(v), class: v === 9 ? 'base' : 'grid' }, g);
      el('text', { x: m.l - 8, y: y(v) + 3.5, 'text-anchor': 'end', class: 'ax' }, g, v + '%');
    });
    OFERTA.forEach(function (r) {
      el('text', { x: x(r.p), y: L.h - m.b + 18, 'text-anchor': 'middle', class: 'ax' }, g, fmt(r.p, 1));
    });
    el('rect', { x: x(16.5), y: m.t, width: x(18.5) - x(16.5), height: L.h - m.t - m.b, fill: C('--gold'), opacity: 0.07 }, g);
    el('text', { x: x(17.5), y: m.t + 10, 'text-anchor': 'middle', class: 'ax' }, g, 'Rango de la oferta');
    [['A', C('--s1')], ['B', C('--s2')]].forEach(function (s) {
      var d = OFERTA.map(function (r, i) { return (i ? 'L' : 'M') + x(r.p).toFixed(1) + ',' + y(r[s[0]]).toFixed(1); }).join('');
      el('path', { d: d, fill: 'none', stroke: s[1], 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g);
      OFERTA.forEach(function (r) {
        el('circle', { cx: x(r.p), cy: y(r[s[0]]), r: r.ref ? 5 : 4, fill: s[1], stroke: C('--surface'), 'stroke-width': 2 }, g);
      });
      var ref = OFERTA[3];
      el('text', { x: x(ref.p) + 9, y: y(ref[s[0]]) - 9, class: 'val' }, g, fmt(ref[s[0]], 1) + '%');
    });
    var cross = el('line', { y1: m.t, y2: L.h - m.b, stroke: C('--muted'), 'stroke-width': 1, opacity: 0 }, g);
    OFERTA.forEach(function (r, i) {
      var a = i ? (x(OFERTA[i - 1].p) + x(r.p)) / 2 : m.l;
      var b = i < OFERTA.length - 1 ? (x(r.p) + x(OFERTA[i + 1].p)) / 2 : L.w - m.r;
      var rect = el('rect', { x: a, y: m.t, width: b - a, height: L.h - m.t - m.b, class: 'hit' }, g);
      var on = function () {
        cross.setAttribute('x1', x(r.p)); cross.setAttribute('x2', x(r.p)); cross.setAttribute('opacity', 0.5);
        var bb = box.getBoundingClientRect(), sb = L.svg.getBoundingClientRect();
        tip.show('<b>' + fmt(r.p, 1) + ' UF/m²</b> · US$' + fmt(r.p * 130686 * 40926.41 / 940.91 / 1e6, 0) + ' MM<br>Conservador ' +
          fmt(r.B, 1) + '% · favorable ' + fmt(r.A, 1) + '%', sb.left - bb.left + x(r.p), sb.top - bb.top + y(r.A));
      };
      rect.addEventListener('mouseenter', on); rect.addEventListener('touchstart', on, { passive: true });
      rect.addEventListener('mouseleave', function () { cross.setAttribute('opacity', 0); tip.hide(); });
    });
  }

  /* ── Tablas y selector de caso ─────────────────────────────────────────── */
  function lotCell(L, corto) { return '<span class="ln" style="--c:var(' + L.c + ')">' + L.n + '</span>' + (corto ? L.s : L.t); }
  function setFig(id, v, dec, unit) { var f = $(id); f.innerHTML = (typeof v === 'number' ? fmt(v, dec) : v) + '<span class="u">' + unit + '</span>'; }
  function caso(k) {
    var cs = CASO[k];
    setFig('#f-tir', cs.tir, 1, '%'); setFig('#f-tireq', cs.tireq, 1, '%');
    setFig('#f-util', cs.ut, 0, 'MM US$'); setFig('#f-plazo', cs.plazo, 0, 'años');
    var tot = { land: 0, cap: 0, ce: 0, rev: 0, ut: 0, u: 0 };
    $('#tb-lotes').innerHTML = LOTES.map(function (L) {
      var d = L[k];
      tot.land += d.land; tot.cap += d.cap; tot.ce += d.ce; tot.rev += d.rev; tot.ut += d.ut; tot.u += L.u;
      return '<tr><td>' + lotCell(L) + '</td><td>' + L.viv + '</td><td>' + fmt(d.p, 1) + '</td><td>' + fmt(d.land, 1) + '</td><td>' +
        fmt(d.cap, 0) + '</td><td>' + fmt(d.ce, 0) + '</td><td>' + fmt(d.rev, 0) + '</td><td>' + fmt(d.ut, 1) + '</td><td>' + fmt(d.mx, 2) + 'x</td><td>' +
        fmt(d.y, d.y % 1 ? 1 : 0) + '</td></tr>';
    }).join('');
    $('#tf-lotes').innerHTML = '<tr><td>Los cuatro lotes</td><td>' + fmt(tot.u, 0) + ' viviendas</td><td>17,7 prom.</td><td>' + fmt(tot.land, 1) +
      '</td><td>' + fmt(tot.cap, 0) + '</td><td>' + fmt(tot.ce, 0) + '</td><td>' + fmt(tot.rev, 0) + '</td><td>' + fmt(tot.ut, 1) + '</td><td></td><td></td></tr>';
    $$('.seg button').forEach(function (b) { b.setAttribute('aria-checked', b.dataset.caso === k ? 'true' : 'false'); });
  }
  $$('.seg button').forEach(function (b) { b.addEventListener('click', function () { caso(b.dataset.caso); }); });
  caso('B');
  $('#tb-interno').innerHTML = LOTES.map(function (L) {
    return '<tr><td>' + lotCell(L, true) + '</td><td>' + fmt(L.B.p, 1) + '</td><td>' + fmt(L.B.land, 1) + '</td><td>' + fmt(L.B.u18, 1) + '%</td></tr>';
  }).join('');

  /* ── Calendario por lote ───────────────────────────────────────────────── */
  var A0 = 2027, A1 = 2039;
  $('#cal-rail').innerHTML = Array.from({ length: A1 - A0 }, function (_, i) { return '<span>' + (A0 + i) + '</span>'; }).join('');
  var pct = function (t) { return ((t - A0) / (A1 - A0) * 100).toFixed(2) + '%'; };
  $('#cal-rows').innerHTML = LOTES.map(function (L, i) {
    var fin = A0 + (L.B.last + 1) / 4, pre = 1.5 / (fin - A0) * 100;
    return '<div class="cal-row"><span class="cl" style="left:0">Lote ' + L.n + ' · ' + L.t + ' · última escritura ' +
      (Math.floor(fin - 0.01)) + '</span><div class="track"><div class="bar l' + L.n + '" style="--d:' + (0.25 + i * 0.15) + 's;left:0;width:' + pct(fin) +
      '"><span class="pre" style="width:' + pre.toFixed(1) + '%"></span></div></div></div>';
  }).join('');

  function graficos() { gOferta(); }
  var fontsListas = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  fontsListas.then(graficos);
  var rz; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { graficos(); frame(); }, 150); });
})();

// Genera las páginas de contacto del equipo (byc.cl/nombre-apellido) a partir de equipo/equipo.json.
//
//   npm run generar
//
// Por cada persona crea:
//   public/<slug>/index.html   página de contacto (publicada)
//   public/<slug>/<slug>.vcf   vCard 3.0 UTF-8 (publicada)
//   equipo/qr/<slug>.svg       QR hacia https://byc.cl/<slug> (NO publicado)

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLICO = join(RAIZ, 'public');
const QR_DIR = join(RAIZ, 'equipo', 'qr');
const MARCA = '<!-- generado por equipo/generar.mjs -->';

const datos = JSON.parse(readFileSync(join(RAIZ, 'equipo', 'equipo.json'), 'utf8'));
const { sitio, empresa, oficina } = datos;

// ===== Utilidades =====

const slugify = (texto) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const escHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Escape de valores vCard 3.0 (RFC 2426): \ , ; y saltos de línea
const escVcf = (s) => String(s).replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\r?\n/g, '\\n');

// apellido2 (materno) es opcional: se muestra en la página y la vCard, pero no entra en la URL
const apellidos = (p) => [p.apellido, p.apellido2].filter(Boolean).join(' ');
const nombreCompleto = (p) => `${p.nombre} ${apellidos(p)}`;

// +56940512777 -> +56 9 4051 2777 (celular chileno); otros formatos quedan tal cual
function formatearCelular(tel) {
  const d = tel.replace(/[^\d+]/g, '');
  const m = d.match(/^\+569(\d{4})(\d{4})$/);
  return m ? `+56 9 ${m[1]} ${m[2]}` : tel;
}

function validar(p, i) {
  for (const campo of ['nombre', 'apellido', 'celular', 'email']) {
    if (!p[campo] || !String(p[campo]).trim()) throw new Error(`equipo[${i}]: falta "${campo}"`);
  }
  if (!/^\+\d{8,15}$/.test(p.celular.replace(/\s/g, ''))) {
    throw new Error(`equipo[${i}]: celular "${p.celular}" debe tener formato +56912345678`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) throw new Error(`equipo[${i}]: email "${p.email}" no es válido`);
}

// ===== vCard =====

function vcard(p, url) {
  const lineas = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N;CHARSET=UTF-8:${escVcf(apellidos(p))};${escVcf(p.nombre)};;;`,
    `FN;CHARSET=UTF-8:${escVcf(nombreCompleto(p))}`,
    `ORG;CHARSET=UTF-8:${escVcf(empresa)}`,
    p.cargo ? `TITLE;CHARSET=UTF-8:${escVcf(p.cargo)}` : null,
    `TEL;TYPE=CELL,VOICE:${p.celular.replace(/\s/g, '')}`,
    `EMAIL;TYPE=INTERNET,WORK:${p.email}`,
    `ADR;TYPE=WORK;CHARSET=UTF-8:;;${escVcf(oficina.direccion)};${escVcf(oficina.comuna)};${escVcf(oficina.region)};;${escVcf(oficina.pais)}`,
    `URL:${url}`,
    'END:VCARD',
  ];
  return lineas.filter(Boolean).join('\r\n') + '\r\n';
}

// ===== Página =====

const ICONOS = {
  tel: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  wa: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  copiar: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  ok: '<path d="M20 6 9 17l-5-5"/>',
  abrir: '<path d="M7 17 17 7M8 7h9v9"/>',
  guardar: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
};
const icono = (n, cls = 'ico') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[n]}</svg>`;

// `accion` agrega una línea en color de acento y una flecha al final, para que se note que la fila abre otra app
function fila({ href, ico, etiqueta, valor, accion, copiar, externo }) {
  const ext = externo ? ' target="_blank" rel="noopener"' : '';
  const btn = copiar
    ? `<button type="button" class="copiar" data-copiar="${escHtml(copiar)}" aria-label="Copiar ${escHtml(etiqueta.toLowerCase())}">${icono('copiar')}${icono('ok', 'ico ico-ok')}</button>`
    : '';
  const acc = accion ? `<span class="fila-acc">${escHtml(accion)}</span>` : '';
  const flecha = accion ? `<span class="fila-flecha">${icono('abrir')}</span>` : '';
  return `
      <li class="fila">
        <a class="fila-link" href="${escHtml(href)}"${ext}>
          <span class="fila-ico">${icono(ico)}</span>
          <span class="fila-txt"><span class="fila-etq">${escHtml(etiqueta)}</span><span class="fila-val">${escHtml(valor)}</span>${acc}</span>${flecha}
        </a>${btn}
      </li>`;
}

function pagina(p, slug) {
  const nombre = nombreCompleto(p);
  const tel = p.celular.replace(/\s/g, '');
  const telVisible = formatearCelular(tel);
  const vcf = `/${slug}/${slug}.vcf`;

  return `<!DOCTYPE html>
${MARCA}
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#0A1628">
  <title>${escHtml(nombre)} | ${escHtml(empresa)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --navy: #0A1628;
      --acento: #2C4A6E;
      --acento-suave: #e9eef4;
      --texto: #1f2937;
      --gris: #6b7280;
      --borde: #e5e7eb;
      --fondo: #f4f5f7;
      --serif: 'Cormorant Garamond', Garamond, Georgia, serif;
      --sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-text-size-adjust: 100%; }
    body { font-family: var(--sans); color: var(--texto); background: var(--fondo); min-height: 100vh; line-height: 1.5; }
    a { color: inherit; text-decoration: none; }

    .cabecera {
      background: var(--navy);
      color: #fff;
      text-align: center;
      padding: calc(48px + env(safe-area-inset-top)) 24px 72px;
    }
    .logo { width: 104px; height: auto; display: block; margin: 0 auto 32px; }
    .nombre { font-family: var(--serif); font-weight: 600; font-size: 2.4rem; line-height: 1.1; letter-spacing: .3px; }
    .cargo { margin-top: 8px; font-size: .95rem; color: rgba(255,255,255,.8); }
    .empresa { margin-top: 14px; font-size: .68rem; font-weight: 500; letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,.6); }

    .contenido { max-width: 440px; margin: -40px auto 0; padding: 0 16px calc(32px + env(safe-area-inset-bottom)); }
    .guardar {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      width: 100%; min-height: 56px; border-radius: 10px;
      background: var(--acento); color: #fff;
      font-size: 1rem; font-weight: 600; letter-spacing: .2px;
      box-shadow: 0 8px 24px rgba(10,22,40,.22);
      transition: background .2s;
    }
    .guardar:hover, .guardar:active { background: #24405f; }
    .guardar .ico { width: 20px; height: 20px; }

    .lista { list-style: none; margin-top: 16px; background: #fff; border-radius: 10px; border: 1px solid var(--borde); overflow: hidden; }
    .fila { display: flex; align-items: center; border-top: 1px solid var(--borde); }
    .fila:first-child { border-top: 0; }
    .fila-link { flex: 1; display: flex; align-items: center; gap: 14px; padding: 14px 16px; min-width: 0; min-height: 64px; }
    .fila-link:active { background: var(--fondo); }
    .fila-ico { flex: none; width: 40px; height: 40px; border-radius: 50%; background: var(--acento-suave); color: var(--acento); display: grid; place-items: center; }
    .ico { width: 18px; height: 18px; }
    .fila-txt { display: flex; flex-direction: column; min-width: 0; }
    .fila-etq { font-size: .7rem; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: var(--gris); }
    .fila-val { font-size: .98rem; color: var(--navy); overflow-wrap: anywhere; }
    .fila-acc { margin-top: 2px; font-size: .88rem; font-weight: 600; color: var(--acento); }
    .fila-flecha { flex: none; margin-left: auto; width: 32px; height: 32px; border-radius: 50%; background: var(--acento); color: #fff; display: grid; place-items: center; }
    .fila-flecha .ico { width: 16px; height: 16px; stroke-width: 2; }

    .copiar {
      flex: none; width: 48px; height: 48px; margin-right: 8px; border: 0; border-radius: 8px;
      background: transparent; color: var(--acento); display: grid; place-items: center; cursor: pointer;
      font: inherit;
    }
    .copiar:active { background: var(--acento-suave); }
    .copiar .ico-ok { display: none; }
    .copiar.ok .ico { display: none; }
    .copiar.ok .ico-ok { display: block; }

    .aviso {
      position: fixed; left: 50%; bottom: calc(24px + env(safe-area-inset-bottom));
      transform: translate(-50%, 16px); opacity: 0; pointer-events: none;
      background: var(--navy); color: #fff; font-size: .88rem; padding: 10px 18px; border-radius: 999px;
      transition: opacity .2s, transform .2s;
    }
    .aviso.visible { opacity: 1; transform: translate(-50%, 0); }

    .pie { text-align: center; margin-top: 28px; font-size: .8rem; color: var(--gris); }
    .pie a { color: var(--acento); font-weight: 500; }

    @media (min-width: 600px) {
      .cabecera { padding-top: 64px; }
      .nombre { font-size: 2.8rem; }
    }
  </style>
</head>
<body>
  <header class="cabecera">
    <img class="logo" src="/img/logo-byc-blanco-320.png" alt="B&amp;C" width="320" height="228">
    <h1 class="nombre">${escHtml(nombre)}</h1>${p.cargo ? `
    <p class="cargo">${escHtml(p.cargo)}</p>` : ''}
    <p class="empresa">${escHtml(empresa)}</p>
  </header>

  <main class="contenido">
    <a class="guardar" href="${vcf}">${icono('guardar')}Guardar contacto</a>

    <ul class="lista">${[
      fila({ href: `tel:${tel}`, ico: 'tel', etiqueta: 'Celular', valor: telVisible, copiar: tel }),
      fila({ href: `mailto:${p.email}`, ico: 'mail', etiqueta: 'Email', valor: p.email, copiar: p.email }),
      fila({ href: `https://wa.me/${tel.replace('+', '')}`, ico: 'wa', etiqueta: 'WhatsApp', valor: telVisible, accion: 'Abrir chat en WhatsApp', externo: true }),
      fila({ href: oficina.maps, ico: 'pin', etiqueta: 'Oficina', valor: `${oficina.direccion}, ${oficina.comuna}`, accion: 'Ver en Google Maps', externo: true }),
    ].join('')}
    </ul>

    <p class="pie"><a href="/">${escHtml(sitio.replace(/^https?:\/\//, ''))}</a></p>
  </main>

  <div class="aviso" id="aviso" role="status" aria-live="polite"></div>

  <script>
    (function () {
      var aviso = document.getElementById('aviso');
      var timer;
      function mostrar(msg) {
        aviso.textContent = msg;
        aviso.classList.add('visible');
        clearTimeout(timer);
        timer = setTimeout(function () { aviso.classList.remove('visible'); }, 1800);
      }
      function copiarFallback(texto) {
        var t = document.createElement('textarea');
        t.value = texto;
        t.setAttribute('readonly', '');
        t.style.position = 'fixed';
        t.style.opacity = '0';
        document.body.appendChild(t);
        t.select();
        t.setSelectionRange(0, texto.length);
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(t);
        return ok;
      }
      document.querySelectorAll('[data-copiar]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var texto = btn.getAttribute('data-copiar');
          function listo() {
            btn.classList.add('ok');
            mostrar('Copiado');
            setTimeout(function () { btn.classList.remove('ok'); }, 1800);
          }
          if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(texto).then(listo, function () {
              copiarFallback(texto) ? listo() : mostrar('No se pudo copiar');
            });
          } else {
            copiarFallback(texto) ? listo() : mostrar('No se pudo copiar');
          }
        });
      });
    })();
  </script>
</body>
</html>
`;
}

// ===== Generación =====

const slugs = new Set();
mkdirSync(QR_DIR, { recursive: true });

for (const [i, p] of datos.equipo.entries()) {
  validar(p, i);
  const slug = p.slug || slugify(`${p.nombre} ${p.apellido}`);
  if (slugs.has(slug)) throw new Error(`Slug duplicado: "${slug}". Agrega un campo "slug" distinto a una de las personas.`);
  slugs.add(slug);

  const carpeta = join(PUBLICO, slug);
  const html = join(carpeta, 'index.html');
  // No pisar carpetas del sitio (img, video, etc.) que no haya creado este script
  if (existsSync(carpeta) && !(existsSync(html) && readFileSync(html, 'utf8').includes(MARCA))) {
    throw new Error(`public/${slug}/ ya existe y no fue generada por este script. Usa otro "slug".`);
  }

  const url = `${sitio}/${slug}`;
  mkdirSync(carpeta, { recursive: true });
  writeFileSync(html, pagina(p, slug));
  writeFileSync(join(carpeta, `${slug}.vcf`), vcard(p, url));

  const svg = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 4,
    color: { dark: '#000000', light: '#ffffff' },
  });
  writeFileSync(join(QR_DIR, `${slug}.svg`), svg);

  console.log(`✓ ${slug}  →  ${url}`);
}

// Avisar de páginas generadas antes para personas que ya no están en equipo.json
for (const d of readdirSync(PUBLICO, { withFileTypes: true })) {
  if (!d.isDirectory() || slugs.has(d.name)) continue;
  const html = join(PUBLICO, d.name, 'index.html');
  if (existsSync(html) && readFileSync(html, 'utf8').includes(MARCA)) {
    console.warn(`! public/${d.name}/ ya no está en equipo.json. Bórrala a mano si corresponde (y equipo/qr/${d.name}.svg).`);
  }
}

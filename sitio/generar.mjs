// Arma las páginas de byc.cl a partir de sitio/paginas/*.html, agregando a cada una
// el <head>, el menú (sitio/partes/cabecera.html) y el footer (sitio/partes/pie.html).
//
//   npm run paginas
//
// Cada archivo de sitio/paginas/ parte con un comentario JSON con sus datos:
//   <!-- {"ruta": "servicios/index.html", "pagina": "servicios", "titulo": "...", "descripcion": "..."} -->
// Opcionales: "inicio": true (intro, video y estilos de la portada).
// No editar a mano los HTML de public/ que estas páginas generan: se sobrescriben.

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITIO = join(RAIZ, 'sitio');
const PUBLICO = join(RAIZ, 'public');
const MARCA = '<!-- generado por sitio/generar.mjs a partir de sitio/paginas/ -->';

const cabecera = readFileSync(join(SITIO, 'partes', 'cabecera.html'), 'utf8');
const pie = readFileSync(join(SITIO, 'partes', 'pie.html'), 'utf8');

const escHtml = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function armar(datos, cuerpo) {
    const { pagina, titulo, descripcion, inicio } = datos;
    // Marca la pestaña de la página actual
    const menu = cabecera.replace(`data-pagina="${pagina}"`, `data-pagina="${pagina}" aria-current="page"`);
    const fuentes = 'https://fonts.googleapis.com/css2?family=PT+Serif:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap';
    // La intro del logo se decide antes de pintar, para que no parpadee la portada
    const scriptIntro = inicio
        ? `\n    <script>try{if(!sessionStorage.getItem('byc-intro')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('con-intro','intro-activa')}catch(e){}</script>`
        : '';
    return `<!DOCTYPE html>
${MARCA}
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escHtml(titulo)}</title>
    <meta name="description" content="${escHtml(descripcion)}">
    <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
    <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="${fuentes}" rel="stylesheet">
    <link rel="stylesheet" href="/css/sitio.css">${inicio ? '\n    <link rel="stylesheet" href="/css/inicio.css">' : ''}${scriptIntro}
</head>
<body>

${menu}
    <main>
${cuerpo.trim().replace(/^/gm, '    ')}
    </main>

${pie}
    <script src="/js/sitio.js"></script>${inicio ? '\n    <script src="/js/inicio.js"></script>' : ''}
</body>
</html>
`;
}

for (const archivo of readdirSync(join(SITIO, 'paginas')).filter((f) => f.endsWith('.html')).sort()) {
    const fuente = readFileSync(join(SITIO, 'paginas', archivo), 'utf8');
    const m = fuente.match(/^<!--\s*(\{[\s\S]*?\})\s*-->\n?/);
    if (!m) throw new Error(`${archivo}: falta el comentario JSON inicial`);
    const datos = JSON.parse(m[1]);
    const destino = join(PUBLICO, datos.ruta);
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, armar(datos, fuente.slice(m[0].length)));
    console.log(`✓ public/${datos.ruta}`);
}

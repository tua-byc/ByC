// Guardia de contenido: todo lo que esté bajo /<presentacion>/ver/ (HTML, imágenes,
// clips) solo se entrega con una sesión firmada vigente para esa presentación.
// Corre antes de la CDN en todas las rutas, así que una presentación nueva queda
// protegida con solo poner su contenido en public/<slug>/ver/.
import { sesionDe, slugValido } from '../lib/sesion.mjs';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async (req, context) => {
  const url = new URL(req.url);
  const partes = url.pathname.split('/').filter(Boolean);
  if (partes.length < 2 || partes[1] !== 'ver') return; // no es contenido protegido
  const slug = partes[0];
  if (!slugValido(slug)) return new Response('No encontrado', { status: 404 });

  const s = await sesionDe(req, slug).catch(() => null);
  const pideHtml = (req.headers.get('accept') || '').includes('text/html');
  if (!s) {
    if (pideHtml) return Response.redirect(new URL(`/${slug}/`, url), 302);
    return new Response('Acceso restringido', { status: 403, headers: { 'Cache-Control': 'no-store' } });
  }

  const res = await context.next();
  const tipo = res.headers.get('content-type') || '';

  if (tipo.includes('text/html')) {
    // Marca la copia con el nombre de quien la abre.
    const html = (await res.text())
      .replaceAll('{{PERSONA}}', esc(s.n))
      .replaceAll('{{ORGANIZACION}}', esc(s.o || ''));
    const h = new Headers(res.headers);
    h.delete('content-length');
    h.set('Cache-Control', 'private, no-store');
    h.set('X-Robots-Tag', 'noindex, nofollow');
    return new Response(html, { status: res.status, headers: h });
  }

  const h = new Headers(res.headers);
  h.set('Cache-Control', 'private, max-age=3600');
  return new Response(res.body, { status: res.status, headers: h });
};

export const config = {
  path: '/*',
  excludedPath: ['/api/*', '/assets/*', '/img/*', '/favicon.ico', '/robots.txt'],
};

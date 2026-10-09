// POST /api/evento  — lo llama /assets/seguimiento.js (sendBeacon).
// Solo acepta eventos de una sesión firmada vigente para esa presentación.
import { sesionDe } from '../lib/sesion.mjs';
import { insertar, visitante } from '../lib/supabase.mjs';

const EVENTOS = new Set(['vista', 'seccion', 'salida']);
const vacio = (status) => new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });
const entero = (n, max) => (Number.isFinite(+n) ? Math.max(0, Math.min(max, Math.round(+n))) : null);
const texto = (t, max) => (typeof t === 'string' && t ? t.slice(0, max) : null);

export default async (req, context) => {
  if (req.method !== 'POST') return vacio(405);

  let d;
  try {
    const crudo = await req.text();
    if (crudo.length > 8000) return vacio(413);
    d = JSON.parse(crudo);
  } catch { return vacio(400); }

  const slug = String(d?.presentacion || '');
  const s = await sesionDe(req, slug).catch(() => null);
  if (!s) return vacio(401);
  if (!EVENTOS.has(d.evento)) return vacio(400);

  // Solo se guardan los campos conocidos del detalle.
  const detalle = {};
  if (d.detalle && typeof d.detalle === 'object') {
    if (d.detalle.secciones && typeof d.detalle.secciones === 'object') {
      detalle.secciones = Object.fromEntries(
        Object.entries(d.detalle.secciones).slice(0, 40)
          .filter(([k]) => /^[a-z0-9-]{1,40}$/.test(k))
          .map(([k, v]) => [k, entero(v, 86400)]),
      );
    }
    for (const k of ['ancho', 'alto']) if (d.detalle[k] != null) detalle[k] = entero(d.detalle[k], 20000);
    if (d.detalle.referrer) detalle.referrer = texto(d.detalle.referrer, 300);
    if (d.detalle.motivo) detalle.motivo = texto(d.detalle.motivo, 30);
  }

  try {
    await insertar('visitas', [{
      presentacion: slug,
      evento: d.evento,
      sesion: s.s,
      codigo: s.c,
      persona: s.n,
      organizacion: s.o,
      seccion: d.evento === 'seccion' ? texto(d.seccion, 40) : null,
      segundos: d.segundos != null ? entero(d.segundos, 86400) : null,
      scroll_max: d.scroll_max != null ? entero(d.scroll_max, 100) : null,
      detalle,
      ...visitante(req, context),
    }]);
    return vacio(204);
  } catch (e) {
    console.error('[evento]', e.message);
    return vacio(503);
  }
};

export const config = { path: '/api/evento' };

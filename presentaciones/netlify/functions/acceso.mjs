// POST /api/acceso  { presentacion, codigo }
//   Valida el código contra la tabla `codigos` de Supabase, registra el intento
//   en `visitas` y, si es válido, entrega una cookie firmada que abre /<presentacion>/ver/.
// GET  /api/acceso?presentacion=<slug>
//   Dice si el navegador ya tiene una sesión vigente (para no pedir el código de nuevo).
import { firmar, cookieSesion, sesionDe, slugValido, DURACION_SEGUNDOS } from '../lib/sesion.mjs';
import { seleccionar, contar, insertar, visitante } from '../lib/supabase.mjs';

const MAX_FALLOS = 10;          // intentos fallidos por IP...
const VENTANA_MIN = 15;         // ...en esta ventana
const FORMATO = /^[A-Z0-9-]{4,40}$/;

const json = (cuerpo, status = 200, extra = {}) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  });

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const destino = (slug) => `/${slug}/ver/`;

export default async (req, context) => {
  if (req.method === 'GET') {
    const slug = new URL(req.url).searchParams.get('presentacion');
    const s = await sesionDe(req, slug).catch(() => null);
    return json(s ? { activa: true, destino: destino(slug) } : { activa: false });
  }
  if (req.method !== 'POST') return json({ ok: false }, 405, { Allow: 'GET, POST' });

  let datos;
  try { datos = await req.json(); } catch { return json({ ok: false, error: 'formato' }, 400); }
  const slug = String(datos?.presentacion || '');
  const codigo = String(datos?.codigo || '').toUpperCase().replace(/\s+/g, '');
  if (!slugValido(slug)) return json({ ok: false, error: 'presentacion' }, 400);

  const v = visitante(req, context);
  const base = { presentacion: slug, ...v };

  try {
    // Freno a la fuerza bruta: demasiados códigos inválidos desde la misma IP.
    if (v.ip) {
      const desde = new Date(Date.now() - VENTANA_MIN * 60_000).toISOString();
      const fallos = await contar('visitas',
        `select=id&evento=eq.codigo_invalido&ip=eq.${encodeURIComponent(v.ip)}&creado_en=gte.${encodeURIComponent(desde)}`);
      if (fallos >= MAX_FALLOS) {
        await insertar('visitas', [{ ...base, evento: 'bloqueado', codigo: codigo.slice(0, 40) || null }]);
        return json({ ok: false, error: 'bloqueado' }, 429, { 'Retry-After': String(VENTANA_MIN * 60) });
      }
    }

    let fila = null;
    if (FORMATO.test(codigo)) {
      const filas = await seleccionar('codigos',
        `select=codigo,persona,organizacion,expira_en&presentacion=eq.${slug}&codigo=eq.${encodeURIComponent(codigo)}&activo=is.true&limit=1`);
      fila = filas[0] || null;
      if (fila?.expira_en && new Date(fila.expira_en) < new Date()) fila = null;
    }

    if (!fila) {
      await insertar('visitas', [{ ...base, evento: 'codigo_invalido', codigo: codigo.slice(0, 40) || null }]);
      await pausa(700);
      return json({ ok: false, error: 'codigo' }, 401);
    }

    const sesion = crypto.randomUUID();
    await insertar('visitas', [{
      ...base, evento: 'ingreso', sesion, codigo: fila.codigo, persona: fila.persona, organizacion: fila.organizacion,
    }]);

    const valor = await firmar({
      p: slug, s: sesion, c: fila.codigo, n: fila.persona, o: fila.organizacion || null,
      x: Math.floor(Date.now() / 1000) + DURACION_SEGUNDOS,
    });
    return json({ ok: true, destino: destino(slug) }, 200, { 'Set-Cookie': cookieSesion(slug, valor) });
  } catch (e) {
    console.error('[acceso]', e.message);
    return json({ ok: false, error: 'servicio' }, 503);
  }
};

export const config = { path: '/api/acceso' };

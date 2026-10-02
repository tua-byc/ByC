// Acceso mínimo a Supabase por su API REST (PostgREST), sin dependencias.
// Usa la clave de servicio: las tablas tienen RLS activado y ninguna política
// pública, así que solo las funciones pueden leer y escribir.
import { env } from './sesion.mjs';

function config() {
  const url = env('SUPABASE_URL');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  return { base: url.replace(/\/+$/, '') + '/rest/v1', key };
}

function headers(key, extra = {}) {
  const h = { apikey: key, 'Content-Type': 'application/json', ...extra };
  // Las claves antiguas (JWT) van también en Authorization; las nuevas sb_secret_ solo en apikey.
  if (key.startsWith('eyJ')) h.Authorization = `Bearer ${key}`;
  return h;
}

export async function seleccionar(tabla, query) {
  const { base, key } = config();
  const r = await fetch(`${base}/${tabla}?${query}`, { headers: headers(key) });
  if (!r.ok) throw new Error(`Supabase ${tabla} ${r.status}: ${await r.text()}`);
  return r.json();
}

export async function contar(tabla, query) {
  const { base, key } = config();
  const r = await fetch(`${base}/${tabla}?${query}`, {
    method: 'HEAD',
    headers: headers(key, { Prefer: 'count=exact', Range: '0-0' }),
  });
  if (!r.ok && r.status !== 206) throw new Error(`Supabase count ${tabla} ${r.status}`);
  const rango = r.headers.get('content-range') || '*/0';
  return parseInt(rango.split('/')[1], 10) || 0;
}

export async function insertar(tabla, filas) {
  const { base, key } = config();
  const r = await fetch(`${base}/${tabla}`, {
    method: 'POST',
    headers: headers(key, { Prefer: 'return=minimal' }),
    body: JSON.stringify(filas),
  });
  if (!r.ok) throw new Error(`Supabase insert ${tabla} ${r.status}: ${await r.text()}`);
}

/** Datos del visitante que entrega Netlify. */
export function visitante(req, context) {
  const geo = context?.geo || {};
  return {
    ip: context?.ip || req.headers.get('x-nf-client-connection-ip') || null,
    pais: geo.country?.code || null,
    ciudad: geo.city || null,
    user_agent: (req.headers.get('user-agent') || '').slice(0, 400) || null,
  };
}

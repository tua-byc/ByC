// Sesión firmada de las presentaciones.
// Solo usa APIs web (crypto.subtle, TextEncoder, atob/btoa), así que corre igual
// en las funciones (Node) y en la edge function (Deno).

export const DURACION_SEGUNDOS = 12 * 60 * 60; // 12 horas
const SLUG = /^[a-z0-9][a-z0-9-]{1,59}$/;

export function env(nombre) {
  const v = globalThis.Netlify?.env?.get?.(nombre) ?? globalThis.process?.env?.[nombre];
  return v == null || v === '' ? undefined : v;
}

export const slugValido = (s) => typeof s === 'string' && SLUG.test(s);
export const nombreCookie = (slug) => `byc_${slug.replace(/-/g, '_')}`;

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function desdeB64url(txt) {
  const s = atob(txt.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((txt.length + 3) % 4));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

async function clave() {
  const secreto = env('PRESENTACIONES_SECRET');
  if (!secreto || secreto.length < 32) throw new Error('Falta PRESENTACIONES_SECRET (mínimo 32 caracteres)');
  return crypto.subtle.importKey('raw', enc.encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

/** Crea el valor de la cookie: payload.firma */
export async function firmar(datos) {
  const cuerpo = b64url(enc.encode(JSON.stringify(datos)));
  const firma = new Uint8Array(await crypto.subtle.sign('HMAC', await clave(), enc.encode(cuerpo)));
  return `${cuerpo}.${b64url(firma)}`;
}

/** Devuelve el payload si la firma es válida y no venció; si no, null. */
export async function verificar(valor, slug) {
  try {
    if (!valor || typeof valor !== 'string') return null;
    const [cuerpo, firma] = valor.split('.');
    if (!cuerpo || !firma) return null;
    const ok = await crypto.subtle.verify('HMAC', await clave(), desdeB64url(firma), enc.encode(cuerpo));
    if (!ok) return null;
    const datos = JSON.parse(dec.decode(desdeB64url(cuerpo)));
    if (datos.p !== slug) return null;
    if (!datos.x || datos.x < Math.floor(Date.now() / 1000)) return null;
    return datos;
  } catch {
    return null;
  }
}

export function leerCookie(req, nombre) {
  const h = req.headers.get('cookie') || '';
  for (const parte of h.split(';')) {
    const i = parte.indexOf('=');
    if (i > -1 && parte.slice(0, i).trim() === nombre) return decodeURIComponent(parte.slice(i + 1).trim());
  }
  return undefined;
}

export function cookieSesion(slug, valor, maxAge = DURACION_SEGUNDOS) {
  return `${nombreCookie(slug)}=${encodeURIComponent(valor)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

/** Sesión válida para una presentación a partir de la request, o null. */
export async function sesionDe(req, slug) {
  if (!slugValido(slug)) return null;
  return verificar(leerCookie(req, nombreCookie(slug)), slug);
}

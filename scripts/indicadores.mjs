// Descarga los indicadores económicos de mindicador.cl y los deja en
// public/data/indicadores.json, que la barra superior del sitio lee.
// Lo corre el workflow de Azure antes de cada publicación (y una vez al día).
// Si la API falla, se conserva el archivo anterior y el deploy sigue.
import { readFile, writeFile } from 'node:fs/promises';

const DESTINO = new URL('../public/data/indicadores.json', import.meta.url);
const API = 'https://mindicador.cl/api';

// Orden y etiquetas de la barra. `maxDias`: si el dato es más viejo, no se muestra
// (mindicador a veces deja de actualizar una serie y no queremos mostrar algo desfasado).
const INDICADORES = [
    { codigo: 'dolar',       etiqueta: 'USD',   formato: 'pesos',   maxDias: 7 },
    { codigo: 'euro',        etiqueta: 'EUR',   formato: 'pesos',   maxDias: 7 },
    { codigo: 'uf',          etiqueta: 'UF',    formato: 'pesos',   maxDias: 7 },
    { codigo: 'utm',         etiqueta: 'UTM',   formato: 'pesos0',  maxDias: 45 },
    { codigo: 'tpm',         etiqueta: 'TPM',   formato: 'porcentaje', maxDias: 7 },
    { codigo: 'ipc',         etiqueta: 'IPC',   formato: 'porcentaje', maxDias: 75 },
    { codigo: 'libra_cobre', etiqueta: 'Cobre', formato: 'dolarLibra', maxDias: 7 },
];

async function descargar() {
    for (let intento = 1; intento <= 4; intento++) {
        try {
            const r = await fetch(API, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; byc.cl indicadores)',
                    'Accept': 'application/json',
                },
                signal: AbortSignal.timeout(20000),
            });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return await r.json();
        } catch (e) {
            console.warn(`Intento ${intento} falló: ${e.message}`);
            await new Promise(res => setTimeout(res, 3000 * intento));
        }
    }
    return null;
}

const datos = await descargar();
if (!datos) {
    console.warn('No se pudieron obtener indicadores; se mantiene el archivo anterior.');
    process.exit(0);
}

const ahora = Date.now();
const items = INDICADORES.flatMap(({ codigo, etiqueta, formato, maxDias }) => {
    const d = datos[codigo];
    if (!d || typeof d.valor !== 'number') return [];
    const dias = (ahora - new Date(d.fecha).getTime()) / 86400000;
    if (dias > maxDias) return [];
    return [{ codigo, etiqueta, formato, valor: d.valor, fecha: d.fecha.slice(0, 10) }];
});

if (items.length === 0) {
    console.warn('La API respondió sin datos vigentes; se mantiene el archivo anterior.');
    process.exit(0);
}

const salida = JSON.stringify({ actualizado: new Date().toISOString(), fuente: 'mindicador.cl', items }, null, 2) + '\n';
const anterior = await readFile(DESTINO, 'utf8').catch(() => '');
await writeFile(DESTINO, salida);
console.log(`Indicadores: ${items.map(i => i.etiqueta).join(', ')}${anterior ? '' : ' (archivo nuevo)'}`);

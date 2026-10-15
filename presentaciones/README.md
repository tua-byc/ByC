# presentaciones.byc.cl

Sitio de presentaciones privadas de ByC. Proyecto Netlify **byc-presentaciones**, conectado a este repo con
**base directory `presentaciones/`**. No se publica en Azure (el workflow de byc.cl solo sube `public/` de la raíz).

## Cómo funciona el acceso

```
/lo-recabarren/          página de ingreso (pública): pide el código
POST /api/acceso         valida el código en Supabase (tabla codigos), registra el intento en visitas
                         y entrega una cookie firmada (HttpOnly, 12 h)
/lo-recabarren/ver/*     la presentación, imágenes y clips: la edge function `guardia` los entrega
                         solo con una sesión válida; sin ella, redirige al ingreso (o 403 para medios)
POST /api/evento         eventos de /assets/seguimiento.js (vista, sección, salida), solo con sesión
```

- `netlify/functions/acceso.mjs`, `netlify/functions/evento.mjs`: funciones (Node).
- `netlify/edge-functions/guardia.js`: protege cualquier ruta `/<slug>/ver/...`. Una presentación nueva queda
  protegida con solo poner su contenido en `public/<slug>/ver/`.
- `netlify/lib/`: firma de sesión (HMAC-SHA256) y cliente REST de Supabase, compartidos.
- `public/assets/seguimiento.js`: script único para todas las presentaciones.
- La presentación marca cada copia con el nombre de quien entra (`{{PERSONA}}`, `{{ORGANIZACION}}`).
- Freno de fuerza bruta: 10 códigos inválidos desde una IP en 15 minutos la bloquean por 15 minutos.

## Puesta en marcha (una vez)

1. **Supabase** → SQL Editor → pegar y correr `supabase/esquema.sql` (crea `codigos`, `visitas`, la función
   `nuevo_codigo` y las vistas `sesiones`, `resumen_visitas`, `tiempo_por_seccion`). Es idempotente.
2. **Netlify** → byc-presentaciones → Project configuration → Environment variables (scope: Functions):
   - `SUPABASE_URL` = `https://<proyecto>.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = clave *service_role* (o la nueva *secret key* `sb_secret_...`)
   - `PRESENTACIONES_SECRET` = 64 caracteres aleatorios (`openssl rand -hex 32`). Cambiarlo cierra todas las sesiones.
3. **Netlify** → Build & deploy → Link repository → `tua-byc/ByC`:
   - Base directory: `presentaciones`
   - Build command: *(vacío)* · Publish directory: `presentaciones/public` · Functions: `presentaciones/netlify/functions`
   - Production branch: `main` (o `feature/presentaciones` mientras el PR no se mezcle)

## Códigos de acceso

Uno por persona. En Supabase → SQL Editor:

```sql
select public.nuevo_codigo('lo-recabarren', 'LR', 'Nombre Apellido', 'Empresas Juan Yarur');
-- devuelve algo como LR-K7QM-3HXP  (opcional: quinto argumento con fecha de vencimiento)
```

Para revocar: `update codigos set activo = false where codigo = 'LR-K7QM-3HXP';`

Se envía el link `https://presentaciones.byc.cl/lo-recabarren/` y, por separado, el código.

## Seguimiento

```sql
select * from resumen_visitas order by ultima_visita desc;      -- por persona: sesiones, aperturas, minutos, % recorrido
select * from sesiones order by inicio desc;                    -- cada sesión: cuándo, cuánto rato, desde dónde
select * from tiempo_por_seccion order by persona, segundos desc;
select * from visitas where evento in ('codigo_invalido','bloqueado') order by creado_en desc;  -- intentos fallidos
```

## Nueva presentación

1. `public/<slug>/index.html`: copiar el ingreso de `lo-recabarren` y cambiar `SLUG`, título y textos.
2. `public/<slug>/ver/`: la presentación, con `<script src="/assets/seguimiento.js" data-presentacion="<slug>" defer>`
   y `data-seccion="..."` en cada sección.
3. Generar códigos con `nuevo_codigo('<slug>', ...)`.

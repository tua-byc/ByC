# ByC
ByC PROD — sitio estático de byc.cl en Azure Static Web Apps.

## Estructura

- `public/` — **lo único que se publica** (el workflow usa `app_location: "public"`). Para editar la web se trabaja aquí.
- `equipo/` — datos, script y QR de las tarjetas de presentación. **No se publica.**
- `presentaciones/` — sitio de presentaciones HTML en `presentaciones.byc.cl` (Netlify). **No se publica en Azure.**

## Presentaciones (presentaciones.byc.cl)

Sitio aparte en Netlify (proyecto `byc-presentaciones`), con el subdominio apuntado por CNAME desde Azure DNS.
Cada presentación es una subcarpeta: `presentaciones/proyecto-ejemplo/index.html` → `presentaciones.byc.cl/proyecto-ejemplo`.

Para publicar una nueva:

1. Crear `presentaciones/<nombre>/` con su `index.html` y sus archivos. Si es confidencial, usar un nombre difícil
   de adivinar (ej. `caliterra-q4-7f3k`).
2. En Netlify → proyecto `byc-presentaciones` → **Deploys**, arrastrar la carpeta `presentaciones` **completa**.
   Cada deploy reemplaza todo el sitio: si se sube solo la carpeta nueva, las demás desaparecen.
3. Hacer commit de la carpeta nueva para que la copia maestra quede en el repo.

Todo el sitio va con `noindex` (`_headers` y `robots.txt`). Los links que no existen muestran `404.html`.

## Páginas de contacto del equipo (QR de tarjetas)

Cada persona tiene una página en `byc.cl/nombre-apellido` con botón "Guardar contacto" (vCard).
Estas páginas tienen `noindex` y no aparecen en el menú.

Para sumar a alguien:

1. Agregar la persona en `equipo/equipo.json` (`nombre`, `apellido`, `celular` en formato `+569...`, `email`;
   opcionales: `segundoNombre`, `apellido2` y `cargo`). `nombre` es el nombre que la persona usa (ej. `José Tomás`).
   - Página y tarjeta: `Carlos A. Cartoni Z.` (nombre + inicial del segundo nombre + apellido + inicial del materno)
   - Contacto del celular: `Carlos Alberto Cartoni Zalaquett` (completo)
   - URL: `byc.cl/carlos-cartoni` (nombre + apellido)
2. Generar:
   ```bash
   npm install   # solo la primera vez
   npm run generar
   ```
3. Revisar y hacer commit de `public/<slug>/` y `equipo/qr/<slug>.svg`.

El QR para la imprenta queda en `equipo/qr/<slug>.svg`. El slug se arma con nombre(s) y primer apellido sin tildes
(ej. `tomas-ubilla`, `jose-tomas-cartoni`, `carlos-cartoni`); si dos personas coinciden, agregar un campo `"slug"` distinto en el JSON.
Para quitar a alguien, borrarlo del JSON y eliminar a mano su carpeta en `public/` y su QR (el script avisa).

Si cambia la URL de alguien, agregar en `public/staticwebapp.config.json` una redirección (`routes`) desde la URL antigua.

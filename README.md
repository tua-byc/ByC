# ByC
ByC PROD — sitio estático de byc.cl en Azure Static Web Apps.

## Estructura

- `public/` — **lo único que se publica** (el workflow usa `app_location: "public"`). Para editar la web se trabaja aquí.
- `equipo/` — datos, script y QR de las tarjetas de presentación. **No se publica.**

## Páginas de contacto del equipo (QR de tarjetas)

Cada persona tiene una página en `byc.cl/nombre-apellido` con botón "Guardar contacto" (vCard).
Estas páginas tienen `noindex` y no aparecen en el menú.

Para sumar a alguien:

1. Agregar la persona en `equipo/equipo.json` (`nombre`, `apellido`, `celular` en formato `+569...`, `email`; opcionales: `apellido2` y `cargo`).
   `apellido2` (materno) se muestra en la página y en el contacto, pero no entra en la URL.
2. Generar:
   ```bash
   npm install   # solo la primera vez
   npm run generar
   ```
3. Revisar y hacer commit de `public/<slug>/` y `equipo/qr/<slug>.svg`.

El QR para la imprenta queda en `equipo/qr/<slug>.svg`. El slug se arma con nombre(s) y primer apellido sin tildes
(ej. `tomas-ubilla`, `jose-tomas-cartoni`); si dos personas coinciden, agregar un campo `"slug"` distinto en el JSON.
Para quitar a alguien, borrarlo del JSON y eliminar a mano su carpeta en `public/` y su QR (el script avisa).

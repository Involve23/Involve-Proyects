# Publicar en claude.ai

Claude Code **no puede publicar artefactos**. Se publica desde un chat de claude.ai. Lo importante: **actualizar el mismo enlace**, porque cada artefacto tiene su propia base de datos y un enlace nuevo empieza vacío.

## Enlaces vigentes
| Aplicación | Enlace | Versión |
|---|---|---|
| Principal | https://claude.ai/artifact/CYGKRhVjHbtuewpJXfPVCd | V1.3.1 |
| Captura · Involve | https://claude.ai/artifact/VEZgJjJJzUj9sfE1VzJyFL | Captura V1.0.0 |
| Captura · Doble Cinco | https://claude.ai/artifact/4Lhnb7etGarvj7JceKh9Lm | Captura V1.0.0 |
| Captura · Impuldesa | https://claude.ai/artifact/JqC66ktcwKTZUrXr2gP51W | Captura V1.0.0 |
| Captura · Involvia | https://claude.ai/artifact/VbvonwuCj51ov493RuG2oB | Captura V1.0.0 |
| Captura · Urvem | https://claude.ai/artifact/DkF4c1VkbMPn7yXziL1eyM | Captura V1.0.0 |

## Actualizar una aplicación existente
1. `npm run construir`.
2. En un chat de claude.ai, adjunta el archivo de `dist/` (por ejemplo `principal.html`) y escribe algo como:
   *«Publica este archivo actualizando el artefacto https://claude.ai/artifact/… sin crear uno nuevo. Capacidades: db, downloads, sample y user (profile).»*
3. Verifica abriendo el enlace y recargando la página (el navegador puede conservar la versión anterior).

## Crear una captura nueva (otra empresa)
1. Agrega la empresa a `src/config/variantes.json` (`slug`, `id`, `nombre`) y a `semillas/` si la usarás en localhost, y corre `npm run construir`.
2. Publícala **sin** enlace previo (se crea un artefacto nuevo) con las mismas capacidades.
3. **Siembra su base**: pide en el mismo chat que escriba en la base del artefacto los documentos `nodes/GRP-0001-8` (Grupo Tama) y `nodes/<ID de la empresa>` (el contenido está en `semillas/captura_<slug>.json`). Sin eso la captura muestra «Preparando tu captura…» y después «No pude cargar esta captura».
4. Compártela con el CEO con permiso de **Editor o Colaborador**; el permiso se da desde Claude, no desde la página.

## Respaldos y versiones
Cada versión publicada debe dejar su HTML de respaldo (`modelo_tama_grafo_V1.3.1.html`, etc.). En git, etiqueta cada versión (`git tag v1.3.1`). La versión se cambia en `src/config/variantes.json` (campo `version`).

## Llevar datos entre artefactos o a localhost
No hay botón de importar todavía (ver `docs/pendientes.md`). Hoy se hace pidiéndole a Claude en un chat que lea la base de un artefacto y escriba en otro, remapeando los IDs. En localhost, `GET /api/<app>/exportar` descarga todo y `POST /api/<app>/importar` carga un JSON con la misma forma (`{coleccion: {id: {data, version, updatedAt}}}`).

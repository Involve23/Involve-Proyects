# Inteligencia organizacional multidisciplinaria · Grupo Tama

Modelo para reunir, analizar y gobernar la información de las empresas del Grupo Tama (Involve, Doble Cinco, Impuldesa, Involvia, Urvem) a través de 13 corrientes de análisis.

- **Aplicación principal** (`dist/principal.html`): Universo (grafo), Capturar, Base de datos, Motor estadístico, Análisis, Sugerencias, Backoffice de variables y guía.
- **Capturas por empresa** (`dist/captura_<empresa>.html`): una columna tipo chat para que el CEO conteste conversando.
- **Versiones actuales:** aplicación principal **V1.3.1** · capturas **V1.0.0**. Historial en `docs/historial-de-versiones.md`.

## Capturar en localhost (lo que necesitas)
Requisito: **Node 18 o superior**.

```bash
cp .env.example .env        # y escribe tu ANTHROPIC_API_KEY (opcional, ver abajo)
npm run dev                 # construye y arranca el servidor local
# abre http://localhost:3000  y elige la aplicación
```

- **Datos.** Se guardan en `datos-locales/<aplicación>/` (archivos JSON). Cada aplicación guarda aparte. Para respaldar, copia esa carpeta, o descarga todo de una aplicación en `http://localhost:3000/api/principal/exportar`.
- **Estructura inicial.** La primera vez se siembra desde `semillas/`: Grupo Tama, las cinco empresas y sus clientes, sin datos. Para empezar de cero, borra `datos-locales/`.
- **Interpretación con Claude.** Con `ANTHROPIC_API_KEY` en `.env`, la captura conversa por bloques e interpreta lo que escribes. Sin la clave todo funciona, pero la captura va **una pregunta a la vez**. El servidor solo escucha en `127.0.0.1` para no exponer tu clave.
- **Tu nombre.** `USUARIO_NOMBRE` en `.env` es quien aparece como autor de cada dato.
- **Sin internet.** d3 y docx se sirven desde `vendor/`. Solo las tipografías (Google Fonts) necesitan red; sin ellas se usa una tipografía del sistema.

## Trabajar con Claude Code
```bash
cd tama
claude
```
Claude Code lee `CLAUDE.md` al abrir: ahí están el proceso de trabajo (plan → definir contigo → construir), la arquitectura y las reglas de código. Antes de pedirle cambios, conviene que lea `docs/pendientes.md`.

## Comandos
| Comando | Qué hace |
|---|---|
| `npm run construir` | Genera `dist/` (principal + una captura por empresa). |
| `npm run dev` | Construye y arranca el servidor local. |
| `npm run verificar` | Revisa manifiesto, plantilla y sintaxis de cada HTML. |
| `node scripts/cargar-conocimiento.mjs --simular` | Valida una carga documental (cada cita contra su nota). Con `--lote=…` la escribe en el servidor local; ver el encabezado del script. |
| `python3 tests/ejecutar_todo.py` | Todas las pruebas de navegador. Requiere `pip install playwright` y `playwright install chromium`. |

## Estructura
```
src/js/        módulos de la aplicación, en el orden de src/js/manifiesto.json
src/styles/    tokens y estilos de Genesis 2.0 (modo métría)
src/template/  plantilla HTML y vista «Pendientes con el equipo»
src/config/    variantes, navegación, versión y empresas (variantes.json)
scripts/       construir.mjs (ensamblador) y verificar.mjs
server/        servidor local y runtime que sustituye a claude.ai
semillas/      estructura inicial para localhost
tests/         pruebas de navegador con Claude y base simulados
datos-de-apoyo/ Excel aprobado de la perspectiva del cliente
docs/          documentación
```

## Publicar en claude.ai
Los HTML de `dist/` son exactamente lo que se publica como artefacto. Claude Code no publica: se sube el archivo a un chat de claude.ai y **se actualiza el mismo enlace** para conservar su base de datos. Pasos en `docs/publicar-en-claude.md`.

## Documentación
- `docs/arquitectura.md` — cómo está armado y cómo funcionan las variantes.
- `docs/modelo-de-datos.md` — colecciones, nodos, observaciones, variables, IDs y privacidad.
- `docs/decisiones.md` — qué se decidió y por qué.
- `docs/sistema-de-diseno.md` — Genesis 2.0 aplicado.
- `docs/publicar-en-claude.md` — publicación y enlaces vigentes.
- `docs/historial-de-versiones.md` y `docs/pendientes.md`.

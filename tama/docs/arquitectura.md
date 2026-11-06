# Arquitectura

## Una aplicación, dos variantes
Todo sale del mismo código. `scripts/construir.mjs` toma `src/template/index.html`, sustituye los marcadores `{{…}}` con los datos de `src/config/variantes.json` y pega el JavaScript en el orden de `src/js/manifiesto.json`. No hay reemplazos de texto sobre el código: lo que ves en `src/` es lo que se publica.

| | principal | captura (una por empresa) |
|---|---|---|
| Navegación | Universo, Capturar, Base de datos, Motor, Análisis, Sugerencias, Backoffice, Cómo funciona | Captura, Pendientes con el equipo |
| Clase del `<body>` | `uni-on` | `ceo` (oculta controles técnicos) |
| JavaScript extra | — | `variante_captura_ceo.js` (después del arranque) |
| Configuración | — | `window.CAPTURA_MODE = {emp, nombre}` inyectado antes del script |

## Módulos de `src/js/` (en orden de carga)
| Archivo | Responsabilidad |
|---|---|
| `00_base_captura_clasica` | Catálogo base de variables y captura una pregunta a la vez (origen del proyecto) |
| `10_modelo_y_cliente` | Nodos, IDs, cobertura, tabla de nodos, utilidades de DOM |
| `20_grafo_universo` | Grafo con d3: satélites, empresas, clientes, corrientes, panel de ficha |
| `30_base_de_datos` | Observaciones, hallazgos, cobertura, catálogo, exportar |
| `40_importar_csv` | Importar un CSV con perfilado y mapeo (a mano o con Claude) |
| `50_motor_estadistico` | Panorama, asociaciones, regresión, perfiles, pronóstico y configuración |
| `60_analisis_y_documentos` | Diagnóstico, comparativo, casos de uso, lectura por corriente y documento de Word |
| `70_sugerencias_logica` / `71_…_interfaz` | Señales, borradores con Claude, prioridad, seguimiento del indicador, tablero |
| `80_catalogo_cliente` | 91 variables de la perspectiva del cliente y su «aplica a» por tipo |
| `85_segmentos_de_cliente` | Varios clientes por empresa (tipo y estrategia), alta guiada, variables según tipo |
| `90_backoffice` | Matriz, ficha por variable, versiones, lanzamientos, propuestas de Claude, memoria |
| `91_estructura_de_pantalla` | Sidebar, barra superior, menú móvil |
| `92_ruta_y_equipo` | Ruta de lo particular a lo general y panel de equipo en vivo |
| `93_conversacion_por_bloques` | Captura conversacional por bloques (motor para uno o varios nodos), memoria de lo aprendido |
| `99_arranque` | `renderAll(); boot();` |
| `variante_captura_ceo` | Alta de ficha/productos/clientes hablando, ruta de tres pasos, pendientes con el equipo |

## Capacidades de la plataforma y localhost
La app solo habla con `window.claude.use(nombre)`:

| Capacidad | En claude.ai | En localhost (`server/`) |
|---|---|---|
| `db` | base compartida por artefacto | archivos JSON + eventos en vivo (SSE) |
| `user` | usuario de la sesión | `USUARIO_ID` / `USUARIO_NOMBRE` de `.env` |
| `downloads` | descarga gestionada | descarga normal del navegador |
| `sample` | interpretación con Claude de la sesión | proxy a la API de Anthropic con tu clave |

`server/runtime-cliente.js` implementa esas cuatro capacidades en el navegador; el servidor lo inyecta al servir `/app/<nombre>`. No forma parte de los HTML publicados.

## Variante de captura para CEO
- **Alta hablando**: ficha → productos → clientes (Claude extrae, el CEO corrige y confirma).
- **Ruta de tres pasos**: tus productos → tus clientes → tu empresa. En cada paso se habla de **todos los nodos a la vez** (por ejemplo, tres productos) y Claude reparte lo dicho por nodo.
- **Sin repetir**: cada respuesta se compara con las demás variables pendientes del nodo; lo que toca otros bloques se llena ahí y no se vuelve a preguntar.
- **Pendientes con el equipo**: lo que el CEO no sabe se pasa a «Brayan» o «Marketing» (colección `consultas`). Quien responde abre el mismo enlace, pulsa Responder y lo captura con la misma conversación; queda a su nombre.
- **Aislamiento**: cada empresa tiene su propio artefacto y su propia base; ningún CEO ve a otra empresa.

## Pruebas
`tests/` usa Playwright. Cada prueba inyecta un `window.claude` simulado (`add_init_script`) antes de que cargue la página: la base real no se toca. Sin `db` la app corre en modo local (`S.mem=true`). `servidor_local.py` prueba el servidor real con una API de Anthropic simulada.

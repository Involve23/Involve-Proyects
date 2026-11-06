# Historial de versiones

La **versión de la aplicación** (V1.x.y) habla del código. Los **lanzamientos del catálogo** (v1.0, v1.1…, en el Backoffice) hablan de las variables y sus preguntas; son un número aparte.

## Aplicación principal
- **V1.0.0** — Grafo, Capturar (una pregunta a la vez), Base de datos, importar CSV, motor estadístico v1, Análisis (cuatro entregables y documento de Word), Sugerencias (señales, borradores, prioridad, seguimiento, tablero), Backoffice (matriz, fichas, versiones y lanzamientos), varios clientes por empresa y la estructura de las cinco empresas.
- **V1.1.0** — Sistema de diseño Genesis 2.0 modo métría: sidebar flotante, barra superior, componentes y grafo sobre superficie oscura.
- **V1.2.0** — Captura de lo particular a lo general (ruta de productos → clientes → empresa → grupo) y panel de equipo en vivo.
- **V1.3.0** — Captura conversacional por bloques con Claude: sugerencias, ejemplos, «lo que entendí», memoria de lo aprendido por empresa. Base reiniciada y estructura limpia de las cinco empresas.
- **V1.3.1** — Motor de conversación para varios nodos a la vez, suscripción a las consultas del equipo y corrección del cierre de la estructura HTML.

## Capturas por empresa
- **Captura V1.0.0** — Una por empresa (Involve, Doble Cinco, Impuldesa, Involvia, Urvem): alta hablando de ficha, productos y clientes; ruta de tres pasos; varios productos o clientes a la vez; interpretación entre bloques para no repetir preguntas; pendientes con Brayan o Marketing; descarga de respuestas. Corregida la carga inicial (esperar la primera lectura de la base).

## Cargas de datos
Las cargas de datos no cambian el código de la aplicación (V1.3.1 sigue igual); se registran aquí.
- **Carga 2026-11-06 · Maindoc Involve, productos** — Desde las 31 notas de `conocimiento/involve-productos/` (no se suben al repo). Con `scripts/cargar-conocimiento.mjs` y `datos-de-apoyo/involve-productos/carga.json`: registro de origen IMP-0001-8; 4 productos de Involve (connect, rh, metría, start); 9 variables nuevas (VAR-061 a VAR-069); 98 observaciones con nota, línea y cita; 14 preguntas abiertas (contradicciones y vacíos); 5 hallazgos con su sugerencia. Solo en localhost (`datos-locales/principal`).

## Repositorio
- **Estructura limpia** — Código fuente en `src/`, ensamblador en Node, servidor local para capturar en localhost, pruebas de navegador y documentación. El ensamblado reproduce byte por byte lo publicado como V1.3.1 y Captura V1.0.0.

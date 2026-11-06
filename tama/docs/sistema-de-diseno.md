# Sistema de diseño: Genesis 2.0 (involve), modo métría

Fuente: el artefacto «Genesis 2.0 GT» de la organización (https://claude.ai/artifact/DB7NKpdmkCpmHKJ3BtaT1q), que pertenece a otra persona y no se modifica. Tiene seis modos de producto (rh, connect, métría, start, academy, magenta); **no hay modo de Grupo Tama**, así que se usa **métría** (violeta `#4C34B2`). Si algún día existe un modo propio, solo cambia el color principal (`src/styles/tokens-genesis-metria.css`).

## Cómo se aplicó
- `tokens-genesis-metria.css`: tokens de color (resueltos para métría), espaciado, radios, sombras, degradados, movimiento y tipografías, generados de `tokens.json` del sistema.
- `genesis.css`: componentes y vistas. Los nombres de variable históricos (`--fg`, `--muted`, `--line`, `--cyan`, `--amber`…) apuntan a tokens de Genesis; dentro del Universo (superficie oscura) se redefinen los alias `--c-*` para que los mismos componentes funcionen sobre fondo oscuro.

## Reglas que se respetan
- Fondo `bg-app` (#F2F2F2), tarjetas blancas **sin borde** con sombra teal suave (las sombras nunca son negras puras). El teal de identidad es decorativo; **nunca va en texto**.
- Hanken Grotesk SemiBold para títulos y números; Inter para el resto. **Mayúsculas solo en rótulos** (overline) y encabezados de tabla.
- Botones y chips en **píldora**; inputs de 44 px con radio 14; tarjetas de 22 y 28; modales de 32. **Un solo botón primario por vista.**
- Estados con **punto + texto**, nunca solo color. Sentence case, español de México tuteando, sin emoji, botones con la acción exacta, errores que dicen cómo corregir.
- Foco visible, objetivos táctiles de 40 a 44 px, respeto a «reducir movimiento», contraste AA (los textos secundarios sobre `bg-app` usan el color fuerte porque `text-secondary` queda justo por debajo de AA ahí).
- Navegación: sidebar oscura flotante (gradiente `neutral-950 → metria-800`) y barra superior con la ruta; en pantallas angostas la sidebar se abre con un botón.

## Gráficas
Paleta de Genesis sobre fondo claro (violeta, teal decorativo, verde, rojo, grises). El texto sobre barras usa tinta clara u oscura según la luminosidad del relleno.

## Colores y tipografía de datos
Los estados de variable (borrador, validada, en uso, descontinuada) y de indicadores (mejorando, sin cambio, empeoró…) tienen colores de texto y de fondo definidos en `90_backoffice.js` y `71_sugerencias_interfaz.js`; si los cambias, mantén el contraste AA.

# CLAUDE.md — Inteligencia organizacional multidisciplinaria (Grupo Tama)

Lee este archivo completo antes de tocar código. Todo lo demás está en `docs/`.

## Qué es este proyecto
Un modelo de **inteligencia organizacional multidisciplinaria** para Grupo Tama. Reúne información de cada empresa del grupo (Involve, Doble Cinco, Impuldesa, Involvia, Urvem) a través de **13 corrientes de análisis**, la analiza (motor estadístico, análisis, sugerencias) y la gobierna (Backoffice de variables con versiones).

Son **HTML autosuficientes** (un solo archivo, JavaScript sin framework) pensados para publicarse como *artefactos* de claude.ai. Se construyen en dos variantes desde el mismo código:
- **principal**: la aplicación completa (Universo, Capturar, Base de datos, Motor, Análisis, Sugerencias, Backoffice, Cómo funciona).
- **captura**: una columna tipo chat para que el CEO de una empresa conteste (una por empresa, 5 en total). Ver `docs/arquitectura.md`.

La persona con la que trabajas es **Brayan** (psicólogo psicométrista, Involve RH). Escribe en español, directo.

## Cómo trabajar con Brayan (proceso fijo, aplícalo siempre)
1. **Primero el plan.** Antes de construir algo, presenta el plan: qué harías y por qué.
2. **Luego se define con él.** Haz preguntas tipo asistente: tú **propones** (con una opción recomendada) y él decide o propone otra cosa. Si una pregunta cerrada no alcanza, dale ejemplos.
3. **Solo después se construye.** No empieces a construir sin ese paso, aunque no lo pida.
4. **Antes de borrar o reiniciar datos**, mira qué hay, haz respaldo y confirma el alcance. Lo borrado en la base compartida es irreversible.
5. **Cada cambio con nombre de versión.** Sube la versión (`src/config/variantes.json`), deja nota en `docs/historial-de-versiones.md` y guarda un respaldo del HTML construido.
6. Habla en **español de México, tuteando**, frases cortas, sin jerga innecesaria. Sé honesto con lo que no probaste (por ejemplo, «lo probé con un Claude simulado, falta el real»).
7. A Brayan **no le gustan las preguntas cerradas y repetitivas** en la captura: prefiere conversar por bloques, con sugerencias y ejemplos, e ir aprendiendo de lo que ya se dijo.

## Comandos
```bash
npm run construir          # genera dist/principal.html y dist/captura_<empresa>.html
npm run dev                # construye y arranca el servidor local en http://localhost:3000
npm run verificar          # revisa el manifiesto, los marcadores de la plantilla y la sintaxis del script
python3 tests/ejecutar_todo.py   # todas las pruebas de navegador (Playwright)
```
Requisitos: Node 18+, y para las pruebas `pip install playwright && playwright install chromium`.

## Estructura
```
src/js/manifiesto.json      ← ORDEN de carga de los módulos (importa; ver "Reglas de código")
src/js/00_base_captura_clasica.js … 99_arranque.js
src/js/variante_captura_ceo.js   ← solo en las capturas por empresa
src/styles/                 ← tokens y estilos de Genesis 2.0 (modo métría)
src/template/               ← plantilla HTML con marcadores {{…}} y la vista «Pendientes con el equipo»
src/config/variantes.json   ← variantes, navegación, versión, lista de empresas
scripts/construir.mjs       ← ensamblador (sin reemplazos de texto: solo plantilla + manifiesto)
server/                     ← servidor local + runtime que sustituye a window.claude de claude.ai
semillas/                   ← estructura inicial (grupo, empresas, clientes) para localhost
tests/                      ← pruebas de navegador con Claude y base simulados
datos-de-apoyo/             ← Excel aprobado de la perspectiva del cliente
docs/                       ← arquitectura, modelo de datos, decisiones, publicar, diseño, pendientes
```

## Arquitectura en una página
- **Una sola página, estado global `S`** (`S.nodes`, `S.obs`, `S.custom`, `S.ctx`, `S.tab`, `S.mem`…). `scheduleRender()` → `renderAll()` repinta la pestaña activa. No hay framework ni módulos ES: es un script clásico y **no está en modo estricto**.
- **Capacidades de la plataforma** vía `window.claude.use(nombre)`: `db` (colecciones con `onSnapshot`, `doc().get/set/update/acquire`), `user` (`id`, `me`, `can`, `profiles`), `downloads` (`save`) y `sample` (`.json(prompt)`). En claude.ai las da la plataforma; **en localhost las da `server/runtime-cliente.js`**. Si falta `db`, la app entra en **modo local** (`S.mem=true`, nada se guarda). Si falta `sample`, la captura cae a «una pregunta a la vez».
- **Modelo de datos** (detalle en `docs/modelo-de-datos.md`): grafo Grupo → Empresa → {Producto, Cliente (segmento)}; el **dato** es una *observación* (`obs`) ligada a un nodo y a una variable; la más reciente es la vigente. 649 variables en 13 corrientes, a nivel empresa, producto o cliente.
- **Claude dentro de la app** (`sample.json`): captura conversacional, propuestas de fichas del Backoffice, borradores de sugerencias, redacción del documento de Word, sugerencias de qué analizar, mapeo al importar un CSV. Siempre con confirmación de la persona antes de guardar.

## Reglas de código (lo que más rompe si se ignora)
1. **El orden de `manifiesto.json` es semántica.** Un módulo posterior puede redefinir una *declaración de función* de uno anterior y gana la última. Así funcionan `choosePrd`, `goStep`, `varsFor`, `nodeForVar`, `renderPath`, etc.
2. **Para poder sobrescribir algo, declara `function nombre(){}`, no `const nombre=()=>{}`.** Un `const` no se puede reasignar. Los envoltorios se hacen así: `const _rs=renderSide; renderSide=function(){_rs();…};`.
3. **Cuidado con la zona muerta temporal (TDZ).** Una función declarada (que se *iza*) que usa un `const` definido más abajo falla si se llama antes. Si una sobrescritura depende de constantes, **asígnala** (`renderLadder=function(){…}`) en el punto del archivo posterior a esas constantes, no la declares.
4. **La primera lectura de la base puede llegar vacía.** Nunca concluyas que algo «no existe» con el primer snapshot; espera datos y reintenta (ver `ceoHome` en la variante de captura).
5. **Los IDs se reservan, no se calculan.** `mintId(prefijo,ancho)` usa `counters/<PREFIJO>` con *lease* (`acquire`). **Nunca se reutilizan.** Formato `PREFIJO-NNNN-D` con dígito verificador Luhn (`verifyId`).
6. **`put(coleccion,id,datos)` actualiza el estado local primero y luego escribe en la base.** Las escrituras de observaciones se encadenan en `S.chain` para no perder el orden.
7. **Una variable descontinuada no se borra:** deja de preguntarse (`estadoVar==='descontinuada'`) pero sus datos se conservan.
8. **Las preguntas y guías editadas en el Backoffice se aplican en vivo** sobre las variables (`applyFichas`). Cada observación guarda `vver` (versión de la variable cuando se preguntó) y `catv`.

## Privacidad (no negociable)
- A Claude **nunca** se le envían filas de archivos importados, correos, ni nombres de personas. Del CSV solo: nombres de columnas, estadísticas y categorías únicas cuando son pocas y repetidas.
- El motor solo comparte **conteos** (cuántas unidades tienen dato por variable), nunca valores.
- Para sugerencias: evidencia agregada, no textos libres capturados (salvo que la persona lo active en el documento de Word).
- En la captura conversacional, lo que la persona escribe sí se envía a Claude (se avisa la primera vez) junto con la ficha de la empresa y lo ya capturado; nunca archivos.
- No guardes ni propongas guardar identificaciones oficiales, datos financieros personales, etc. Ver `docs/modelo-de-datos.md`.

## Sistema de diseño
Genesis 2.0 (involve), **modo métría** (`data-theme="metria"`, violeta #4C34B2). Fondo claro `bg-app`, tarjetas blancas sin borde con sombra teal suave, botones y chips en píldora, inputs de 44 px con radio 14, Hanken Grotesk (títulos/números) e Inter (resto). Español de México tuteando, **sentence case**, sin emoji, botones con la acción exacta. Un solo botón primario por vista. El grafo del Universo va sobre superficie oscura `bg-deep`. Detalle en `docs/sistema-de-diseno.md`. **No inventes colores ni radios**: usa los tokens de `src/styles/tokens-genesis-metria.css`.

## Cómo verificar tu trabajo
1. `npm run construir && npm run verificar`.
2. `python3 tests/ejecutar_todo.py --sin-construir` (todo debe pasar).
3. Para cambios visuales, corre `tests/capturas_de_pantalla.py` y **mira las imágenes** (se guardan en la carpeta temporal del sistema, `tama-pruebas/`), en escritorio (1440×900) y celular (390×844).
4. Para probar de verdad con datos: `npm run dev`, abre `/app/principal`. Con `ANTHROPIC_API_KEY` en `.env` la interpretación con Claude funciona; sin ella, la captura va una pregunta a la vez.

## Publicar en claude.ai
Claude Code **no puede publicar artefactos**. Se publica desde un chat de claude.ai y **se actualiza el mismo enlace** para no perder la base de datos. Pasos y enlaces vigentes en `docs/publicar-en-claude.md`.

## Qué falta (resumen; lista completa en `docs/pendientes.md`)
Importar respuestas de las capturas por empresa al proyecto principal · probar la conversación con el Claude real y con un CEO de verdad · regresión logística y modelos multinivel/bayesianos · exportar a PDF · avisos cuando alguien pasa una pregunta al equipo.

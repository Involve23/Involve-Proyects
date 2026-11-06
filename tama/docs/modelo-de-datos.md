# Modelo de datos

## Colecciones
| Colección | Qué guarda |
|---|---|
| `nodes` | Grupo, empresas, productos, clientes (segmentos), hallazgos, sugerencias, borradores de sugerencia, importaciones y preguntas abiertas |
| `obs` | Observaciones: cada dato capturado |
| `catalog` | Variables agregadas por el equipo (además del catálogo base del código) |
| `counters` | Contadores de IDs por prefijo (`{n}`) |
| `vfichas`, `vhist`, `vrel` | Backoffice: ficha vigente por variable, historial de versiones, lanzamientos del catálogo |
| `aprend` | Memoria de lo aprendido por empresa (un documento por empresa) |
| `consultas` | Preguntas que el CEO pasó a Brayan o a Marketing (solo capturas por empresa) |

## IDs
Formato `PREFIJO-NNNN-D`, donde `D` es un dígito verificador de **Luhn** sobre el número. `OBS` usa 6 dígitos (`OBS-000001-8`). Se reservan con `mintId` (contador + *lease* `acquire`) y **nunca se reutilizan**.
Prefijos: `GRP`, `EMP`, `CLI`, `PRD`, `OBS`, `HAL`, `SUG`, `SGD`, `IMP`, `PRE`, `REL`, `CON`. Las variables son `VAR-nnn` (sin dígito): base 001–060 y 201–389 (marketing), 401+ (corrientes), 901–991 (perspectiva del cliente); las que agrega el equipo parten de 061 y saltan a 1001.

## Nodos (`nodes`)
- **GRP** Grupo Tama.
- **EMP** empresa: `ficha {industria, categoria, mercado_geo, pregunta, decision, fuentes}`.
- **CLI** cliente = **segmento / buyer persona** (hay varios por empresa): `segmento`, `tipoCliente` (`B2C`, `B2B`, `B2B2C`, `Institucional`), `estrategia` (`Adquisición`, `Retención`, `Cross-selling`, `Recuperación`).
- **PRD** producto: `etapa` (`Desarrollo`, `Lanzamiento`, `Crecimiento`, `Madurez`, `Innovación`) y `etapa_evidencia`. La etapa decide qué variables se preguntan primero.
- **HAL** hallazgo, **SUG** sugerencia (con `impacto`, `esfuerzo`, `kpiVar`, `base`, `meta`, `vence`, `estado`), **SGD** borrador de sugerencia, **IMP** importación, **PRE** pregunta abierta.

## Observación (`obs`)
`{id, nodo, variable, valor, no_aplica, fuente, confianza, periodo (AAAA-MM), nota, catv, vver, capturado, por}`. Para el mismo `(nodo, variable)` **la más reciente es la vigente**; las anteriores se conservan. `catv` es el tamaño del catálogo al capturar y `vver` la versión de la variable (Backoffice) con la que se preguntó. Las de la conversación llevan `captura:'conversación'` y la evidencia textual en `nota`.

## Variables
649 en 13 corrientes: **MER** análisis de mercado · **ANT** antropología · **SOC** sociología · **CUA** investigación cualitativa · **SEM** semiótica · **SEN** ciencia sensorial · **ECO** economía · **DAT** estadística y ciencia de datos · **RBI** retail y business intelligence · **SLI** social listening · **PSI** psicología del consumidor · **FIN** finanzas · **GES** gestión del negocio.
Campos: `id, nombre, nivel (E empresa / P producto / C cliente), dim (área), grupo (bloque), tipo (t texto, n número, p porcentaje, e escala 1–5, sn sí/no, c opciones), opts, q (pregunta), guia, fuente, aplica (tipos de cliente), emp (limitada a una empresa)`.
Niveles: 266 de empresa, 147 de producto, 236 de cliente. Las de cliente se muestran según el tipo del segmento (`aplica`). Una variable **descontinuada** deja de preguntarse, pero sus datos se conservan.

## Qué no se guarda
No se guardan ni se piden: números de identificación oficial, cuentas bancarias o tarjetas, ni datos personales sensibles. Lo que se importa de un CSV se agrega y **las filas del archivo no se guardan**.

## Qué se envía a Claude
- Motor: solo conteos por variable, nunca valores.
- Importar CSV: nombres de columnas, estadísticas y categorías únicas si son pocas y repetidas; nunca filas ni correos.
- Sugerencias: evidencia agregada y textos de hallazgos.
- Documento de Word: contenido de las secciones; los textos libres solo si se activa.
- Backoffice: la descripción de las variables, sin datos de empresas.
- Captura conversacional: lo que la persona escribe, la ficha de la empresa y lo ya capturado en ese nodo; nunca archivos.

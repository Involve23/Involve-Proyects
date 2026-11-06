# Pendientes y límites conocidos

## Por construir
- **Importar respuestas** de las capturas por empresa al proyecto principal (con pantalla de «lo que entendí» y remapeo de IDs de productos y segmentos). Hoy se hace a mano con Claude.
- **Probar la captura conversacional con el Claude real** y con un CEO de verdad. Todo se probó con un Claude simulado.
- **Avisos** cuando alguien pasa una pregunta al equipo (hoy hay que abrir «Pendientes con el equipo»).
- **Modelos estadísticos**: regresión logística, multinivel y bayesianos. En un mismo modelo no se pueden mezclar variables de producto y de cliente.
- **Exportar a PDF** (hoy solo Word y CSV/JSON).
- **Series por periodo al importar un CSV** (hoy cada columna se resume en un solo valor por periodo).
- **Asignaciones por persona** (quién captura qué) y matriz de personas por corriente. Hoy solo hay avance en vivo.
- **Dirección de las variables** («más es mejor» o «menos es mejor») para afinar brechas y alertas.

- **Llevar la carga documental al artefacto publicado.** `scripts/cargar-conocimiento.mjs` solo escribe en localhost; en claude.ai hace falta la misma importación que las capturas por empresa.
- **Unidad en las variables de precio.** «Precio de lista» mezcla precios por vacante y por mes, así que las brechas entre productos de Involve no son comparables (el motor marca start con $0 como brecha alta).

## Por validar con Brayan
- **Carga de productos de Involve (2026-11-06):** responder las 14 preguntas abiertas (PRE-0001 a PRE-0014), sobre todo clientes activos (500 o 2,400), planes de metría y vigencia de créditos. Validar las 9 variables nuevas (VAR-061 a VAR-069) en el Backoffice.
- Estructuras de las 12 corrientes nuevas y las ramas de Psicología del consumidor (propuestas).
- Traslapes: emociones y necesidades (Análisis de mercado) frente a Psicología; experiencia poscompra; recordación y asociaciones; sensorial en producto; conversación en redes frente a Social listening; modelación frente a Estadística.
- Umbrales de las reglas de alerta de Sugerencias (satisfacción ≤ 2, NPS ≤ 0, LTV/CAC < 3, churn ≥ 30 %, margen unitario < 15 %…).
- Las fichas iniciales de las 649 variables (definición, unidad, escala, ejemplo, frecuencia, dueño y relaciones obvias) están en estado «borrador».
- «Modelo de venta» y «Tipo de cliente» se duplican: al definir un segmento B2C o B2B, «Modelo de venta» se registra automáticamente. Falta decidir si se fusionan.

## Límites técnicos
- La interpretación con Claude depende de que el CEO abra el enlace desde Claude con su sesión; si no, la captura dice que necesita a Claude.
- Un bloque con muchas variables de producto puede producir muchos bloques (≈36 por producto): la conversación es larga; se pueden dejar para después.
- El navegador puede conservar la versión anterior de un artefacto: recargar.
- Las tipografías (Google Fonts) requieren internet; sin ellas se usa la del sistema.

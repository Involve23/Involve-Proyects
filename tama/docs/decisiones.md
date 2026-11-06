# Decisiones de diseño

Resumen de lo que se decidió con Brayan y por qué. Si vas a cambiar algo de aquí, **pregúntale primero**.

## Modelo
- **Grafo por capas**: Grupo → Empresa → {Producto, Cliente}. El Cliente es un **buyer persona**, no personas individuales, así que no hace falta un ID maestro de clientes.
- **Cada dato es una observación** con fuente, confianza, periodo, autor y fecha; la más reciente es la vigente. IDs propios con dígito verificador, nunca reutilizados.
- **13 corrientes de análisis** como estructura compartida. En Grupo Tama son plantilla sin datos; cada empresa, su cliente y cada producto repiten esa estructura **con datos**, mostrando solo las variables de su nivel.
- **Marketing** vive dentro de Análisis de mercado; Smartketing no es un nodo, solo es análisis de mercado. Neuromarketing es una rama de Psicología del consumidor. Las estructuras de las corrientes nuevas son un borrador por validar.
- **El cliente tiene la misma estructura completa (13 corrientes)** vista como buyer persona, con 236 variables (91 nuevas). Una empresa puede tener **varios clientes (segmentos)**: cada uno con su **tipo** (B2C, B2B, B2B2C, Institucional) y su **estrategia** (una por segmento). Al elegir el tipo solo se preguntan las variables que aplican.
- **El producto conserva solo sus variables de nivel producto**; la etapa del ciclo de vida ordena qué se pregunta primero.

## Análisis
- **Motor estadístico en el navegador**: se niega a calcular lo que no se sostiene (pocas empresas o periodos) y dice qué falta. Umbrales por defecto: asociaciones con 8 unidades, regresión con 10 por variable explicativa, perfiles con 15, pronóstico con 6 periodos. No se pueden mezclar variables de producto y de cliente en un mismo modelo.
- **Análisis** presenta cuatro entregables (diagnóstico por empresa, comparativo del grupo, casos de uso de cliente, lectura por corriente) con textos de plantilla; el documento de Word los redacta Claude.
- **Sugerencias**: detectores levantan señales (hallazgos sin sugerencia, brechas, cross-selling, huecos de datos, alertas, valor, calidad); Claude redacta borradores; el equipo acepta, edita o descarta; se priorizan por impacto × (6 − esfuerzo); se mide el indicador con datos nuevos (cambio ≥ 5% en la dirección buena). Los umbrales de las alertas son reglas iniciales por validar.

## Backoffice
- Catálogo maestro **de la estructura general (tipo Tama)**, sin datos de empresas. **Versión por variable y lanzamientos del catálogo (v1.0, v1.1…)**, con nota obligatoria en cada cambio. Estados: borrador, validada, en uso, descontinuada. Descontinuar no borra datos.
- Las fichas iniciales (definición, unidad, escala, ejemplo, frecuencia, dueño, relaciones) son un **borrador** derivado de lo que ya existía, por validar.

## Captura
- **De lo particular a lo general**: productos → clientes → empresa → grupo.
- **Conversacional por bloques**: una pregunta abierta por bloque (hasta 6 variables de una misma área), sugerencias, ejemplos si no sabe qué responder, «lo que entendí» antes de guardar, memoria de lo aprendido por empresa compartida con el equipo. **Siempre se guarda con confirmación**; lo deducido se marca. Las sugerencias no cruzan datos entre empresas.
- **Equipo en vivo**: cada dato queda a nombre de quien lo capturó; el panel muestra avance y actividad.
- **Capturas por empresa para el CEO**: un artefacto por empresa (aislamiento y privacidad), con la empresa fija; lo que no sepan se pasa a Brayan o a Marketing.

## Diseño y versiones
- **Genesis 2.0 modo métría** (no existe modo de Grupo Tama). Grafo sobre superficie oscura. Navegación en sidebar flotante.
- **Versión de la aplicación** (V1.x.y) separada de los **lanzamientos del catálogo** (v1.x). Cada versión deja un respaldo del HTML.
- **Localhost**: servidor local que sustituye a la plataforma; la estructura inicial se siembra, los datos reales se capturan en localhost.

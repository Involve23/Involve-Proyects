/* ===================== Guías de respuesta por bloque ===================== */
/* Clave: «código de área|bloque». Dicen qué registrar, en qué forma y para qué sirve el dato. */
const GUIA={
 'N|Grupo':'Nombre del grupo empresarial al que pertenece la empresa y la relación (matriz, filial, marca hermana). Sirve para ubicar a la empresa en el grafo y detectar sinergias entre marcas.',
 'N|Marcas':'Registra el nombre de la marca y su rol (principal, secundaria o nueva) con el año de lanzamiento. Sirve para ver la arquitectura de marca y posibles canibalizaciones.',
 'N|Portafolio':'Lista las líneas o productos y, si se conoce, cuánto aporta cada una a los ingresos (porcentaje). Sirve para ubicar huecos de portafolio y priorizar.',
 'N|Profundidad del portafolio':'Distingue quién compra y quién usa, que pueden ser personas distintas. Descríbelos por cargo o tipo de persona. Sirve para dirigir mensajes y medir al cliente correcto.',
 'O|Unidad de compra':'Describe cómo compra el cliente: unidad mínima, tamaños o paquetes, y si hay promoción o descuento vigentes con sus condiciones. Sirve para entender la escalera de oferta y el efecto del precio.',
 'O|Variables del producto base':'Describe la característica que cambia lo que se paga, con datos exactos (días, versión, qué incluye). Sirve para comparar versiones y precios.',
 'O|Variables del paquete':'Registra el dato exacto del paquete (unidades, precio, vigencia, nivel) tal como aparece en la lista vigente, con pesos o unidades. Sirve para calcular el precio unitario efectivo y comparar paquetes.',
 'O|Variables de la promoción':'Registra las reglas de la promoción: tipo, fechas, quién puede usarla, código y límite de usos. Indica la fecha de la última. Sirve para medir su efecto sobre ventas y recompra.',
 'O|Variables del descuento':'Registra las reglas del descuento: tipo, monto o porcentaje, condición y quién lo autoriza. Sirve para medir cuánto se cede del precio de lista y con qué criterio.',
 'O|Precio y pago':'Registra el dato en pesos o la forma de pago vigente, con el periodo al que corresponde. Sirve para calcular márgenes y la brecha entre precio de lista y precio real.',
 'Q|Modelo':'Indica si la empresa vende a empresas (B2B), a personas (B2C) o a ambos. Sirve para decidir qué variables de audiencia aplican y cómo segmentar.',
 'Q|Estado de relación':'Indica en qué estado predomina la relación con este cliente: activo, prospecto o inactivo. Sirve para separar clientes actuales de potenciales.',
 'Q|Firmográficos B2B':'Describe al cliente típico con datos comparables: industria, tamaño, región, volumen de compra o puesto del decisor. Usa rangos (por ejemplo, 50 a 200 empleados). Sirve para segmentar y comparar entre empresas.',
 'Q|Perfil B2C':'Describe a la persona típica con segmento principal, rango de edad u ocupación; usa rangos y porcentajes si los tienes. Sirve para segmentar y comparar perfiles entre empresas.',
 'R|Tipo':'Indica el estado de este tipo de medio en la empresa y, en la nota, en qué plataformas o acciones se usa. Sirve para ver el balance entre medios pagados, ganados, compartidos y propios.',
 'S|Digital':'Indica el estado de este canal digital en la empresa. Sirve para ver cobertura de canales y huecos.',
 'S|Propios':'Indica el estado de este canal propio. Sirve para saber qué activos de marketing controla la empresa.',
 'S|Directos':'Indica el estado de este canal directo. Sirve para ver qué esfuerzo comercial depende de personas.',
 'S|Estado de adopción':'Lista los canales según su estado: los que tiene, los que usa y los que usará. Sirve para ver la brecha entre lo disponible y lo realmente utilizado.',
 'T|Publicidad / pauta':'Indica el estado de esta plataforma de pauta. Si se usa, agrega en la nota el presupuesto mensual aproximado. Sirve para saber dónde se invierte.',
 'T|Publicidad / pauta · futuro':'Indica si la empresa considera esta plataforma de pauta emergente. Sirve para anticipar canales.',
 'T|Redes':'Indica el estado de la empresa en esta red y, en la nota, la frecuencia de publicación. Sirve para ver presencia por red.',
 'T|CRM y automatización':'Indica si la empresa tiene y usa esta herramienta y, en la nota, para qué. Sirve para evaluar capacidad de seguimiento y automatización.',
 'T|Medición':'Indica si esta herramienta de medición está instalada y en uso. Sirve para saber qué datos se pueden obtener.',
 'U|Marketing':'Nombre y cargo de la persona responsable de esta función, o escribe «no existe». Sirve para saber a quién consultar y detectar funciones sin dueño.',
 'U|Otras áreas':'Nombre y cargo del responsable de esta área que influye en marketing, o «no existe». Sirve para mapear quién participa en las decisiones.',
 'U|Externos':'Nombre de la agencia o los socios y qué hacen exactamente. Sirve para entender qué se hace dentro y qué fuera de la empresa.',
 'V|Adquisición':'Describe cómo es esta etapa para el cliente típico: qué hace, dónde y cuánto tarda. Incluye un dato o ejemplo. Sirve para ubicar fugas en el embudo.',
 'V|Relación':'Describe cómo es esta etapa de la relación con el cliente típico y qué la mueve. Incluye un dato o ejemplo. Sirve para ver retención y expansión.',
 'V|Recuperación':'Describe las señales y las acciones de esta etapa: qué ocurre, cómo se detecta y qué se hace. Incluye datos si existen. Sirve para entender abandono y recompra.',
 'W|Formato':'Indica el estado de este formato de contenido en la empresa. Sirve para ver variedad y huecos de contenido.',
 'W|Mensaje':'Resume el mensaje central y cómo se expresa, con un ejemplo textual. Sirve para comparar mensajes y relacionarlos con resultados.',
 'W|Llamado a la acción':'Indica el llamado a la acción usado y dónde aparece, con un ejemplo. Sirve para relacionar cada acción pedida con la conversión.',
 'X|Tipo de origen':'Estima qué parte de los clientes o leads llega por este origen (porcentaje o cantidad en el periodo). Sirve para saber qué fuentes alimentan al cliente.',
 'X|Rastreo (UTM)':'Indica si este parámetro de rastreo se registra y cómo se nombra (convención). Sirve para asegurar que el origen sea medible.',
 'X|Atribución':'Indica si se aplica este modelo de atribución y para qué decisiones. Sirve para entender a qué canal se le da crédito.',
 'X|Punto de captura':'Indica si este punto de captura se usa y cuántos contactos aporta, aproximadamente. Sirve para saber dónde se captura al cliente.',
 'X|Momento':'Registra la fecha o el rango típico (AAAA-MM-DD, o «X días desde la captura»). Sirve para medir tiempos del ciclo.',
 'Y|Datos':'Describe al contacto típico (un arquetipo, no una persona real): cargo, tipo de organización, canal y dónde se le encuentra. Sirve para definir el buyer persona.',
 'Y|Rol en la compra':'Describe cuánto y cómo interviene este rol en la compra: cargo típico y peso en la decisión. Sirve para dirigir mensajes al rol correcto.',
 'Y|Consentimiento':'Indica si la política aplica y, en la nota, cómo se obtiene. Sirve para cumplir privacidad y definir qué se puede contactar.',
 'Y|Calificación':'Registra cómo se califica al contacto: escala, regla o puntaje típico. Sirve para priorizar el seguimiento.',
 'Y|Gestión':'Registra quién da seguimiento y cómo (responsable, canal, frecuencia). Sirve para ver cómo se gestiona la relación comercial.',
 'Z|Alcance y captación':'Registra el valor del indicador en el último periodo, con unidad y periodo (por ejemplo, mensual). Sirve para ver el embudo.',
 'Z|Venta y uso':'Registra el valor del indicador en el último periodo, en pesos o unidades, con el periodo. Sirve para medir ventas y uso.',
 'Z|Lealtad':'Registra el valor del indicador en el último periodo (porcentaje o puntos) y la fórmula usada. Sirve para ver retención y satisfacción.',
 'AN1|Valores y creencias':'Describe el valor o la creencia con un ejemplo observado o una frase del cliente, y de dónde salió (entrevista, observación). Evita opiniones del equipo. Sirve para alinear mensajes y producto con lo que el cliente valora.',
 'AN1|Identidad':'Describe cómo el cliente se define a sí mismo al consumir y con qué grupos se identifica, con ejemplos. Sirve para posicionar la marca dentro de su identidad.',
 'AN2|Rituales de consumo':'Describe paso a paso cómo ocurre (cuándo, dónde, con quién) usando un caso concreto observado. Sirve para encontrar momentos de oportunidad y fricciones.',
 'AN2|Rutinas':'Describe la rutina alrededor del producto con un caso concreto: horarios, personas, objetos y obstáculos. Sirve para diseñar oferta y comunicación en el momento correcto.',
 'AN3|Significado':'Registra qué significa el producto para el cliente en sus propias palabras, con frases literales, y qué emoción o símbolo asocia. Sirve para posicionamiento y comunicación.',
 'AN3|Lenguaje':'Registra palabras, expresiones o historias que el cliente usa, tal como las dice. Sirve para redactar mensajes que suenen auténticos.',
 'AN4|Comunidad':'Describe la comunidad o red (nombre, tamaño aproximado, quién la lidera) y cómo influye en la compra. Sirve para identificar prescriptores y espacios de conversación.',
 'AN4|Entorno cultural':'Describe el rasgo cultural o regional relevante con un ejemplo y su efecto en la compra o en la empresa. Sirve para adaptar la oferta y evitar choques culturales.',
 'SO1|Estratificación':'Registra la distribución del cliente típico con rangos o porcentajes (por ejemplo, 60% nivel C+) y la fuente. Sirve para segmentar con datos comparables.',
 'SO1|Demografía social':'Registra la composición típica (hogar, etapa de vida, género y generación) con rangos o porcentajes. Sirve para segmentar y dimensionar.',
 'SO2|Influencia':'Describe quién influye en la decisión y con qué peso (alto, medio o bajo), con ejemplos. Sirve para dirigir mensajes a quien realmente influye.',
 'SO2|Redes':'Describe cómo circula la recomendación (canales, comunidades, frecuencia) con un ejemplo. Sirve para activar el boca a boca.',
 'SO3|Normas':'Describe la norma, regulación o institución y cómo condiciona la operación o la compra; cita la fuente. Sirve para anticipar restricciones.',
 'SO3|Tendencias sociales':'Describe el cambio social con datos o fuente y su efecto esperado en la demanda. Sirve para anticipar cambios de mercado.',
 'CU1|Objetivo':'Redáctalo en una oración clara y accionable. Sirve para que el estudio responda algo que se pueda decidir.',
 'CU1|Muestra':'Describe perfil, cantidad y criterios con números (por ejemplo, 8 sesiones de 6 personas). Sirve para juzgar qué tan sólido es el hallazgo.',
 'CU2|Técnicas usadas':'Indica el estado de esta técnica cualitativa en la empresa. Sirve para ver qué capacidades de investigación existen.',
 'CU2|Moderación':'Describe o liga el material (guía, responsable, estímulo) e indica la fecha de su última versión. Sirve para asegurar consistencia entre estudios.',
 'CU3|Motivaciones y barreras':'Resume el hallazgo en 2 o 3 frases e indica cuántos participantes lo mencionaron (por ejemplo, 5 de 8). Sirve para priorizar mejoras.',
 'CU3|Verbatims':'Incluye la frase literal entre comillas y quién la dijo (perfil, no nombre). Sirve para sustentar insights con evidencia.',
 'SE1|Identidad visual':'Describe el elemento visual con precisión (por ejemplo, rojo en el logotipo) y qué comunica. Sirve para evaluar coherencia y diferenciación.',
 'SE1|Identidad verbal':'Registra el nombre, el tono o el eslogan textuales y qué comunican. Sirve para evaluar coherencia y diferenciación.',
 'SE2|Empaque':'Describe el atributo físico del empaque con datos (forma, material, ubicación de la información). Sirve para comparar contra competidores y evaluar impacto en anaquel.',
 'SE2|Señales':'Describe qué señal usa el empaque o el producto para comunicar calidad, precio o categoría y cómo la interpreta el cliente. Sirve para detectar incoherencias.',
 'SE3|Códigos':'Describe el código de la categoría con 2 o 3 ejemplos de marcas que lo usan. Sirve para decidir si seguirlo o romperlo.',
 'SE3|Narrativa':'Resume el relato, el personaje o el contexto con un ejemplo de pieza de comunicación. Sirve para evaluar originalidad y coherencia.',
 'CS1|Panel':'Describe el panel con datos (tipo, número de panelistas o frecuencia). Sirve para juzgar la validez de las evaluaciones.',
 'CS1|Protocolo':'Describe el método, la escala o las condiciones de prueba exactamente como se aplican. Sirve para que los resultados sean comparables en el tiempo.',
 'CS2|Atributos':'Describe el atributo con palabras precisas del léxico del panel y su intensidad si se midió. Sirve para construir el perfil sensorial.',
 'CS2|Intensidad':'Registra intensidades por atributo, la escala usada y qué atributos diferencian al producto o salen del perfil. Sirve para ajustar la formulación.',
 'CS3|Aceptación':'Registra el resultado de la prueba (promedio o porcentaje) con tamaño de muestra y escala. Sirve para decidir lanzamientos y ajustes.',
 'CS3|Drivers':'Lista los atributos que explican el agrado o lo penalizan, con evidencia (análisis o frecuencia). Sirve para orientar mejoras.',
 'CS4|Vida útil':'Registra cómo cambia el atributo con el tiempo, con fechas o días y condiciones de almacenamiento. Sirve para definir caducidad.',
 'CS4|Consistencia':'Registra la variación entre lotes o contra el estándar con un número (por ejemplo, 3% fuera de especificación). Sirve para controlar la calidad.',
 'EC1|Competencia':'Registra el dato de estructura con su fuente (por ejemplo, 4 competidores concentran 70% del mercado). Sirve para entender poder de mercado y barreras.',
 'EC1|Sustitución':'Lista los productos sustitutos o complementarios y lo que le cuesta al cliente cambiar. Sirve para estimar elasticidades y riesgo de pérdida.',
 'EC2|Elasticidades':'Registra el coeficiente numérico estimado, cómo se calculó y el periodo. Sirve para decidir precios.',
 'EC2|Tendencia':'Registra el dato de demanda (unidades o pesos) o su crecimiento, con periodo y fuente. Sirve para dimensionar y proyectar.',
 'EC3|Costos':'Registra el costo en pesos por unidad o por periodo, con fecha. Sirve para calcular márgenes y punto de equilibrio.',
 'EC3|Capacidad':'Registra la capacidad o su utilización en unidades y porcentaje, con fecha. Sirve para saber cuánto se puede crecer.',
 'EC4|Indicadores':'Registra el valor más reciente del indicador macro con fecha y fuente (por ejemplo, INEGI o Banxico). Sirve para relacionar el entorno con las ventas.',
 'EC4|Política y regulación':'Describe la medida vigente o esperada y su efecto en costos o demanda, con fuente y fecha. Sirve para anticipar riesgos.',
 'DA1|Fuentes':'Lista las fuentes con su dueño, formato y frecuencia. Sirve para saber con qué datos se puede analizar.',
 'DA1|Calidad':'Registra la medida de calidad (porcentaje o periodos disponibles) y cómo se calculó. Sirve para decidir qué técnicas son confiables.',
 'DA2|En uso':'Indica el estado de este tipo de modelo en la empresa. Sirve para ver la madurez analítica.',
 'DA2|Validación':'Describe cómo se mide y se valida (métrica, criterio, frecuencia) con valores. Sirve para confiar en los resultados.',
 'DA3|Pronóstico':'Registra el pronóstico, su error o su intervalo con periodo y unidad. Sirve para planear y comparar contra lo real.',
 'DA3|Explicación':'Lista variables o relaciones con evidencia (coeficiente o importancia) y qué falta validar. Sirve para decidir sobre qué actuar.',
 'RB1|Auditoría':'Registra el resultado de la última auditoría (porcentaje o valor) con fecha y número de puntos de venta. Sirve para detectar fallas de ejecución.',
 'RB1|Formatos':'Registra el desempeño por formato de tienda con cifras (ventas, rotación). Sirve para decidir dónde enfocarse.',
 'RB2|Ventas':'Registra el valor en pesos o unidades del último periodo y cómo se midió. Sirve para ver el flujo del canal.',
 'RB2|Promoción':'Registra ventas o efecto de la última promoción contra una base de comparación y su periodo. Sirve para evaluar si la promoción deja valor.',
 'RB3|Inteligencia de negocio':'Describe el tablero o indicador: nombre, responsable y frecuencia. Sirve para ver cómo se monitorea el negocio.',
 'RB3|Integración':'Describe las fuentes conectadas o los reportes automatizados. Sirve para saber cuánto del análisis es repetible.',
 'SL1|Volumen':'Registra el número del último periodo con la herramienta, la fecha y las palabras clave usadas. Sirve para seguir la conversación en el tiempo.',
 'SL1|Sentimiento':'Registra el porcentaje o la emoción dominante, con herramienta y periodo. Sirve para ver la salud de la marca.',
 'SL2|Temas':'Lista los temas con su peso aproximado y un ejemplo. Sirve para encontrar quejas y oportunidades.',
 'SL2|Voces':'Lista las cuentas o comunidades con su alcance y el porcentaje de la conversación. Sirve para decidir con quién colaborar.',
 'SL3|Dónde ocurre':'Lista dónde ocurre la conversación y cuánta hay en cada lugar (porcentaje). Sirve para decidir dónde escuchar y responder.',
 'SL3|Respuesta':'Registra el tiempo promedio de respuesta o el protocolo, con datos del último periodo. Sirve para evaluar la gestión de reputación.',
 'NM1|Atención':'Registra el resultado del estudio (valor, mapa o hallazgo) con el estímulo, la muestra y la técnica. Sirve para saber qué capta la vista.',
 'NM1|Emoción':'Registra la medida (valor o dirección) por estímulo, con técnica y muestra. Sirve para comparar lo que se siente con lo que se dice.',
 'NM1|Memoria':'Registra el resultado del test implícito (puntaje o asociación) con estímulo y muestra. Sirve para ver qué se queda en la mente.',
 'NM1|Realidad aumentada':'Describe el prototipo o la simulación: qué se probó, dónde y con cuántas personas. Sirve para decidir antes de producir.',
 'NM1|Resultados':'Registra el resultado (porcentaje, tiempo o diferencia) con condiciones de prueba y muestra. Sirve para validar decisiones de diseño.',
 'PC1|Atención':'Describe qué capta la atención en el punto de contacto, con un ejemplo y la evidencia (estudio u observación). Sirve para diseñar piezas visibles.',
 'PC1|Percepción':'Describe cómo percibe el cliente esta dimensión frente a la competencia (mejor, igual o peor) y la evidencia. Sirve para posicionar.',
 'PC2|Motivaciones':'Describe el motivo con un ejemplo e indica cuántos clientes lo mencionan (porcentaje o cantidad). Sirve para priorizar mensajes.',
 'PC2|Emociones':'Describe la emoción dominante en ese momento con frases del cliente. Sirve para diseñar la experiencia.',
 'PC3|Memoria de marca':'Registra el valor (porcentaje o lista de asociaciones) con fecha y muestra. Sirve para medir el posicionamiento.',
 'PC3|Hábito y aprendizaje':'Describe el hábito o el aprendizaje con su frecuencia y un ejemplo. Sirve para ver lealtad por costumbre y barreras de adopción.',
 'PC4|Proceso de decisión':'Describe qué hace el cliente en esta etapa: fuentes consultadas, tiempo y criterios. Sirve para encontrar dónde intervenir.',
 'PC4|Heurísticas y sesgos':'Describe la heurística o el sesgo observado, cómo aparece en la compra y la evidencia. Sirve para diseñar oferta y mensajes.',
 'PC5|Actitudes':'Registra la actitud o la intención con la escala usada y el resultado (media o porcentaje). Sirve para predecir la compra.',
 'PC5|Personalidad y estilo de vida':'Describe los rasgos o el estilo típicos con segmentos y porcentajes si existen. Sirve para segmentar psicográficamente.',
 'FI1|Estado de resultados':'Registra la cifra en pesos del último periodo cerrado e indica el periodo (por ejemplo, 2025 anual). Sirve para rentabilidad y comparaciones.',
 'FI1|Márgenes':'Registra el porcentaje del último periodo y la fórmula usada. Sirve para comparar rentabilidad.',
 'FI2|Liquidez':'Registra la cifra o la razón al último cierre, con fecha. Sirve para ver capacidad de pago y operación.',
 'FI2|Estructura':'Registra la cifra en pesos o la razón al último cierre, con fecha. Sirve para evaluar solvencia.',
 'FI3|Rentabilidad':'Registra el porcentaje o el valor del último periodo y la fórmula usada. Sirve para evaluar el retorno.',
 'FI3|Valor':'Registra la cifra con el método y la fecha de cálculo. Sirve para decidir inversiones.',
 'FI4|Unit economics':'Registra el valor por unidad en pesos, con el periodo y cómo se calculó. Sirve para decidir precio y rentabilidad por producto.',
 'FI5|Valor del cliente':'Registra el valor en pesos o la razón, con periodo y método de cálculo. Sirve para decidir cuánto invertir en captar y retener.',
 'FI6|Presupuesto':'Registra el monto en pesos o la desviación del periodo vigente. Sirve para ver disciplina financiera y prioridades.',
 'FI6|Proyección':'Registra la proyección con su periodo y supuestos, o lista los riesgos con su impacto estimado. Sirve para planear escenarios.',
 'GN1|Propuesta de valor':'Redáctalo en una o dos oraciones con datos concretos: para quién, qué problema, cómo. Sirve para alinear estrategia y mensajes.',
 'GN1|Operación':'Lista los elementos clave y su importancia o costo. Sirve para ver dependencias.',
 'GN2|Dirección':'Registra la meta con cifra y fecha. Sirve para alinear acciones con objetivos.',
 'GN2|Riesgos':'Describe el riesgo con probabilidad e impacto aproximados (alto, medio o bajo) y qué se hace al respecto. Sirve para priorizar la mitigación.',
 'GN3|Indicadores':'Registra el indicador con su definición, valor actual y meta; para el avance, el porcentaje. Sirve para seguir el desempeño.',
 'GN3|Organización':'Describe estructura, responsables y ritmo de revisión con nombres de puesto. Sirve para saber quién decide y cuándo se revisa.'
};

/* ===================== Satélites: plantillas de variables ===================== */
const ADOPT=['Lo tenemos','Lo usamos','Lo usaremos','No lo usamos'];
const MKT_DEF=[
 {d:'N',n:'Organización',k:'DIM_ORGANIZACION',q:'¿Qué marca y qué producto habla?',lvl:'E',g:[
  ['Grupo',['Grupo al que pertenece']],
  ['Marcas',['Marca principal','Otras marcas del grupo relacionadas','Marcas nuevas por lanzar']],
  ['Portafolio',['Líneas de producto o servicio','Producto o servicio principal']],
  ['Profundidad del portafolio',['Quién compra','Quién usa']]]},
 {d:'O',n:'Oferta',k:'DIM_OFERTA',q:'¿Qué compra el cliente? Profundidad del portafolio.',lvl:'P',g:[
  ['Unidad de compra',['Unidad mínima de compra','Presentaciones o tamaños','Paquete','Promoción','Descuento']],
  ['Variables del producto base',['Duración o vigencia','Versión destacada o premium','Difusión incluida','Extras incluidos','Renovación']],
  ['Variables del paquete',['Unidades incluidas','Precio del paquete','Precio unitario efectivo','Vigencia del paquete','Nivel (básico, pro, empresarial)']],
  ['Variables de la promoción',['Tipo de promoción','Fechas de inicio y fin','Elegibilidad (recompra, primera compra)','Código de promoción','Límite de usos']],
  ['Variables del descuento',['Tipo de descuento (% o monto fijo)','Descuento por volumen','Descuento por lealtad o recompra','Descuento por pronto pago','Tope máximo de descuento','Quién autoriza el descuento']],
  ['Precio y pago',['Precio de lista','Precio final pagado','Forma de pago','Facturación']]]},
 {d:'Q',n:'Audiencia',k:'DIM_AUDIENCIA',q:'¿A quién le hablamos?',lvl:'C',g:[
  ['Modelo',['Modelo de venta']],
  ['Estado de relación',['Estado de la relación']],
  ['Firmográficos B2B',['Industria','Tamaño de empresa','Región','Volumen de compra','Puesto del decisor']],
  ['Perfil B2C',['Segmento de persona principal','Rango de edad','Ocupación']]]},
 {d:'R',n:'Medios',k:'DIM_MEDIO',q:'¿Qué tipo de medio es? (modelo PESO)',lvl:'E',g:[
  ['Tipo',['Medios pagados','Medios ganados','Medios compartidos','Medios propios']]]},
 {d:'S',n:'Canales',k:'DIM_CANAL',q:'¿Por dónde llega el mensaje?',lvl:'E',g:[
  ['Digital',['Búsqueda (SEO/SEM)','Redes sociales','Display / programática','Email','Mensajería']],
  ['Propios',['Sitio web / landing','Plataforma o app propia','Blog / recursos']],
  ['Directos',['Ventas outbound / SDR','Eventos y ferias','Webinars','Referidos y alianzas','Relaciones públicas']],
  ['Estado de adopción',['Canales que tenemos','Canales que usamos','Canales que usaremos']]]},
 {d:'T',n:'Plataformas',k:'DIM_PLATAFORMA',q:'¿Con qué herramienta se ejecuta o se mide?',lvl:'E',g:[
  ['Publicidad / pauta',['Google Ads','Meta Ads','LinkedIn Ads','TikTok Ads']],
  ['Publicidad / pauta · futuro',['OpenAI Ads (ChatGPT)','YouTube Ads','Spotify Ads']],
  ['Redes',['LinkedIn','Instagram','Facebook','TikTok','YouTube']],
  ['CRM y automatización',['CRM','Email marketing','WhatsApp Business API']],
  ['Medición',['GA4','Tag Manager','Píxeles','Tablero BI']]]},
 {d:'U',n:'Áreas',k:'DIM_AREA',q:'¿Quién es responsable?',lvl:'E',g:[
  ['Marketing',['Responsable de marca','Responsable de performance','Responsable de contenido','Responsable de growth']],
  ['Otras áreas',['Responsable de ventas / SDR','Responsable de customer success','Responsable de producto','Responsable de datos / BI','Responsable de diseño']],
  ['Externos',['Agencia externa','Socios externos']]]},
 {d:'V',n:'Ciclo de vida',k:'DIM_CICLO_VIDA',q:'¿En qué momento está la persona?',lvl:'C',g:[
  ['Adquisición',['Descubrimiento','Consideración','Conversión']],
  ['Relación',['Onboarding / activación','Uso / retención','Expansión (cross-sell)']],
  ['Recuperación',['Riesgo de abandono','Reactivación','Recomendación / referidos']]]},
 {d:'W',n:'Contenido',k:'DIM_CONTENIDO',q:'¿Qué le decimos y en qué formato?',lvl:'E',g:[
  ['Formato',['Video','Carrusel / post','Artículo','Webinar','Demo','Newsletter','Caso de éxito','Plantilla / guía']],
  ['Mensaje',['Mensaje de ahorro de tiempo','Mensaje de calidad','Mensaje de costo','Mensaje de alcance']],
  ['Llamado a la acción',['Comprar por primera vez','Agendar demo','Prueba gratis','Recomprar','Subir a un paquete','Usar una promoción']]]},
 {d:'X',n:'Origen',k:'DIM_ORIGEN',q:'¿De dónde vino esta persona o este lead?',lvl:'C',g:[
  ['Tipo de origen',['Inbound','Outbound','Referido','Alianza / partner','Evento','Orgánico directo']],
  ['Rastreo (UTM)',['utm_source','utm_medium','utm_campaign','utm_content','utm_term']],
  ['Atribución',['Primer toque','Último toque','Toque que convirtió','Multitoque']],
  ['Punto de captura',['Landing / formulario','WhatsApp','Llamada','Registro en la plataforma','Otra marca del grupo']],
  ['Momento',['Fecha de primera captura','Fecha de conversión']]]},
 {d:'Y',n:'Contacto',k:'DIM_CONTACTO',q:'¿Cómo es el contacto típico? Perfil del buyer persona.',lvl:'C',g:[
  ['Datos',['Cargo típico','Tipo de organización','Canal de contacto habitual (email, teléfono, WhatsApp)','Perfil profesional donde se le encuentra']],
  ['Rol en la compra',['Decisor','Influenciador','Usuario','Pagador']],
  ['Consentimiento',['Opt-in de email requerido','Opt-in de WhatsApp requerido','Aviso de privacidad aplicado','Política de baja o no contactar']],
  ['Calificación',['Lead score','Engagement score','Fit con perfil ideal']],
  ['Gestión',['Responsable (owner)','Canal preferido de seguimiento','Último contacto típico','Marcas del grupo con las que tiene relación']]]},
 {d:'Z',n:'Métricas',k:'DIM_METRICAS',q:'¿Qué medimos en cada interacción?',lvl:'E',g:[
  ['Alcance y captación',['Impresiones','Alcance','Clics / CTR','Leads','MQL','SQL','Demos','Conversiones','CPL','CAC']],
  ['Venta y uso',['Unidades ofertadas','Unidades compradas','Uso de lo comprado','Ticket promedio','Tasa de recompra','Frecuencia de compra','Descuento otorgado','Ingresos','LTV']],
  ['Lealtad',['Churn','Tasa de reactivación','NPS','Engagement']]]}
];
const MKT_PCT=new Set(['Clics / CTR','Tasa de recompra','Tasa de reactivación','Churn','Engagement']);
function mktType(d,g,n){
  if(d==='R'||d==='T'||(d==='S'&&g!=='Estado de adopción')||(d==='W'&&g==='Formato')) return {t:'c',opts:ADOPT};
  if(n==='Modelo de venta') return {t:'c',opts:['B2B','B2C','Mixto']};
  if(n==='Estado de la relación') return {t:'c',opts:['Cliente activo','Prospecto','Cliente inactivo']};
  if(g==='Consentimiento') return {t:'sn'};
  if(n==='Fit con perfil ideal') return {t:'e'};
  if(d==='Z') return {t:MKT_PCT.has(n)?'p':'n'};
  if(/^Precio |^Tope máximo|^Unidades incluidas|^Lead score|^Engagement score/.test(n)) return {t:'n'};
  return {t:'t'};
}
const NIVLUG={E:'en esta empresa',P:'en este producto',C:'en este cliente'};
function mktQ(n,t,o,l){
  const lp=NIVLUG[l]||'';
  if(t==='c') return o===ADOPT?'¿En qué estado está «'+n+'» '+lp+'?':'¿Cuál opción describe «'+n+'» '+lp+'?';
  if(t==='n') return '¿Cuál es el valor de «'+n+'» '+lp+'? Indica unidad y periodo.';
  if(t==='p') return '¿Qué porcentaje es «'+n+'» '+lp+'? (0 a 100)';
  if(t==='sn') return '¿Aplica «'+n+'» '+lp+'?';
  if(t==='e') return '¿Qué tan alto es «'+n+'» '+lp+'? (1 = muy bajo, 5 = muy alto)';
  return 'Describe «'+n+'» '+lp+' con datos concretos.';
}
const TREE_GROUPS={
 A:[['Dimensión del mercado',['VAR-002','VAR-003']],['Oportunidad y segmentos',['VAR-001','VAR-005','VAR-006']],['Contexto y territorio',['VAR-004','VAR-007']]],
 B:[['Necesidades y percepción',['VAR-008','VAR-012','VAR-014']],['Relación y lealtad',['VAR-009','VAR-010','VAR-011']],['Entorno del cliente',['VAR-013']]],
 C:[['Comprador',['VAR-016','VAR-018']],['Punto de venta',['VAR-017','VAR-019']]],
 D:[['Evaluación y diferencias',['VAR-020','VAR-022','VAR-028']],['Atributos sensoriales',['VAR-021','VAR-024','VAR-027','VAR-026']],['Calidad y vida útil',['VAR-023','VAR-025']],['Costo y regulación',['VAR-029','VAR-030']]],
 E:[['Posición y fuerza',['VAR-031','VAR-032','VAR-035']],['Estructura de marca',['VAR-033','VAR-034']]],
 F:[['Nivel de precio',['VAR-036','VAR-037']],['Respuesta y margen',['VAR-038','VAR-039']]],
 G:[['Caminos al mercado',['VAR-040','VAR-041']],['Desempeño en canal',['VAR-042','VAR-043','VAR-044']]],
 H:[['Evaluación del mensaje',['VAR-045','VAR-046']],['Ejecución y retorno',['VAR-047','VAR-048']]],
 I:[['Competidores',['VAR-049','VAR-050']]],
 J:[['Pronóstico',['VAR-051']],['Modelos',['VAR-052','VAR-053']]],
 K:[['Proceso',['VAR-054','VAR-055']],['Oferta nueva',['VAR-056','VAR-057']]],
 L:[['Planes',['VAR-058','VAR-059','VAR-060']]]
};
const DIMQ={A:'¿Qué tan grande es el mercado y dónde está la oportunidad?',B:'¿Quién compra, qué necesita y por qué se queda o se va?',C:'¿Cómo vive el comprador el punto de venta?',D:'¿Qué tan bien responde el producto a lo que el cliente espera?',E:'¿Qué lugar ocupa la marca y cómo está armado el portafolio?',F:'¿A qué precio se vende y cómo reacciona la demanda?',G:'¿Por dónde llega el producto al cliente?',H:'¿Qué le decimos al mercado y qué retorno deja?',I:'¿Contra quién competimos y cómo nos comparamos?',J:'¿Cuánto vamos a vender y qué lo explica?',K:'¿Qué sigue en productos y conceptos?',L:'¿Cuál es el plan para ejecutar lo que aprendimos?'};
MKT_DEF.forEach(D=>{DIMQ[D.d]=D.q;});
(function(){
  let k=200;
  MKT_DEF.forEach(D=>{D.g.forEach(([gname,names],gi)=>{names.forEach(n=>{
    k++;const t=mktType(D.d,gname,n);
    VARS_BASE.push({id:'VAR-'+k,dim:D.d,nombre:n,nivel:D.lvl,fuente:'I',tipo:t.t,q:mktQ(n,t.t,t.opts,D.lvl),guia:GUIA[D.d+'|'+gname]||null,hint:D.n+' › '+gname,opts:t.opts||null,sat:'MER',grupo:gname,gi});
  });});});
  Object.keys(TREE_GROUPS).forEach(d=>TREE_GROUPS[d].forEach(([gname,ids],gi)=>ids.forEach(id=>{
    const v=VARS_BASE.find(x=>x.id===id);if(v){v.grupo=gname;v.gi=gi;v.sat='MER';}
  })));
})();
/* ===================== Otras corrientes de análisis (borrador por validar) ===================== */
/* Formato de variable: «nombre|tipo». Tipos: n número, p porcentaje, e escala 1 a 5, sn sí/no, a estado de adopción, c=op1/op2 opciones. Sin tipo: texto. */
const CORR_DEF=[
 {c:'ANT',n:'Antropología',src:'P',desc:'Cómo vive, usa y da sentido el cliente al producto en su vida diaria. Método: etnografía, observación en contexto y entrevistas en profundidad.',dims:[
  {d:'AN1',n:'Cultura y valores',q:'¿Qué valores y creencias orientan al cliente?',lvl:'C',g:[
   ['Valores y creencias',['Valores centrales','Creencias sobre la categoría','Mitos y prejuicios','Tabúes']],
   ['Identidad',['Identidad que expresa al consumir','Grupos de pertenencia','Aspiraciones','Rol social']]]},
  {d:'AN2',n:'Prácticas y rituales',q:'¿Cómo y en qué contextos se usa el producto en la vida diaria?',lvl:'C',g:[
   ['Rituales de consumo',['Ritual de compra','Ritual de uso','Momentos y ocasiones','Lugares de consumo']],
   ['Rutinas',['Rutina diaria en torno al producto','Con quién se consume','Objetos y herramientas asociados','Fricciones cotidianas']]]},
  {d:'AN3',n:'Significado y símbolos',q:'¿Qué significa el producto para el cliente?',lvl:'P',g:[
   ['Significado',['Significado cultural del producto','Símbolos asociados','Metáforas que usa el cliente','Emociones que despierta']],
   ['Lenguaje',['Palabras que usa el cliente','Historias y relatos','Referentes culturales']]]},
  {d:'AN4',n:'Comunidad y contexto',q:'¿En qué comunidad y entorno cultural opera la empresa?',lvl:'E',g:[
   ['Comunidad',['Comunidades de usuarios','Líderes de opinión','Redes de recomendación']],
   ['Entorno cultural',['Contexto regional y local','Tendencias culturales','Cultura organizacional de la empresa']]]}]},
 {c:'SOC',n:'Sociología',src:'P',desc:'Cómo la estructura social, los grupos y las normas moldean la compra y el consumo.',dims:[
  {d:'SO1',n:'Estructura social',q:'¿Qué lugar ocupa el cliente en la estructura social?',lvl:'C',g:[
   ['Estratificación',['Nivel socioeconómico','Nivel educativo','Ocupación y clase social','Movilidad social']],
   ['Demografía social',['Composición del hogar','Etapa de vida','Género y generación']]]},
  {d:'SO2',n:'Influencia y redes',q:'¿Quién influye en la decisión de compra?',lvl:'C',g:[
   ['Influencia',['Grupos de referencia','Influencia familiar','Influencia de pares','Prescriptores']],
   ['Redes',['Redes de contacto','Canales de boca a boca']]]},
  {d:'SO3',n:'Instituciones y normas',q:'¿Qué normas e instituciones condicionan a la empresa?',lvl:'E',g:[
   ['Normas',['Normas sociales relevantes','Regulación que afecta','Instituciones clave']],
   ['Tendencias sociales',['Cambios demográficos','Cambios en estilos de vida','Movimientos sociales relevantes']]]}]},
 {c:'CUA',n:'Investigación cualitativa',src:'P',desc:'Estudios con sesiones de grupo y entrevistas para entender motivaciones, barreras y lenguaje del cliente.',dims:[
  {d:'CU1',n:'Diseño del estudio',q:'¿Qué se quiere entender y con quién?',lvl:'E',g:[
   ['Objetivo',['Pregunta de investigación','Hipótesis a explorar','Decisión que informa']],
   ['Muestra',['Perfil de participantes','Número de sesiones o entrevistas','Criterios de reclutamiento']]]},
  {d:'CU2',n:'Técnicas',q:'¿Qué técnicas cualitativas se usan?',lvl:'E',g:[
   ['Técnicas usadas',['Sesiones de grupo|a','Entrevistas en profundidad|a','Etnografía y observación|a','Diarios de usuario|a','Comunidades en línea|a']],
   ['Moderación',['Guía de tópicos','Moderador responsable','Material de estímulo']]]},
  {d:'CU3',n:'Hallazgos',q:'¿Qué dicen los clientes?',lvl:'C',g:[
   ['Motivaciones y barreras',['Motivaciones principales','Barreras principales','Necesidades no cubiertas']],
   ['Verbatims',['Frases representativas','Contradicciones entre discurso y conducta','Insights emergentes']]]}]},
 {c:'SEM',n:'Semiótica',src:'P',desc:'Qué comunican la marca, el empaque y la comunicación, y qué códigos dominan la categoría.',dims:[
  {d:'SE1',n:'Códigos de marca',q:'¿Qué códigos usa la marca para comunicarse?',lvl:'E',g:[
   ['Identidad visual',['Colores y paleta','Tipografía','Logotipo y símbolos','Estilo gráfico']],
   ['Identidad verbal',['Nombre de marca','Tono de voz','Eslogan y mensajes clave']]]},
  {d:'SE2',n:'Empaque y producto',q:'¿Qué dice el empaque del producto?',lvl:'P',g:[
   ['Empaque',['Forma y formato','Materiales y texturas','Jerarquía visual en anaquel','Información en el empaque']],
   ['Señales',['Señales de calidad','Señales de precio','Señales de categoría']]]},
  {d:'SE3',n:'Códigos de la categoría',q:'¿Qué códigos dominan la categoría?',lvl:'E',g:[
   ['Códigos',['Códigos dominantes en la categoría','Códigos emergentes','Códigos residuales']],
   ['Narrativa',['Relato de marca','Personajes y arquetipos','Contexto cultural de la comunicación']]]}]},
 {c:'SEN',n:'Ciencia sensorial',src:'P',desc:'Cómo se percibe el producto con los sentidos: paneles entrenados, perfil sensorial, preferencia y estabilidad.',dims:[
  {d:'CS1',n:'Panel y protocolo',q:'¿Cómo se evalúa sensorialmente el producto?',lvl:'E',g:[
   ['Panel',['Tipo de panel (entrenado o consumidores)','Tamaño del panel|n','Frecuencia de evaluación']],
   ['Protocolo',['Método de evaluación','Escala utilizada','Condiciones de prueba']]]},
  {d:'CS2',n:'Perfil sensorial',q:'¿Cómo es el producto a los sentidos?',lvl:'P',g:[
   ['Atributos',['Apariencia','Aroma','Sabor','Textura','Sonido','Persistencia o retrogusto']],
   ['Intensidad',['Intensidad de atributos clave','Atributos diferenciadores','Defectos o notas fuera de perfil']]]},
  {d:'CS3',n:'Preferencia sensorial',q:'¿Qué tanto gusta el producto y por qué?',lvl:'P',g:[
   ['Aceptación',['Agrado global|e','Intención de compra tras probar|e','Preferencia frente a competidor|c=Inferior/Paridad/Superior']],
   ['Drivers',['Atributos que impulsan el agrado','Atributos que penalizan','Segmentos por preferencia']]]},
  {d:'CS4',n:'Estabilidad',q:'¿Se mantiene la calidad sensorial en el tiempo?',lvl:'P',g:[
   ['Vida útil',['Cambio sensorial durante la vida útil','Punto de rechazo','Condiciones de almacenamiento']],
   ['Consistencia',['Variación entre lotes','Desviación frente al estándar']]]}]},
 {c:'ECO',n:'Economía',src:'I',desc:'Estructura del mercado, demanda, costos y entorno macroeconómico: elasticidades, competencia y variables que mueven el negocio.',dims:[
  {d:'EC1',n:'Estructura de mercado',q:'¿Cómo está estructurado el mercado en que compite la empresa?',lvl:'E',s:'X',g:[
   ['Competencia',['Tipo de mercado|c=Competencia perfecta/Competencia monopolística/Oligopolio/Monopolio','Número de competidores relevantes|n','Concentración del mercado','Barreras de entrada','Poder de negociación de proveedores','Poder de negociación de compradores']],
   ['Sustitución',['Productos sustitutos','Productos complementarios','Costos de cambio del cliente']]]},
  {d:'EC2',n:'Demanda',q:'¿Cómo responde la demanda al precio, al ingreso y al tiempo?',lvl:'P',g:[
   ['Elasticidades',['Elasticidad precio de la demanda|n','Elasticidad ingreso|n','Elasticidad cruzada|n']],
   ['Tendencia',['Demanda actual|n','Crecimiento de la demanda|p','Estacionalidad']]]},
  {d:'EC3',n:'Oferta y costos',q:'¿Cuánto cuesta producir y cuánto se puede producir?',lvl:'P',g:[
   ['Costos',['Costo fijo|n','Costo variable unitario|n','Costo marginal|n','Economías de escala']],
   ['Capacidad',['Capacidad instalada|n','Utilización de la capacidad|p']]]},
  {d:'EC4',n:'Entorno macroeconómico',q:'¿Qué variables macroeconómicas afectan a la empresa?',lvl:'E',s:'X',g:[
   ['Indicadores',['Crecimiento del PIB|p','Inflación|p','Tipo de cambio|n','Tasa de interés|p','Empleo y salarios','Confianza del consumidor|n']],
   ['Política y regulación',['Política fiscal y aranceles','Regulación sectorial','Riesgo país']]]}]},
 {c:'DAT',n:'Estadística y ciencia de datos',src:'I',desc:'Qué datos hay, qué modelos se usan y qué resultados dan: calidad de los datos, pronósticos y variables que explican.',dims:[
  {d:'DA1',n:'Datos disponibles',q:'¿Con qué datos cuenta la empresa?',lvl:'E',g:[
   ['Fuentes',['Fuentes internas de datos','Fuentes externas de datos','Datos propios de clientes','Frecuencia de actualización']],
   ['Calidad',['Completitud de los datos|p','Consistencia entre fuentes','Historial disponible (periodos)|n']]]},
  {d:'DA2',n:'Modelos',q:'¿Qué modelos se usan y cómo se validan?',lvl:'E',g:[
   ['En uso',['Modelos descriptivos|a','Modelos predictivos|a','Modelos de segmentación|a','Modelos de atribución|a','Marketing mix modeling|a']],
   ['Validación',['Métrica de desempeño','Criterios de aceptación','Frecuencia de reentrenamiento']]]},
  {d:'DA3',n:'Resultados',q:'¿Qué dicen los modelos?',lvl:'P',g:[
   ['Pronóstico',['Pronóstico de demanda|n','Error del pronóstico|p','Intervalo de confianza']],
   ['Explicación',['Variables más influyentes','Relaciones encontradas','Hallazgos pendientes de validar']]]}]},
 {c:'RBI',n:'Retail y business intelligence',src:'I',desc:'Cómo se ve el producto en el punto de venta, cómo se mueve el sell-in y sell-out y qué tableros usa la empresa.',dims:[
  {d:'RB1',n:'Punto de venta',q:'¿Cómo se ejecuta el producto donde se compra?',lvl:'P',g:[
   ['Auditoría',['Disponibilidad en anaquel|p','Participación en anaquel|p','Cumplimiento de planograma|p','Material POP','Precio exhibido|n']],
   ['Formatos',['Desempeño por formato de tienda','Rotación por punto de venta|n']]]},
  {d:'RB2',n:'Sell-in y sell-out',q:'¿Cómo se mueve el producto en el canal?',lvl:'P',g:[
   ['Ventas',['Sell-in|n','Sell-out|n','Inventario en canal|n','Días de inventario|n']],
   ['Promoción',['Ventas en promoción','Efecto de la promoción|p']]]},
  {d:'RB3',n:'Tableros',q:'¿Qué tableros y reportes se usan?',lvl:'E',g:[
   ['Inteligencia de negocio',['Tableros en uso','Indicadores clave monitoreados','Frecuencia de revisión','Responsable de los tableros']],
   ['Integración',['Fuentes conectadas','Automatización de reportes']]]}]},
 {c:'SLI',n:'Social listening',src:'X',desc:'Qué se dice de la marca y la categoría en redes, foros y medios: volumen, sentimiento, temas y voces.',dims:[
  {d:'SL1',n:'Conversación',q:'¿Cuánto y cómo se habla de la marca?',lvl:'E',g:[
   ['Volumen',['Menciones totales|n','Alcance potencial|n','Crecimiento de menciones|p','Picos de conversación']],
   ['Sentimiento',['Sentimiento positivo|p','Sentimiento negativo|p','Emociones dominantes']]]},
  {d:'SL2',n:'Temas y voces',q:'¿De qué se habla y quién habla?',lvl:'E',g:[
   ['Temas',['Temas principales','Temas emergentes','Quejas frecuentes']],
   ['Voces',['Influenciadores clave','Comunidades activas','Share of voice|p']]]},
  {d:'SL3',n:'Plataformas',q:'¿Dónde ocurre la conversación y cómo responde la marca?',lvl:'E',g:[
   ['Dónde ocurre',['Redes con más conversación','Foros y reseñas','Medios y noticias']],
   ['Respuesta',['Tiempo de respuesta de la marca|n','Gestión de crisis']]]}]},
 {c:'PSI',n:'Psicología del consumidor',src:'P',desc:'Cómo percibe, siente, recuerda y decide el cliente. Reúne varias ramas: percepción y atención, motivación y emoción, aprendizaje y memoria, decisión de compra, actitudes y personalidad, y neuromarketing.',dims:[
  {d:'NM1',n:'Neuromarketing',q:'¿Qué muestran las medidas implícitas y la simulación ante el producto?',lvl:'P',g:[
   ['Atención',['Seguimiento ocular','Tiempo de fijación|n','Mapas de calor']],
   ['Emoción',['Valencia emocional','Activación (arousal)','Expresión facial','Respuesta electrodérmica']],
   ['Memoria',['Recuerdo implícito','Asociaciones implícitas']],
   ['Realidad aumentada',['Simulación de anaquel','Prototipo virtual de producto','Prueba de empaque en realidad aumentada']],
   ['Resultados',['Tasa de selección en anaquel simulado|p','Tiempo hasta la elección|n','Diferencia entre lo dicho y lo medido']]]}]},
 {c:'FIN',n:'Finanzas',src:'I',desc:'Resultados, liquidez, rentabilidad y economía por unidad y por cliente: lo que se debe saber de cada empresa en términos financieros.',dims:[
  {d:'FI1',n:'Resultados',q:'¿Cuáles son los resultados financieros de la empresa?',lvl:'E',g:[
   ['Estado de resultados',['Ingresos totales|n','Costo de ventas|n','Utilidad bruta|n','Gastos de operación|n','EBITDA|n','Utilidad neta|n']],
   ['Márgenes',['Margen bruto|p','Margen EBITDA|p','Margen neto|p']]]},
  {d:'FI2',n:'Balance y liquidez',q:'¿Qué tan sólida y líquida es la empresa?',lvl:'E',g:[
   ['Liquidez',['Efectivo disponible|n','Razón circulante|n','Capital de trabajo|n','Días de cobro|n','Días de pago|n']],
   ['Estructura',['Activos totales|n','Deuda total|n','Apalancamiento|n','Capital contable|n']]]},
  {d:'FI3',n:'Rentabilidad y valor',q:'¿Qué tan rentable es y cuánto vale?',lvl:'E',g:[
   ['Rentabilidad',['ROE|p','ROA|p','ROIC|p','Retorno de la inversión en marketing|n']],
   ['Valor',['Costo de capital (WACC)|p','Valuación de la empresa|n','Flujo de caja libre|n']]]},
  {d:'FI4',n:'Economía del producto',q:'¿Cuánto deja cada unidad del producto?',lvl:'P',g:[
   ['Unit economics',['Ingreso por unidad|n','Costo por unidad|n','Margen por unidad|p','Punto de equilibrio|n']]]},
  {d:'FI5',n:'Economía del cliente',q:'¿Cuánto cuesta ganar al cliente y cuánto vale?',lvl:'C',g:[
   ['Valor del cliente',['Costo de adquisición (CAC)|n','Valor de vida del cliente (LTV)|n','Relación LTV/CAC|n','Periodo de recuperación del CAC|n']]]},
  {d:'FI6',n:'Planeación financiera',q:'¿Qué presupuesto y proyección tiene la empresa?',lvl:'E',g:[
   ['Presupuesto',['Presupuesto anual|n','Presupuesto de marketing|n','Desviación vs presupuesto|p']],
   ['Proyección',['Ingresos proyectados|n','Escenarios financieros','Riesgos financieros principales']]]}]},
 {c:'GES',n:'Gestión del negocio',src:'I',desc:'Modelo de negocio, estrategia y desempeño: cómo se dirige la empresa y cómo se mide.',dims:[
  {d:'GN1',n:'Modelo de negocio',q:'¿Cómo crea y captura valor la empresa?',lvl:'E',g:[
   ['Propuesta de valor',['Propuesta de valor','Segmentos atendidos','Fuentes de ingreso']],
   ['Operación',['Actividades clave','Recursos clave','Alianzas clave','Estructura de costos']]]},
  {d:'GN2',n:'Estrategia',q:'¿Hacia dónde va la empresa?',lvl:'E',g:[
   ['Dirección',['Visión y objetivos','Prioridades del año','Ventajas competitivas']],
   ['Riesgos',['Riesgos principales','Dependencias críticas','Plan de contingencia']]]},
  {d:'GN3',n:'Desempeño',q:'¿Cómo se mide y se dirige el desempeño?',lvl:'E',g:[
   ['Indicadores',['Indicadores clave del negocio','Metas del periodo','Avance contra metas|p']],
   ['Organización',['Estructura del equipo','Responsables por área','Ritmo de revisión']]]}]}
];
function parseVar(s){
  const i=s.indexOf('|');if(i<0) return {nombre:s,tipo:'t'};
  const nm=s.slice(0,i),tp=s.slice(i+1);
  if(tp==='a') return {nombre:nm,tipo:'c',opts:ADOPT};
  if(tp.startsWith('c=')) return {nombre:nm,tipo:'c',opts:tp.slice(2).split('/')};
  return {nombre:nm,tipo:tp};
}
(function(){
  let k=400;
  CORR_DEF.forEach(C=>C.dims.forEach(D=>{
    DIMS[D.d]=D.n;DIMQ[D.d]=D.q;
    D.g.forEach(([gname,names],gi)=>names.forEach(s=>{
      k++;const pv=parseVar(s);
      VARS_BASE.push({id:'VAR-'+k,dim:D.d,nombre:pv.nombre,nivel:D.lvl,fuente:D.s||C.src,tipo:pv.tipo,q:mktQ(pv.nombre,pv.tipo,pv.opts,D.lvl),guia:GUIA[D.d+'|'+gname]||null,hint:D.n+' › '+gname,opts:pv.opts||null,sat:C.c,grupo:gname,gi});
    }));
  }));
})();

const EXTRA_DEF=[
 {c:'PSI',dims:[
  {d:'PC1',n:'Percepción y atención',q:'¿Qué percibe y a qué le presta atención el cliente?',lvl:'C',g:[
   ['Atención',['Qué capta primero su atención','Saliencia de la marca','Distractores en el momento de compra']],
   ['Percepción',['Percepción de calidad','Percepción de precio','Percepción de valor','Percepción de la marca frente a la competencia']]]},
  {d:'PC2',n:'Motivación y emoción',q:'¿Qué mueve al cliente y qué siente?',lvl:'C',g:[
   ['Motivaciones',['Necesidades que busca cubrir','Motivos funcionales','Motivos emocionales','Motivos sociales']],
   ['Emociones',['Emociones al comprar','Emociones al usar','Emociones después de la compra']]]},
  {d:'PC3',n:'Aprendizaje y memoria',q:'¿Qué recuerda el cliente y cómo aprende a comprar?',lvl:'C',g:[
   ['Memoria de marca',['Recordación espontánea|p','Recordación asistida|p','Asociaciones de marca']],
   ['Hábito y aprendizaje',['Hábitos de compra','Lealtad por costumbre','Curva de aprendizaje del producto']]]},
  {d:'PC4',n:'Decisión de compra',q:'¿Cómo decide el cliente?',lvl:'C',g:[
   ['Proceso de decisión',['Reconocimiento de la necesidad','Búsqueda de información','Evaluación de alternativas','Momento de compra','Experiencia poscompra']],
   ['Heurísticas y sesgos',['Heurísticas más usadas','Sesgos relevantes (anclaje, escasez, prueba social)','Riesgo percibido','Esfuerzo de decisión']]]},
  {d:'PC5',n:'Actitudes y personalidad',q:'¿Qué piensa el cliente y cómo es?',lvl:'C',g:[
   ['Actitudes',['Actitud hacia la marca','Actitud hacia la categoría','Intención de compra|e']],
   ['Personalidad y estilo de vida',['Rasgos de personalidad típicos','Estilo de vida','Valores personales']]]}]}
];
(function(){
  let k=0;
  VARS_BASE.forEach(v=>{const m=/^VAR-(\d+)$/.exec(v.id);if(m&&+m[1]>=400) k=Math.max(k,+m[1]);});
  EXTRA_DEF.forEach(C=>C.dims.forEach(D=>{
    DIMS[D.d]=D.n;DIMQ[D.d]=D.q;
    D.g.forEach(([gname,names],gi)=>names.forEach(s=>{
      k++;const pv=parseVar(s);
      VARS_BASE.push({id:'VAR-'+k,dim:D.d,nombre:pv.nombre,nivel:D.lvl,fuente:'P',tipo:pv.tipo,q:mktQ(pv.nombre,pv.tipo,pv.opts,D.lvl),guia:GUIA[D.d+'|'+gname]||null,hint:D.n+' › '+gname,opts:pv.opts||null,sat:C.c,grupo:gname,gi});
    }));
  }));
})();

const SATS={
 MER:{id:'sat:MER',nombre:'Análisis de mercado',dims:'ABCDEFGHIJKL'.split('').concat(MKT_DEF.map(D=>D.d)),desc:'Lo que se debe saber de cada empresa para analizar su mercado: categoría, cliente, shopper, producto, marca, precio, canal, comunicación, competencia, modelación, innovación y planeación. Incluye todo lo de marketing: organización, oferta, audiencia, medios, canales, plataformas, áreas, ciclo de vida, contenido, origen, contacto y métricas.'}
};
CORR_DEF.forEach(C=>{SATS[C.c]={id:'sat:'+C.c,nombre:C.n,dims:C.dims.map(D=>D.d),desc:C.desc};});
EXTRA_DEF.forEach(E=>{SATS[E.c].dims=E.dims.map(D=>D.d).concat(SATS[E.c].dims);});
DIMS.IM='Importados por categorizar';DIMQ.IM='Información que llegó en archivos y aún no tiene un área definitiva.';SATS.MER.dims.push('IM');
const DIMSAT={};
Object.keys(SATS).forEach(k=>SATS[k].dims.forEach(d=>{DIMSAT[d]=k;}));
const SATCOL='#FF9F68';
const DIMCOL={A:'#F29ABD',B:'#F7C548',C:'#8FD18F',D:'#6CB4F2',E:'#B79CF2',F:'#F2A65A',G:'#6DD0C4',H:'#E9E36B',I:'#9AA5F2',J:'#F2B8E0',K:'#A5D86E',L:'#F29A76',
 N:'#E57373',O:'#BA68C8',Q:'#7986CB',R:'#4FC3F7',S:'#4DB6AC',T:'#AED581',U:'#FFD54F',V:'#FF8A65',W:'#A1887F',X:'#90A4AE',Y:'#F48FB1',Z:'#CE93D8'};
const SIMVARS=['Modelo de venta','Estado de la relación','Industria','Tamaño de empresa','Región','Puesto del decisor'].map(n=>VARS_BASE.find(v=>v.nombre===n)).filter(Boolean).map(v=>v.id);
const satOf=v=>v.sat||DIMSAT[v.dim]||'MER';
const SATHUE={ANT:20,SOC:45,CUA:95,SEM:150,SEN:175,ECO:200,DAT:225,RBI:250,SLI:275,PSI:300,FIN:330,GES:350};
const _dc={};
function dimColor(d){
  if(DIMCOL[d]) return DIMCOL[d];
  if(_dc[d]) return _dc[d];
  const k=DIMSAT[d],base=SATHUE[k]!=null?SATHUE[k]:210,idx=Math.max(0,(SATS[k]?SATS[k].dims:[]).indexOf(d));
  return _dc[d]=d3.hsl((base+idx*9)%360,.62,.66).formatHex();
}
function groupsOf(arr){
  const m=new Map();
  arr.forEach(v=>{const k=v.gi!=null?v.gi:99;if(!m.has(k))m.set(k,[v.grupo||'Variables nuevas',k,[]]);m.get(k)[2].push(v);});
  return [...m.values()].sort((a,b)=>a[1]-b[1]);
}
function applicableNodes(v){
  const T={E:'EMP',P:'PRD',C:'CLI'}[v.nivel];
  return nodesOf(T).filter(n=>{const e=empOfNode(n);return !v.emp||(e&&e.id===v.emp);});
}
function varCoverage(v){const ns=applicableNodes(v);return {done:ns.filter(n=>hasObs(n.id,v.id)).length,total:ns.length,nodes:ns};}
function varsCoverage(vs){let done=0,total=0;vs.forEach(v=>{const c=varCoverage(v);done+=c.done;total+=c.total;});return {done,total,frac:total?done/total:0};}

/* ---- empresa nueva: el perfil del cliente es la dimensión Audiencia ---- */
async function createEmpresa(f){
  const wait=say('Registrando la empresa…');
  try{
    let grp=nodesOf('GRP')[0];
    if(!grp){
      const gid=await mintId('GRP',4);
      grp={id:gid,tipo:'GRP',nombre:'Grupo Tama',padre:null,estado:'activo',alias:[],creado:nowIso(),por:S.uid||null};
      await put('nodes',gid,grp);
    }
    const id=await mintId('EMP',4);
    const node={id,tipo:'EMP',nombre:f.nombre,padre:grp.id,estado:'activo',alias:[],
      ficha:{industria:f.industria,categoria:f.categoria,mercado_geo:f.geo,pregunta:f.pregunta,decision:f.decision,fuentes:f.fuentes||''},
      creado:nowIso(),por:S.uid||null};
    await put('nodes',id,node);
    const cli=await ensureCli(node,f.persona||'');
    wait.remove();
    S.ctx.emp=id;S.ctx.prd=null;renderPath();
    bubble('bot',el('div',{class:'receipt'},tagEl(id),el('span',{text:'empresa creada · pertenece a'}),tagEl(grp.id)));
    bubble('bot',el('div',{class:'receipt'},tagEl(cli.id),el('span',{text:'cliente (buyer persona) creado · pertenece a'}),tagEl(id)));
    say('Antes de los productos, armemos el perfil del cliente: su audiencia. Son pocas preguntas y sirven de base para todo lo demás.');
    S.dimMode='Q';S.phase=null;S.queue=buildQueue({dim:'Q'});S.then=()=>choosePrd(node);S.thenMsg='Perfil listo. Ahora los productos.';
    askVar();
  }catch(e){
    wait.remove();say('No se pudo registrar la empresa: '+msgOf(e)+'. Revisa que tengas permiso de edición en este artefacto.');
    chooseEmpresa();
  }
}

/* ===================== Grafo: satélites + instancias por empresa ===================== */
function gData(){
  const nodes=[],links=[];
  const gn=nodesOf('GRP')[0],gid=gn?gn.id:'GRP*';
  nodes.push({id:gid,kind:'grp',label:gn?gn.nombre:'Grupo Tama',ref:gn?gn.id:null,r:20,rad:0,rs:.12});
  /* satélites: la estructura vive aquí */
  Object.keys(SATS).forEach(k=>{
    const s=SATS[k];
    nodes.push({id:s.id,kind:'sat',sat:k,label:s.nombre,r:15,rad:250,rs:.05});
    links.push({s:gid,t:s.id,type:'own',dist:120,str:.5});
    if(!GR.open.has(s.id)) return;
    s.dims.forEach(d=>{
      const vs=allVars().filter(v=>v.dim===d&&satOf(v)===k);if(!vs.length) return;
      const aid=s.id+'~'+d,cov=varsCoverage(vs);
      nodes.push({id:aid,kind:'tarea',dim:d,sat:k,label:DIMS[d],parent:s.id,r:9,total:vs.length,frac:cov.frac});
      links.push({s:s.id,t:aid,type:'branch',dist:92,str:.8});
      if(!GR.open.has(aid)) return;
      groupsOf(vs).forEach(([gname,gi,arr])=>{
        const g2=aid+'~g'+gi,c2=varsCoverage(arr);
        nodes.push({id:g2,kind:'tgrp',dim:d,sat:k,gi,label:gname,parent:aid,r:6,total:arr.length,frac:c2.frac});
        links.push({s:aid,t:g2,type:'branch',dist:64,str:.8});
        if(!GR.open.has(g2)) return;
        arr.forEach(v=>{
          nodes.push({id:g2+'~'+v.id,kind:'tvar',vid:v.id,dim:d,sat:k,label:v.nombre,parent:g2,r:4.5});
          links.push({s:g2,t:g2+'~'+v.id,type:'branch',dist:36,str:.9});
        });
      });
    });
  });
  /* empresas, clientes y productos, con su información */
  const clis=[];
  nodesOf('EMP').forEach(e=>{
    const idxA=getIdx(),hasAny=id=>!!idxA[id];
    const empPend=!empNodes(e).some(n=>hasAny(n.id));
    nodes.push({id:e.id,kind:'emp',label:e.nombre+(empPend?' · por capturar':''),ref:e.id,r:17,rad:430,rs:.05,pend:empPend});
    links.push({s:gid,t:e.id,type:'own',dist:170,str:.5});
    clisOf(e.id).forEach(c=>{
      nodes.push({id:c.id,kind:'cli',label:'Cliente · '+segLabel(c),ref:c.id,parent:e.id,r:14,pend:!hasAny(c.id)});
      links.push({s:e.id,t:c.id,type:'own',dist:84,str:.7});clis.push(c);
    });
    nodesOf('PRD').filter(p=>p.padre===e.id).forEach(p=>{
      nodes.push({id:p.id,kind:'prd',label:p.nombre,ref:p.id,parent:e.id,r:13,pend:!hasAny(p.id)});
      links.push({s:e.id,t:p.id,type:'own',dist:84,str:.7});
    });
    if(GR.open.has(e.id)){
      nodesOf('HAL').filter(h=>h.padre===e.id).forEach(h=>{
        nodes.push({id:h.id,kind:'hal',label:h.nombre,ref:h.id,parent:e.id,r:8});
        links.push({s:e.id,t:h.id,type:'branch',dist:86,str:.8});
        nodesOf('SUG').filter(s=>s.padre===h.id).forEach(s=>{
          nodes.push({id:s.id,kind:'sug',label:s.nombre,ref:s.id,parent:h.id,r:6});
          links.push({s:h.id,t:s.id,type:'branch',dist:50,str:.9});
        });
      });
      nodesOf('SUG').filter(s=>s.padre===e.id).forEach(s=>{
        nodes.push({id:s.id,kind:'sug',label:s.nombre,ref:s.id,parent:e.id,r:6});
        links.push({s:e.id,t:s.id,type:'branch',dist:70,str:.8});
      });
    }
  });
  const bigs=nodes.filter(n=>n.kind==='emp'||n.kind==='cli'||n.kind==='prd');
  bigs.forEach(b=>{
    if(!GR.open.has(b.id)) return;
    const node=S.nodes[b.id],vsAll=varsFor(node);
    Object.keys(SATS).forEach(k=>{
      const vs=vsAll.filter(v=>satOf(v)===k),cdone=vs.filter(v=>hasObs(b.id,v.id)).length,cid=b.id+'~'+k;
      nodes.push({id:cid,kind:'corr',sat:k,label:SATS[k].nombre,parent:b.id,ref:b.id,r:10,done:cdone,total:vs.length,pend:cdone===0});
      links.push({s:b.id,t:cid,type:'branch',dist:96,str:.7});
      if(!GR.open.has(cid)||!vs.length) return;
      const by={};vs.forEach(v=>{(by[v.dim]||(by[v.dim]=[])).push(v);});
      SATS[k].dims.forEach(d=>{
        const arr=by[d];if(!arr) return;
        const aid=cid+'~'+d,done=arr.filter(v=>hasObs(b.id,v.id)).length;
        nodes.push({id:aid,kind:'area',dim:d,label:DIMS[d],parent:cid,ref:b.id,r:8,done,total:arr.length});
        links.push({s:cid,t:aid,type:'branch',dist:76,str:.8});
        if(!GR.open.has(aid)) return;
        groupsOf(arr).forEach(([gname,gi,garr])=>{
          const g2=aid+'~g'+gi,gd=garr.filter(v=>hasObs(b.id,v.id)).length;
          nodes.push({id:g2,kind:'grp2',dim:d,gi,label:gname,parent:aid,ref:b.id,r:6,done:gd,total:garr.length});
          links.push({s:aid,t:g2,type:'branch',dist:60,str:.8});
          if(!GR.open.has(g2)) return;
          garr.forEach(v=>{
            const st=varState(b.id,v.id);
            if(GR.onlyCap&&st==='pend') return;
            nodes.push({id:g2+'~'+v.id,kind:'var',vid:v.id,dim:d,label:v.nombre,parent:g2,ref:b.id,state:st,r:5});
            links.push({s:g2,t:g2+'~'+v.id,type:'branch',dist:34,str:.9});
          });
        });
      });
    });
  });
  for(let i=0;i<clis.length;i++)for(let j=i+1;j<clis.length;j++){
    const m=cliMatches(clis[i],clis[j]);
    if(m.length>=2) links.push({s:clis[i].id,t:clis[j].id,type:'sim',dist:240,str:.03,matches:m});
  }
  return {nodes,links};
}
function gStyle(){
  GR.gN.selectAll('g.gn').each(function(d){
    const g=d3.select(this),col=d.dim?dimColor(d.dim):null;
    let fill=BIGCOL,stroke='rgba(255,255,255,.3)',sw=1,op=1,dash=null;
    if(d.kind==='cli') fill=CLICOL;
    else if(d.kind==='sat'||d.kind==='corr') fill=SATCOL;
    else if(d.kind==='area'){fill=col;op=d.done?1:.45;}
    else if(d.kind==='grp2'){fill=col;op=d.done?.9:.4;}
    else if(d.kind==='tarea'){fill=col;op=.55+.45*(d.frac||0);dash='3 2';}
    else if(d.kind==='tgrp'){fill=col;op=.5+.4*(d.frac||0);dash='3 2';}
    else if(d.kind==='tvar'){fill='#352B6D';stroke=col;sw=1.5;dash='2 2';}
    else if(d.kind==='hal') fill='#FF6B9A';
    else if(d.kind==='sug') fill='#FFD479';
    else if(d.kind==='var'){
      if(d.state==='cap') fill=col;
      else if(d.state==='na') fill='#5A626D';
      else{fill='#352B6D';stroke=col;sw=1.5;}
    }
    if(d.pend){op=.42;dash='3 3';}
    if(GR.open.has(d.id)){stroke='#FFFFFF';sw=2.5;}
    if(GR.sel===d.id){stroke='#FFD479';sw=3;}
    g.select('circle').attr('r',d.r).attr('fill',fill).attr('stroke',stroke).attr('stroke-width',sw).attr('opacity',op).attr('stroke-dasharray',dash);
    const show=(d.kind!=='var'&&d.kind!=='tvar')||GR.sel===d.id;
    g.select('text').attr('class','gt '+d.kind).attr('y',d.r+13).text(show?(d.label.length>(d.pend?44:28)?d.label.slice(0,(d.pend?43:27))+'…':d.label):'');
  });
}
const EXPANDABLE=new Set(['emp','cli','prd','corr','area','grp2','sat','tarea','tgrp']);
function gClick(d){
  GR.sel=d.id;
  if(EXPANDABLE.has(d.kind)){
    if(GR.open.has(d.id)){
      GR.open.delete(d.id);
      [...GR.open].forEach(k=>{if(k.startsWith(d.id+'~'))GR.open.delete(k);});
    }else GR.open.add(d.id);
  }
  gRefresh();gPanel();
}
function gOpenAll(){
  Object.values(SATS).forEach(s=>GR.open.add(s.id));
  ['EMP','CLI','PRD'].forEach(t=>nodesOf(t).forEach(n=>GR.open.add(n.id)));
  gRefresh();
}
function gotoVar(nodeKey,d,gi,v){
  GR.open.add(d.id);GR.open.add(d.id+'~g'+gi);GR.sel=d.id+'~g'+gi+'~'+v.id;
  gRefresh();gPanel();
}
function varChip(v,st,fn){
  return el('button',{type:'button',class:'chip '+(st==='cap'?'on':st==='na'?'na':''),onclick:fn,text:v.nombre});
}
function gPanel(){
  const p=$('#gpanel');
  const d=GR.sel&&GR.map.get(GR.sel);
  if(!d){p.hidden=true;p.replaceChildren();return;}
  p.hidden=false;
  const close=el('button',{class:'x',type:'button','aria-label':'Cerrar ficha',onclick:()=>{GR.sel=null;gStyle();gPanel();},text:'×'});
  const kids=[close];
  const node=d.ref?S.nodes[d.ref]:null;
  const capBtn=(label,fn)=>el('div',{class:'ctrls'},el('button',{class:'btn main',type:'button',onclick:fn,text:label}));
  if(d.kind==='grp'){
    kids.push(el('div',{class:'eyebrow',text:'Grupo'}),el('h2',{text:d.label}));
    if(d.ref) kids.push(el('p',{class:'mono',text:d.ref}));
    kids.push(el('p',{text:'Raíz del grafo. De aquí cuelgan las empresas y los dos satélites con la estructura de variables.'}),
      el('p',{class:'mono',text:nodesOf('EMP').length+' empresas · '+Object.keys(S.obs).length+' observaciones'}));
  }else if(d.kind==='sat'){
    const S_=SATS[d.sat],vs=allVars().filter(v=>satOf(v)===d.sat),cov=varsCoverage(vs);
    kids.push(el('div',{class:'eyebrow',text:'Satélite · plantilla'}),el('h2',{text:S_.nombre}),el('p',{text:S_.desc}),
      el('p',{class:'mono',text:S_.dims.filter(x=>vs.some(v=>v.dim===x)).length+' áreas · '+vs.length+' variables'}),
      el('p',{class:'mono',text:cov.total?cov.done+' de '+cov.total+' datos capturados en las empresas':'Todavía no hay empresas que llenen esta estructura'}),
      el('p',{class:'empty',text:'Aquí vive la estructura. Cada empresa tiene sus propios nodos con su información, siguiendo estas mismas áreas.'}));
  }else if(d.kind==='tarea'){
    const vs=allVars().filter(v=>v.dim===d.dim&&satOf(v)===d.sat),cov=varsCoverage(vs);
    const niv=[...new Set(vs.map(v=>NIVELES[v.nivel]))].join(' y ');
    kids.push(el('div',{class:'eyebrow',text:'Área de '+SATS[d.sat].nombre}),el('h2',{text:DIMS[d.dim]}),el('p',{text:DIMQ[d.dim]||''}),
      el('p',{class:'mono',text:vs.length+' variables · se llena en: '+niv}),
      el('p',{class:'mono',text:cov.total?cov.done+' de '+cov.total+' datos capturados':'Sin empresas todavía'}),
      ...groupsOf(vs).map(([gname,gi,arr])=>el('div',{class:'grp'},el('b',{style:'font-size:13px',text:gname+' · '+arr.length}),
        el('div',{class:'chips'},...arr.map(v=>varChip(v,'pend',()=>gotoVar(null,d,gi,v)))))));
  }else if(d.kind==='tgrp'){
    const vs=allVars().filter(v=>v.dim===d.dim&&satOf(v)===d.sat&&(v.gi!=null?v.gi:99)===d.gi);
    const par=GR.map.get(d.parent);
    kids.push(el('div',{class:'eyebrow',text:'Bloque · '+DIMS[d.dim]}),el('h2',{text:d.label}),
      el('p',{class:'mono',text:vs.length+' variables'}),
      el('div',{class:'chips'},...vs.map(v=>varChip(v,'pend',()=>{GR.open.add(d.id);GR.sel=d.id+'~'+v.id;gRefresh();gPanel();}))));
  }else if(d.kind==='tvar'){
    const v=varById(d.vid),cov=varCoverage(v);
    const filled=cov.nodes.map(n=>({n,r:latest(n.id,v.id)})).filter(x=>x.r);
    kids.push(el('div',{class:'eyebrow',text:'Variable · '+v.id}),el('h2',{text:v.nombre}),el('p',{text:v.q}),v.guia?el('p',{class:'mono',text:'Cómo responder: '+v.guia}):null,
      el('div',{class:'formgrid'},row('Área',DIMS[v.dim]),row('Bloque',v.grupo||'Variables nuevas'),row('Se llena en',NIVELES[v.nivel]),row('Fuente habitual',FUENTES[v.fuente]),row('Tipo de respuesta',TIPOS[v.tipo])),
      el('p',{class:'mono',text:cov.total?'Capturada en '+cov.done+' de '+cov.total+(cov.total===1?' nodo':' nodos'):'Todavía no hay nodos de este nivel'}));
    if(filled.length) kids.push(el('div',{class:'grp'},el('b',{style:'font-size:13px',text:'Valores por nodo'}),
      ...filled.slice(0,8).map(x=>el('p',{class:'mono',text:x.n.nombre+': '+showVal(x.r)}))));
  }else if(d.kind==='emp'){
    const f=node.ficha||{};
    kids.push(el('div',{class:'eyebrow',text:'Empresa'}),el('h2',{text:node.nombre}),el('p',{class:'mono',text:node.id}),
      el('div',{class:'formgrid'},row('Industria',f.industria),row('Categoría',f.categoria),row('Mercado',f.mercado_geo),row('Pregunta de negocio',f.pregunta),row('Decisión',f.decision),row('Fuentes',f.fuentes)),
      covLine(node),
      d.pend?el('p',{class:'impmsg warn',style:'margin:0',text:'Por capturar: todavía no tiene datos. Llénala desde el chat.'}):null,
      el('p',{class:'empty',text:GR.open.has(d.id)?'Abierta: toca una corriente para ver sus áreas.':'Toca el nodo para abrir sus corrientes.'}),
      capBtn('Capturar en el chat',()=>captureNode(node.id)));
  }else if(d.kind==='prd'){
    kids.push(el('div',{class:'eyebrow',text:'Producto'}),el('h2',{text:node.nombre}),el('p',{class:'mono',text:node.id}),
      el('p',{text:'Etapa: '+(node.etapa||'—')+(node.etapa_evidencia?' · '+node.etapa_evidencia:'')}),covLine(node),
      capBtn('Capturar en el chat',()=>captureNode(node.id)));
  }else if(d.kind==='cli'){
    kids.push(el('div',{class:'eyebrow',text:'Cliente · buyer persona'}),el('h2',{text:segName(node)}),el('p',{class:'mono',text:node.id}),
      el('div',{class:'formgrid'},row('Tipo de cliente',node.tipoCliente||'por definir'),row('Estrategia',node.estrategia||'por definir')));
    if(node.descripcion) kids.push(el('p',{text:node.descripcion}));
    const prof=varsFor(node).filter(v=>v.dim==='Q').map(v=>{const r=latest(node.id,v.id);return row(v.nombre,r?showVal(r):'');});
    kids.push(el('div',{class:'formgrid'},...prof),covLine(node));
    const sims=GR.links.filter(l=>l.type==='sim'&&(l.source.id===node.id||l.target.id===node.id));
    if(sims.length) kids.push(el('div',{class:'grp'},el('b',{style:'font-size:13px',text:'Perfil parecido con'}),
      ...sims.map(l=>{const o=l.source.id===node.id?l.target:l.source;const oe=empOfNode(S.nodes[o.id]);
        return el('p',{class:'mono',text:(oe?oe.nombre:o.id)+' · coincide en '+l.matches.map(id=>{const v=varById(id);return v?v.nombre:id;}).join(', ')});})));
    kids.push(capBtn('Capturar en el chat',()=>captureNode(node.id)));
  }else if(d.kind==='corr'){
    const vs=varsFor(node).filter(v=>satOf(v)===d.sat),dn=vs.filter(v=>hasObs(node.id,v.id)).length;
    const nivel={EMP:'empresa',CLI:'cliente',PRD:'producto'}[node.tipo];
    kids.push(el('div',{class:'eyebrow',text:'Corriente · '+(NODO_ES[node.tipo]||'')+' '+node.nombre}),el('h2',{text:SATS[d.sat].nombre}),el('p',{text:SATS[d.sat].desc}),
      vs.length?el('p',{class:'mono',text:dn+' de '+vs.length+' variables de nivel '+nivel+' con dato'}):el('p',{class:'impmsg warn',style:'margin:0',text:'Esta corriente no tiene variables de nivel '+nivel+'. Sus variables se llenan en otros nodos de la empresa.'}),
      vs.length?el('p',{class:'empty',text:GR.open.has(d.id)?'Abierta: toca un área para ver sus bloques y variables.':'Toca el nodo para abrir sus áreas.'}):null,
      vs.length?el('div',{class:'ctrls'},el('button',{class:'btn main',type:'button',onclick:()=>captureCorr(node.id,d.sat),text:'Capturar esta corriente en el chat'})):null);
  }else if(d.kind==='area'||d.kind==='grp2'){
    const all=varsFor(node).filter(v=>v.dim===d.dim);
    const groups=groupsOf(all).filter(([gname,gi])=>d.kind==='area'||gi===d.gi);
    const aid=d.kind==='area'?d.id:d.parent;
    kids.push(el('div',{class:'eyebrow',text:(d.kind==='area'?'Área · ':'Bloque · ')+node.nombre}),el('h2',{text:d.kind==='area'?DIMS[d.dim]:d.label}),
      el('p',{class:'mono',text:d.done+' de '+d.total+' variables con dato'}),
      ...groups.map(([gname,gi,arr])=>el('div',{class:'grp'},d.kind==='area'?el('b',{style:'font-size:13px',text:gname}):null,
        el('div',{class:'chips'},...arr.map(v=>varChip(v,varState(node.id,v.id),()=>{
          GR.open.add(aid);GR.open.add(aid+'~g'+gi);GR.sel=aid+'~g'+gi+'~'+v.id;gRefresh();gPanel();}))))),
      capBtn('Capturar esta área en el chat',()=>captureArea(node.id,d.dim)));
  }else if(d.kind==='hal'){
    const E_=empOfNode(node);
    kids.push(el('div',{class:'eyebrow',text:'Hallazgo'}),el('h2',{text:node.nombre}),el('p',{class:'mono',text:node.id+(E_?' · '+E_.nombre:'')}),
      el('div',{class:'formgrid'},row('Qué se encontró',node.hallazgo),row('Corrientes que conecta',(node.sats||[]).map(k=>SATS[k]?SATS[k].nombre:k).join(', ')),row('Áreas',(node.dims||[]).map(x=>DIMS[x]||x).join(', ')),row('Insight: por qué pasa',node.insight),row('Implicación para el negocio',node.implicacion)),
      el('div',{class:'grp'},el('b',{style:'font-size:13px',text:'Datos en los que se apoya ('+(node.obs||[]).length+')'}),
        ...(node.obs||[]).slice(0,8).map(id=>{const o=S.obs[id],v=o&&varById(o.variable);return el('p',{class:'mono',text:o?(v?v.nombre:o.variable)+': '+showVal(o)+' · '+id:id});})),
      ...nodesOf('SUG').filter(s=>s.padre===node.id).map(s=>el('p',{class:'mono',text:'Sugerencia '+s.id+': '+s.nombre})));
  }else if(d.kind==='sug'){
    const hp=S.nodes[node.padre];
    kids.push(el('div',{class:'eyebrow',text:'Sugerencia'}),el('h2',{text:node.nombre}),el('p',{class:'mono',text:node.id+(hp?' · sale de '+hp.id:'')}),
      el('div',{class:'formgrid'},row('Acción',node.accion),row('Área',DIMS[node.dimension]||node.dimension),row('Responsable',node.responsable),row('Plazo',node.plazo),row('Indicador de seguimiento',node.kpi),row('Estado',node.estado)));
  }else if(d.kind==='var'){
    const v=varById(d.vid),r=latest(node.id,d.vid);
    const hist=Object.values(S.obs).filter(o=>o.nodo===node.id&&o.variable===d.vid).sort((a,b)=>String(b.capturado).localeCompare(String(a.capturado)));
    const st={cap:['Capturada','var(--amber)'],na:['No aplica','var(--muted)'],pend:['Pendiente','var(--cyan)']}[d.state];
    kids.push(el('div',{class:'eyebrow',text:'Variable · '+d.vid}),el('h2',{text:v.nombre}),
      el('span',{class:'state',style:'color:'+st[1]+';border-color:'+st[1],text:st[0]}),
      el('p',{text:v.q}),v.guia?el('p',{class:'mono',text:'Cómo responder: '+v.guia}):null,
      el('div',{class:'grp'},el('b',{style:'font-size:13px',text:'Valor en '+node.nombre}),
        el('p',{style:'color:var(--fg);font-size:16px',text:r?showVal(r):'Sin dato todavía'}),
        r?el('p',{class:'mono',text:r.id+' · '+(r.fuente||'')+' · confianza '+(r.confianza||'')+' · '+(r.periodo||'')+' · '+capName(r.por)}):null,
        r&&r.nota?el('p',{text:'Nota de hallazgo: '+r.nota}):null));
    if(hist.length>1) kids.push(el('div',{class:'grp'},el('b',{style:'font-size:13px',text:'Historial'}),...hist.slice(1,6).map(o=>el('p',{class:'mono',text:showVal(o)+' · '+o.id+' · '+(o.periodo||'')}))));
    kids.push(capBtn('Capturar en el chat',()=>captureVar(d.vid,node.id)));
  }
  p.replaceChildren(...kids.filter(Boolean));
}

/* ---- catálogo y explicación con satélites ---- */
function renderCatalogList(){
  fillCvEmp();
  const f=$('#cv-filter').value||'*';
  const t=$('#catTbl');t.replaceChildren();
  t.append(el('thead',null,el('tr',null,['ID','Variable','Satélite','Dimensión','Bloque','Nivel','Fuente','Respuesta','Aplica a','Prioritaria en'].map(h=>el('th',{text:h})))));
  const b=el('tbody');
  allVars().filter(v=>f==='*'||v.dim===f).forEach(v=>{
    const pr=ETAPAS.filter(e=>(PRIOR[e.k]||[]).includes(v.id)).map(e=>e.k).join(', ');
    const em=v.emp&&S.nodes[v.emp];
    b.append(el('tr',null,el('td',{class:'mono',text:v.id}),el('td',null,v.nombre,S.custom[v.id]?el('span',{class:'tag',style:'margin-left:6px',text:'nueva'}):null),
      el('td',{text:SATS[satOf(v)].nombre}),el('td',{text:v.dim+' · '+DIMS[v.dim]}),el('td',{text:v.grupo||'Variables nuevas'}),
      el('td',{text:NIVELES[v.nivel]}),el('td',{text:FUENTES[v.fuente]}),el('td',{text:TIPOS[v.tipo]}),
      el('td',{text:v.emp?(em?em.nombre:v.emp):'Todas'}),el('td',{text:pr||'—'})));
  });
  t.append(b);
}
function renderHow(){
  const ne=nodesOf('EMP').length,np=nodesOf('PRD').length,no=Object.keys(S.obs).length;
  const pl=(n,a,b)=>n+' '+(n===1?a:b);
  $('#how-live').textContent='Hoy: '+pl(ne,'empresa','empresas')+' · '+pl(np,'producto','productos')+' · '+pl(no,'observación','observaciones')+' · '+pl(allVars().length,'variable','variables')+' en las plantillas';
  const g=$('#how-dims');g.replaceChildren();
  Object.values(SATS).forEach(s=>{
    g.append(el('div',{class:'dimhead',text:s.nombre}));
    s.dims.forEach(d=>{
      const vs=allVars().filter(v=>v.dim===d&&satOf(v)===(s===SATS.MKT?'MKT':'MER'));if(!vs.length) return;
      const nivs=[...new Set(vs.map(v=>NIVELES[v.nivel]))].join(' y ');
      g.append(el('div',null,el('span',null,el('i',{text:d}),DIMS[d]),el('span',{text:vs.length+' · '+nivs})));
    });
  });
  const t=$('#how-etapas');t.replaceChildren();
  t.append(el('thead',null,el('tr',null,['Etapa','Cómo se reconoce','Variables prioritarias'].map(h=>el('th',{text:h})))));
  const b=el('tbody');
  ETAPAS.forEach(e=>{
    const names=(PRIOR[e.k]||[]).map(id=>{const v=varById(id);return v?v.nombre:id;});
    b.append(el('tr',null,el('td',{text:e.k}),el('td',{text:e.s}),el('td',{text:names.join(' · ')})));
  });
  t.append(b);
}

/* ---- encuadre automático del grafo ---- */
function gFitNow(smooth){
  const sv=$('#gsvg');
  if(!GR.inited||!GR.w||S.tab!=='universe'||!sv||!sv.clientWidth) return;
  const ns=GR.nodes.filter(n=>n.x!=null&&isFinite(n.x));if(!ns.length) return;
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  ns.forEach(n=>{x0=Math.min(x0,n.x-n.r);x1=Math.max(x1,n.x+n.r);y0=Math.min(y0,n.y-n.r);y1=Math.max(y1,n.y+n.r+16);});
  const narrow=GR.w<760,panelW=$('#gpanel').hidden||narrow?0:340;
  const L=40,R=40+panelW,T=narrow?170:240,Bm=narrow?($('#gpanel').hidden?30:Math.round(GR.h*.5)):40;
  const w=Math.max(120,GR.w-L-R),h=Math.max(120,GR.h-T-Bm);
  const k=Math.max(.25,Math.min(1.6,Math.min(w/((x1-x0)||1),h/((y1-y0)||1))));
  const t=d3.zoomIdentity.translate(L+w/2-k*(x0+x1)/2,T+h/2-k*(y0+y1)/2).scale(k);
  (smooth?GR.svg.transition().duration(600):GR.svg).call(GR.zoom.transform,t);
}
function gAutoFit(){
  if(!GR.autoFit||!GR.inited||!GR.w) return;
  (GR.fitTs||[]).forEach(clearTimeout);
  GR.fitTs=[setTimeout(()=>{if(GR.autoFit)gFitNow(true);},1200),setTimeout(()=>{if(GR.autoFit)gFitNow(true);},2800)];
}
function gFit(){GR.autoFit=true;gFitNow(true);gAutoFit();}


/* ===================== captura por corriente ===================== */
S.curSat=null;
function dimIndex(d){
  let i=0;
  for(const k of Object.keys(SATS)){const ix=SATS[k].dims.indexOf(d);if(ix>=0) return i+ix;i+=SATS[k].dims.length;}
  return 9999;
}
function buildQueue(opts={}){
  const P=S.ctx.prd;
  let vars=allVars().filter(v=>nodeForVar(v));
  if(opts.dim) vars=vars.filter(v=>v.dim===opts.dim);
  if(opts.sat) vars=vars.filter(v=>satOf(v)===opts.sat);
  let list=vars.map(v=>({vid:v.id,nodeId:nodeForVar(v),dim:v.dim,gi:v.gi!=null?v.gi:99}));
  const pr=P&&S.nodes[P]?(PRIOR[S.nodes[P].etapa]||[]):[];
  if(!opts.dim) list=list.filter(it=>!hasObs(it.nodeId,it.vid));
  list.forEach(it=>{it.rank=pr.indexOf(it.vid);it.prio=!opts.dim&&it.rank>=0;});
  if(opts.prio) list=list.filter(it=>it.prio);
  list.sort((a,b)=>{
    if(a.prio!==b.prio) return a.prio?-1:1;
    if(a.prio&&b.prio) return a.rank-b.rank;
    const da=dimIndex(a.dim),db=dimIndex(b.dim);if(da!==db) return da-db;
    if(a.gi!==b.gi) return a.gi-b.gi;
    return a.vid.localeCompare(b.vid);
  });
  return list;
}
function satProgress(k){
  const vs=allVars().filter(v=>satOf(v)===k&&nodeForVar(v));
  return {total:vs.length,done:vs.filter(v=>hasObs(nodeForVar(v),v.id)).length};
}
function startCapture(){
  S.dimMode=null;S.phase=null;S.then=null;S.queue=[];S.curSat=null;renderPath();renderSide();
  const P=S.ctx.prd?S.nodes[S.ctx.prd]:null;
  const items=[];
  const pq=buildQueue({prio:true});
  if(pq.length) items.push({label:'Lo prioritario de la etapa',sub:String(pq.length),tone:'primary',fn:()=>{echo('Lo prioritario de la etapa');S.curSat=null;S.queue=buildQueue({prio:true});askVar();}});
  Object.keys(SATS).forEach(k=>{
    const pg=satProgress(k);if(!pg.total) return;
    items.push({label:SATS[k].nombre,sub:pg.done+'/'+pg.total,fn:()=>startCorr(k)});
  });
  const nx=nextLevelChip();if(nx) items.push(nx);
  items.push({label:'Importar un CSV',fn:()=>{echo('Importar CSV');IMP.emp=S.ctx.emp||IMP.emp;IMP.prd=S.ctx.prd||'';impReady=false;setTab('data');setSub('imp');}});
  const npre=nodesOf('PRE').filter(p=>S.ctx.emp&&p.padre===S.ctx.emp&&p.estado==='abierta').length;
  if(npre) items.push({label:'Preguntas abiertas',sub:String(npre),tone:'primary',fn:()=>{echo('Preguntas abiertas');startPre();}});
  items.push({label:'Registrar hallazgos y sugerencias',fn:()=>{echo('Hallazgos y sugerencias');startInsight();}});
  items.push({label:'Otro producto o empresa',tone:'quiet',fn:()=>{echo('Cambiar de nodo');chooseEmpresa();}});
  say(levelMsg()+'¿Qué corriente de análisis quieres capturar?');
  setComposer(chipRow(items));
}
function startCorr(k){
  echo(SATS[k].nombre);
  S.curSat=k;S.dimMode=null;S.phase=null;S.then=null;S.queue=buildQueue({sat:k});
  if(!S.queue.length){say('Esa corriente no tiene variables pendientes para este nodo.');startCapture();return;}
  say(SATS[k].nombre+': hay '+S.queue.length+' variables por registrar. Puedes cambiar de área cuando quieras.');
  askVar();
}
function pickDim(k){
  if(!S.ctx.emp){chooseEmpresa();return;}
  k=(typeof k==='string'?k:null)||S.curSat;
  if(!k){startCapture();return;}
  S.curSat=k;
  say('¿Qué área de '+SATS[k].nombre+' quieres capturar?');
  const items=SATS[k].dims.map(d=>{
    let tot=0,pend=0;
    allVars().filter(v=>v.dim===d&&satOf(v)===k).forEach(v=>{const nid=nodeForVar(v);if(!nid)return;tot++;if(!hasObs(nid,v.id))pend++;});
    return {d,tot,pend};
  }).filter(x=>x.tot>0).map(x=>({label:x.d+' · '+DIMS[x.d],sub:(x.tot-x.pend)+'/'+x.tot,fn:()=>jumpDim(x.d)}));
  items.push({label:'Volver a lo pendiente',tone:'quiet',fn:()=>{echo('Volver a lo pendiente');startCorr(k);}});
  items.push({label:'Otra corriente',tone:'quiet',fn:()=>{echo('Otra corriente');startCapture();}});
  setComposer(chipRow(items));
}
function menu(msg){
  S.then=null;
  if(msg) say(msg);
  const items=[];
  const nx=S.ctx.emp?nextLevelChip():null;if(nx) items.push(nx);
  if(S.ctx.emp) items.push({label:'Otra corriente',fn:()=>{echo('Otra corriente');startCapture();}});
  if(S.ctx.emp&&S.curSat) items.push({label:'Elegir área',fn:()=>{echo('Elegir área');pickDim();}});
  if(S.ctx.emp) items.push({label:'Importar un CSV',fn:()=>{echo('Importar CSV');IMP.emp=S.ctx.emp;IMP.prd=S.ctx.prd||'';impReady=false;setTab('data');setSub('imp');}});
  const npre2=nodesOf('PRE').filter(p=>S.ctx.emp&&p.padre===S.ctx.emp&&p.estado==='abierta').length;
  if(npre2) items.push({label:'Preguntas abiertas',sub:String(npre2),tone:'primary',fn:()=>{echo('Preguntas abiertas');startPre();}});
  if(S.ctx.emp) items.push({label:'Registrar hallazgos y sugerencias',fn:()=>{echo('Hallazgos y sugerencias');startInsight();}});
  if(S.ctx.emp) items.push({label:'Otro producto de esta empresa',fn:()=>{echo('Otro producto');choosePrd(S.nodes[S.ctx.emp]);}});
  items.push({label:'Otra empresa',fn:()=>{echo('Otra empresa');chooseEmpresa();}});
  setComposer(chipRow(items));
}
function renderSide(){
  const dims=$('#dims');dims.replaceChildren();
  const E=S.ctx.emp?S.nodes[S.ctx.emp]:null;
  if(!E){dims.append(el('p',{class:'empty',text:'Elige una empresa para ver el avance por corriente.'}));}
  else{
    let done=0,total=0;
    Object.keys(SATS).forEach(k=>{
      const pg=satProgress(k);done+=pg.done;total+=pg.total;
      if(!pg.total) return;
      const pct=Math.round(pg.done/pg.total*100);
      dims.append(el('button',{class:'dimrow',type:'button',title:SATS[k].nombre,onclick:()=>{if(S.tab==='capture'&&S.ctx.emp)startCorr(k);}},
        el('span',{class:'dl',text:k}),el('span',{class:'dn',text:SATS[k].nombre}),el('span',{class:'dc',text:pg.done+'/'+pg.total}),
        el('span',{class:'bar'},el('i',{style:'width:'+pct+'%'}))));
    });
    dims.prepend(el('p',{class:'empty',style:'margin-bottom:8px',text:done+' de '+total+' variables registradas ('+(total?Math.round(done/total*100):0)+' %)'}));
  }
  const rec=$('#recent');rec.replaceChildren();
  const last=Object.values(S.obs).sort((a,b)=>String(b.capturado).localeCompare(String(a.capturado))).slice(0,6);
  if(!last.length) rec.append(el('li',{class:'empty',text:'Todavía no hay registros.'}));
  last.forEach(o=>{
    const v=varById(o.variable);
    rec.append(el('li',null,el('span',null,tagEl(o.id),' ',el('span',{text:v?v.nombre:o.variable})),
      el('span',{class:'m',text:o.nodo+' · '+showVal(o)+' · '+capName(o.por)})));
  });
}
function renderCover(){
  const w=$('#coverWrap');w.replaceChildren();
  const emps=nodesOf('EMP');
  if(!emps.length){w.append(el('p',{class:'empty',text:'Todavía no hay nodos para medir cobertura.'}));return;}
  const cols=[];
  emps.forEach(e=>{cols.push(e);clisOf(e.id).forEach(c=>cols.push(c));nodesOf('PRD').filter(p=>p.padre===e.id).forEach(p=>cols.push(p));});
  const t=el('table',{class:'tbl'});
  t.append(el('thead',null,el('tr',null,el('th',{text:'Área'}),cols.map(n=>el('th',{style:'text-align:center'},n.nombre,el('small',{text:n.id}))))));
  const covs=cols.map(n=>coverage(n));
  const b=el('tbody');
  Object.keys(SATS).forEach(k=>{
    const rows=SATS[k].dims.filter(d=>covs.some(c=>c[d]&&c[d].total));
    if(!rows.length) return;
    b.append(el('tr',null,el('td',{colspan:cols.length+1,style:'color:var(--cyan);font-weight:600;padding-top:16px',text:SATS[k].nombre})));
    rows.forEach(d=>{
      b.append(el('tr',null,el('td',null,tagEl(d),' '+DIMS[d]),
        covs.map(c=>{const x=c[d];
          if(!x||!x.total) return el('td',{class:'cell zero',style:'--p:0',text:'—'});
          const p=x.done/x.total;
          return el('td',{class:'cell'+(x.done?'':' zero'),style:'--p:'+p.toFixed(2),text:x.done+'/'+x.total});})));
    });
  });
  t.append(b);w.append(t);
}
function dimOptions(){
  return Object.keys(SATS).map(k=>{
    const g=el('optgroup',{label:SATS[k].nombre});
    SATS[k].dims.forEach(d=>{if(DIMS[d]) g.append(el('option',{value:d,text:d+' · '+DIMS[d]}));});
    return g;
  });
}
function fillObsFilters(){
  $('#o-dim').replaceChildren(el('option',{value:'',text:'Todas las dimensiones'}),...dimOptions());
}
function fillDimSelects(){
  $('#cv-dim').replaceChildren(...dimOptions());
  $('#cv-filter').replaceChildren(el('option',{value:'*',text:'Todas'}),...dimOptions());
}
fillObsFilters();fillDimSelects();
function renderHow(){
  const ne=nodesOf('EMP').length,np=nodesOf('PRD').length,no=Object.keys(S.obs).length;
  const pl=(n,a,b)=>n+' '+(n===1?a:b);
  $('#how-live').textContent='Hoy: '+pl(ne,'empresa','empresas')+' · '+pl(np,'producto','productos')+' · '+pl(no,'observación','observaciones')+' · '+pl(allVars().length,'variable','variables')+' en '+Object.keys(SATS).length+' corrientes';
  const ct=$('#how-corr');ct.replaceChildren();
  ct.append(el('thead',null,el('tr',null,['Corriente','Qué mira','Áreas','Variables','Se llena en'].map(h=>el('th',{text:h})))));
  const cb=el('tbody');
  Object.keys(SATS).forEach(k=>{
    const vs=allVars().filter(v=>satOf(v)===k);
    const nivs=[...new Set(vs.map(v=>NIVELES[v.nivel]))].join(', ');
    cb.append(el('tr',null,el('td',{style:'white-space:nowrap',text:SATS[k].nombre}),el('td',{text:SATS[k].desc}),el('td',{class:'num',text:SATS[k].dims.filter(d=>vs.some(v=>v.dim===d)).length}),el('td',{class:'num',text:vs.length}),el('td',{text:nivs})));
  });
  ct.append(cb);
  const g=$('#how-dims');g.replaceChildren();
  Object.keys(SATS).forEach(k=>{
    g.append(el('div',{class:'dimhead',text:SATS[k].nombre}));
    SATS[k].dims.forEach(d=>{
      const vs=allVars().filter(v=>v.dim===d&&satOf(v)===k);if(!vs.length) return;
      const nivs=[...new Set(vs.map(v=>NIVELES[v.nivel]))].join(' y ');
      g.append(el('div',null,el('span',null,el('i',{text:d}),DIMS[d]),el('span',{text:vs.length+' · '+nivs})));
    });
  });
  const t=$('#how-etapas');t.replaceChildren();
  t.append(el('thead',null,el('tr',null,['Etapa','Cómo se reconoce','Variables prioritarias'].map(h=>el('th',{text:h})))));
  const b=el('tbody');
  ETAPAS.forEach(e=>{
    const names=(PRIOR[e.k]||[]).map(id=>{const v=varById(id);return v?v.nombre:id;});
    b.append(el('tr',null,el('td',{text:e.k}),el('td',{text:e.s}),el('td',{text:names.join(' · ')})));
  });
  t.append(b);
}

function captureCorr(nodeId,k){
  const nd=S.nodes[nodeId];if(!nd) return;
  setTab('capture');ctxFromNode(nd);renderPath();renderSide();
  S.curSat=k;S.dimMode=null;S.phase=null;S.then=null;
  S.queue=buildQueue({sat:k}).filter(it=>it.nodeId===nodeId);
  if(!S.queue.length){say('Esa corriente no tiene variables pendientes para este nodo.');startCapture();return;}
  say(SATS[k].nombre+' de '+nd.nombre+': hay '+S.queue.length+' variables por registrar.');
  askVar();
}

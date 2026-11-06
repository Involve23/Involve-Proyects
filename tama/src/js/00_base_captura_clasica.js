
const DIMS={A:'Mercado y categoría',B:'Consumidor / cliente',C:'Shopper y punto de venta',D:'Producto',E:'Marca y posicionamiento',F:'Precio',G:'Canal y distribución',H:'Comunicación y medios',I:'Competencia',J:'Modelación y pronóstico',K:'Innovación',L:'Planeación y ejecución',N:'Organización',O:'Oferta',Q:'Audiencia',R:'Medios',S:'Canales',T:'Plataformas',U:'Áreas',V:'Ciclo de vida',W:'Contenido',X:'Origen',Y:'Contacto',Z:'Métricas'};
const FUENTES={I:'Interna',P:'Primaria',X:'Externa',D:'Derivada'};
const NIVELES={E:'Empresa',P:'Producto',C:'Cliente'};
const TIPOS={t:'Texto',n:'Número',p:'Porcentaje',e:'Escala 1 a 5',sn:'Sí / No',c:'Opciones'};
const ESCALA=['Muy bajo','Bajo','Medio','Alto','Muy alto'];
const INDUSTRIAS=['Retail','Servicios','Automotriz','Pharma','Sabores y fragancias','Consumo','Otra'];
const ETAPAS=[
 {k:'Desarrollo',s:'Idea o producto aún no lanzado; se busca validar la oportunidad'},
 {k:'Lanzamiento',s:'Primer año en mercado; la distribución está en construcción'},
 {k:'Crecimiento',s:'Ventas y distribución en aumento; la competencia reacciona'},
 {k:'Madurez',s:'Ventas estables; presión de precio; foco en eficiencia y lealtad'},
 {k:'Innovación',s:'Hay que renovar portafolio, reformular o entrar a nuevas categorías'}];
const PRIOR={
 Desarrollo:['VAR-001','VAR-002','VAR-003','VAR-004','VAR-031','VAR-020','VAR-005','VAR-058'],
 Lanzamiento:['VAR-036','VAR-042','VAR-016','VAR-045'],
 Crecimiento:['VAR-032','VAR-049','VAR-043','VAR-016','VAR-051','VAR-052'],
 Madurez:['VAR-033','VAR-011','VAR-019','VAR-051','VAR-052','VAR-038','VAR-053'],
 Innovación:['VAR-054','VAR-006','VAR-056','VAR-029']
};
const BASE=[
['VAR-001','A','Oportunidades de negocio','P','X','t','¿Qué espacios no atendidos hay en la categoría para este producto?','Brechas entre oferta y demanda; necesidades no cubiertas; espacios libres por segmento'],
['VAR-002','A','Tamaño de mercado','P','X','n','¿Cuál es el valor anual de la categoría, en pesos?','Valor y volumen; TAM-SAM-SOM; crecimiento anual (CAGR)'],
['VAR-003','A','Participación de mercado (share)','P','X','p','¿Qué porcentaje del valor de la categoría tiene el producto?','Share en valor y volumen; evolución por periodo; share por canal o región'],
['VAR-004','A','Tendencias de mercado','E','X','t','¿Qué tendencias de consumo, regulatorias o tecnológicas afectan a la empresa?','Tendencias de consumo, regulación (p. ej. etiquetado) y tecnología'],
['VAR-005','A','Segmentación de mercado','P','P','t','¿Qué segmentos de clientes atiende el producto y qué tan grande es cada uno?','Variables demográficas, NSE, psicográficas y ocasiones de consumo'],
['VAR-006','A','Nuevas realidades y necesidades','E','X','t','¿Qué cambios estructurales del consumidor están apareciendo?','Nuevos hábitos y ocasiones emergentes'],
['VAR-007','A','Geomarketing','E','X','t','¿En qué zonas hay más potencial y cómo es la cobertura frente a la competencia?','Potencial por zona, densidad poblacional, NSE por área'],
['VAR-008','B','Necesidades y motivaciones','C','P','t','¿Cuáles son los principales motivos y barreras de compra de los clientes?','Drivers y barreras de compra; trabajos por hacer (jobs-to-be-done)'],
['VAR-009','B','Satisfacción y lealtad','C','P','e','¿Qué tan satisfechos y leales son los clientes con este producto?','CSAT, NPS, intención de recompra'],
['VAR-010','B','Clientes perdidos','C','I','p','¿Qué porcentaje de clientes se perdió en el último periodo?','Tasa de abandono (churn), motivos de salida, recuperabilidad'],
['VAR-011','B','Relación con el cliente','C','I','t','¿Cómo es la relación con los clientes: frecuencia de contacto y valor que dejan en el tiempo?','Esfuerzo del cliente, frecuencia de interacción, valor de vida (CLV)'],
['VAR-012','B','Emociones','C','P','t','¿Qué emociones despierta la marca o el producto?','Valencia y activación; medidas implícitas'],
['VAR-013','B','Conversación en redes sociales','C','X','t','¿Qué se dice de la marca en redes: volumen, sentimiento y temas?','Menciones, sentimiento, share of voice'],
['VAR-014','B','Viaje del cliente (journey)','C','P','t','¿Cuáles son las etapas del viaje de compra y dónde hay fricción?','Etapas, momentos de verdad, fricciones por etapa'],
['VAR-016','C','Experiencia del shopper','C','P','e','¿Qué tan buena es la experiencia de compra en el punto de venta?','Ruta de compra, conversión, compra planeada vs. impulsiva'],
['VAR-017','C','Ejecución en punto de venta (PDV)','C','P','p','¿Qué porcentaje de disponibilidad (sin faltantes) tiene el producto en el punto de venta?','Faltantes, participación en anaquel, planograma, material POP'],
['VAR-018','C','Formatos de tienda','C','I','t','¿En qué formatos de tienda se vende y cómo le va en cada uno?','Autoservicio, conveniencia, tradicional, comercio electrónico'],
['VAR-019','C','Administración por categoría','C','I','t','¿Qué rol tiene el producto dentro de la categoría del retailer?','Rol de categoría, surtido, rotación, rentabilidad por SKU'],
['VAR-020','D','Evaluación del producto','P','P','e','¿Cómo evalúan los clientes el producto frente a sus expectativas?','Agrado general, intención de compra, producto vs. competidor'],
['VAR-021','D','Atributos sensoriales clave','P','P','t','¿Qué atributos describen y diferencian el producto (sabor, olor, textura, apariencia u otros)?','Léxico sensorial; intensidad por atributo'],
['VAR-022','D','Diferencias entre productos','P','P','t','¿Los clientes detectan diferencias entre este producto y otros?','Pruebas triangulares y dúo-trío; perfil descriptivo'],
['VAR-023','D','Vida de anaquel','P','I','n','¿Cuántos días conserva su calidad el producto en anaquel?','Curva de deterioro; punto de rechazo'],
['VAR-024','D','Dinámica temporal del producto','P','P','t','¿Cómo evolucionan los atributos del producto durante el consumo?','Dominancia temporal; tiempo-intensidad'],
['VAR-025','D','Calidad y consistencia','P','I','p','¿Qué porcentaje de lotes cumple la especificación?','Lotes dentro de especificación; desviación vs. estándar'],
['VAR-026','D','Insights rápidos para innovación','P','P','t','¿Qué respuestas rápidas de clientes hay para orientar la innovación?','CATA, napping, flash profile'],
['VAR-027','D','Patrones en datos sensoriales','P','D','t','¿Qué patrones aparecen en las bases de datos históricas del producto?','Mapas de preferencia; análisis multivariado'],
['VAR-028','D','Integración sensorial–consumidor','P','P','t','¿Qué atributos del producto son los que más valora el cliente?','Drivers of liking; análisis de penalización'],
['VAR-029','D','Costos y reformulación','P','I','n','¿Cuál es el costo por unidad del producto, en pesos?','Costo por unidad; paridad con la versión original'],
['VAR-030','D','Etiquetado y reformulación','P','X','t','¿Qué ajustes de etiquetado o reformulación exige la regulación?','Sellos de advertencia; impacto en preferencia y compra'],
['VAR-031','E','Posicionamiento de marca','P','P','t','¿Qué lugar ocupa la marca en la mente del cliente y en qué se diferencia?','Mapa perceptual, atributos asociados, diferenciación'],
['VAR-032','E','Salud de marca','P','P','e','¿Qué tan fuerte es la marca: conocimiento, consideración y preferencia?','Embudo de marca; valor de marca'],
['VAR-033','E','Arquitectura de marca','E','I','c','¿Cómo se relacionan las marcas, submarcas y extensiones de la empresa?','Modelo de marca; canibalización',['Monolítica','Respaldada','Independiente']],
['VAR-034','E','Portafolio','E','I','t','¿Qué mezcla de productos o servicios tiene la empresa y qué huecos hay?','Contribución por SKU, cobertura de segmentos, huecos de portafolio'],
['VAR-035','E','Ciclo de vida de la marca','P','I','t','¿Qué evidencia respalda la etapa del ciclo de vida del producto?','Etapa y su evidencia'],
['VAR-036','F','Monitoreo de precios','P','X','n','¿Cuál es el precio promedio del producto en el mercado, en pesos?','Precio vs. competidores; índice de precio; dispersión por canal'],
['VAR-037','F','Arquitectura de precios','P','I','t','¿Cómo se escalonan los precios por presentación?','Escalera de precios; precio por unidad de medida'],
['VAR-038','F','Elasticidad precio','P','D','n','¿Cuál es el coeficiente de elasticidad del precio estimado?','Elasticidad directa y cruzada; umbral de precio'],
['VAR-039','F','Estrategia de precios con distribución y producción','E','I','p','¿Qué margen (%) deja el precio en el canal principal?','Margen por canal; punto de equilibrio'],
['VAR-040','G','Rutas al mercado','E','I','t','¿Por qué caminos llega el producto al mercado?','Canales directos e indirectos; cobertura'],
['VAR-041','G','Portafolio por ruta al mercado','P','I','t','¿Qué productos van por cada canal y cuál rota más?','Surtido y rotación por canal'],
['VAR-042','G','Ejecución en canal','P','I','e','¿Qué tan bien se ejecuta el producto en cada canal: distribución, visibilidad y acuerdos?','Distribución, visibilidad, cumplimiento de acuerdos comerciales'],
['VAR-043','G','Desarrollo de canal','P','I','p','¿Cuánto creció el canal principal, en porcentaje anual?','Crecimiento por canal; potencial de canales nuevos'],
['VAR-044','G','Programas con distribuidores','E','P','e','¿Qué tan satisfechos están los distribuidores?','Satisfacción del distribuidor; cumplimiento de estándares'],
['VAR-045','H','Evaluación de comunicación','P','P','e','¿Qué tan efectivo es el mensaje: recordación, comprensión y credibilidad?','Recordación, comprensión, credibilidad, persuasión'],
['VAR-046','H','Evaluación publicitaria','P','P','e','¿Qué resultado tuvo la última pieza publicitaria, antes y después de salir?','Pre-test y post-test; impacto en intención de compra'],
['VAR-047','H','Tropicalización de comunicación','P','P','t','¿Cómo se adaptan las campañas globales al contexto local?','Ajuste cultural del mensaje sin cambiar el posicionamiento'],
['VAR-048','H','Mix de medios y ROI','E','I','n','¿Qué retorno tiene la inversión en medios (veces la inversión)?','ROI por medio; curvas de respuesta; contribución incremental'],
['VAR-049','I','Panorama competitivo','P','X','t','¿Quiénes compiten con el producto y cómo se comparan?','Mapa de competidores, share relativo, precio relativo, fortalezas y debilidades'],
['VAR-050','I','Benchmark de producto','P','P','c','¿Cómo se compara el producto frente a sus competidores principales?','Paridad o superioridad en preferencia y atributos',['Inferior','Paridad','Superior']],
['VAR-051','J','Pronóstico de ventas','P','D','n','¿Cuál es el volumen de ventas proyectado para el siguiente año?','Volumen proyectado, escenarios, intervalo de error'],
['VAR-052','J','Marketing mix modeling','E','D','t','¿Qué contribución tienen precio, distribución, medios y promoción a las ventas?','Contribución de cada palanca a las ventas'],
['VAR-053','J','Modelos econométricos','E','D','t','¿Qué relaciones se han modelado entre variables económicas y ventas?','Regresiones, series de tiempo, variables macro'],
['VAR-054','K','Modelo de innovación','E','I','t','¿Cómo genera y filtra ideas la empresa?','Embudo de ideas, criterios de filtro, tasa de éxito'],
['VAR-055','K','Desarrollo de conceptos','P','P','e','¿Qué tan atractivo es el concepto de producto para el cliente?','Atractivo, unicidad, relevancia, intención de compra'],
['VAR-056','K','Desarrollo de portafolio','E','I','t','¿Qué categorías o productos nuevos se están considerando?','Incrementalidad, canibalización, ajuste estratégico'],
['VAR-057','K','Desarrollo de sabores y fragancias','P','P','t','¿Qué desarrollo sensorial específico se está trabajando?','Aceptación, ajuste a tendencia, perfil sensorial objetivo'],
['VAR-058','L','Plan de ejecución de mercado','P','I','t','¿Cuál es el plan para salir al mercado: objetivos, mercado meta, calendario y KPIs?','Objetivos, mercado meta, mezcla de marketing, calendario, KPIs'],
['VAR-059','L','Planes de mercadotecnia','E','I','t','¿Cuál es el plan de mercadotecnia vigente: objetivos, presupuesto y métricas?','Objetivos SMART, presupuesto, métricas de seguimiento'],
['VAR-060','L','Planes de comercialización','E','I','t','¿Cuál es el plan comercial: metas por canal o cliente y cobertura?','Metas por canal o cliente, fuerza de ventas, cobertura']
];
const VARS_BASE=BASE.map(a=>({id:a[0],dim:a[1],nombre:a[2],nivel:a[3],fuente:a[4],tipo:a[5],q:a[6],hint:a[7],opts:a[8]||null}));

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
function el(tag,props,...kids){
  const e=document.createElement(tag);
  if(props) for(const k in props){
    const v=props[k];
    if(k==='class') e.className=v;
    else if(k==='text') e.textContent=v;
    else if(k.startsWith('on')) e.addEventListener(k.slice(2),v);
    else if(v===true) e.setAttribute(k,'');
    else if(v!==false&&v!=null) e.setAttribute(k,v);
  }
  kids.flat().forEach(c=>{ if(c==null||c===false) return; e.append(c.nodeType?c:document.createTextNode(String(c))); });
  return e;
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const nowIso=()=>new Date().toISOString();
const msgOf=e=>(e&&(e.message||e.code))||String(e);

const S={db:null,mem:true,uid:null,holder:'h'+Math.random().toString(36).slice(2,9),canWrite:null,
  nodes:{},obs:{},custom:{},names:{},idx:null,ctx:{emp:null,prd:null},queue:[],phase:null,dimMode:null,
  meta:{fuente:'auto',confianza:'Media',periodo:new Date().toISOString().slice(0,7)},
  chain:Promise.resolve(),pending:0,tab:'universe',sub:'obs',openNode:null,memC:{},loaded:{nodes:false,obs:false,custom:false},ready:false};
let userNs=null,dlNs=null;
const KEY={nodes:'nodes',obs:'obs',catalog:'custom'};

function allVars(){return VARS_BASE.concat(Object.values(S.custom).sort((a,b)=>a.id.localeCompare(b.id)));}
function varById(id){return allVars().find(v=>v.id===id);}
function nodesOf(t){return Object.values(S.nodes).filter(n=>n.tipo===t).sort((a,b)=>a.id.localeCompare(b.id));}
function getIdx(){
  if(S.idx) return S.idx;
  const ix={};
  Object.values(S.obs).forEach(o=>{
    const m=ix[o.nodo]||(ix[o.nodo]={});
    const cur=m[o.variable];
    if(!cur||String(o.capturado)>String(cur.capturado)) m[o.variable]=o;
  });
  return S.idx=ix;
}
const latest=(n,v)=>(getIdx()[n]||{})[v]||null;
const hasObs=(n,v)=>!!latest(n,v);
function varsFor(node){
  if(!node) return [];
  if(node.tipo==='EMP') return allVars().filter(v=>v.nivel==='E');
  if(node.tipo==='PRD') return allVars().filter(v=>v.nivel==='P');
  return [];
}
function coverage(node){
  const out={};Object.keys(DIMS).forEach(d=>out[d]={done:0,total:0});
  varsFor(node).forEach(v=>{ const c=out[v.dim]||(out[v.dim]={done:0,total:0}); c.total++; if(hasObs(node.id,v.id)) c.done++; });
  return out;
}
function capName(id){ if(!id) return '—'; if(id===S.uid) return 'Tú'; return S.names[id]||'Capturista'; }
function fmtNum(n){return Number(n).toLocaleString('es-MX',{maximumFractionDigits:4});}
function showVal(rec){
  if(!rec) return '';
  if(rec.no_aplica) return 'No aplica';
  const v=varById(rec.variable); const x=rec.valor;
  if(!v) return String(x);
  if(v.tipo==='p') return fmtNum(x)+'%';
  if(v.tipo==='n') return fmtNum(x);
  if(v.tipo==='e') return x+' de 5';
  return String(x);
}

function luhn(s){let sum=0,dbl=true;for(let i=s.length-1;i>=0;i--){let d=+s[i];if(dbl){d*=2;if(d>9)d-=9;}sum+=d;dbl=!dbl;}return (10-(sum%10))%10;}
function fmtId(prefix,n,width,noCheck){const num=String(n).padStart(width,'0');return noCheck?`${prefix}-${num}`:`${prefix}-${num}-${luhn(String(n))}`;}
function verifyId(id){
  const m=/^([A-Z]{3})-(\d+)-(\d)$/.exec(id.trim().toUpperCase());
  if(m) return luhn(String(parseInt(m[2],10)))===+m[3];
  return null;
}
async function mintId(prefix,width,opt={}){
  const base=opt.base||0;
  if(S.mem){let n=(S.memC[prefix]!=null?S.memC[prefix]:base)+1;if(opt.jump)n=opt.jump(n);S.memC[prefix]=n;return fmtId(prefix,n,width,opt.noCheck);}
  const ref=S.db.doc('counters/'+prefix);
  for(let i=0;i<7;i++){
    const r=await ref.acquire({holder:S.uid||S.holder,ttlMs:2000});
    if(r.acquired){
      const snap=await ref.get();
      const cur=snap.exists&&typeof snap.data().n==='number'?snap.data().n:base;
      let n=cur+1;if(opt.jump)n=opt.jump(n);
      if(snap.exists){try{await ref.update({n});}catch(e){await ref.set({n});}}else{await ref.set({n});}
      return fmtId(prefix,n,width,opt.noCheck);
    }
    await sleep(500+Math.random()*600);
  }
  throw new Error('No se pudo reservar el ID. Intenta de nuevo.');
}
async function put(coll,id,data){
  const k=KEY[coll];
  S[k][id]=data;S.idx=null;scheduleRender();
  if(S.mem) return;
  try{await S.db.doc(coll+'/'+id).set(data);}
  catch(e){delete S[k][id];S.idx=null;scheduleRender();throw e;}
}

/* ---------- chat primitives ---------- */
const chatEl=$('#chat'),compEl=$('#composer');
function scrollDown(){chatEl.scrollTop=chatEl.scrollHeight;}
function bubble(who,...kids){const b=el('div',{class:'msg '+who},el('div',{class:'bub'},...kids));chatEl.append(b);scrollDown();return b;}
function say(text,notes){return bubble('bot',el('p',{text}),notes?el('ul',{class:'notes'},notes.map(n=>el('li',{text:n}))):null);}
function echo(text){bubble('me',el('p',{text:String(text)}));}
function divider(text){chatEl.append(el('div',{class:'divider',text}));scrollDown();}
function setComposer(...nodes){compEl.replaceChildren(...nodes.filter(Boolean));}
function chipRow(items){
  return el('div',{class:'chips'},items.map(i=>el('button',{class:'chip '+(i.tone||''),type:'button',onclick:i.fn},i.label,i.sub?el('span',{class:'chipid',text:i.sub}):null)));
}
function inputRow(kind,ph,onVal,unit){
  const multi=kind==='text';
  const inp=multi?el('textarea',{rows:2,placeholder:ph,'aria-label':ph}):el('input',{type:'number',step:'any',inputmode:'decimal',placeholder:ph,'aria-label':ph});
  const err=el('div',{class:'err',role:'alert'});
  const go=()=>{
    const raw=inp.value.trim();
    if(!raw){err.textContent='Escribe una respuesta, o usa No aplica u Omitir.';return;}
    if(kind==='text'){err.textContent='';onVal(raw);return;}
    const n=Number(raw);
    if(!Number.isFinite(n)){err.textContent='Escribe un número válido.';return;}
    if(kind==='pct'&&(n<0||n>100)){err.textContent='El porcentaje debe estar entre 0 y 100.';return;}
    err.textContent='';onVal(n);
  };
  inp.addEventListener('input',()=>{err.textContent='';});
  inp.addEventListener('keydown',e=>{
    if(multi){if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();go();}}
    else if(e.key==='Enter'){e.preventDefault();go();}
  });
  setTimeout(()=>{try{inp.focus({preventScroll:true});}catch(_){}},0);
  return el('div',{class:'inrow'},el('div',{class:'infield'},inp,unit?el('span',{class:'unit',text:unit}):null),el('button',{class:'btn',type:'button',onclick:go,text:'Registrar'}),err);
}
function askText(q,ph,cb,o={}){
  say(q);
  const extra=o.optional?chipRow([{label:'Omitir',tone:'quiet',fn:()=>{echo('Omitir');cb('');}}]):null;
  setComposer(inputRow('text',ph,v=>{echo(v);cb(v);}),extra);
}
function runSteps(steps,data,done,i=0){
  if(i>=steps.length) return done(data);
  const s=steps[i];
  const next=v=>{data[s.key]=v;runSteps(steps,data,done,i+1);};
  if(s.chips){
    say(s.q,s.notes);
    setComposer(chipRow(s.chips.map(c=>({label:c.label||c,fn:()=>{echo(c.label||c);next(c.label||c);}}))));
  }else askText(s.q,s.ph,next,{optional:s.optional});
}

/* ---------- flow: empresa / producto ---------- */
function intro(){
  scheduleRender();
  bubble('bot',el('p',{text:'Te guío empresa por empresa. Cada respuesta se guarda como una observación con su propio ID, ligada al nodo que describe y a la variable que mide.'}),
    el('p',{class:'hint',text:'En cada pregunta puedes responder, elegir una opción, marcar No aplica u Omitir, y cambiar de dimensión cuando quieras.'}));
  chooseEmpresa();
}
function chooseEmpresa(){
  S.ctx={emp:null,prd:null};S.queue=[];renderPath();renderSide();
  const emps=nodesOf('EMP');
  say(emps.length?'¿De qué empresa vamos a capturar información?':'Todavía no hay empresas registradas. Empecemos con la primera.');
  const items=emps.map(e=>({label:e.nombre,sub:e.id,fn:()=>{echo(e.nombre);S.ctx.emp=e.id;choosePrd(e);}}));
  items.push({label:'Nueva empresa',tone:'primary',fn:()=>{echo('Nueva empresa');newEmpresa();}});
  setComposer(chipRow(items));
}
function newEmpresa(){
  runSteps([
    {key:'nombre',q:'¿Cómo se llama la empresa?',ph:'Nombre comercial'},
    {key:'industria',q:'¿En qué industria está?',chips:INDUSTRIAS},
    {key:'categoria',q:'¿En qué categoría compite?',ph:'Ej. botanas saladas, software de nómina…'},
    {key:'geo',q:'¿En qué mercado geográfico opera?',ph:'Ej. México; México y Centroamérica…'},
    {key:'pregunta',q:'¿Qué pregunta de negocio queremos resolver con el análisis?',ph:'Ej. ¿Por qué baja la recompra?'},
    {key:'decision',q:'¿Qué decisión se va a tomar con el análisis?',ph:'Ej. Reformular el producto estrella'},
    {key:'fuentes',q:'¿Qué fuentes de información hay disponibles?',ph:'Ventas, encuestas, reportes…',optional:true}
  ],{},createEmpresa);
}
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
    wait.remove();
    S.ctx.emp=id;S.ctx.prd=null;renderPath();
    bubble('bot',el('div',{class:'receipt'},el('span',{class:'idtag',text:id}),el('span',{text:'empresa creada · pertenece a'}),el('span',{class:'idtag',text:grp.id})));
    choosePrd(node);
  }catch(e){
    wait.remove();say('No se pudo registrar la empresa: '+msgOf(e)+'. Revisa que tengas permiso de edición en este artefacto.');
    chooseEmpresa();
  }
}
function choosePrd(emp){
  S.ctx.emp=emp.id;S.ctx.prd=null;S.queue=[];renderPath();renderSide();
  const prds=nodesOf('PRD').filter(p=>p.padre===emp.id);
  say(`Empresa ${emp.nombre}. ¿Con qué producto trabajamos?`);
  const items=prds.map(p=>({label:p.nombre,sub:p.id,fn:()=>{echo(p.nombre);S.ctx.prd=p.id;startCapture();}}));
  items.push({label:'Nuevo producto',tone:'primary',fn:()=>{echo('Nuevo producto');newProducto(emp);}});
  items.push({label:'Solo datos de la empresa',fn:()=>{echo('Solo datos de la empresa');S.ctx.prd=null;startCapture();}});
  items.push({label:'Cambiar de empresa',tone:'quiet',fn:()=>{echo('Cambiar de empresa');chooseEmpresa();}});
  setComposer(chipRow(items));
}
function newProducto(emp){
  runSteps([
    {key:'nombre',q:'¿Cómo se llama el producto?',ph:'Nombre del producto o línea'},
    {key:'etapa',q:'¿En qué etapa del ciclo de vida está? La etapa decide qué variables se preguntan primero.',notes:ETAPAS.map(e=>e.k+': '+e.s),chips:ETAPAS.map(e=>e.k)},
    {key:'evidencia',q:'¿Qué evidencia respalda esa etapa?',ph:'Ej. lanzado en marzo; ventas estables dos años',optional:true}
  ],{},f=>createProducto(emp,f));
}
async function createProducto(emp,f){
  const wait=say('Registrando el producto…');
  try{
    const id=await mintId('PRD',4);
    const node={id,tipo:'PRD',nombre:f.nombre,padre:emp.id,estado:'activo',alias:[],etapa:f.etapa,etapa_evidencia:f.evidencia||'',creado:nowIso(),por:S.uid||null};
    await put('nodes',id,node);
    wait.remove();
    S.ctx.prd=id;renderPath();
    bubble('bot',el('div',{class:'receipt'},el('span',{class:'idtag',text:id}),el('span',{text:'producto creado · pertenece a'}),el('span',{class:'idtag',text:emp.id})));
    startCapture();
  }catch(e){
    wait.remove();say('No se pudo registrar el producto: '+msgOf(e));choosePrd(emp);
  }
}

/* ---------- flow: variables ---------- */
function buildQueue(opts={}){
  const E=S.ctx.emp,P=S.ctx.prd;
  let vars=allVars().filter(v=>v.nivel==='E'?!!E:!!P);
  if(opts.dim) vars=vars.filter(v=>v.dim===opts.dim);
  let list=vars.map(v=>({vid:v.id,nodeId:v.nivel==='E'?E:P}));
  if(!opts.dim){
    list=list.filter(it=>!hasObs(it.nodeId,it.vid));
    const pr=P?(PRIOR[S.nodes[P].etapa]||[]):[];
    list.forEach(it=>{it.rank=pr.indexOf(it.vid);it.prio=it.rank>=0;});
    list.sort((a,b)=>{const ra=a.prio?a.rank:999,rb=b.prio?b.rank:999;return ra!==rb?ra-rb:a.vid.localeCompare(b.vid);});
  }
  return list;
}
function startCapture(){
  S.dimMode=null;S.phase=null;S.queue=buildQueue();renderPath();renderSide();
  const prd=S.ctx.prd?S.nodes[S.ctx.prd]:null;
  const n=S.queue.length,np=S.queue.filter(i=>i.prio).length;
  if(!n){menu('Este nodo ya tiene todas sus variables registradas.');return;}
  say(`Hay ${n} variables por registrar.`+(np?` Empiezo por las ${np} prioritarias para la etapa de ${prd.etapa.toLowerCase()}.`:'')+' Puedes cambiar de dimensión cuando quieras.');
  askVar();
}
function askVar(){
  const it=S.queue[0];
  if(!it){queueDone();return;}
  const v=varById(it.vid),node=S.nodes[it.nodeId];
  if(!v||!node){S.queue.shift();askVar();return;}
  const phase=S.dimMode?'dim:'+S.dimMode:(it.prio?'prio':'rest');
  if(S.phase!=='single'&&phase!==S.phase){
    S.phase=phase;
    divider(phase==='prio'?'Prioritarias para la etapa':phase==='rest'?'Resto de '+(S.curSat&&SATS[S.curSat]?SATS[S.curSat].nombre:'las variables'):'Dimensión '+S.dimMode+' · '+DIMS[S.dimMode]);
  }
  const cur=latest(it.nodeId,it.vid);
  bubble('bot',
    el('div',{class:'vhead'},el('span',{class:'idtag',text:v.id}),el('span',{class:'dimtag',text:v.dim+' · '+(DIMS[v.dim]||'')})),
    el('h3',{text:v.nombre}),
    el('p',{text:it.qx||v.q}),v.guia?el('p',{class:'hint',text:'Cómo responder: '+v.guia}):null,
    v.hint?el('p',{class:'hint',text:(/ › /.test(v.hint)?'Ubicación: ':'Indicadores de referencia: ')+v.hint}):null,
    el('p',{class:'tgt'},'Se registra en ',el('b',{text:node.id}),' · '+node.nombre),
    cur?el('p',{class:'hint',text:'Valor actual: '+showVal(cur)+'. Si respondes, se agrega una observación nueva.'}):null);
  const submit=(val,disp)=>answer(it,val,false,disp);
  let main;
  if(v.tipo==='t') main=inputRow('text','Escribe la respuesta…',x=>submit(x,x));
  else if(v.tipo==='n') main=inputRow('num','Número',x=>submit(x,fmtNum(x)));
  else if(v.tipo==='p') main=inputRow('pct','0 a 100',x=>submit(x,fmtNum(x)+'%'),'%');
  else if(v.tipo==='e') main=el('div',{class:'scale'},ESCALA.map((w,i)=>el('button',{type:'button',onclick:()=>submit(i+1,(i+1)+' de 5')},el('b',{text:String(i+1)}),el('span',{text:w}))));
  else if(v.tipo==='sn') main=chipRow([{label:'Sí',fn:()=>submit('Sí','Sí')},{label:'No',fn:()=>submit('No','No')}]);
  else main=chipRow((v.opts||[]).map(o=>({label:o,fn:()=>submit(o,o)})));
  const extras=chipRow([
    {label:'No aplica',tone:'quiet',fn:()=>answer(it,null,true,'No aplica')},
    {label:'Omitir',tone:'quiet',fn:()=>{echo('Omitir');S.queue.shift();askVar();}},
    {label:'Cambiar dimensión',tone:'quiet',fn:()=>{echo('Cambiar dimensión');pickDim();}},
    {label:'Terminar',tone:'quiet',fn:()=>{echo('Terminar');S.queue=[];S.dimMode=null;menu('Sesión guardada. Todo lo respondido ya quedó como observaciones.');}}
  ]);
  setComposer(main,extras);
}
function answer(it,val,na,disp){
  echo(disp);
  S.queue.shift();
  saveObs(it,val,na);
  if(it.preId&&S.nodes[it.preId])put('nodes',it.preId,{...S.nodes[it.preId],estado:'respondida',respondida:nowIso()}).catch(()=>{});
  askVar();
}
function saveObs(it,val,na){
  const v=varById(it.vid);
  const slot=el('div',{class:'receipt pending'},'Guardando…');
  chatEl.append(slot);scrollDown();
  const m={...S.meta,nota:($('#m-nota').value||'').trim()};$('#m-nota').value='';
  S.pending++;setSync();
  S.chain=S.chain.then(async()=>{
    const id=await mintId('OBS',6);
    const rec={id,nodo:it.nodeId,variable:it.vid,valor:na?null:val,no_aplica:!!na,
      fuente:m.fuente==='auto'?(FUENTES[v.fuente]||''):m.fuente,confianza:m.confianza,periodo:m.periodo,nota:m.nota||'',
      capturado:nowIso(),por:S.uid||null,catv:allVars().length,vver:(v&&v.vver)||1};
    await put('obs',id,rec);
    slot.className='receipt';
    slot.replaceChildren(el('span',{class:'idtag',text:id}),el('span',{class:'arrow',text:'→'}),el('span',{class:'idtag',text:it.nodeId}),el('span',{text:'mide'}),el('span',{class:'idtag',text:it.vid}));
  }).catch(e=>{
    slot.className='receipt fail';
    slot.textContent='No se guardó '+it.vid+': '+msgOf(e)+'. Revisa que tengas permiso de edición.';
  }).then(()=>{S.pending--;setSync();});
}
function queueDone(){
  S.dimMode=null;renderSide();
  menu('No quedan variables pendientes en esta lista. ¿Qué sigue?');
}
function menu(msg){
  if(msg) say(msg);
  const items=[];
  if(S.ctx.emp) items.push({label:'Elegir dimensión',fn:()=>{echo('Elegir dimensión');pickDim();}});
  if(S.ctx.emp) items.push({label:'Otro producto de esta empresa',fn:()=>{echo('Otro producto');choosePrd(S.nodes[S.ctx.emp]);}});
  items.push({label:'Otra empresa',fn:()=>{echo('Otra empresa');chooseEmpresa();}});
  setComposer(chipRow(items));
}
function pickDim(){
  if(!S.ctx.emp){chooseEmpresa();return;}
  say('¿Qué dimensión quieres capturar?');
  const E=S.nodes[S.ctx.emp],P=S.ctx.prd?S.nodes[S.ctx.prd]:null;
  const items=Object.keys(DIMS).map(d=>{
    let tot=0,pend=0;
    allVars().filter(v=>v.dim===d).forEach(v=>{
      const node=v.nivel==='E'?E:P; if(!node) return;
      tot++; if(!hasObs(node.id,v.id)) pend++;
    });
    return {d,tot,pend};
  }).filter(x=>x.tot>0).map(x=>({label:x.d+' · '+DIMS[x.d],sub:(x.tot-x.pend)+'/'+x.tot,fn:()=>jumpDim(x.d)}));
  items.push({label:'Volver a lo pendiente',tone:'quiet',fn:()=>{echo('Volver a lo pendiente');startCapture();}});
  setComposer(chipRow(items));
}
function jumpDim(d){
  echo(d+' · '+DIMS[d]);
  S.dimMode=d;S.phase=null;S.queue=buildQueue({dim:d});
  if(!S.queue.length){menu('Esa dimensión no tiene variables para este nivel.');return;}
  askVar();
}

/* ---------- renderers ---------- */
function renderPath(){
  const box=$('#path');box.replaceChildren();
  const E=S.ctx.emp?S.nodes[S.ctx.emp]:null,P=S.ctx.prd?S.nodes[S.ctx.prd]:null;
  if(!E){box.append(el('span',{class:'none',text:'Sin nodo seleccionado'}));return;}
  const chip=n=>el('span',{class:'node'},n.nombre,el('i',{text:n.id}));
  const grp=E.padre&&S.nodes[E.padre];
  if(grp){box.append(chip(grp),el('span',{class:'sep',text:'›'}));}
  box.append(chip(E));
  if(P){box.append(el('span',{class:'sep',text:'›'}),chip(P),el('span',{class:'dimtag',text:'Etapa: '+(P.etapa||'—')}));}
}
function renderSide(){
  const dims=$('#dims');dims.replaceChildren();
  const E=S.ctx.emp?S.nodes[S.ctx.emp]:null,P=S.ctx.prd?S.nodes[S.ctx.prd]:null;
  if(!E){dims.append(el('p',{class:'empty',text:'Elige una empresa para ver el avance por dimensión.'}));}
  else{
    const ce=coverage(E),cp=P?coverage(P):null;
    let done=0,total=0;
    Object.keys(DIMS).forEach(d=>{
      const t=ce[d].total+(cp?cp[d].total:0),dn=ce[d].done+(cp?cp[d].done:0);
      done+=dn;total+=t;
      if(!t) return;
      const pct=Math.round(dn/t*100);
      dims.append(el('button',{class:'dimrow',type:'button',onclick:()=>{if(S.tab==='capture'&&S.ctx.emp){jumpDim(d);}}},
        el('span',{class:'dl',text:d}),el('span',{class:'dn',text:DIMS[d]}),el('span',{class:'dc',text:dn+'/'+t}),
        el('span',{class:'bar'},el('i',{style:'width:'+pct+'%'}))));
    });
    dims.prepend(el('p',{class:'empty',style:'margin-bottom:8px',text:`${done} de ${total} variables registradas (${total?Math.round(done/total*100):0} %)`}));
  }
  const rec=$('#recent');rec.replaceChildren();
  const last=Object.values(S.obs).sort((a,b)=>String(b.capturado).localeCompare(String(a.capturado))).slice(0,6);
  if(!last.length) rec.append(el('li',{class:'empty',text:'Todavía no hay registros.'}));
  last.forEach(o=>{
    const v=varById(o.variable);
    rec.append(el('li',null,el('span',null,el('span',{class:'idtag',text:o.id}),' ',el('span',{text:v?v.nombre:o.variable})),
      el('span',{class:'m',text:o.nodo+' · '+showVal(o)+' · '+capName(o.por)})));
  });
}
function setSync(){
  const s=$('#sync');
  const ne=nodesOf('EMP').length,np=nodesOf('PRD').length,no=Object.keys(S.obs).length;
  if(S.mem){s.className='sync warn';s.textContent='Modo local: lo que captures no se guardará al cerrar';return;}
  s.className='sync';
  s.replaceChildren(S.pending?'Guardando… ':'',el('b',{text:ne}),ne===1?' empresa · ':' empresas · ',el('b',{text:np}),np===1?' producto · ':' productos · ',el('b',{text:no}),no===1?' observación':' observaciones');
}
function renderNodes(){
  const t=$('#nodesTbl');t.replaceChildren();
  t.append(el('thead',null,el('tr',null,['ID','Tipo','Nombre','Depende de','Etapa','Registros','Avance'].map((h,i)=>el('th',{text:h,class:i>=5?'num':''})))));
  const body=el('tbody');
  const rows=[];
  nodesOf('GRP').forEach(g=>{rows.push(g);nodesOf('EMP').filter(e=>e.padre===g.id).forEach(e=>{rows.push(e);nodesOf('PRD').filter(p=>p.padre===e.id).forEach(p=>rows.push(p));});});
  nodesOf('EMP').filter(e=>!rows.includes(e)).forEach(e=>{rows.push(e);nodesOf('PRD').filter(p=>p.padre===e.id).forEach(p=>rows.push(p));});
  if(!rows.length) body.append(el('tr',null,el('td',{colspan:7,class:'empty',text:'Todavía no hay nodos. Crea una empresa desde la pestaña Capturar.'})));
  rows.forEach(n=>{
    const cnt=Object.values(S.obs).filter(o=>o.nodo===n.id).length;
    let av='—';
    const vs=varsFor(n);
    if(vs.length){const d=vs.filter(v=>hasObs(n.id,v.id)).length;av=d+'/'+vs.length;}
    const tipo={GRP:'Grupo',EMP:'Empresa',PRD:'Producto'}[n.tipo]||n.tipo;
    body.append(el('tr',{class:'row'+(S.openNode===n.id?' open':''),onclick:()=>{S.openNode=S.openNode===n.id?null:n.id;renderNodes();}},
      el('td',{class:'mono',text:n.id}),el('td',{text:tipo}),el('td',{text:(n.tipo==='PRD'?'↳ ':'')+n.nombre}),
      el('td',{class:'mono',text:n.padre||'—'}),el('td',{text:n.etapa||'—'}),el('td',{class:'num',text:cnt}),el('td',{class:'num',text:av})));
  });
  t.append(body);
  const det=$('#nodeDetail');det.replaceChildren();
  const n=S.openNode&&S.nodes[S.openNode];
  if(!n) return;
  const obs=Object.values(S.obs).filter(o=>o.nodo===n.id).sort((a,b)=>String(b.capturado).localeCompare(String(a.capturado)));
  const card=el('div',{class:'card'},el('h3',{style:'font-size:17px;margin-bottom:6px',text:n.nombre}),el('p',{class:'mono',text:n.id}));
  if(n.ficha){
    const f=n.ficha;
    card.append(el('div',{class:'formgrid'},
      [['Industria',f.industria],['Categoría',f.categoria],['Mercado geográfico',f.mercado_geo],['Pregunta de negocio',f.pregunta],['Decisión',f.decision],['Fuentes disponibles',f.fuentes]]
      .map(([k,v])=>el('div',null,el('div',{class:'dimtag',text:k}),el('div',{text:v||'—'})))));
  }
  if(n.tipo==='PRD') card.append(el('p',{style:'margin-top:10px',text:'Etapa: '+n.etapa+(n.etapa_evidencia?' · '+n.etapa_evidencia:'')}));
  const tb=el('table',{class:'tbl',style:'margin-top:14px'},
    el('thead',null,el('tr',null,['Observación','Variable','Valor','Fuente','Confianza','Periodo','Capturó','Fecha'].map(h=>el('th',{text:h})))));
  const b=el('tbody');
  if(!obs.length) b.append(el('tr',null,el('td',{colspan:8,class:'empty',text:'Este nodo todavía no tiene observaciones.'})));
  obs.forEach(o=>{const v=varById(o.variable);
    b.append(el('tr',null,el('td',{class:'mono',text:o.id}),el('td',null,el('span',{class:'idtag',text:o.variable}),' '+(v?v.nombre:'')),
      el('td',{text:showVal(o)}),el('td',{text:o.fuente||''}),el('td',{text:o.confianza||''}),el('td',{text:o.periodo||''}),el('td',{text:capName(o.por)}),
      el('td',{text:o.capturado?new Date(o.capturado).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'}):''})));});
  tb.append(b);card.append(el('div',{class:'scroll'},tb));
  det.append(card);
}
function renderCover(){
  const w=$('#coverWrap');w.replaceChildren();
  const emps=nodesOf('EMP');
  if(!emps.length){w.append(el('p',{class:'empty',text:'Todavía no hay nodos para medir cobertura.'}));return;}
  const cols=[];
  emps.forEach(e=>{cols.push(e);nodesOf('PRD').filter(p=>p.padre===e.id).forEach(p=>cols.push(p));});
  const t=el('table',{class:'tbl'});
  t.append(el('thead',null,el('tr',null,el('th',{text:'Dimensión'}),cols.map(n=>el('th',{style:'text-align:center'},n.nombre,el('small',{text:n.id}))))));
  const covs=cols.map(n=>coverage(n));
  const b=el('tbody');
  Object.keys(DIMS).forEach(d=>{
    b.append(el('tr',null,el('td',null,el('span',{class:'idtag',text:d}),' '+DIMS[d]),
      covs.map(c=>{const x=c[d];
        if(!x||!x.total) return el('td',{class:'cell zero',style:'--p:0',text:'—'});
        const p=x.done/x.total;
        return el('td',{class:'cell'+(x.done?'':' zero'),style:'--p:'+p.toFixed(2),text:x.done+'/'+x.total});})));
  });
  t.append(b);w.append(t);
}
function renderCatalogList(){
  const f=$('#cv-filter').value||'*';
  const t=$('#catTbl');t.replaceChildren();
  t.append(el('thead',null,el('tr',null,['ID','Variable','Dimensión','Nivel','Fuente','Respuesta','Prioritaria en'].map(h=>el('th',{text:h})))));
  const b=el('tbody');
  allVars().filter(v=>f==='*'||v.dim===f).forEach(v=>{
    const pr=ETAPAS.filter(e=>(PRIOR[e.k]||[]).includes(v.id)).map(e=>e.k).join(', ');
    b.append(el('tr',null,el('td',{class:'mono',text:v.id}),el('td',null,v.nombre,S.custom[v.id]?el('span',{class:'tag',style:'margin-left:6px',text:'nueva'}):null),
      el('td',{text:v.dim+' · '+DIMS[v.dim]}),el('td',{text:NIVELES[v.nivel]}),el('td',{text:FUENTES[v.fuente]}),el('td',{text:TIPOS[v.tipo]}),el('td',{text:pr||'—'})));
  });
  t.append(b);
}
function renderExport(){
  const ne=nodesOf('EMP').length,np=nodesOf('PRD').length,no=Object.keys(S.obs).length;
  $('#exStats').textContent=`${ne} empresas, ${np} productos, ${no} observaciones y ${allVars().length} variables en el catálogo.`;
  $('#ex-csv').hidden=!dlNs;$('#ex-json').hidden=!dlNs;
  $('#exNote').textContent=dlNs?'El JSON incluye nodos, variables, dimensiones, observaciones y aristas (pertenece a, describe, mide).':'La descarga de archivos no está disponible en esta vista.';
}
let rq=false;
function scheduleRender(){if(rq)return;rq=true;requestAnimationFrame(()=>{rq=false;renderAll();});}

/* ---------- tabs and static controls ---------- */
$('#m-per').value=S.meta.periodo;
$('#m-fuente').addEventListener('change',e=>{S.meta.fuente=e.target.value;});
$('#m-conf').addEventListener('change',e=>{S.meta.confianza=e.target.value;});
$('#m-per').addEventListener('change',e=>{S.meta.periodo=e.target.value||S.meta.periodo;});
(function fillDims(){
  const opts=Object.keys(DIMS).map(d=>el('option',{value:d,text:d+' · '+DIMS[d]}));
  $('#cv-dim').append(...opts);
  $('#cv-filter').append(el('option',{value:'*',text:'Todas'}),...Object.keys(DIMS).map(d=>el('option',{value:d,text:d+' · '+DIMS[d]})));
  $('#cv-filter').addEventListener('change',renderCatalogList);
})();
$('#idgo').addEventListener('click',checkId);
$('#idin').addEventListener('keydown',e=>{if(e.key==='Enter')checkId();});
function checkId(){
  const raw=$('#idin').value.trim().toUpperCase();const r=$('#idres');
  if(!raw){r.className='res bad';r.textContent='Escribe un ID.';return;}
  if(/^VAR-\d{3}$/.test(raw)){const v=varById(raw);r.className='res '+(v?'ok':'bad');r.textContent=v?'Variable de catálogo: '+v.nombre:'No existe esa variable en el catálogo.';return;}
  const ok=verifyId(raw);
  if(ok===null){r.className='res bad';r.textContent='Formato no válido. Debe ser PREFIJO-NÚMERO-DÍGITO.';return;}
  if(!ok){r.className='res bad';r.textContent='El dígito verificador no coincide: hay un error de captura.';return;}
  const n=S.nodes[raw],o=S.obs[raw];
  r.className='res ok';
  r.textContent=n?'ID válido · '+n.nombre:o?'ID válido · observación de '+o.variable+' en '+o.nodo:'ID con formato correcto, pero no existe en esta base.';
}
$('#cv-add').addEventListener('click',async()=>{
  const r=$('#cv-res');
  const nombre=$('#cv-nombre').value.trim(),q=$('#cv-q').value.trim();
  if(!nombre||!q){r.className='res bad';r.textContent='Falta el nombre o la pregunta.';return;}
  r.className='res';r.textContent='Reservando ID…';
  try{
    const id=await mintId('VAR',3,{noCheck:true,base:60,jump:n=>n>=201&&n<1001?1001:n});
    const rec={id,dim:$('#cv-dim').value,nombre,nivel:$('#cv-nivel').value,fuente:$('#cv-fuente').value,tipo:$('#cv-tipo').value,q,hint:'',opts:null,emp:$('#cv-emp').value||null,creado:nowIso(),por:S.uid||null};
    await put('catalog',id,rec);
    $('#cv-nombre').value='';$('#cv-q').value='';
    r.className='res ok';r.textContent=id+' agregada. Se preguntará en las próximas capturas.';
  }catch(e){r.className='res bad';r.textContent='No se pudo agregar: '+msgOf(e);}
});
function csvCell(x){if(x==null)return '';const s=String(x);return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
async function saveFile(filename,data){
  if(!dlNs) return;
  try{await dlNs.save({filename,data});}
  catch(e){if(e&&e.code!=='declined') $('#exNote').textContent='No se pudo descargar: '+msgOf(e);}
}
$('#ex-csv').addEventListener('click',()=>{
  const head=['observacion_id','nodo_id','nodo_tipo','nodo_nombre','variable_id','variable','dimension','valor','no_aplica','fuente','confianza','periodo','capturado','capturista','version_catalogo','nota'];
  const rows=Object.values(S.obs).sort((a,b)=>a.id.localeCompare(b.id)).map(o=>{
    const n=S.nodes[o.nodo]||{},v=varById(o.variable)||{};
    return [o.id,o.nodo,n.tipo,n.nombre,o.variable,v.nombre,v.dim,o.valor,o.no_aplica?'sí':'no',o.fuente,o.confianza,o.periodo,o.capturado,capName(o.por),o.catv,o.nota||''].map(csvCell).join(',');
  });
  saveFile('tama_observaciones.csv','\ufeff'+[head.join(','),...rows].join('\n'));
});
$('#ex-json').addEventListener('click',()=>{
  const nodos=Object.values(S.nodes),obs=Object.values(S.obs),vars=allVars();
  const aristas=[];
  nodos.forEach(n=>{if(n.padre)aristas.push({origen:n.id,destino:n.padre,tipo:'PERTENECE_A'});});
  nodos.filter(n=>n.tipo==='PRD').forEach(pr=>{clisOf(pr.padre).forEach(c=>aristas.push({origen:c.id,destino:pr.id,tipo:'CONSUME'}));});
  nodos.filter(n=>n.tipo==='HAL').forEach(h=>(h.obs||[]).forEach(o=>aristas.push({origen:h.id,destino:o,tipo:'SE_APOYA_EN'})));
  vars.forEach(v=>aristas.push({origen:v.id,destino:'DIM-'+v.dim,tipo:'PERTENECE_A_DIMENSION'}));
  obs.forEach(o=>{aristas.push({origen:o.id,destino:o.nodo,tipo:'DESCRIBE'});aristas.push({origen:o.id,destino:o.variable,tipo:'MIDE'});});
  const out={generado:nowIso(),dimensiones:Object.keys(DIMS).map(d=>({id:'DIM-'+d,nombre:DIMS[d]})),variables:vars,nodos,observaciones:obs,aristas};
  saveFile('tama_grafo.json',JSON.stringify(out,null,2));
});

/* ---------- boot ---------- */
async function resolveNames(){
  if(!userNs) return;
  const ids=new Set();
  Object.values(S.obs).forEach(o=>o.por&&ids.add(o.por));
  Object.values(S.nodes).forEach(n=>n.por&&ids.add(n.por));
  const miss=[...ids].filter(i=>!(i in S.names));
  if(!miss.length) return;
  miss.forEach(i=>{S.names[i]='';});
  try{const ps=await userNs.profiles(miss);miss.forEach(i=>{S.names[i]=(ps&&ps[i]&&ps[i].name)||'Capturista';});}
  catch(e){miss.forEach(i=>{S.names[i]='Capturista';});}
  scheduleRender();
}
const use=n=>(window.claude&&window.claude.use)?window.claude.use(n):Promise.resolve(null);
async function boot(){
  const [db,user,dl]=await Promise.all([use('db'),use('user'),use('downloads')]);
  userNs=user;dlNs=dl;
  if(user){
    try{
      S.uid=await user.id();
      const me=await user.me();
      if(S.uid) S.names[S.uid]=(me&&me.name)||'Tú';
      S.canWrite=await user.can('data.write');
    }catch(e){}
  }
  if(!db){
    S.mem=true;setSync();
    chatEl.append(el('div',{class:'notice',text:'Esta vista no tiene base de datos compartida. Puedes probar el flujo, pero nada se guardará. Ábrela desde Claude con tu sesión iniciada para registrar de verdad.'}));
    S.ready=true;intro();return;
  }
  S.db=db;S.mem=false;setSync();
  if(S.canWrite===false) chatEl.append(el('div',{class:'notice',text:'Tu acceso a este artefacto es de solo lectura. Pide permiso de edición para poder capturar.'}));
  let started=false;
  const start=()=>{if(started)return;started=true;S.ready=true;intro();};
  const check=()=>{if(S.loaded.nodes&&S.loaded.obs&&S.loaded.custom)start();};
  const sub=(coll,key)=>db.collection(coll).onSnapshot(snap=>{
    S[key]=Object.fromEntries(snap.docs.map(d=>[d.id,d.data()]));
    S.idx=null;S.loaded[key]=true;check();scheduleRender();resolveNames();
  },err=>{
    console.error(err);S.loaded[key]=true;check();
    $('#sync').className='sync warn';$('#sync').textContent='No se pudo leer la base: '+msgOf(err);
  });
  sub('nodes','nodes');sub('obs','obs');sub('catalog','custom');boSub(db);
  setTimeout(start,5000);
}

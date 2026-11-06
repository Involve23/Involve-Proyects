/* ===================== Captura conversacional por bloques ===================== */
BO.ap=BO.ap||{};
let startCorrClassic=null;
const CV={on:true,blocks:[],bi:0,cur:null,busy:false,follow:0,hist:[],told:false,scope:null,group:null,extra:null,afterChips:null};
const clipT=(s,n)=>{s=String(s||'');return s.length>n?s.slice(0,n-1)+'…':s;};
const NIVEL_TXT={E:'empresa',P:'producto',C:'cliente'};

/* ---- memoria de lo aprendido, por empresa ---- */
const memItems=empId=>(BO.ap[empId]&&BO.ap[empId].items)||[];
async function apPut(empId,data){
  const prev=BO.ap[empId];BO.ap[empId]=data;scheduleRender();
  if(S.mem) return;
  try{await S.db.doc('aprend/'+empId).set(data);}
  catch(e){if(prev) BO.ap[empId]=prev;else delete BO.ap[empId];scheduleRender();throw e;}
}
async function memAdd(empId,list){
  const old=memItems(empId),seen=new Set(old.map(i=>i.texto.toLowerCase().replace(/\s+/g,' ').trim()));
  const nuevos=[];
  (list||[]).forEach((a,i)=>{
    const t=String(a&&a.texto||'').trim().slice(0,200);if(!t) return;
    const k=t.toLowerCase().replace(/\s+/g,' ');if(seen.has(k)) return;seen.add(k);
    nuevos.push({id:'m'+Date.now().toString(36)+i,tipo:['termino','competidor','producto','cliente','preferencia','hecho'].includes(a.tipo)?a.tipo:'hecho',texto:t,por:S.uid||null,cuando:nowIso()});
  });
  if(!nuevos.length) return 0;
  await apPut(empId,{emp:empId,items:[...old,...nuevos].slice(-120)});
  return nuevos.length;
}
async function memDel(empId,id){await apPut(empId,{emp:empId,items:memItems(empId).filter(i=>i.id!==id)});}
const MEM_ES={termino:'Término',competidor:'Competidor',producto:'Producto',cliente:'Cliente',preferencia:'Preferencia',hecho:'Dato'};
function renderMem(){
  const box=document.getElementById('mem');if(!box) return;
  const E=S.ctx.emp&&S.nodes[S.ctx.emp];
  if(!E){box.replaceChildren(el('p',{class:'empty',text:'Elige una empresa. Aquí verás lo que voy aprendiendo de ella mientras conversamos.'}));return;}
  const items=memItems(E.id),kids=[];
  if(!items.length) kids.push(el('p',{class:'empty',text:'Todavía no he aprendido nada de '+E.nombre+'. Conforme conversemos, iré anotando sus términos, competidores y datos que no conviene volver a preguntar.'}));
  items.slice(-12).reverse().forEach(i=>kids.push(el('div',{class:'memrow'},el('span',{class:'tag'},MEM_ES[i.tipo]||'Dato'),el('span',{class:'memt',text:i.texto}),
    el('button',{class:'memx',type:'button','aria-label':'Quitar: '+i.texto,text:'×',onclick:()=>memDel(E.id,i.id).catch(e=>alert('No se pudo quitar: '+msgOf(e)))}))));
  if(items.length>12) kids.push(el('p',{class:'empty',text:'Y '+(items.length-12)+' más anteriores.'}));
  const inp=el('input',{type:'text',maxlength:'200',placeholder:'Algo que deba saber de esta empresa','aria-label':'Agregar a lo aprendido'});
  const add=()=>{const t=inp.value.trim();if(!t) return;inp.value='';memAdd(E.id,[{tipo:'hecho',texto:t}]).catch(e=>alert('No se pudo guardar: '+msgOf(e)));};
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();add();}});
  kids.push(el('div',{class:'row2',style:'margin-top:10px'},inp,el('button',{class:'btn',type:'button',text:'Agregar',onclick:add})));
  box.replaceChildren(...kids);
}

/* ---- contexto para Claude ---- */
function nodeDesc(n){
  if(n.tipo==='PRD') return 'Producto «'+n.nombre+'»'+(n.etapa?' (etapa de '+n.etapa+')':'');
  if(n.tipo==='CLI') return 'Segmento de cliente «'+segName(n)+'»'+(n.tipoCliente?' ('+n.tipoCliente+(n.estrategia?', estrategia de '+n.estrategia.toLowerCase():'')+')':'');
  return 'Empresa «'+n.nombre+'»';
}
function cvCtx(n){
  const e=empOfNode(n)||n,f=e.ficha||{};
  const known=Object.values(S.obs).filter(o=>o.nodo===n.id&&!o.no_aplica).sort((a,b)=>String(a.capturado).localeCompare(String(b.capturado))).slice(-25).map(o=>{const v=varById(o.variable);return (v?v.nombre:o.variable)+': '+clipT(showVal(o),120);});
  return {empresa:e.nombre,industria:f.industria||'',categoria:f.categoria||'',mercado:f.mercado_geo||'',pregunta_de_negocio:f.pregunta||'',decision:f.decision||'',nodo:nodeDesc(n),ya_capturado_en_este_nodo:known,memoria_de_la_empresa:memItems(e.id).slice(-40).map(i=>(MEM_ES[i.tipo]||'Dato')+': '+i.texto)};
}
function cvCtxG(g){
  if(g.length<=1) return cvCtx(g[0]);
  const base=cvCtx(g[0]),por={};
  g.forEach(x=>{por[nodeDesc(x)]=cvCtx(x).ya_capturado_en_este_nodo.slice(-8);});
  delete base.nodo;delete base.ya_capturado_en_este_nodo;
  base.nodos=g.map(nodeDesc);base.ya_capturado_por_nodo=por;
  return base;
}
const nodeNm=n=>n.tipo==='CLI'?segName(n):n.nombre;
function cvVarLine(v){
  const f=eff(v);
  return v.id+' | '+v.nombre+' | tipo: '+TIPO_ES_BO(v)+' | unidad: '+(f.unidad||'—')+' | escala: '+(f.escala||'—')+' | qué mide: '+clipT(f.def,160)+' | pregunta del catálogo: '+clipT(v.q,160);
}
function cvOpenPrompt(b,ctx){
  const multi=b.nodes&&b.nodes.length>1?'\nNODOS A LOS QUE APLICA (la persona responderá por todos a la vez; en tu pregunta invítala a hablar de cada uno por su nombre): '+b.nodes.map(nodeNm).join(', ')+'\n':'';
  return `Eres un entrevistador de inteligencia de negocio: cálido, claro y curioso. Vas a conversar con una persona de la empresa para llenar un bloque de variables. Hablas en español de México, tuteas, usas frases cortas y evitas la jerga estadística.

CONTEXTO (JSON):
${JSON.stringify(ctx)}

BLOQUE: ${SATS[b.sat].nombre} › ${DIMS[b.dim]} › ${b.grupo}${multi}
VARIABLES DEL BLOQUE:
${b.vars.map(cvVarLine).join('\n')}

Devuelve SOLO JSON con esta forma:
{"intro":"una o dos frases que explican en palabras simples para qué sirve este bloque","pregunta":"UNA sola pregunta abierta que invite a contar con sus palabras e incluya lo que buscan las variables, sin sonar a formulario","sugerencias":["hasta 3 respuestas completas y cortas (máximo 25 palabras) que la persona podría usar tal cual"],"ejemplos":["3 ejemplos realistas de respuesta para una empresa de esa industria"],"donde":"una frase sobre dónde o con quién suele estar esta información"}

Reglas:
- No inventes datos de la empresa. Las sugerencias solo van si se deducen del contexto (ficha, lo ya capturado o la memoria); si no hay base, devuelve [].
- Los ejemplos son ilustrativos y se presentan como tales.
- Si la memoria ya contiene algo útil, úsalo para que la pregunta suene a continuación de la conversación.`;
}
function cvExtractPrompt(b,ctx,vars,others,texto){
  const multi=b.nodes&&b.nodes.length>1;
  return `Convierte la respuesta de la persona en valores de variables de un catálogo. Hablas en español de México.

CONTEXTO (JSON):
${JSON.stringify(ctx)}

BLOQUE: ${SATS[b.sat].nombre} › ${DIMS[b.dim]} › ${b.grupo}
${multi?'NODOS (usa en el campo "nodo" el nombre exacto, o «todos» si aplica a todos): '+b.nodes.map(nodeNm).join(', ')+'\n':''}VARIABLES POR LLENAR:
${vars.map(cvVarLine).join('\n')}

OTRAS VARIABLES PENDIENTES (solo si la respuesta las contiene con claridad; id | nombre | tipo):
${others.length?others.map(v=>v.id+' | '+v.nombre+' | '+TIPO_ES_BO(v)).join('\n'):'(ninguna)'}

PREGUNTA QUE HICISTE: ${b.pre?b.pre.pregunta:''}
CONVERSACIÓN PREVIA EN ESTE BLOQUE:
${CV.hist.length?CV.hist.map(h=>'- '+h).join('\n'):'(ninguna)'}

RESPUESTA ACTUAL DE LA PERSONA:
"""${texto}"""

Reglas:
- Llena una variable (de las por llenar o de las otras pendientes) solo si la respuesta la contiene o la implica con claridad; así la persona no tiene que repetirlo después. "confianza": "literal" si la persona lo dijo, "deducido" si lo inferiste.
- Respeta el tipo: número (solo dígitos y punto, sin símbolos), porcentaje (0 a 100), escala (1 a 5), sí/no ("Sí" o "No"), opciones (exactamente una de las opciones del tipo), texto (resume con las palabras de la persona, máximo 280 caracteres).
- "evidencia": cita corta de lo que dijo (máximo 20 palabras).
- "faltan": ids de variables sin respuesta suficiente, con "pista": una frase de cómo podría contestarlas.
- "seguimiento": UNA pregunta concreta sobre lo más importante que falta, con "ejemplo" corto; null si no falta nada importante o si la persona dijo que no sabe.
- "aprendizajes": hechos reutilizables de la empresa (tipo: termino, competidor, producto, cliente, preferencia o hecho; texto corto). No repitas lo que ya está en la memoria.
- "contradicciones": si algo choca con lo ya capturado o con la memoria, {"texto":"..."}.
- Si la persona dice que una variable no aplica, ponla en "no_aplica".

Responde SOLO con JSON con esta forma exacta:
{"valores":[{"id":"VAR-x",${multi?'"nodo":"nombre o todos",':''}"valor":"...","confianza":"literal","evidencia":"..."}],"no_aplica":[],"faltan":[{"id":"VAR-x","pista":"..."}],"seguimiento":{"pregunta":"...","ejemplo":"..."},"aprendizajes":[{"tipo":"hecho","texto":"..."}],"contradicciones":[],"comentario":"una frase breve y cálida que reconozca lo que contó"}`;
}
const CV_ERR={not_granted:'No diste permiso para usar Claude.',rate_limited:'Hay demasiadas solicitudes seguidas. Espera un momento.',invalid_json:'Claude respondió con un formato que no pude leer.',no_sample:'Claude no está disponible en esta vista.'};
async function cvSample(){try{return await (window.claude&&window.claude.use?window.claude.use('sample'):null);}catch(e){return null;}}
function cvFallback(b){
  const names=b.vars.map(v=>v.nombre.toLowerCase());
  return {intro:'Bloque «'+b.grupo+'» de '+DIMS[b.dim]+'.',pregunta:'Cuéntame con tus palabras lo que sepas sobre: '+names.join(', ')+'.',sugerencias:[],
    ejemplos:b.vars.slice(0,3).map(v=>clipT(v.guia||eff(v).ejemplo||v.q,140)).filter(Boolean),donde:'Suele estar con el área responsable de ese tema o en sus reportes internos.'};
}
function cvNorm(v,raw){
  if(raw==null||raw==='') return {ok:false};
  const t=v.tipo;
  if(t==='n'||t==='p'||t==='e'){
    const x=Number(String(raw).replace(/[^0-9.\-]/g,''));if(!isFinite(x)||String(raw).replace(/[^0-9]/g,'')==='') return {ok:false};
    if(t==='p'&&(x<0||x>100)) return {ok:false};
    if(t==='e'){const r=Math.round(x);return r<1||r>5?{ok:false}:{ok:true,val:r};}
    return {ok:true,val:x};
  }
  if(t==='sn'){const s=String(raw).trim().toLowerCase();if(/^s[ií]/.test(s)||s==='true') return {ok:true,val:'Sí'};if(/^no/.test(s)||s==='false') return {ok:true,val:'No'};return {ok:false};}
  if(t==='c'){const o=(v.opts||[]).find(o=>o.toLowerCase()===String(raw).trim().toLowerCase());return o?{ok:true,val:o}:{ok:false};}
  return {ok:true,val:String(raw).trim().slice(0,400)};
}

/* ---- bloques del nodo actual ---- */
function stepLevel(){
  if(S.ctx.prd) return S.nodes[S.ctx.prd];
  if(S.ctx.cli) return S.nodes[S.ctx.cli];
  return S.ctx.emp?S.nodes[S.ctx.emp]:null;
}
function cvAppl(g){
  const m=new Map();
  g.forEach(x=>varsFor(x).forEach(v=>{const e=m.get(v.id)||{v,nodes:[]};e.nodes.push(x);m.set(v.id,e);}));
  return m;
}
function cvPendNodes(b,v){return ((b.map.get(v.id)||{nodes:[]}).nodes).filter(x=>!hasObs(x.id,v.id));}
const cvPendVars=(b,vs)=>vs.filter(v=>cvPendNodes(b,v).length);
function buildBlocks(only,group){
  const g=(group&&group.length?group:[stepLevel()]).filter(Boolean);if(!g.length) return [];
  const map=cvAppl(g),prio=new Set();
  g.forEach(x=>{if(x.tipo==='PRD'&&x.etapa) (PRIOR[x.etapa]||[]).forEach(id=>prio.add(id));});
  const vs=[...map.values()].map(e=>e.v),blocks=[],ref={map};
  Object.keys(SATS).forEach(k=>{
    if(only&&only.sat&&only.sat!==k) return;
    SATS[k].dims.forEach(d=>{
      const arr=vs.filter(v=>satOf(v)===k&&v.dim===d);if(!arr.length) return;
      let cur=null;
      const flush=()=>{if(cur&&cur.vars.length) blocks.push({key:g[0].id+'~'+d+'~'+blocks.length,nodes:g,map,node:g[0].id,sat:k,dim:d,grupo:[...new Set(cur.names)].slice(0,2).join(' · '),vars:cur.vars,prio:cur.vars.some(v=>prio.has(v.id))});cur=null;};
      groupsOf(arr).forEach(([gname,gi,garr])=>{
        const pend=garr.filter(v=>cvPendNodes(ref,v).length);if(!pend.length) return;
        for(let i=0;i<pend.length;i+=6){
          const part=pend.slice(i,i+6);
          if(!cur) cur={names:[gname],vars:[...part]};
          else if(cur.vars.length+part.length<=6){cur.names.push(gname);cur.vars.push(...part);}
          else{flush();cur={names:[gname],vars:[...part]};}
        }
      });
      flush();
    });
  });
  return blocks.sort((a,b)=>(b.prio?1:0)-(a.prio?1:0));
}

/* ---- guardar ---- */
function saveObsConv(nodeId,vid,val,na,nota){
  const v=varById(vid),m=S.meta;S.pending++;setSync();
  const p=S.chain.then(async()=>{
    const id=await mintId('OBS',6);
    await put('obs',id,{id,nodo:nodeId,variable:vid,valor:na?null:val,no_aplica:!!na,fuente:m.fuente==='auto'?(FUENTES[v.fuente]||''):m.fuente,confianza:m.confianza,periodo:m.periodo,nota:nota||'',captura:'conversación',capturado:nowIso(),por:S.uid||null,catv:allVars().length,vver:(v&&v.vver)||1});
    return id;
  });
  S.chain=p.then(()=>{},()=>{}).then(()=>{S.pending--;setSync();});
  return p;
}

/* ---- conversación ---- */
async function cvStart(only,group){
  const g=(group&&group.length?group:[stepLevel()]).filter(Boolean);
  if(!g.length){chooseEmpresa();return;}
  const sample=CV.on?await cvSample():null;
  if(!sample){
    if(CV.on&&!CV.noClaude){CV.noClaude=true;say('Claude no está disponible en esta vista; sigo con una pregunta a la vez.');}
    if(only&&only.sat&&startCorrClassic) return startCorrClassic(only.sat);
    startCapture();return;
  }
  CV.group=group||null;CV.blocks=buildBlocks(only,g);CV.bi=0;CV.scope=only||null;
  renderPath();renderSide();
  const E=empOfNode(g[0])||g[0];
  if(!CV.blocks.length){menu((group?'':levelMsg())+'Esto ya tiene todas sus variables registradas.');return;}
  say((group?'':levelMsg())+'Vamos a conversar por bloques: te cuento de qué trata cada uno, tú respondes con tus palabras y yo anoto lo que entienda. Son '+CV.blocks.length+(CV.blocks.length===1?' bloque.':' bloques.')+(CV.blocks[0].prio?' Empiezo por lo prioritario.':''));
  if(!CV.told){
    CV.told=true;
    say('Aviso: lo que escribas aquí se envía a Claude para interpretarlo, junto con la ficha de '+E.nombre+' y lo ya capturado. No se envían archivos. Siempre verás lo que entendí antes de guardarlo.');
  }
  cvRunBlock();
}
async function cvRunBlock(){
  const b=CV.blocks[CV.bi];
  if(!b){cvDone();return;}
  b.vars=cvPendVars(b,b.vars);
  if(!b.vars.length){cvNext();return;}
  CV.cur=b;CV.follow=0;CV.hist=[];b.scope=null;
  if(b.fixedPre){b.pre=b.fixedPre;say(b.pre.intro);say(b.pre.pregunta);cvComposer(b);return;}
  const wait=say('Preparando el bloque…');
  let pre=null;
  try{
    const sample=await cvSample();if(!sample) throw {code:'no_sample'};
    const o=await sample.json(cvOpenPrompt(b,cvCtxG(b.nodes)),{modelTier:'default',cache:false});
    if(o&&o.pregunta) pre={intro:String(o.intro||'').slice(0,400),pregunta:String(o.pregunta).slice(0,400),sugerencias:(Array.isArray(o.sugerencias)?o.sugerencias:[]).map(String).filter(Boolean).slice(0,3),ejemplos:(Array.isArray(o.ejemplos)?o.ejemplos:[]).map(String).filter(Boolean).slice(0,3),donde:String(o.donde||'').slice(0,240)};
  }catch(e){}
  wait.remove();
  b.pre=pre||cvFallback(b);
  say('Bloque '+(CV.bi+1)+' de '+CV.blocks.length+' · '+DIMS[b.dim]+' › '+b.grupo+'. '+b.pre.intro);
  say(b.pre.pregunta);
  cvComposer(b);
}
function cvComposer(b,placeholder){
  const ta=el('textarea',{rows:'3',placeholder:placeholder||'Escribe lo que sepas, aunque sea a medias',maxlength:'1500','aria-label':'Tu respuesta'}),err=el('div',{class:'err',role:'alert'});
  const send=()=>{const t=ta.value.trim();if(!t){err.textContent='Escribe algo, aunque sea una idea a medias, o toca una sugerencia.';return;}if(CV.busy) return;cvAnswer(b,t);};
  ta.addEventListener('input',()=>{err.textContent='';});
  ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}});
  const sugs=b.pre&&b.pre.sugerencias&&b.pre.sugerencias.length&&!b.scope?el('div',{class:'cvsug'},el('div',{class:'empty',style:'margin-bottom:6px',text:'Por lo que ya sé, podría ser algo así. Toca una para usarla:'}),chipRow(b.pre.sugerencias.map(t=>({label:t,fn:()=>{ta.value=(ta.value?ta.value+' ':'')+t;err.textContent='';ta.focus();}})))):null;
  const main=el('div',{class:'cvmain'},sugs,el('div',{class:'inrow'},el('div',{class:'infield'},ta),el('button',{class:'btn main',type:'button',onclick:send,text:'Enviar'})),err);
  const extras=chipRow([
    {label:'No sé qué responder',fn:()=>cvHelp(b)},
    {label:'Lo dejo para después',tone:'quiet',fn:()=>{echo('Lo dejo para después');say('Queda pendiente en tu ruta. Seguimos.');cvNext();}},
    {label:'Una pregunta a la vez',tone:'quiet',fn:()=>cvClassic(b)},
    {label:'Elegir corriente',tone:'quiet',fn:()=>{echo('Elegir corriente');startCapture();}},
    {label:'Terminar',tone:'quiet',fn:()=>{echo('Terminar');S.queue=[];menu('Sesión guardada. Todo lo que confirmaste ya quedó como observaciones.');}}
  ].concat(CV.extra?CV.extra(b):[]));
  setComposer(main,extras);
  setTimeout(()=>{try{ta.focus();}catch(e){}},60);
}
function cvHelp(b){
  echo('No sé qué responder');
  const p=b.pre||cvFallback(b),kids=[el('p',{text:'Te doy ejemplos para una empresa como esta. No son datos de ustedes, solo para inspirarte:'})];
  if(p.ejemplos&&p.ejemplos.length) kids.push(el('ul',{class:'notes',style:'color:inherit;font-size:14px'},...p.ejemplos.map(x=>el('li',{text:x}))));
  if(p.donde) kids.push(el('p',{class:'hint',text:p.donde}));
  kids.push(el('p',{class:'hint',text:'Si solo sabes una parte, cuéntame esa; lo demás queda pendiente.'}));
  bubble('bot',el('div',null,...kids));
  const ex=chipRow([
    {label:'Ayúdame a estimarlo',tone:'primary',fn:()=>cvEstimate(b)},
    {label:'Ya sé qué responder',fn:()=>{echo('Ya sé qué responder');cvComposer(b);}},
    {label:'Lo dejo para después',tone:'quiet',fn:()=>{echo('Lo dejo para después');say('Queda pendiente en tu ruta. Seguimos.');cvNext();}}
  ]);
  setComposer(ex);
}
async function cvEstimate(b){
  echo('Ayúdame a estimarlo');
  const wait=say('Pensando cómo estimarlo con lo que seguramente tienes a la mano…');
  try{
    const sample=await cvSample();if(!sample) throw {code:'no_sample'};
    const o=await sample.json(`La persona no sabe qué responder a esta pregunta de un bloque: «${b.pre?b.pre.pregunta:''}». Contexto (JSON): ${JSON.stringify(cvCtxG(b.nodes))}.
Variables del bloque:
${b.vars.map(cvVarLine).join('\n')}
Propón cómo estimarlo con información que una empresa así suele tener a la mano. Responde SOLO con JSON: {"pasos":["2 o 3 pasos concretos y cortos"],"pregunta":"una pregunta fácil de contestar con ese método"}. Español de México, tuteando, sin inventar datos de la empresa.`,{modelTier:'default',cache:false});
    wait.remove();
    const pasos=(Array.isArray(o&&o.pasos)?o.pasos:[]).map(String).filter(Boolean).slice(0,3);
    if(!pasos.length) throw {code:'invalid_json'};
    bubble('bot',el('div',null,el('p',{text:'Una forma de estimarlo:'}),el('ol',{class:'notes',style:'color:inherit;font-size:14px'},...pasos.map(x=>el('li',{text:x}))),o.pregunta?el('p',{text:String(o.pregunta)}):null));
  }catch(e){wait.remove();say((CV_ERR[e&&e.code]||'No pude proponer un método ahora.')+' Puedes contarme lo que sepas o dejarlo para después.');}
  cvComposer(b,'Cuéntame lo que encuentres, aunque sea aproximado');
}
function cvClassic(b){
  echo('Una pregunta a la vez');
  S.dimMode=null;S.phase=null;S.curSat=b.sat;
  S.queue=[];
  b.vars.forEach(v=>cvPendNodes(b,v).forEach(x=>S.queue.push({nodeId:x.id,vid:v.id,prio:false})));
  S.then=()=>cvNext();S.thenMsg=null;
  askVar();
}
function cvNext(){CV.bi++;if(CV.bi<CV.blocks.length) cvRunBlock();else cvDone();}
function cvDone(){
  const g=(CV.group&&CV.group.length?CV.group:[stepLevel()]).filter(Boolean);
  let done=0,total=0;g.forEach(x=>{const p=nodeProg(x);done+=p.done;total+=p.total;});
  menu('Terminamos los bloques: '+done+' de '+total+' variables registradas.'+(done<total?' Lo pendiente queda en tu ruta.':''));
}
async function cvAnswer(b,texto){
  CV.busy=true;echo(texto);
  const vars=b.scope||cvPendVars(b,b.vars),ids=new Set(vars.map(v=>v.id)),wait=say('Leyendo tu respuesta…');
  const others=[...b.map.values()].map(e=>e.v).filter(v=>!ids.has(v.id)&&cvPendNodes(b,v).length).sort((x,y)=>(satOf(y)===b.sat?1:0)-(satOf(x)===b.sat?1:0)).slice(0,40);
  setComposer(el('div',{class:'empty',text:'Un momento…'}));
  try{
    const sample=await cvSample();if(!sample) throw {code:'no_sample'};
    const o=await sample.json(cvExtractPrompt(b,cvCtxG(b.nodes),vars,others,texto),{modelTier:'default',cache:false});
    wait.remove();CV.hist.push(clipT(texto,300));
    cvReview(b,vars,others,o||{});
  }catch(e){
    wait.remove();
    say((CV_ERR[e&&e.code]||('No pude interpretar tu respuesta: '+msgOf(e)))+' Puedes intentarlo de nuevo, contestar una pregunta a la vez o dejarlo para después.');
    cvComposer(b);
  }
  CV.busy=false;
}
function cvReview(b,vars,others,o){
  const multi=b.nodes.length>1,valMap=new Map();
  (Array.isArray(o.valores)?o.valores:[]).filter(x=>x&&x.id).forEach(x=>{const a=valMap.get(x.id)||[];a.push(x);valMap.set(x.id,a);});
  const naSet=new Set(Array.isArray(o.no_aplica)?o.no_aplica:[]);
  const falt=new Map((Array.isArray(o.faltan)?o.faltan:[]).filter(x=>x&&x.id).map(x=>[x.id,x.pista||'']));
  const match=(x,node)=>{
    if(!multi) return true;
    const s=String(x.nodo||'').trim().toLowerCase();if(!s||s==='todos'||s==='todas') return true;
    const t=nodeNm(node).toLowerCase();return t===s||t.includes(s)||s.includes(t);
  };
  const rows=[];
  const mk=(v,extra)=>cvPendNodes(b,v).forEach(x=>{
    if(naSet.has(v.id)){rows.push({v,n:x,estado:'na',on:true,val:'',extra});return;}
    const hit=(valMap.get(v.id)||[]).find(z=>match(z,x));
    if(hit){const nm=cvNorm(v,hit.valor);if(nm.ok){rows.push({v,n:x,estado:hit.confianza==='deducido'?'deducido':'literal',on:true,val:String(nm.val),evid:String(hit.evidencia||'').slice(0,200),extra});return;}}
    if(!extra) rows.push({v,n:x,estado:'falta',on:false,val:'',pista:falt.get(v.id)||'',extra});
  });
  vars.forEach(v=>mk(v,false));others.forEach(v=>mk(v,true));
  const card=el('div',{class:'cvcard'});
  card.append(el('div',{class:'cvtitle',text:'Esto es lo que entendí'}));
  if(o.comentario) card.append(el('p',{class:'hint',style:'margin:0 0 8px',text:String(o.comentario).slice(0,240)}));
  const renderRow=(r,lastVar)=>{
    const v=r.v,cb=el('input',{type:'checkbox','aria-label':'Guardar '+v.nombre+(multi?' de '+nodeNm(r.n):'')});cb.checked=r.on;cb.addEventListener('change',e=>{r.on=e.target.checked;});
    let ed;
    if(r.estado==='na') ed=el('span',{class:'empty',text:'No aplica'});
    else if(v.tipo==='e'){ed=el('select',null,el('option',{value:'',text:'—'}),...[1,2,3,4,5].map(i=>el('option',{value:String(i),text:i+' de 5'})));ed.value=r.val;}
    else if(v.tipo==='sn'){ed=el('select',null,el('option',{value:'',text:'—'}),el('option',{value:'Sí',text:'Sí'}),el('option',{value:'No',text:'No'}));ed.value=r.val;}
    else if(v.tipo==='c'){ed=el('select',null,el('option',{value:'',text:'—'}),...(v.opts||[]).map(x=>el('option',{value:x,text:x})));ed.value=r.val;}
    else if(v.tipo==='t'){ed=el('textarea',{rows:'2',maxlength:'400'});ed.value=r.val;}
    else{ed=el('input',{type:'text',inputmode:'decimal',maxlength:'20'});ed.value=r.val;}
    if(r.estado!=='na') ed.addEventListener('change',e=>{r.val=e.target.value;if(r.val&&r.estado==='falta'){r.estado='literal';r.on=true;cb.checked=true;}});
    const badge=el('span',{class:'cvb '+r.estado,text:{literal:'lo dijiste',deducido:'deducido: confirma',falta:'falta',na:'no aplica'}[r.estado]});
    return el('div',{class:'cvrow'},el('label',{class:'cvck'},cb,el('b',{text:multi?nodeNm(r.n):v.nombre})),badge,el('div',{class:'cved'},ed),
      r.evid?el('div',{class:'cvev',text:'«'+r.evid+'»'}):(r.pista?el('div',{class:'cvev',text:r.pista}):null));
  };
  const section=(list,title)=>{
    if(!list.length) return;
    if(title) card.append(el('div',{class:'cvsub',text:title}));
    let last=null;
    list.forEach(r=>{
      if(multi&&last!==r.v.id){card.append(el('div',{class:'cvvar',text:r.v.nombre}));last=r.v.id;}
      card.append(renderRow(r));
    });
  };
  section(rows.filter(r=>!r.extra),null);
  section(rows.filter(r=>r.extra),'También entendí esto, que era de otros bloques');
  const cont=Array.isArray(o.contradicciones)?o.contradicciones.map(x=>String(x&&x.texto||'')).filter(Boolean):[];
  if(cont.length) card.append(el('div',{class:'impmsg warn',style:'margin:10px 0 0'},'Ojo: '+cont.join(' · ')));
  const aprend=(Array.isArray(o.aprendizajes)?o.aprendizajes:[]).filter(a=>a&&a.texto);
  if(aprend.length) card.append(el('p',{class:'hint',style:'margin:10px 0 0',text:'Voy a recordar: '+aprend.map(a=>a.texto).join(' · ')}));
  const msg=el('div',{class:'res',role:'status',style:'margin-top:8px'});
  const saveBtn=el('button',{class:'btn main',type:'button',text:'Guardar lo que entendí'});
  saveBtn.addEventListener('click',async()=>{
    const sel=rows.filter(r=>r.on);
    const bad=sel.filter(r=>r.estado!=='na'&&!cvNorm(r.v,r.val).ok);
    if(bad.length){msg.className='res bad';msg.textContent='Revisa el valor de «'+bad[0].v.nombre+(multi?' · '+nodeNm(bad[0].n):'')+'»: no coincide con lo que se espera ('+TIPO_ES_BO(bad[0].v)+').';return;}
    if(!sel.length){msg.className='res bad';msg.textContent='No hay nada marcado para guardar. Puedes marcar lo que quieras guardar o responder de nuevo.';return;}
    saveBtn.disabled=true;msg.className='res';msg.textContent='Guardando…';
    try{
      for(const r of sel){
        if(r.estado==='na') await saveObsConv(r.n.id,r.v.id,null,true,'');
        else await saveObsConv(r.n.id,r.v.id,cvNorm(r.v,r.val).val,false,(r.evid?'«'+r.evid+'»':'')+(r.estado==='deducido'?' · deducido y confirmado':''));
      }
      const e=empOfNode(b.nodes[0])||b.nodes[0];
      let nl=0;try{nl=await memAdd(e.id,aprend);}catch(err){}
      msg.className='res ok';msg.textContent='Guardado: '+sel.length+(sel.length===1?' dato.':' datos.')+(nl?' Anoté '+nl+(nl===1?' cosa nueva.':' cosas nuevas.'):'');
      cvAfterSave(b,vars,o);
    }catch(err){saveBtn.disabled=false;msg.className='res bad';msg.textContent='No se guardó: '+msgOf(err)+'. Revisa que tengas permiso de edición.';}
  });
  card.append(el('div',{class:'row2'},saveBtn,el('button',{class:'btn',type:'button',text:'Responder de nuevo',onclick:()=>{echo('Responder de nuevo');cvComposer(b);}}),msg));
  bubble('bot',card);
  setComposer(el('div',{class:'empty',text:'Revisa lo que entendí, corrige lo que haga falta y guarda. También puedes responder de nuevo.'}),chipRow([
    {label:'Una pregunta a la vez',tone:'quiet',fn:()=>cvClassic(b)},
    {label:'Lo dejo para después',tone:'quiet',fn:()=>{echo('Lo dejo para después');cvNext();}}
  ].concat(CV.extra?CV.extra(b):[])));
}
function cvAfterSave(b,vars,o){
  const rem=cvPendVars(b,vars),seg=o&&o.seguimiento&&o.seguimiento.pregunta?o.seguimiento:null;
  if(b.onSaved) try{b.onSaved(rem);}catch(e){}
  if(rem.length&&seg&&CV.follow<2){
    CV.follow++;b.scope=rem;
    say(String(seg.pregunta).slice(0,300)+(seg.ejemplo?' Por ejemplo: '+String(seg.ejemplo).slice(0,200):''));
    cvComposer(b,'Cuéntame lo que sepas de esto, aunque sea aproximado');
    return;
  }
  say(rem.length?'Listo ese bloque. Quedan pendientes: '+rem.map(v=>v.nombre).join(', ')+'. Siguen en tu ruta.':'Listo ese bloque.');
  setComposer(chipRow([
    {label:CV.bi+1<CV.blocks.length?'Siguiente bloque':'Terminar',tone:'primary',fn:()=>{echo('Siguiente');cvNext();}},
    ...(rem.length&&CV.afterChips?CV.afterChips(b,rem):[]),
    {label:'Pausar aquí',tone:'quiet',fn:()=>{echo('Pausar');menu('Pausamos. Todo lo que guardaste ya quedó registrado.');}}
  ]));
}

/* ---- entrada desde la ruta y desde las corrientes ---- */
function goStep(emp,s){
  S.ctx.emp=emp.id;S.ctx.grp=false;
  if(s.kind==='prd'){S.ctx.prd=s.node.id;S.ctx.cli=null;renderPath();cvStart(null);}
  else if(s.kind==='cli'){
    const c=s.node;
    if(!c.tipoCliente){segmentFlow(emp,c,()=>choosePrd(S.nodes[emp.id]||emp));return;}
    S.ctx.cli=c.id;S.ctx.prd=null;renderPath();cvStart(null);
  }
  else if(s.kind==='emp'){S.ctx.prd=null;S.ctx.cli=null;renderPath();cvStart(null);}
  else stepGrupo(emp);
}
{
  const _sCorr=startCorr;startCorrClassic=_sCorr;
  startCorr=function(k){
    if(CV.on&&S.ctx.emp){echo(SATS[k].nombre);return cvStart({sat:k});}
    return _sCorr(k);
  };
  const _rs2=renderSide;
  renderSide=function(){_rs2();renderMem();};
}

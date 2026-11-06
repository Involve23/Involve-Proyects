/* ===================== Captura para CEO (un artefacto por empresa) ===================== */
const CEO=window.CAPTURA_MODE||{emp:'',nombre:''};
BO.cons=BO.cons||{};
const CEO_EQUIPO=['Brayan','Marketing'];
const ceoPrds=()=>nodesOf('PRD').filter(p=>p.padre===CEO.emp).sort(byIdN);
const ceoClis=()=>clisOf(CEO.emp);
const ceoEmp=()=>S.nodes[CEO.emp];
const CEO_STEPS=[
  {k:'prd',label:'Tus productos',one:'producto',nodes:()=>ceoPrds()},
  {k:'cli',label:'Tus clientes',one:'cliente',nodes:()=>ceoClis()},
  {k:'emp',label:'Tu empresa',one:'empresa',nodes:()=>[ceoEmp()].filter(Boolean)}
];
function ceoProg(nodes){let done=0,total=0;nodes.forEach(n=>{const p=nodeProg(n);done+=p.done;total+=p.total;});return {done,total,pct:total?Math.round(done/total*100):0};}
const ceoStepDone=s=>{const ns=s.nodes();if(!ns.length) return false;const p=ceoProg(ns);return p.total===0||p.done>=p.total;};
/* ---- consultas al equipo ---- */
async function consPut(id,data){
  const prev=BO.cons[id];BO.cons[id]=data;scheduleRender();
  if(S.mem) return;
  try{await S.db.doc('consultas/'+id).set(data);}
  catch(e){if(prev) BO.cons[id]=prev;else delete BO.cons[id];scheduleRender();throw e;}
}
const consultasAbiertas=()=>Object.values(BO.cons).filter(c=>c.estado==='abierta');
function consultedSet(){const s=new Set();consultasAbiertas().forEach(c=>(c.bloque&&c.bloque.pares||[]).forEach(p=>s.add(p)));return s;}
{
  const _pn=cvPendNodes;
  cvPendNodes=function(b,v){
    const base=_pn(b,v);
    if(b.forConsulta) return base;
    const cs=consultedSet();
    return cs.size?base.filter(x=>!cs.has(v.id+'|'+x.id)):base;
  };
}
async function ceoAsk(b,vars){
  echo('No sé: preguntar al equipo');
  const vs=(vars&&vars.length?vars:cvPendVars(b,b.vars));
  if(!vs.length){say('Ya no queda nada pendiente en este bloque.');cvNext();return;}
  say('¿A quién se lo preguntamos? Le llegará lo que no sabes de este bloque.');
  setComposer(chipRow([
    ...CEO_EQUIPO.map(p=>({label:p==='Marketing'?'A Marketing':'A '+p,tone:'primary',fn:()=>ceoAskNote(b,vs,p)})),
    {label:'Mejor lo intento yo',tone:'quiet',fn:()=>{echo('Mejor lo intento yo');cvComposer(b);}}
  ]));
}
function ceoAskNote(b,vs,para){
  echo(para==='Marketing'?'A Marketing':'A '+para);
  say('Si quieres, agrega una nota para '+(para==='Marketing'?'Marketing':para)+' (por ejemplo, qué parte sí sabes o con quién hablar). Es opcional.');
  const ta=el('textarea',{rows:'2',placeholder:'Nota opcional',maxlength:'400','aria-label':'Nota para el equipo'});
  const go=async nota=>{
    try{
      const pares=[];vs.forEach(v=>cvPendNodes(b,v).forEach(x=>pares.push(v.id+'|'+x.id)));
      const id=await mintId('CON',4);
      await consPut(id,{id,para,nota:String(nota||'').trim().slice(0,400),estado:'abierta',por:S.uid||null,cuando:nowIso(),
        bloque:{sat:b.sat,dim:b.dim,grupo:b.grupo,pregunta:b.pre?b.pre.pregunta:'',nodos:b.nodes.map(x=>x.id),vars:vs.map(v=>v.id),pares}});
      say('Listo: le pasé esto a '+(para==='Marketing'?'Marketing':para)+'. Lo verás en «Pendientes con el equipo», y cuando respondan se llena solo.');
      cvNext();
    }catch(e){say('No se pudo enviar: '+msgOf(e)+'. Revisa que tengas permiso de edición.');cvComposer(b);}
  };
  setComposer(el('div',{class:'cvmain'},el('div',{class:'inrow'},el('div',{class:'infield'},ta),el('button',{class:'btn main',type:'button',text:'Enviar',onclick:()=>{echo(ta.value.trim()||'Sin nota');go(ta.value);}}))),
    chipRow([{label:'Enviar sin nota',fn:()=>{echo('Sin nota');go('');}},{label:'Cancelar',tone:'quiet',fn:()=>{echo('Cancelar');cvComposer(b);}}]));
}
CV.extra=b=>[{label:'No sé: preguntar al equipo',tone:'quiet',fn:()=>ceoAsk(b)}];
CV.afterChips=(b,rem)=>[{label:'Pasar lo que falta al equipo',fn:()=>ceoAsk(b,rem)}];
function renderConsultas(){
  const box=document.getElementById('cons-body');if(!box) return;
  const all=Object.values(BO.cons).sort((a,b)=>String(b.cuando).localeCompare(String(a.cuando)));
  const ab=all.filter(c=>c.estado==='abierta'),rs=all.filter(c=>c.estado!=='abierta');
  const card=c=>{
    const vs=(c.bloque.vars||[]).map(id=>{const v=varById(id);return v?v.nombre:id;});
    return el('div',{class:'card',style:'margin-bottom:12px'},
      el('div',{class:'vhead'},el('span',{class:'tag',text:'Para '+c.para}),el('span',{class:'tag',style:c.estado==='abierta'?'background:var(--feedback-warning-bg);color:var(--feedback-warning)':'background:var(--feedback-success-bg);color:var(--feedback-success-strong)',text:c.estado==='abierta'?'abierta':'respondida'}),el('span',{class:'dimtag',text:capName(c.por)+' · '+agoTxt(c.cuando)})),
      el('h3',{style:'font-size:16px;margin:8px 0 4px',text:DIMS[c.bloque.dim]+' › '+c.bloque.grupo}),
      c.bloque.pregunta?el('p',{text:c.bloque.pregunta}):null,
      c.nota?el('p',{class:'empty',text:'Nota: '+c.nota}):null,
      el('p',{class:'empty',text:'Variables: '+vs.join(', ')}),
      c.estado==='abierta'?el('div',{class:'row2'},el('button',{class:'btn main',type:'button',text:'Responder',onclick:()=>ceoAnswerConsulta(c)})):el('p',{class:'empty',text:'Respondida por '+capName(c.respondidoPor)+' · '+agoTxt(c.respondidoCuando)+'.'}));
  };
  const kids=[el('div',{class:'row2',style:'margin-top:0'},el('button',{class:'btn',type:'button',text:'Descargar mis respuestas',onclick:ceoExport}))];
  kids.push(el('h3',{style:'font-size:18px;margin:18px 0 10px',text:'Abiertas ('+ab.length+')'}));
  if(!ab.length) kids.push(el('p',{class:'empty',text:'No hay preguntas abiertas. Cuando pases algo al equipo desde la captura, aparece aquí.'}));
  ab.forEach(c=>kids.push(card(c)));
  if(rs.length){kids.push(el('h3',{style:'font-size:18px;margin:22px 0 10px',text:'Respondidas ('+rs.length+')'}));rs.forEach(c=>kids.push(card(c)));}
  box.replaceChildren(...kids);
}
function ceoAnswerConsulta(c){
  const nodes=(c.bloque.nodos||[]).map(id=>S.nodes[id]).filter(Boolean);
  const vars=(c.bloque.vars||[]).map(varById).filter(Boolean);
  if(!nodes.length||!vars.length){alert('Esta pregunta ya no tiene variables ni nodos disponibles.');return;}
  setTab('capture');
  const map=cvAppl(nodes);
  const b={key:'cons-'+c.id,nodes,map,node:nodes[0].id,sat:c.bloque.sat,dim:c.bloque.dim,grupo:c.bloque.grupo,vars,forConsulta:true,
    fixedPre:{intro:'Te pasaron esta pregunta'+(c.nota?' con una nota: «'+c.nota+'».':'.'),pregunta:c.bloque.pregunta||'Cuéntame lo que sepas de este tema.',sugerencias:[],ejemplos:[],donde:''},
    onSaved:async rem=>{try{await consPut(c.id,{...BO.cons[c.id],estado:rem.length?'abierta':'respondida',respondidoPor:S.uid||null,respondidoCuando:nowIso(),parcial:!!rem.length});}catch(e){}}};
  CV.group=nodes;CV.blocks=[b];CV.bi=0;CV.scope=null;
  S.ctx={emp:CEO.emp,prd:null,cli:null,grp:false};renderPath();renderSide();
  say('Respondiendo una pregunta para '+c.para+' sobre «'+DIMS[c.bloque.dim]+' › '+c.bloque.grupo+'».');
  cvRunBlock();
}
async function ceoExport(){
  if(!dlNs){alert('La descarga no está disponible en esta vista.');return;}
  const nodos=Object.values(S.nodes).filter(n=>n.tipo!=='GRP'),obs=Object.values(S.obs);
  const data={empresa:CEO.nombre,empresa_id:CEO.emp,exportado:nowIso(),nodos,observaciones:obs.map(o=>({...o,variable_nombre:(varById(o.variable)||{}).nombre})),aprendizajes:memItems(CEO.emp),consultas:Object.values(BO.cons)};
  try{await dlNs.save({filename:'Captura_'+String(CEO.nombre).replace(/[^A-Za-z0-9]+/g,'_')+'_'+new Date().toISOString().slice(0,10)+'.json',data:JSON.stringify(data,null,2)});}
  catch(e){if(!e||e.code!=='declined') alert('No se pudo descargar: '+msgOf(e));}
}

/* ---- alta conversacional: ficha, productos y clientes ---- */
const ONB={
  ficha:{
    intro:E=>'Para empezar, quiero conocer a '+E.nombre+'.',
    pregunta:E=>'Cuéntame a qué se dedica '+E.nombre+': qué vende, a quién, en qué mercado compite y qué te gustaría resolver con este análisis.',
    ejemplos:['Vendemos plataformas de evaluación para reclutar personal en pymes de México; queremos entender por qué baja la recompra.','Somos una distribuidora de alimentos para restaurantes del centro del país; queremos saber qué productos crecer.'],
    donde:'Basta con lo que tú sabes del negocio; no necesitas buscar nada.'
  },
  productos:{
    intro:E=>'Ahora los productos o servicios de '+E.nombre+'.',
    pregunta:E=>'¿Qué productos o servicios vende '+E.nombre+'? Nómbralos todos y, si puedes, cuéntame en qué momento está cada uno: en desarrollo, recién lanzado, creciendo, maduro o renovándose.',
    ejemplos:['Connect, que reclutadores usan para publicar vacantes; está maduro. Métría, evaluaciones psicométricas, recién lanzado.','Tres líneas: café de grano (maduro), cápsulas (creciendo) y una bebida nueva en desarrollo.'],
    donde:'Piensa en lo que se cobra por separado o tiene su propio equipo.'
  },
  clientes:{
    intro:E=>'Ahora, a quién le vende '+E.nombre+'.',
    pregunta:E=>'¿Quiénes son los clientes de '+E.nombre+'? Cuéntame los tipos de clientes que atiendes, y si con alguno quieres crecer, retenerlo o recuperarlo.',
    ejemplos:['Dueños de pymes que contratan mucho y líderes de recursos humanos de empresas medianas; con las pymes queremos crecer.','Consumidor final que compra en tienda y distribuidores que revenden; a los distribuidores queremos retenerlos.'],
    donde:'Un tipo de cliente es un grupo que compra por razones parecidas: no una persona ni una empresa en particular.'
  }
};
function onbPrompt(kind,E,texto){
  const base='Eres un asistente de captura de una inteligencia de negocio. Hablas en español de México. Extrae información SOLO de lo que la persona dijo; no inventes. Deja vacío lo que no mencionó.\n\nEMPRESA: '+E.nombre+'\nPREGUNTA QUE HICISTE: '+ONB[kind].pregunta(E)+'\nRESPUESTA: """'+texto+'"""\n\n';
  if(kind==='ficha') return base+'Devuelve SOLO JSON: {"industria":"elige la más cercana de: '+INDUSTRIAS.join(', ')+'; si ninguna encaja, escribe la tuya","categoria":"categoría en la que compite","mercado":"mercado geográfico","pregunta":"pregunta de negocio que quiere resolver","decision":"decisión que se va a tomar","fuentes":"fuentes de información que mencionó","comentario":"una frase cálida que reconozca lo que contó"}';
  if(kind==='productos') return base+'Etapas posibles: '+ETAPAS.map(e=>e.k+' ('+e.s+')').join('; ')+'.\nDevuelve SOLO JSON: {"productos":[{"nombre":"nombre del producto o servicio","etapa":"una de las etapas posibles o vacío si no dijo","nota":"evidencia breve de la etapa o vacío"}],"comentario":"una frase cálida"}';
  return base+'Tipos de cliente: B2C (persona que compra para sí), B2B (organización que compra), B2B2C (distribuidor o canal que revende), Institucional (gobierno, licitaciones). Estrategias: Adquisición, Retención, Cross-selling, Recuperación.\nDevuelve SOLO JSON: {"clientes":[{"nombre":"nombre corto del tipo de cliente","tipo":"B2C, B2B, B2B2C o Institucional","estrategia":"una de las estrategias o vacío si no dijo","nota":""}],"comentario":"una frase cálida"}';
}
function ceoOnboard(kind){
  const E=ceoEmp(),O=ONB[kind];
  say(O.intro(E)+' '+O.pregunta(E));
  const ta=el('textarea',{rows:'3',placeholder:'Escribe con tus palabras, aunque sea a medias',maxlength:'1500','aria-label':'Tu respuesta'}),err=el('div',{class:'err',role:'alert'});
  const send=async()=>{
    const t=ta.value.trim();if(!t){err.textContent='Escribe algo, aunque sea una idea a medias.';return;}
    echo(t);const wait=say('Leyendo tu respuesta…');setComposer(el('div',{class:'empty',text:'Un momento…'}));
    try{
      const sample=await cvSample();if(!sample) throw {code:'no_sample'};
      const o=await sample.json(onbPrompt(kind,E,t),{modelTier:'default',cache:false});
      wait.remove();ceoOnbReview(kind,o||{});
    }catch(e){wait.remove();say((CV_ERR[e&&e.code]||'No pude interpretar tu respuesta.')+' Intenta de nuevo.');ceoOnboard(kind);}
  };
  ta.addEventListener('input',()=>{err.textContent='';});
  ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}});
  setComposer(el('div',{class:'cvmain'},el('div',{class:'inrow'},el('div',{class:'infield'},ta),el('button',{class:'btn main',type:'button',text:'Enviar',onclick:send})),err),
    chipRow([{label:'No sé qué responder',fn:()=>{echo('No sé qué responder');bubble('bot',el('div',null,el('p',{text:'Te doy ejemplos. No son datos de tu empresa, solo para inspirarte:'}),el('ul',{class:'notes',style:'color:inherit;font-size:14px'},...O.ejemplos.map(x=>el('li',{text:x}))),el('p',{class:'hint',text:O.donde})));}}]));
  setTimeout(()=>{try{ta.focus();}catch(e){}},60);
}
function ceoOnbReview(kind,o){
  const E=ceoEmp(),card=el('div',{class:'cvcard'}),msg=el('div',{class:'res',role:'status',style:'margin-top:8px'});
  card.append(el('div',{class:'cvtitle',text:'Esto es lo que entendí'}));
  if(o.comentario) card.append(el('p',{class:'hint',style:'margin:0 0 8px',text:String(o.comentario).slice(0,240)}));
  let rows=[],saveFn;
  const field=(label,val,cb,max)=>{const i=el('input',{type:'text',maxlength:String(max||160)});i.value=val||'';i.addEventListener('change',e=>cb(e.target.value));return el('label',{class:'cvfld'},label,i);};
  if(kind==='ficha'){
    const f={industria:String(o.industria||''),categoria:String(o.categoria||''),mercado:String(o.mercado||''),pregunta:String(o.pregunta||''),decision:String(o.decision||''),fuentes:String(o.fuentes||'')};
    [['industria','Industria'],['categoria','Categoría'],['mercado','Mercado'],['pregunta','Pregunta de negocio'],['decision','Decisión que se tomará'],['fuentes','Fuentes de información']].forEach(([k,l])=>card.append(field(l,f[k],v=>{f[k]=v;})));
    saveFn=async()=>{if(!f.industria.trim()) throw new Error('Falta la industria. Escríbela o elige la más cercana.');await put('nodes',E.id,{...S.nodes[E.id],ficha:{industria:f.industria.trim(),categoria:f.categoria.trim(),mercado_geo:f.mercado.trim(),pregunta:f.pregunta.trim(),decision:f.decision.trim(),fuentes:f.fuentes.trim()}});};
  }else if(kind==='productos'){
    rows=(Array.isArray(o.productos)?o.productos:[]).filter(x=>x&&x.nombre).map(x=>({on:true,nombre:String(x.nombre).slice(0,80),etapa:ETAPAS.some(e=>e.k===x.etapa)?x.etapa:'',nota:String(x.nota||'').slice(0,160)}));
    const draw=()=>{card.querySelectorAll('.onbrow').forEach(n=>n.remove());rows.forEach(r=>{
      const cb=el('input',{type:'checkbox','aria-label':'Crear '+r.nombre});cb.checked=r.on;cb.addEventListener('change',e=>{r.on=e.target.checked;});
      const sel=el('select',null,el('option',{value:'',text:'Etapa por definir'}),...ETAPAS.map(e=>el('option',{value:e.k,text:e.k})));sel.value=r.etapa;sel.addEventListener('change',e=>{r.etapa=e.target.value;});
      const nm=el('input',{type:'text',maxlength:'80'});nm.value=r.nombre;nm.addEventListener('change',e=>{r.nombre=e.target.value;});
      card.insertBefore(el('div',{class:'onbrow'},cb,nm,sel),addBtn);});};
    const addBtn=el('button',{class:'btn',type:'button',text:'Agregar otro producto',onclick:()=>{rows.push({on:true,nombre:'',etapa:'',nota:''});draw();}});
    card.append(addBtn);draw();
    saveFn=async()=>{
      const ex=new Set(ceoPrds().map(p=>p.nombre.toLowerCase())),sel=rows.filter(r=>r.on&&r.nombre.trim()&&!ex.has(r.nombre.trim().toLowerCase()));
      if(!sel.length&&!ceoPrds().length) throw new Error('Agrega al menos un producto.');
      for(const r of sel){const id=await mintId('PRD',4);await put('nodes',id,{id,tipo:'PRD',nombre:r.nombre.trim(),padre:E.id,estado:'activo',alias:[],etapa:r.etapa||'Madurez',etapa_evidencia:r.etapa?r.nota:'Etapa por confirmar',creado:nowIso(),por:S.uid||null});}
    };
  }else{
    rows=(Array.isArray(o.clientes)?o.clientes:[]).filter(x=>x&&x.nombre).map(x=>({on:true,nombre:String(x.nombre).slice(0,80),tipo:CLI_TIPOS.includes(x.tipo)?x.tipo:'',estrategia:CLI_ESTR.includes(x.estrategia)?x.estrategia:''}));
    const draw=()=>{card.querySelectorAll('.onbrow').forEach(n=>n.remove());rows.forEach(r=>{
      const cb=el('input',{type:'checkbox','aria-label':'Crear '+r.nombre});cb.checked=r.on;cb.addEventListener('change',e=>{r.on=e.target.checked;});
      const nm=el('input',{type:'text',maxlength:'80'});nm.value=r.nombre;nm.addEventListener('change',e=>{r.nombre=e.target.value;});
      const st=el('select',null,el('option',{value:'',text:'Tipo por definir'}),...CLI_TIPOS.map(t=>el('option',{value:t,text:TIPO_LBL[t]})));st.value=r.tipo;st.addEventListener('change',e=>{r.tipo=e.target.value;});
      const se=el('select',null,el('option',{value:'',text:'Estrategia por definir'}),...CLI_ESTR.map(t=>el('option',{value:t,text:t})));se.value=r.estrategia;se.addEventListener('change',e=>{r.estrategia=e.target.value;});
      card.insertBefore(el('div',{class:'onbrow'},cb,nm,st,se),addBtn);});};
    const addBtn=el('button',{class:'btn',type:'button',text:'Agregar otro tipo de cliente',onclick:()=>{rows.push({on:true,nombre:'',tipo:'',estrategia:''});draw();}});
    card.append(addBtn);draw();
    saveFn=async()=>{
      const ex=new Set(ceoClis().map(c=>segName(c).toLowerCase())),sel=rows.filter(r=>r.on&&r.nombre.trim()&&!ex.has(r.nombre.trim().toLowerCase()));
      if(!sel.length&&!ceoClis().length) throw new Error('Agrega al menos un tipo de cliente.');
      const bad=sel.find(r=>!r.tipo);if(bad) throw new Error('Elige el tipo de «'+bad.nombre+'»: define qué preguntas le tocan.');
      for(const r of sel){const c=await newCli(E);await saveSegmento(E,c,{segmento:r.nombre.trim(),tipo:r.tipo,estrategia:r.estrategia});}
    };
  }
  const btn=el('button',{class:'btn main',type:'button',text:kind==='ficha'?'Guardar la ficha':kind==='productos'?'Crear los productos':'Crear los tipos de cliente'});
  btn.addEventListener('click',async()=>{
    btn.disabled=true;msg.className='res';msg.textContent='Guardando…';
    try{await saveFn();msg.className='res ok';msg.textContent='Listo.';setTimeout(ceoHome,500);}
    catch(e){btn.disabled=false;msg.className='res bad';msg.textContent=msgOf(e)+(/permiso/i.test(msgOf(e))?'':'');}
  });
  card.append(el('div',{class:'row2'},btn,el('button',{class:'btn',type:'button',text:'Responder de nuevo',onclick:()=>{echo('Responder de nuevo');ceoOnboard(kind);}}),msg));
  bubble('bot',card);
  setComposer(el('div',{class:'empty',text:'Revisa lo que entendí, corrige lo que haga falta y confirma.'}));
}

/* ---- inicio, ruta y menú ---- */
function ceoWelcome(E){
  say('Hola. Soy el asistente de captura de '+E.nombre+'. Te voy a hacer preguntas por bloques; respondes con tus palabras y yo lo interpreto. Siempre verás lo que entendí antes de guardar, y lo que no se repite no te lo vuelvo a preguntar.');
  say('Lo que no sepas, me lo dices y se lo paso a Brayan o a Marketing para que lo respondan. Puedes parar cuando quieras: todo se guarda y retomas donde te quedaste.');
}
function ceoHome(){
  const E=ceoEmp();
  if(!E){
    if(!CEO.wait){
      CEO.wait=true;say('Preparando tu captura…');setComposer(el('div',{class:'empty',text:'Un momento…'}));
      setTimeout(()=>{if(CEO.wait&&!ceoEmp()){CEO.wait=false;say('No pude cargar esta captura. Recarga la página; si sigue igual, avísale a Brayan.');setComposer(chipRow([{label:'Reintentar',tone:'primary',fn:()=>{echo('Reintentar');ceoHome();}}]));}},12000);
    }
    return;
  }
  CEO.wait=false;
  S.ctx={emp:CEO.emp,prd:null,cli:null,grp:false};S.queue=[];S.then=null;renderPath();renderSide();
  if(!CEO.hi){CEO.hi=true;ceoWelcome(E);}
  if(!E.ficha||!E.ficha.industria) return ceoOnboard('ficha');
  if(!ceoPrds().length) return ceoOnboard('productos');
  if(!ceoClis().length) return ceoOnboard('clientes');
  ceoMenu('¿Por dónde seguimos?');
}
function ceoMenu(msg){
  if(msg) say(msg);
  const first=CEO_STEPS.find(s=>!ceoStepDone(s)),items=[];
  CEO_STEPS.forEach((s,i)=>{
    const p=ceoProg(s.nodes());
    items.push({label:(i+1)+' · '+s.label,sub:p.pct+'%',tone:first===s?'primary':undefined,fn:()=>{echo(s.label);ceoRunStep(s);}});
  });
  items.push({label:'Agregar un producto',fn:()=>{echo('Agregar un producto');ceoOnboard('productos');}});
  items.push({label:'Agregar un tipo de cliente',fn:()=>{echo('Agregar un tipo de cliente');ceoOnboard('clientes');}});
  const na=consultasAbiertas().length;
  items.push({label:'Pendientes con el equipo'+(na?' ('+na+')':''),tone:'quiet',fn:()=>{echo('Pendientes con el equipo');setTab('consultas');}});
  setComposer(chipRow(items));
}
function ceoRunStep(s){
  const nodes=s.nodes();
  if(!nodes.length){ceoOnboard(s.k==='prd'?'productos':'clientes');return;}
  S.ctx={emp:CEO.emp,prd:null,cli:null,grp:false};renderPath();
  say(s.label+(nodes.length>1?': hablaremos de '+nodes.map(nodeNm).join(', ')+' a la vez.':'.'));
  cvStart(null,nodes);
}
intro=function(){scheduleRender();ceoHome();};
chooseEmpresa=function(){ceoHome();};
choosePrd=function(){ceoHome();};
startCapture=function(){
  say('Esta captura necesita a Claude para conversar contigo. Abre el enlace desde Claude con tu sesión iniciada y vuelve a intentarlo.');
  setComposer(chipRow([{label:'Reintentar',tone:'primary',fn:()=>{echo('Reintentar');ceoHome();}}]));
};
menu=function(msg){if(msg) say(msg);ceoMenu(null);};
nextLevelChip=function(){return null;};
levelMsg=function(){return '';};
renderLadder=function(){
  const box=document.getElementById('ladder');if(!box) return;
  const E=ceoEmp();if(!E){box.replaceChildren(el('p',{class:'empty',text:'Preparando…'}));return;}
  const kids=[];
  CEO_STEPS.forEach((s,i)=>{
    const ns=s.nodes();
    kids.push(el('div',{class:'lvl'},el('span',{class:'lvln',text:String(i+1)}),el('b',{text:s.label})));
    if(!ns.length) kids.push(el('p',{class:'empty',style:'margin:0 0 10px 34px',text:'Aún no hay '+(s.k==='prd'?'productos.':s.k==='cli'?'tipos de cliente.':'datos.')}));
    ns.forEach(n=>{
      const p=nodeProg(n),dn=p.total===0||p.done>=p.total;
      kids.push(el('div',{class:'steprow'+(dn?' done':'')},el('span',{class:'sn',text:nodeNm(n)}),el('span',{class:'sp',text:dn?'completo':p.pct+'%'}),el('span',{class:'bar'},el('i',{style:'width:'+p.pct+'%'}))));
    });
  });
  const t=ceoProg(CEO_STEPS.flatMap(s=>s.nodes()));
  kids.push(el('p',{class:'empty',style:'margin-top:12px',text:'En total: '+t.done+' de '+t.total+' variables ('+t.pct+'%).'}));
  box.replaceChildren(...kids);
  const pc=document.getElementById('progchip');if(pc) pc.textContent='Avance '+t.pct+'%';
};
renderPath=function(){
  const box=$('#path');box.replaceChildren();
  const E=ceoEmp();if(!E){box.append(el('span',{class:'none',text:'Preparando…'}));return;}
  box.append(el('span',{class:'node'},E.nombre));
};
{
  const _ra=renderAll;
  renderAll=function(){_ra();if(CEO.wait&&ceoEmp()){CEO.wait=false;ceoHome();}if(S.tab==='consultas') renderConsultas();};
  /* arranque: cabecera y primera pantalla */
  const sec0=document.querySelector('.crumb .sec0');if(sec0) sec0.textContent=CEO.nombre;
  const top=document.querySelector('.topbar .sync');
  if(top){const pc=el('span',{class:'progchip',id:'progchip',text:'Avance 0%'});top.parentNode.insertBefore(pc,top);}
  TAB_LBL.consultas='Pendientes con el equipo';TAB_LBL.capture='Captura';
  setTab('capture');
}

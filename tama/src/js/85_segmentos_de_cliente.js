/* ===================== Segmentos de cliente (buyer persona) ===================== */
const clisOf=empId=>Object.values(S.nodes).filter(n=>n.tipo==='CLI'&&n.padre===empId).sort((a,b)=>a.id.localeCompare(b.id));
const segName=c=>(c&&(c.segmento||c.nombre))||'Cliente';
const segLabel=c=>segName(c)+(c&&c.tipoCliente?' · '+c.tipoCliente:'');
function empNodes(emp){return [emp,...clisOf(emp.id),...nodesOf('PRD').filter(p=>p.padre===emp.id)].filter(Boolean);}
function varsFor(node){
  if(!node) return [];
  const lvl={EMP:'E',PRD:'P',CLI:'C'}[node.tipo];
  if(!lvl) return [];
  const emp=empOfNode(node),eid=emp?emp.id:null;
  return allVars().filter(v=>v.nivel===lvl&&v.estadoVar!=='descontinuada'&&(!v.emp||v.emp===eid)&&(lvl!=='C'||appliesTo(v,node.tipoCliente)));
}
function nodeForVar(v){
  const E=S.ctx.emp;if(!E||v.estadoVar==='descontinuada') return null;
  if(v.emp&&v.emp!==E) return null;
  if(v.nivel==='E') return E;
  if(v.nivel==='C'){
    const c=S.ctx.cli&&S.nodes[S.ctx.cli];
    if(!c||c.padre!==E) return null;
    return appliesTo(v,c.tipoCliente)?c.id:null;
  }
  return S.ctx.prd||null;
}
function applicableNodes(v){
  if(v.estadoVar==='descontinuada') return [];
  const T={E:'EMP',P:'PRD',C:'CLI'}[v.nivel];
  return nodesOf(T).filter(n=>{const e=empOfNode(n);return (!v.emp||(e&&e.id===v.emp))&&(v.nivel!=='C'||appliesTo(v,n.tipoCliente));});
}
function ctxFromNode(n){
  const e=empOfNode(n);if(!e) return false;
  S.ctx.emp=e.id;S.ctx.prd=n.tipo==='PRD'?n.id:null;S.ctx.cli=n.tipo==='CLI'?n.id:null;return true;
}
function renderPath(){
  const box=$('#path');box.replaceChildren();
  const E=S.ctx.emp?S.nodes[S.ctx.emp]:null,P=S.ctx.prd?S.nodes[S.ctx.prd]:null,C=S.ctx.cli?S.nodes[S.ctx.cli]:null;
  if(!E){box.append(el('span',{class:'none',text:'Sin nodo seleccionado'}));return;}
  const chip=n=>el('span',{class:'node'},n.nombre,el('i',{text:n.id}));
  const grp=E.padre&&S.nodes[E.padre];
  if(grp){box.append(chip(grp),el('span',{class:'sep',text:'›'}));}
  box.append(chip(E));
  if(P){box.append(el('span',{class:'sep',text:'›'}),chip(P),el('span',{class:'dimtag',text:'Etapa: '+(P.etapa||'—')}));}
  if(C){box.append(el('span',{class:'sep',text:'›'}),el('span',{class:'node'},segName(C),el('i',{text:C.id})),el('span',{class:'dimtag',text:(C.tipoCliente||'tipo por definir')+(C.estrategia?' · '+C.estrategia:'')}));}
}

/* ---- crear y guardar segmentos ---- */
async function newCli(emp){
  const id=await mintId('CLI',4);
  const c={id,tipo:'CLI',nombre:'Cliente de '+emp.nombre,descripcion:'',padre:emp.id,estado:'activo',alias:[],creado:nowIso(),por:S.uid||null};
  await put('nodes',id,c);
  return c;
}
async function saveSegmento(emp,c,f){
  const vN=vidByName('Nombre del segmento'),vT=vidByName('Tipo de cliente'),vE=vidByName('Estrategia principal para este segmento');
  const node={...(S.nodes[c.id]||c),nombre:f.segmento,segmento:f.segmento,tipoCliente:f.tipo,estrategia:f.estrategia};
  await put('nodes',c.id,node);
  const per=new Date().toISOString().slice(0,7);
  const vM=vidByName('Modelo de venta'),mv=f.tipo==='B2C'?'B2C':f.tipo==='B2B'?'B2B':null;
  const pairs=[[vN,f.segmento],[vT,f.tipo],[vE,f.estrategia],[mv&&vM,mv]].filter(([v,val])=>v&&val&&!hasObs(c.id,v)&&(varById(v)||{}).estadoVar!=='descontinuada');
  if(pairs.length){
    const ids=await mintBlock('OBS',6,pairs.length);
    for(let i=0;i<pairs.length;i++){
      await put('obs',ids[i],{id:ids[i],nodo:c.id,variable:pairs[i][0],valor:pairs[i][1],no_aplica:false,fuente:'Captura',confianza:'Alta',periodo:per,nota:'',catv:allVars().length,vver:(varById(pairs[i][0])||{}).vver||1,capturado:nowIso(),por:S.uid||null});
    }
  }
  return S.nodes[c.id]||node;
}
function segmentFlow(emp,cli,done){
  const segs=[];
  const finish=()=>{
    const ids=[...segs];
    const next=()=>{
      const id=ids.shift();
      if(!id){done();return;}
      const c=S.nodes[id];S.ctx.emp=emp.id;S.ctx.cli=id;S.ctx.prd=null;renderPath();renderSide();
      say('Perfil de «'+segName(c)+'»: su audiencia.');
      S.dimMode='Q';S.phase=null;S.queue=buildQueue({dim:'Q'}).filter(it=>it.nodeId===id&&!hasObs(it.nodeId,it.vid));S.then=next;S.thenMsg=null;
      if(!S.queue.length){next();return;}
      askVar();
    };
    next();
  };
  const loop=(c,first)=>{
    say(first?'Ahora definamos a quién le vende '+emp.nombre+'. Cada cliente es un segmento (buyer persona) con su tipo y su estrategia.':'Definamos el siguiente segmento de cliente.');
    runSteps([
      {key:'segmento',q:'¿Cómo se llama este segmento de cliente?',ph:'Ej. Reclutador de pyme'},
      {key:'tipo',q:'¿De qué tipo de cliente se trata? Define qué variables se le preguntan.',chips:CLI_TIPOS.map(t=>TIPO_LBL[t])},
      {key:'estrategia',q:'¿Qué estrategia se trabaja con este segmento en este periodo?',chips:CLI_ESTR}
    ],{},async f=>{
      try{
        const tipo=CLI_TIPOS.find(t=>TIPO_LBL[t]===f.tipo)||f.tipo;
        await saveSegmento(emp,c,{segmento:f.segmento,tipo,estrategia:f.estrategia});
        segs.push(c.id);
        say('Segmento «'+f.segmento+'» registrado como '+tipo+', con estrategia de '+f.estrategia.toLowerCase()+'.');
        say('¿Hay otro segmento de cliente en '+emp.nombre+'?');
        setComposer(chipRow([
          {label:'Sí, agregar otro',fn:async()=>{echo('Sí, otro segmento');try{const n=await newCli(emp);loop(n,false);}catch(e){say('No se pudo crear el segmento: '+msgOf(e));}}},
          {label:'No, ya están todos',tone:'primary',fn:()=>{echo('No, ya están todos');finish();}}
        ]));
      }catch(e){say('No se pudo guardar el segmento: '+msgOf(e)+'. Revisa que tengas permiso de edición.');choosePrd(S.nodes[emp.id]||emp);}
    });
  };
  loop(cli,true);
}

/* ---- empresa nueva y ficha: los segmentos se definen en el mismo flujo ---- */
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
    S.ctx.emp=id;S.ctx.prd=null;S.ctx.cli=null;renderPath();
    bubble('bot',el('div',{class:'receipt'},tagEl(id),el('span',{text:'empresa creada · pertenece a'}),tagEl(grp.id)));
    bubble('bot',el('div',{class:'receipt'},tagEl(cli.id),el('span',{text:'primer segmento de cliente creado · pertenece a'}),tagEl(id)));
    segmentFlow(node,cli,()=>choosePrd(S.nodes[id]||node));
  }catch(e){
    wait.remove();say('No se pudo registrar la empresa: '+msgOf(e)+'. Revisa que tengas permiso de edición en este artefacto.');
    chooseEmpresa();
  }
}
function completarFicha(emp){
  say('Completemos la ficha de '+emp.nombre+'. Son pocas preguntas y quedan guardadas en su nodo.');
  runSteps([
    {key:'industria',q:'¿En qué industria está '+emp.nombre+'?',chips:INDUSTRIAS},
    {key:'categoria',q:'¿En qué categoría compite?',ph:'Ej. botanas saladas, software de nómina…'},
    {key:'geo',q:'¿En qué mercado geográfico opera?',ph:'Ej. México; México y Centroamérica…'},
    {key:'pregunta',q:'¿Qué pregunta de negocio queremos resolver con el análisis?',ph:'Ej. ¿Por qué baja la recompra?'},
    {key:'decision',q:'¿Qué decisión se va a tomar con el análisis?',ph:'Ej. Reformular el producto estrella'},
    {key:'fuentes',q:'¿Qué fuentes de información hay disponibles?',ph:'Ventas, encuestas, reportes…',optional:true}
  ],{},async f=>{
    const wait=say('Guardando la ficha…');
    try{
      const node={...S.nodes[emp.id],ficha:{industria:f.industria,categoria:f.categoria,mercado_geo:f.geo,pregunta:f.pregunta,decision:f.decision,fuentes:f.fuentes||''}};
      await put('nodes',emp.id,node);
      const cli=await ensureCli(node,'');
      wait.remove();
      S.ctx.emp=emp.id;S.ctx.prd=null;S.ctx.cli=null;renderPath();
      const sinTipo=clisOf(emp.id).find(c=>!c.tipoCliente)||cli;
      say('Ficha guardada.');
      if(sinTipo&&!sinTipo.tipoCliente) segmentFlow(node,sinTipo,()=>choosePrd(S.nodes[emp.id]||node));
      else choosePrd(S.nodes[emp.id]||node);
    }catch(e){wait.remove();say('No se pudo guardar la ficha: '+msgOf(e)+'. Revisa que tengas permiso de edición.');choosePrd(emp);}
  });
}
function choosePrd(emp){
  S.ctx.emp=emp.id;S.ctx.prd=null;S.ctx.cli=null;S.queue=[];S.then=null;renderPath();renderSide();
  ensureCli(emp).then(()=>scheduleRender()).catch(()=>{});
  const prds=nodesOf('PRD').filter(p=>p.padre===emp.id),clis=clisOf(emp.id);
  say(`Empresa ${emp.nombre}. ¿Qué parte vamos a capturar?`);
  const items=[];
  prds.forEach(p=>items.push({label:'Producto: '+p.nombre,sub:p.id,fn:()=>{echo(p.nombre);S.ctx.prd=p.id;S.ctx.cli=null;startCapture();}}));
  clis.forEach(c=>items.push({label:'Cliente: '+segName(c),sub:c.tipoCliente||'tipo por definir',fn:()=>{
    echo(segName(c));
    if(!c.tipoCliente){segmentFlow(emp,c,()=>choosePrd(S.nodes[emp.id]||emp));return;}
    S.ctx.cli=c.id;S.ctx.prd=null;renderPath();startCapture();}}));
  if(!emp.ficha||!emp.ficha.industria) items.push({label:'Completar ficha de la empresa',tone:'primary',fn:()=>{echo('Completar ficha');completarFicha(emp);}});
  items.push({label:'Nuevo producto',tone:'primary',fn:()=>{echo('Nuevo producto');newProducto(emp);}});
  items.push({label:'Nuevo segmento de cliente',tone:'primary',fn:async()=>{echo('Nuevo segmento de cliente');try{const n=await newCli(emp);segmentFlow(emp,n,()=>choosePrd(S.nodes[emp.id]||emp));}catch(e){say('No se pudo crear el segmento: '+msgOf(e));}}});
  items.push({label:'Solo la empresa',fn:()=>{echo('Solo la empresa');S.ctx.prd=null;S.ctx.cli=null;startCapture();}});
  items.push({label:'Cambiar de empresa',tone:'quiet',fn:()=>{echo('Cambiar de empresa');chooseEmpresa();}});
  setComposer(chipRow(items));
}

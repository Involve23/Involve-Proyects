/* ===================== Modelo de nodos: grupo, empresa, producto, cliente ===================== */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const BASE_IDS=new Set(VARS_BASE.map(v=>v.id));
const tagEl=t=>el('span',{class:'idtag',text:t});
const cliOf=empId=>Object.values(S.nodes).find(n=>n.tipo==='CLI'&&n.padre===empId)||null;
const empOfNode=n=>{let c=n,g=0;while(c&&c.tipo!=='EMP'&&c.padre&&g++<5)c=S.nodes[c.padre];return c&&c.tipo==='EMP'?c:null;};
S.then=null;

function varsFor(node){
  if(!node) return [];
  const lvl={EMP:'E',PRD:'P',CLI:'C'}[node.tipo];
  if(!lvl) return [];
  const emp=empOfNode(node),eid=emp?emp.id:null;
  return allVars().filter(v=>v.nivel===lvl&&(!v.emp||v.emp===eid));
}
function nodeForVar(v){
  const E=S.ctx.emp;if(!E) return null;
  if(v.emp&&v.emp!==E) return null;
  if(v.nivel==='E') return E;
  if(v.nivel==='C'){const c=cliOf(E);return c?c.id:null;}
  return S.ctx.prd||null;
}
function varState(nodeId,vid){const r=latest(nodeId,vid);return r?(r.no_aplica?'na':'cap'):'pend';}
async function ensureCli(emp,desc){
  let c=cliOf(emp.id);if(c) return c;
  const id=await mintId('CLI',4);
  c={id,tipo:'CLI',nombre:'Cliente de '+emp.nombre,descripcion:desc||'',padre:emp.id,estado:'activo',alias:[],creado:nowIso(),por:S.uid||null};
  await put('nodes',id,c);
  return c;
}

/* ---- captura: flujo con tres niveles (empresa, producto, cliente) ---- */
function newEmpresa(){
  runSteps([
    {key:'nombre',q:'¿Cómo se llama la empresa?',ph:'Nombre comercial'},
    {key:'industria',q:'¿En qué industria está?',chips:INDUSTRIAS},
    {key:'categoria',q:'¿En qué categoría compite?',ph:'Ej. botanas saladas, software de nómina…'},
    {key:'geo',q:'¿En qué mercado geográfico opera?',ph:'Ej. México; México y Centroamérica…'},
    {key:'pregunta',q:'¿Qué pregunta de negocio queremos resolver con el análisis?',ph:'Ej. ¿Por qué baja la recompra?'},
    {key:'decision',q:'¿Qué decisión se va a tomar con el análisis?',ph:'Ej. Reformular el producto estrella'},
    {key:'fuentes',q:'¿Qué fuentes de información hay disponibles?',ph:'Ventas, encuestas, reportes…',optional:true},
    {key:'persona',q:'¿Cómo describes al cliente típico de esta empresa? Es el buyer persona que consume sus productos.',ph:'Ej. Reclutador de empresa mediana, B2B',optional:true}
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
    const cli=await ensureCli(node,f.persona||'');
    wait.remove();
    S.ctx.emp=id;S.ctx.prd=null;renderPath();
    bubble('bot',el('div',{class:'receipt'},tagEl(id),el('span',{text:'empresa creada · pertenece a'}),tagEl(grp.id)));
    bubble('bot',el('div',{class:'receipt'},tagEl(cli.id),el('span',{text:'cliente (buyer persona) creado · pertenece a'}),tagEl(id)));
    say('Antes de los productos, armemos el perfil del cliente. Son pocas preguntas y sirven de base para todo lo demás.');
    S.dimMode='M';S.phase=null;S.queue=buildQueue({dim:'M'});S.then=()=>choosePrd(node);S.thenMsg='Perfil listo. Ahora los productos.';
    askVar();
  }catch(e){
    wait.remove();say('No se pudo registrar la empresa: '+msgOf(e)+'. Revisa que tengas permiso de edición en este artefacto.');
    chooseEmpresa();
  }
}
function choosePrd(emp){
  S.ctx.emp=emp.id;S.ctx.prd=null;S.queue=[];S.then=null;renderPath();renderSide();
  ensureCli(emp).then(()=>scheduleRender()).catch(()=>{});
  const prds=nodesOf('PRD').filter(p=>p.padre===emp.id);
  say(`Empresa ${emp.nombre}. ¿Con qué producto trabajamos?`);
  const items=prds.map(p=>({label:p.nombre,sub:p.id,fn:()=>{echo(p.nombre);S.ctx.prd=p.id;startCapture();}}));
  if(!emp.ficha||!emp.ficha.industria) items.push({label:'Completar ficha de la empresa',tone:'primary',fn:()=>{echo('Completar ficha');completarFicha(emp);}});
  items.push({label:'Nuevo producto',tone:'primary',fn:()=>{echo('Nuevo producto');newProducto(emp);}});
  items.push({label:'Empresa y cliente, sin producto',fn:()=>{echo('Empresa y cliente');S.ctx.prd=null;startCapture();}});
  items.push({label:'Cambiar de empresa',tone:'quiet',fn:()=>{echo('Cambiar de empresa');chooseEmpresa();}});
  setComposer(chipRow(items));
}
function buildQueue(opts={}){
  const E=S.ctx.emp,P=S.ctx.prd;
  let vars=allVars().filter(v=>nodeForVar(v));
  if(opts.dim) vars=vars.filter(v=>v.dim===opts.dim);
  let list=vars.map(v=>({vid:v.id,nodeId:nodeForVar(v)}));
  if(!opts.dim){
    list=list.filter(it=>!hasObs(it.nodeId,it.vid));
    const pr=P?(PRIOR[S.nodes[P].etapa]||[]):[];
    list.forEach(it=>{it.rank=pr.indexOf(it.vid);it.prio=it.rank>=0;});
    list.sort((a,b)=>{const ra=a.prio?a.rank:999,rb=b.prio?b.rank:999;return ra!==rb?ra-rb:a.vid.localeCompare(b.vid);});
  }
  return list;
}
function queueDone(){
  S.dimMode=null;renderSide();
  if(S.then){const f=S.then,m=S.thenMsg;S.then=null;S.thenMsg=null;if(m)say(m);f();return;}
  menu('No quedan variables pendientes en esta lista. ¿Qué sigue?');
}
function menu(msg){
  S.then=null;
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
  const items=Object.keys(DIMS).map(d=>{
    let tot=0,pend=0;
    allVars().filter(v=>v.dim===d).forEach(v=>{const nid=nodeForVar(v);if(!nid)return;tot++;if(!hasObs(nid,v.id))pend++;});
    return {d,tot,pend};
  }).filter(x=>x.tot>0).map(x=>({label:x.d+' · '+DIMS[x.d],sub:(x.tot-x.pend)+'/'+x.tot,fn:()=>jumpDim(x.d)}));
  items.push({label:'Volver a lo pendiente',tone:'quiet',fn:()=>{echo('Volver a lo pendiente');startCapture();}});
  setComposer(chipRow(items));
}
function ctxFromNode(n){
  const e=empOfNode(n);if(!e) return false;
  S.ctx.emp=e.id;S.ctx.prd=n.tipo==='PRD'?n.id:null;return true;
}
function captureVar(vid,nodeId){
  const v=varById(vid),n=nodeId&&S.nodes[nodeId];if(!v||!n) return;
  setTab('capture');ctxFromNode(n);renderPath();renderSide();
  S.dimMode=null;S.phase='single';S.queue=[{vid,nodeId}];S.then=null;
  divider('Variable elegida en el grafo');
  askVar();
}
function captureArea(nodeId,dim){
  const n=S.nodes[nodeId];if(!n) return;
  setTab('capture');ctxFromNode(n);renderPath();renderSide();
  S.dimMode=dim;S.phase=null;S.then=null;
  S.queue=buildQueue({dim}).filter(it=>it.nodeId===nodeId);
  if(!S.queue.length){menu('Esa área no tiene variables para este nodo.');return;}
  askVar();
}
function captureNode(nodeId){
  const n=S.nodes[nodeId];if(!n) return;
  setTab('capture');ctxFromNode(n);startCapture();
}

/* ---- panel lateral del avance (con cliente) ---- */
function renderSide(){
  const dims=$('#dims');dims.replaceChildren();
  const E=S.ctx.emp?S.nodes[S.ctx.emp]:null,P=S.ctx.prd?S.nodes[S.ctx.prd]:null,C=E?cliOf(E.id):null;
  if(!E){dims.append(el('p',{class:'empty',text:'Elige una empresa para ver el avance por dimensión.'}));}
  else{
    const covs=[E,P,C].filter(Boolean).map(coverage);
    let done=0,total=0;
    Object.keys(DIMS).forEach(d=>{
      let t=0,dn=0;covs.forEach(c=>{if(c[d]){t+=c[d].total;dn+=c[d].done;}});
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
    rec.append(el('li',null,el('span',null,tagEl(o.id),' ',el('span',{text:v?v.nombre:o.variable})),
      el('span',{class:'m',text:o.nodo+' · '+showVal(o)+' · '+capName(o.por)})));
  });
}

/* ===================== Grafo 2D (d3-force) ===================== */
const BIGCOL='#6EE3E3',CLICOL='#FFFFFF';
const GR={nodes:[],links:[],map:new Map(),open:new Set(),sel:null,onlyCap:false,sig:'',sim:null,svg:null,root:null,gL:null,gN:null,w:0,h:0,inited:false,zoom:null,autoFit:true,fitTs:[]};
const normV=x=>String(x).trim().toLowerCase();
function cliMatches(a,b){
  const out=[];
  SIMVARS.forEach(id=>{
    const ra=latest(a.id,id),rb=latest(b.id,id);
    if(ra&&rb&&!ra.no_aplica&&!rb.no_aplica&&normV(ra.valor)===normV(rb.valor)) out.push(id);
  });
  return out;
}
function gData(){
  const nodes=[],links=[];
  const gn=nodesOf('GRP')[0],gid=gn?gn.id:'GRP*';
  nodes.push({id:gid,kind:'grp',label:gn?gn.nombre:'Grupo Tama',ref:gn?gn.id:null,r:20,rad:300,rs:.04});
  const clis=[];
  nodesOf('EMP').forEach(e=>{
    nodes.push({id:e.id,kind:'emp',label:e.nombre,ref:e.id,r:17,rad:230,rs:.07});
    links.push({s:gid,t:e.id,type:'own',dist:170,str:.5});
    const c=cliOf(e.id);
    if(c){
      nodes.push({id:c.id,kind:'cli',label:'Cliente · '+e.nombre,ref:c.id,r:17,rad:0,rs:.2});
      links.push({s:e.id,t:c.id,type:'own',dist:110,str:.25});clis.push(c);
    }
    nodesOf('PRD').filter(p=>p.padre===e.id).forEach(p=>{
      nodes.push({id:p.id,kind:'prd',label:p.nombre,ref:p.id,r:13,rad:130,rs:.08});
      links.push({s:e.id,t:p.id,type:'own',dist:110,str:.3});
      if(c) links.push({s:c.id,t:p.id,type:'consume',dist:90,str:.4});
    });
  });
  const bigs=nodes.filter(n=>n.kind==='emp'||n.kind==='cli'||n.kind==='prd');
  bigs.forEach(b=>{
    if(!GR.open.has(b.id)) return;
    const node=S.nodes[b.id],vs=varsFor(node),by={};
    vs.forEach(v=>{(by[v.dim]||(by[v.dim]=[])).push(v);});
    Object.keys(DIMS).forEach(d=>{
      const arr=by[d];if(!arr) return;
      const aid=b.id+'~'+d,done=arr.filter(v=>hasObs(b.id,v.id)).length;
      nodes.push({id:aid,kind:'area',dim:d,label:DIMS[d],parent:b.id,ref:b.id,r:8,done,total:arr.length});
      links.push({s:b.id,t:aid,type:'branch',dist:84,str:.8});
      if(!GR.open.has(aid)) return;
      arr.forEach(v=>{
        const st=varState(b.id,v.id);
        if(GR.onlyCap&&st==='pend') return;
        nodes.push({id:aid+'~'+v.id,kind:'var',vid:v.id,dim:d,label:v.nombre,parent:aid,ref:b.id,state:st,r:5});
        links.push({s:aid,t:aid+'~'+v.id,type:'branch',dist:34,str:.9});
      });
    });
  });
  for(let i=0;i<clis.length;i++)for(let j=i+1;j<clis.length;j++){
    const m=cliMatches(clis[i],clis[j]);
    if(m.length>=2) links.push({s:clis[i].id,t:clis[j].id,type:'sim',dist:240,str:.03,matches:m});
  }
  return {nodes,links};
}
function gResize(){
  const el_=$('#gsvg');if(!el_) return;
  const r=el_.getBoundingClientRect();
  if(!r.width) return;
  const first=!GR.w;GR.w=r.width;GR.h=r.height;
  if(first&&GR.svg) GR.svg.call(GR.zoom.transform,d3.zoomIdentity.translate(GR.w/2,GR.h/2+20));
}
function gInit(){
  GR.svg=d3.select('#gsvg');GR.svg.selectAll('*').remove();
  GR.root=GR.svg.append('g');
  GR.gL=GR.root.append('g');GR.gN=GR.root.append('g');
  GR.zoom=d3.zoom().scaleExtent([.25,3]).on('zoom',e=>{GR.root.attr('transform',e.transform);if(e.sourceEvent)GR.autoFit=false;});
  GR.svg.call(GR.zoom).on('dblclick.zoom',null);
  GR.svg.on('click',e=>{if(e.target===GR.svg.node()){GR.sel=null;gStyle();gPanel();}});
  GR.sim=d3.forceSimulation()
    .force('link',d3.forceLink().id(d=>d.id).distance(l=>l.dist).strength(l=>l.str))
    .force('charge',d3.forceManyBody().strength(d=>d.kind==='var'?-28:d.kind==='area'?-150:-420))
    .force('collide',d3.forceCollide().radius(d=>d.kind==='area'?d.r+24:d.r+7))
    .force('radial',d3.forceRadial(d=>d.rad||0,0,0).strength(d=>d.rs||0))
    .on('tick',gTick);
  GR.inited=true;gResize();
}
function gTick(){
  GR.gL.selectAll('line').attr('x1',l=>l.source.x).attr('y1',l=>l.source.y).attr('x2',l=>l.target.x).attr('y2',l=>l.target.y);
  GR.gN.selectAll('g.gn').attr('transform',d=>`translate(${d.x},${d.y})`);
}
function gRefresh(){
  if(!GR.inited) return;
  const d=gData(),next=[];
  d.nodes.forEach(n=>{
    const old=GR.map.get(n.id);
    if(old){Object.assign(old,n);next.push(old);}
    else{
      const par=n.parent?GR.map.get(n.parent):null;
      if(par&&par.x!=null){n.x=par.x+(Math.random()-.5)*24;n.y=par.y+(Math.random()-.5)*24;}
      else{n.x=(Math.random()-.5)*60;n.y=(Math.random()-.5)*60;}
      next.push(n);
    }
  });
  GR.map=new Map(next.map(n=>[n.id,n]));
  GR.nodes=next;
  const sig=next.map(n=>n.id).join('|')+'#'+d.links.map(l=>l.s+'>'+l.t).join('|');
  const changed=sig!==GR.sig;
  if(changed) GR.links=d.links.map(l=>({source:l.s,target:l.t,type:l.type,dist:l.dist,str:l.str,matches:l.matches,key:l.s+'>'+l.t}));
  GR.gL.selectAll('line').data(GR.links,l=>l.key).join('line').attr('class',l=>'gl '+l.type);
  GR.gN.selectAll('g.gn').data(GR.nodes,n=>n.id).join(enter=>{
    const g=enter.append('g').attr('class','gn');
    g.append('circle');g.append('text');
    g.on('click',(e,n)=>{e.stopPropagation();gClick(n);})
     .on('mouseenter',(e,n)=>gTip(e,n)).on('mousemove',gTipMove).on('mouseleave',()=>{$('#tip').hidden=true;});
    g.call(d3.drag()
      .on('start',(e,n)=>{if(!e.active)GR.sim.alphaTarget(.25).restart();n.fx=n.x;n.fy=n.y;})
      .on('drag',(e,n)=>{n.fx=e.x;n.fy=e.y;})
      .on('end',(e,n)=>{if(!e.active)GR.sim.alphaTarget(0);n.fx=null;n.fy=null;}));
    return g;
  });
  if(changed){
    GR.sig=sig;
    GR.sim.nodes(GR.nodes);GR.sim.force('link').links(GR.links);
    GR.sim.alpha(.7).restart();gAutoFit();
  }
  gStyle();gTick();
  const st=$('#g-stats');
  if(st) st.textContent=GR.nodes.length+' nodos · '+GR.links.length+' relaciones'+(nodesOf('EMP').length?'':' · crea la primera empresa en Capturar');
}
function gStyle(){
  GR.gN.selectAll('g.gn').each(function(d){
    const g=d3.select(this);
    let fill=BIGCOL,stroke='rgba(255,255,255,.3)',sw=1,op=1;
    if(d.kind==='cli') fill=CLICOL;
    else if(d.kind==='area'){fill=DIMCOL[d.dim];op=d.done?1:.45;}
    else if(d.kind==='var'){
      if(d.state==='cap') fill=DIMCOL[d.dim];
      else if(d.state==='na') fill='#5A626D';
      else{fill='#2B3038';stroke=DIMCOL[d.dim];sw=1.5;}
    }
    if(GR.open.has(d.id)){stroke='#FFFFFF';sw=2.5;}
    if(GR.sel===d.id){stroke='#FFD479';sw=3;}
    g.select('circle').attr('r',d.r).attr('fill',fill).attr('stroke',stroke).attr('stroke-width',sw).attr('opacity',op);
    const show=d.kind!=='var'||GR.sel===d.id;
    g.select('text').attr('class','gt '+d.kind).attr('y',d.r+13).text(show?(d.label.length>28?d.label.slice(0,27)+'…':d.label):'');
  });
}
function gTip(e,n){const t=$('#tip');t.textContent=n.label;t.hidden=false;gTipMove(e);}
function gTipMove(e){const t=$('#tip');t.style.left=e.clientX+'px';t.style.top=e.clientY+'px';}
function gClick(d){
  GR.sel=d.id;
  if(d.kind==='emp'||d.kind==='cli'||d.kind==='prd'||d.kind==='area'){
    if(GR.open.has(d.id)){
      GR.open.delete(d.id);
      [...GR.open].forEach(k=>{if(k.startsWith(d.id+'~'))GR.open.delete(k);});
    }else GR.open.add(d.id);
  }
  gRefresh();gPanel();
}
function gOpenAll(){nodesOf('EMP').forEach(e=>GR.open.add(e.id));nodesOf('CLI').forEach(c=>GR.open.add(c.id));nodesOf('PRD').forEach(p=>GR.open.add(p.id));gRefresh();}
function gCloseAll(){GR.open.clear();GR.sel=null;gRefresh();gPanel();}
function gFit(){if(GR.inited&&GR.w) GR.svg.transition().duration(500).call(GR.zoom.transform,d3.zoomIdentity.translate(GR.w/2,GR.h/2+20));}
function ensureGraph(){
  if(S.tab!=='universe'||!S.ready||!window.d3) return;
  if(!GR.inited) gInit();
  if(!GR.w) gResize();
}
/* ficha del nodo seleccionado */
function row(k,v){return el('div',null,el('div',{class:'dimtag',text:k}),el('div',{text:v||'—'}));}
function covLine(node){
  const vs=varsFor(node);if(!vs.length) return null;
  const d=vs.filter(v=>hasObs(node.id,v.id)).length;
  return el('p',{class:'mono',text:d+' de '+vs.length+' variables con dato'});
}
function gPanel(){
  const p=$('#gpanel');
  const d=GR.sel&&GR.map.get(GR.sel);
  if(!d){p.hidden=true;p.replaceChildren();return;}
  p.hidden=false;
  const close=el('button',{class:'x',type:'button','aria-label':'Cerrar ficha',onclick:()=>{GR.sel=null;gStyle();gPanel();},text:'×'});
  const kids=[close];
  const node=d.ref?S.nodes[d.ref]:null;
  if(d.kind==='grp'){
    kids.push(el('div',{class:'eyebrow',text:'Grupo'}),el('h2',{text:d.label}),
      el('p',{text:'Raíz del grafo. De aquí cuelgan las empresas.'}),
      el('p',{class:'mono',text:nodesOf('EMP').length+' empresas · '+Object.keys(S.obs).length+' observaciones'}));
    if(d.ref) kids.splice(3,0,el('p',{class:'mono',text:d.ref}));
  }else if(d.kind==='emp'){
    const f=node.ficha||{};
    kids.push(el('div',{class:'eyebrow',text:'Empresa'}),el('h2',{text:node.nombre}),el('p',{class:'mono',text:node.id}),
      el('div',{class:'formgrid'},row('Industria',f.industria),row('Categoría',f.categoria),row('Mercado',f.mercado_geo),row('Pregunta de negocio',f.pregunta),row('Decisión',f.decision),row('Fuentes',f.fuentes)),
      covLine(node),
      el('p',{class:'empty',text:GR.open.has(d.id)?'Abierta: toca un área para ver sus variables.':'Toca el nodo para abrir sus áreas.'}),
      el('div',{class:'ctrls'},el('button',{class:'btn main',type:'button',onclick:()=>captureNode(node.id),text:'Capturar en el chat'})));
  }else if(d.kind==='prd'){
    kids.push(el('div',{class:'eyebrow',text:'Producto'}),el('h2',{text:node.nombre}),el('p',{class:'mono',text:node.id}),
      el('p',{text:'Etapa: '+(node.etapa||'—')+(node.etapa_evidencia?' · '+node.etapa_evidencia:'')}),covLine(node),
      el('div',{class:'ctrls'},el('button',{class:'btn main',type:'button',onclick:()=>captureNode(node.id),text:'Capturar en el chat'})));
  }else if(d.kind==='cli'){
    const emp=S.nodes[node.padre];
    kids.push(el('div',{class:'eyebrow',text:'Cliente · buyer persona'}),el('h2',{text:node.nombre}),el('p',{class:'mono',text:node.id}));
    if(node.descripcion) kids.push(el('p',{text:node.descripcion}));
    const prof=varsFor(node).filter(v=>v.dim==='M'||v.id==='VAR-015').map(v=>{const r=latest(node.id,v.id);return row(v.nombre,r?showVal(r):'');});
    kids.push(el('div',{class:'formgrid'},...prof),covLine(node));
    const sims=GR.links.filter(l=>l.type==='sim'&&(l.source.id===node.id||l.target.id===node.id));
    if(sims.length){
      kids.push(el('div',{class:'grp'},el('b',{style:'font-size:13px',text:'Perfil parecido con'}),
        ...sims.map(l=>{const o=l.source.id===node.id?l.target:l.source;const oe=empOfNode(S.nodes[o.id]);
          return el('p',{class:'mono',text:(oe?oe.nombre:o.id)+' · coincide en '+l.matches.map(id=>{const v=varById(id);return v?v.nombre:id;}).join(', ')});})));
    }
    kids.push(el('div',{class:'ctrls'},el('button',{class:'btn main',type:'button',onclick:()=>captureNode(node.id),text:'Capturar en el chat'})));
  }else if(d.kind==='area'){
    const vs=varsFor(node).filter(v=>v.dim===d.dim);
    kids.push(el('div',{class:'eyebrow',text:'Área · '+node.nombre}),el('h2',{text:DIMS[d.dim]}),
      el('p',{class:'mono',text:d.done+' de '+d.total+' variables con dato'}),
      el('div',{class:'grp'},el('div',{class:'chips'},...vs.map(v=>{
        const st=varState(node.id,v.id);
        return el('button',{type:'button',class:'chip '+(st==='cap'?'on':st==='na'?'na':''),onclick:()=>{GR.open.add(d.id);GR.sel=d.id+'~'+v.id;gRefresh();gPanel();},text:v.nombre});
      }))),
      el('div',{class:'ctrls'},el('button',{class:'btn main',type:'button',onclick:()=>captureArea(node.id,d.dim),text:'Capturar esta área en el chat'})));
  }else if(d.kind==='var'){
    const v=varById(d.vid),r=latest(node.id,d.vid);
    const hist=Object.values(S.obs).filter(o=>o.nodo===node.id&&o.variable===d.vid).sort((a,b)=>String(b.capturado).localeCompare(String(a.capturado)));
    const st={cap:['Capturada','var(--amber)'],na:['No aplica','var(--muted)'],pend:['Pendiente','var(--cyan)']}[d.state];
    kids.push(el('div',{class:'eyebrow',text:'Variable · '+d.vid}),el('h2',{text:v.nombre}),
      el('span',{class:'state',style:'color:'+st[1]+';border-color:'+st[1],text:st[0]}),
      el('p',{text:v.q}),
      el('div',{class:'grp'},el('b',{style:'font-size:13px',text:'Valor en '+node.nombre}),
        el('p',{style:'color:var(--fg);font-size:16px',text:r?showVal(r):'Sin dato todavía'}),
        r?el('p',{class:'mono',text:r.id+' · '+(r.fuente||'')+' · confianza '+(r.confianza||'')+' · '+(r.periodo||'')+' · '+capName(r.por)}):null));
    if(hist.length>1) kids.push(el('div',{class:'grp'},el('b',{style:'font-size:13px',text:'Historial'}),...hist.slice(1,6).map(o=>el('p',{class:'mono',text:showVal(o)+' · '+o.id+' · '+(o.periodo||'')}))));
    kids.push(el('div',{class:'ctrls'},el('button',{class:'btn main',type:'button',onclick:()=>captureVar(d.vid,node.id),text:'Capturar en el chat'})));
  }
  p.replaceChildren(...kids.filter(Boolean));
}
$('#g-open').addEventListener('click',gOpenAll);
$('#g-close').addEventListener('click',gCloseAll);
$('#g-fit').addEventListener('click',gFit);
$('#g-cap').addEventListener('click',e=>{GR.onlyCap=!GR.onlyCap;e.currentTarget.setAttribute('aria-pressed',String(GR.onlyCap));gRefresh();});
addEventListener('resize',()=>{if(GR.inited){GR.w=0;gResize();}});

/* ===================== Base de datos ===================== */
function renderDbStats(){
  const ne=nodesOf('EMP').length,np=nodesOf('PRD').length,no=Object.keys(S.obs).length;
  const people=new Set(Object.values(S.obs).map(o=>o.por).filter(Boolean)).size;
  let done=0,total=0;
  [...nodesOf('EMP'),...nodesOf('CLI'),...nodesOf('PRD')].forEach(n=>{const vs=varsFor(n);total+=vs.length;vs.forEach(v=>{if(hasObs(n.id,v.id))done++;});});
  const items=[[ne,'Empresas'],[np,'Productos'],[no,'Observaciones'],[allVars().length,'Variables en el catálogo'],[people,'Personas capturando'],[total?Math.round(done/total*100)+' %':'—','Cobertura de variables'],[nodesOf('HAL').length,'Hallazgos'],[nodesOf('SUG').length,'Sugerencias']];
  $('#dbStats').replaceChildren(...items.map(([n,l])=>el('div',{class:'stat'},el('b',{text:String(n)}),el('span',{text:l}))));
}
function fillObsFilters(){
  $('#o-dim').replaceChildren(el('option',{value:'',text:'Todas las dimensiones'}),...Object.keys(DIMS).map(d=>el('option',{value:d,text:d+' · '+DIMS[d]})));
}
function renderObs(){
  const fe=$('#o-emp'),fd=$('#o-dim'),fq=$('#o-q');
  const emps=nodesOf('EMP'),sig=emps.map(e=>e.id+e.nombre).join('|');
  if(fe.dataset.sig!==sig){
    const cur=fe.value;
    fe.replaceChildren(el('option',{value:'',text:'Todas las empresas'}),...emps.map(e=>el('option',{value:e.id,text:e.nombre})));
    fe.value=cur;fe.dataset.sig=sig;
  }
  const e=fe.value,d=fd.value,q=fq.value.trim().toLowerCase();
  let rows=Object.values(S.obs).filter(o=>{
    const n=S.nodes[o.nodo],v=varById(o.variable),em=empOfNode(n);
    if(e&&(!em||em.id!==e)) return false;
    if(d&&(!v||v.dim!==d)) return false;
    if(q){
      const hay=[o.id,o.nodo,n&&n.nombre,em&&em.nombre,o.variable,v&&v.nombre,showVal(o),o.fuente,capName(o.por)].join(' ').toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });
  rows.sort((a,b)=>String(b.capturado).localeCompare(String(a.capturado)));
  const LIM=300;
  $('#o-count').textContent=rows.length+(rows.length===1?' observación':' observaciones')+(rows.length>LIM?' · se muestran las '+LIM+' más recientes':'');
  const t=$('#obsTbl');t.replaceChildren();
  t.append(el('thead',null,el('tr',null,['Observación','Empresa','Nodo','Variable','Área','Valor','Nota de hallazgo','Fuente','Confianza','Periodo','Capturó','Fecha'].map(h=>el('th',{text:h})))));
  const b=el('tbody');
  if(!rows.length) b.append(el('tr',null,el('td',{colspan:12,class:'empty',text:Object.keys(S.obs).length?'Ninguna observación coincide con el filtro.':'Todavía no hay observaciones. Captura la primera desde la pestaña Capturar.'})));
  rows.slice(0,LIM).forEach(o=>{
    const n=S.nodes[o.nodo],v=varById(o.variable),em=empOfNode(n);
    b.append(el('tr',null,
      el('td',{class:'mono',text:o.id}),el('td',{text:em?em.nombre:'—'}),
      el('td',null,n?n.nombre:o.nodo,' ',tagEl(o.nodo)),
      el('td',null,tagEl(o.variable),' '+(v?v.nombre:'')),
      el('td',{text:v?v.dim+' · '+DIMS[v.dim]:''}),el('td',{text:showVal(o)}),el('td',{text:o.nota||''}),el('td',{text:o.fuente||''}),el('td',{text:o.confianza||''}),el('td',{text:o.periodo||''}),
      el('td',{text:capName(o.por)}),
      el('td',{text:o.capturado?new Date(o.capturado).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'}):''})));
  });
  t.append(b);
}
function renderNodes(){
  const t=$('#nodesTbl');t.replaceChildren();
  t.append(el('thead',null,el('tr',null,['ID','Tipo','Nombre','Depende de','Etapa','Registros','Avance'].map((h,i)=>el('th',{text:h,class:i>=5?'num':''})))));
  const body=el('tbody');
  const rows=[];
  nodesOf('GRP').forEach(g=>{rows.push(g);nodesOf('EMP').filter(e=>e.padre===g.id).forEach(e=>{rows.push(e);clisOf(e.id).forEach(c=>rows.push(c));nodesOf('PRD').filter(p=>p.padre===e.id).forEach(p=>rows.push(p));addInsights(e,rows);});});
  nodesOf('EMP').filter(e=>!rows.includes(e)).forEach(e=>{rows.push(e);clisOf(e.id).forEach(c=>rows.push(c));nodesOf('PRD').filter(p=>p.padre===e.id).forEach(p=>rows.push(p));addInsights(e,rows);});
  if(!rows.length) body.append(el('tr',null,el('td',{colspan:7,class:'empty',text:'Todavía no hay nodos. Crea una empresa desde la pestaña Capturar.'})));
  rows.forEach(n=>{
    const cnt=Object.values(S.obs).filter(o=>o.nodo===n.id).length;
    const vs=varsFor(n);let av='—';
    if(vs.length){const d=vs.filter(v=>hasObs(n.id,v.id)).length;av=d+'/'+vs.length;}
    const tipo={GRP:'Grupo',EMP:'Empresa',PRD:'Producto',CLI:'Cliente',HAL:'Hallazgo',SUG:'Sugerencia'}[n.tipo]||n.tipo;
    body.append(el('tr',{class:'row'+(S.openNode===n.id?' open':''),onclick:()=>{S.openNode=S.openNode===n.id?null:n.id;renderNodes();}},
      el('td',{class:'mono',text:n.id}),el('td',{text:tipo}),el('td',{text:(n.tipo==='PRD'||n.tipo==='CLI'?'↳ ':'')+n.nombre}),
      el('td',{class:'mono',text:n.padre||'—'}),el('td',{text:n.etapa||'—'}),el('td',{class:'num',text:cnt}),el('td',{class:'num',text:av})));
  });
  t.append(body);
  const det=$('#nodeDetail');det.replaceChildren();
  const n=S.openNode&&S.nodes[S.openNode];
  if(!n) return;
  const obs=Object.values(S.obs).filter(o=>o.nodo===n.id).sort((a,b)=>String(b.capturado).localeCompare(String(a.capturado)));
  const card=el('div',{class:'card'},el('h3',{style:'font-size:17px;margin-bottom:6px',text:n.nombre}),el('p',{class:'mono',text:n.id}));
  if(n.descripcion) card.append(el('p',{style:'margin-top:6px',text:n.descripcion}));
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
    b.append(el('tr',null,el('td',{class:'mono',text:o.id}),el('td',null,tagEl(o.variable),' '+(v?v.nombre:'')),
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
  emps.forEach(e=>{cols.push(e);const c=cliOf(e.id);if(c)cols.push(c);nodesOf('PRD').filter(p=>p.padre===e.id).forEach(p=>cols.push(p));});
  const t=el('table',{class:'tbl'});
  t.append(el('thead',null,el('tr',null,el('th',{text:'Dimensión'}),cols.map(n=>el('th',{style:'text-align:center'},n.nombre,el('small',{text:n.id}))))));
  const covs=cols.map(n=>coverage(n));
  const b=el('tbody');
  Object.keys(DIMS).forEach(d=>{
    b.append(el('tr',null,el('td',null,tagEl(d),' '+DIMS[d]),
      covs.map(c=>{const x=c[d];
        if(!x||!x.total) return el('td',{class:'cell zero',style:'--p:0',text:'—'});
        const p=x.done/x.total;
        return el('td',{class:'cell'+(x.done?'':' zero'),style:'--p:'+p.toFixed(2),text:x.done+'/'+x.total});})));
  });
  t.append(b);w.append(t);
}
function fillCvEmp(){
  const s=$('#cv-emp');if(!s) return;
  const emps=nodesOf('EMP'),sig=emps.map(e=>e.id+e.nombre).join('|');
  if(s.dataset.sig!==sig){
    const cur=s.value;
    s.replaceChildren(el('option',{value:'',text:'Todas las empresas'}),...emps.map(e=>el('option',{value:e.id,text:e.nombre})));
    s.value=cur;s.dataset.sig=sig;
  }
}
function renderCatalogList(){
  fillCvEmp();
  const f=$('#cv-filter').value||'*';
  const t=$('#catTbl');t.replaceChildren();
  t.append(el('thead',null,el('tr',null,['ID','Variable','Dimensión','Nivel','Fuente','Respuesta','Aplica a','Prioritaria en'].map(h=>el('th',{text:h})))));
  const b=el('tbody');
  allVars().filter(v=>f==='*'||v.dim===f).forEach(v=>{
    const pr=ETAPAS.filter(e=>(PRIOR[e.k]||[]).includes(v.id)).map(e=>e.k).join(', ');
    const em=v.emp&&S.nodes[v.emp];
    b.append(el('tr',null,el('td',{class:'mono',text:v.id}),el('td',null,v.nombre,S.custom[v.id]?el('span',{class:'tag',style:'margin-left:6px',text:'nueva'}):null),
      el('td',{text:v.dim+' · '+DIMS[v.dim]}),el('td',{text:NIVELES[v.nivel]}),el('td',{text:FUENTES[v.fuente]}),el('td',{text:TIPOS[v.tipo]}),
      el('td',{text:v.emp?(em?em.nombre:v.emp):'Todas'}),el('td',{text:pr||'—'})));
  });
  t.append(b);
}

/* ===================== Cómo funciona (partes dinámicas) ===================== */
function renderHow(){
  const ne=nodesOf('EMP').length,np=nodesOf('PRD').length,no=Object.keys(S.obs).length;
  const pl=(n,a,b)=>n+' '+(n===1?a:b);
  $('#how-live').textContent='Hoy: '+pl(ne,'empresa','empresas')+' · '+pl(np,'producto','productos')+' · '+pl(no,'observación','observaciones')+' · '+pl(allVars().length,'variable','variables')+' en el catálogo';
  const g=$('#how-dims');g.replaceChildren();
  Object.keys(DIMS).forEach(d=>{
    const vs=allVars().filter(v=>v.dim===d);
    const nivs=[...new Set(vs.map(v=>NIVELES[v.nivel]))].join(' y ');
    g.append(el('div',null,el('span',null,el('i',{text:d}),DIMS[d]),el('span',{text:vs.length+' · '+nivs})));
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
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>{const t=$('#'+b.dataset.go);if(t)t.scrollIntoView({behavior:'smooth',block:'start'});}));

/* ===================== pestañas ===================== */
function setTab(t){
  S.tab=t;
  $$('.tab').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===t)));
  $$('.view').forEach(v=>{v.hidden=v.id!=='v-'+t;});
  document.body.classList.toggle('uni-on',t==='universe');
  window.scrollTo(0,0);shellSync();
  if(t==='universe'){GR.w=0;requestAnimationFrame(()=>{ensureGraph();gResize();gRefresh();});}
  scheduleRender();
}
function setSub(s){
  S.sub=s;
  $$('.subtab').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.sub===s)));
  $$('.subview').forEach(v=>{v.hidden=v.id!=='s-'+s;});
  scheduleRender();
}
$$('.tab').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
$$('.subtab').forEach(b=>b.addEventListener('click',()=>setSub(b.dataset.sub)));
$('#o-emp').addEventListener('change',renderObs);
$('#o-dim').addEventListener('change',renderObs);
$('#o-q').addEventListener('input',renderObs);
function renderAll(){
  ensureFichas();
  setSync();renderPath();renderSide();
  if(S.tab==='universe'){ensureGraph();gRefresh();if(GR.sel)gPanel();}
  if(S.tab==='data'){
    renderDbStats();
    if(S.sub==='obs') renderObs();
    if(S.sub==='nodes') renderNodes();
    if(S.sub==='cover') renderCover();
    if(S.sub==='catalog') renderCatalogList();
    if(S.sub==='export') renderExport();
    if(S.sub==='hal') renderHal();
    if(S.sub==='imp') renderImp();
  }
  if(S.tab==='how') renderHow();
  if(S.tab==='motor') renderMotor();
  if(S.tab==='analisis') renderAnalisis();
  if(S.tab==='sugerencias') renderSugerenciasAuto();
  if(S.tab==='backoffice') renderBackofficeAuto();
}

/* ===================== Captura de lo particular a lo general + equipo en vivo ===================== */
const TEAM={seen:null,msg:'',msgAt:0,fresh:{},qStart:''};
const byIdN=(a,b)=>a.id.localeCompare(b.id);
function nodeProg(n){
  const vs=varsFor(n),done=vs.filter(v=>hasObs(n.id,v.id)).length;
  return {done,total:vs.length,pct:vs.length?Math.round(done/vs.length*100):0};
}
function ladderOf(emp){
  const steps=[];
  nodesOf('PRD').filter(p=>p.padre===emp.id).sort(byIdN).forEach(p=>steps.push({nivel:1,kind:'prd',node:p}));
  clisOf(emp.id).forEach(c=>steps.push({nivel:2,kind:'cli',node:c}));
  steps.push({nivel:3,kind:'emp',node:emp});
  steps.push({nivel:4,kind:'grp',node:nodesOf('GRP')[0]||{id:'grp',nombre:'Grupo Tama'}});
  return steps;
}
const stepDone=s=>{if(s.kind==='grp') return false;const p=nodeProg(s.node);return p.total===0||p.done>=p.total;};
const sameStep=(a,b)=>!!a&&!!b&&a.kind===b.kind&&a.node.id===b.node.id;
function stepName(s){
  return s.kind==='prd'?'Producto «'+s.node.nombre+'»':s.kind==='cli'?'Cliente «'+segName(s.node)+'»':s.kind==='emp'?'Empresa «'+s.node.nombre+'»':'Grupo Tama';
}
function curStep(emp){
  const L=ladderOf(emp);
  if(S.ctx.prd) return L.find(s=>s.kind==='prd'&&s.node.id===S.ctx.prd)||null;
  if(S.ctx.cli) return L.find(s=>s.kind==='cli'&&s.node.id===S.ctx.cli)||null;
  if(S.ctx.grp) return L.find(s=>s.kind==='grp');
  return L.find(s=>s.kind==='emp');
}
function nextStep(emp){
  const L=ladderOf(emp),cur=curStep(emp),i=Math.max(0,L.findIndex(s=>sameStep(s,cur)));
  const inc=[...L.slice(i+1),...L.slice(0,i)].filter(s=>s.kind!=='grp'&&!stepDone(s));
  if(inc.length) return inc[0];
  return cur&&cur.kind==='grp'?null:L.find(s=>s.kind==='grp');
}
function levelMsg(){
  const E=S.ctx.emp&&S.nodes[S.ctx.emp];if(!E) return '';
  const c=curStep(E);return c?'Nivel '+c.nivel+' de 4 · '+stepName(c)+'. ':'';
}
function nextLevelChip(){
  const E=S.ctx.emp&&S.nodes[S.ctx.emp];if(!E) return null;
  const nx=nextStep(E);if(!nx) return null;
  return {label:'Siguiente nivel: '+stepName(nx),tone:'primary',fn:()=>{echo('Siguiente nivel');goStep(E,nx);}};
}
function goStep(emp,s){
  S.ctx.emp=emp.id;S.ctx.grp=false;
  if(s.kind==='prd'){S.ctx.prd=s.node.id;S.ctx.cli=null;renderPath();startCapture();}
  else if(s.kind==='cli'){
    const c=s.node;
    if(!c.tipoCliente){segmentFlow(emp,c,()=>choosePrd(S.nodes[emp.id]||emp));return;}
    S.ctx.cli=c.id;S.ctx.prd=null;renderPath();startCapture();
  }
  else if(s.kind==='emp'){S.ctx.prd=null;S.ctx.cli=null;renderPath();startCapture();}
  else stepGrupo(emp);
}
function stepGrupo(emp){
  S.ctx.emp=emp.id;S.ctx.prd=null;S.ctx.cli=null;S.ctx.grp=true;S.queue=[];S.then=null;S.curSat=null;renderPath();renderSide();
  const L=ladderOf(emp).filter(s=>s.kind!=='grp'),done=L.filter(stepDone).length;
  const emps=nodesOf('EMP'),full=emps.filter(e=>ladderOf(e).filter(s=>s.kind!=='grp').every(stepDone)).length;
  say('Nivel 4 de 4 · Grupo Tama. De '+emp.nombre+' hay '+done+' de '+L.length+' nodos completos. En el grupo, '+full+' de '+emps.length+(emps.length===1?' empresa tiene':' empresas tienen')+' todos sus nodos completos.');
  const items=[],pend=L.find(s=>!stepDone(s));
  if(pend) items.push({label:'Completar: '+stepName(pend),tone:'primary',fn:()=>{echo('Completar');goStep(emp,pend);}});
  const nextEmp=emps.find(e=>e.id!==emp.id&&!ladderOf(e).filter(s=>s.kind!=='grp').every(stepDone));
  if(nextEmp) items.push({label:'Siguiente empresa: '+nextEmp.nombre,tone:'primary',fn:()=>{echo(nextEmp.nombre);choosePrd(nextEmp);}});
  items.push({label:'Registrar hallazgos y sugerencias',fn:()=>{echo('Hallazgos y sugerencias');startInsight();}});
  items.push({label:'Ver las sugerencias',fn:()=>{echo('Sugerencias');setTab('sugerencias');}});
  items.push({label:'Ver el universo',fn:()=>{echo('Universo');setTab('universe');}});
  items.push({label:'Elegir otra empresa',tone:'quiet',fn:()=>{echo('Otra empresa');chooseEmpresa();}});
  setComposer(chipRow(items));
}
function choosePrd(emp){
  S.ctx.emp=emp.id;S.ctx.prd=null;S.ctx.cli=null;S.ctx.grp=false;S.queue=[];S.then=null;renderPath();renderSide();
  ensureCli(emp).then(()=>scheduleRender()).catch(()=>{});
  const L=ladderOf(emp),first=L.find(s=>s.kind!=='grp'&&!stepDone(s));
  say('Capturemos '+emp.nombre+' de lo particular a lo general: primero sus productos, luego sus segmentos de cliente, después la empresa y al final el grupo.');
  const items=[];
  L.forEach(s=>{
    if(s.kind==='grp') return;
    items.push({label:s.nivel+' · '+stepName(s),sub:nodeProg(s.node).pct+'%',tone:first&&sameStep(s,first)?'primary':undefined,fn:()=>{echo(stepName(s));goStep(emp,s);}});
  });
  items.push({label:'4 · Grupo Tama',sub:'cierre',tone:first?undefined:'primary',fn:()=>{echo('Grupo Tama');stepGrupo(emp);}});
  if(!emp.ficha||!emp.ficha.industria) items.push({label:'Completar ficha de la empresa',tone:'primary',fn:()=>{echo('Completar ficha');completarFicha(emp);}});
  items.push({label:'Nuevo producto',fn:()=>{echo('Nuevo producto');newProducto(emp);}});
  items.push({label:'Nuevo segmento de cliente',fn:async()=>{echo('Nuevo segmento de cliente');try{const n=await newCli(emp);segmentFlow(emp,n,()=>choosePrd(S.nodes[emp.id]||emp));}catch(e){say('No se pudo crear el segmento: '+msgOf(e));}}});
  items.push({label:'Cambiar de empresa',tone:'quiet',fn:()=>{echo('Cambiar de empresa');chooseEmpresa();}});
  setComposer(chipRow(items));
}

/* ---- ruta de captura (panel lateral) ---- */
function renderLadder(){
  const box=document.getElementById('ladder');if(!box) return;
  const E=S.ctx.emp&&S.nodes[S.ctx.emp];
  if(!E){box.replaceChildren(el('p',{class:'empty',text:'Elige una empresa para ver su ruta: productos, segmentos de cliente, empresa y grupo.'}));return;}
  const L=ladderOf(E),cur=curStep(E),kids=[];
  [[1,'Productos'],[2,'Segmentos de cliente'],[3,'Empresa'],[4,'Grupo']].forEach(([n,t])=>{
    kids.push(el('div',{class:'lvl'},el('span',{class:'lvln',text:String(n)}),el('b',{text:t})));
    const steps=L.filter(s=>s.nivel===n);
    if(!steps.length) kids.push(el('p',{class:'empty',style:'margin:0 0 10px 34px',text:n===1?'Aún no hay productos.':'Aún no hay segmentos.'}));
    steps.forEach(s=>{
      const on=sameStep(s,cur);
      if(s.kind==='grp'){
        kids.push(el('button',{class:'steprow'+(on?' on':''),type:'button',onclick:()=>{if(S.tab==='capture') goStep(E,s);}},el('span',{class:'sn',text:'Cierre y sugerencias'}),el('span',{class:'sp',text:''})));
        return;
      }
      const p=nodeProg(s.node),dn=stepDone(s);
      kids.push(el('button',{class:'steprow'+(on?' on':'')+(dn?' done':''),type:'button','aria-current':on?'step':null,onclick:()=>{if(S.tab==='capture') goStep(E,s);}},
        el('span',{class:'sn',text:s.kind==='prd'?s.node.nombre:s.kind==='cli'?segName(s.node):s.node.nombre}),
        el('span',{class:'sp',text:dn?'completo':p.pct+'%'}),
        el('span',{class:'bar'},el('i',{style:'width:'+p.pct+'%'}))));
    });
  });
  box.replaceChildren(...kids);
}

/* ---- equipo en vivo ---- */
function agoTxt(iso){
  const s=Math.max(0,(Date.now()-new Date(iso).getTime())/1000);
  if(!isFinite(s)) return '';
  if(s<60) return 'hace un momento';
  if(s<3600) return 'hace '+Math.floor(s/60)+' min';
  if(s<86400) return 'hace '+Math.floor(s/3600)+' h';
  return 'hace '+Math.floor(s/86400)+' d';
}
function renderTeam(){
  const box=document.getElementById('team'),rec=document.getElementById('recent'),live=document.getElementById('team-live'),pill=document.getElementById('team-pill');
  if(!box||!rec) return;
  const obs=Object.values(S.obs),ready=S.mem||(S.loaded&&S.loaded.obs);
  if(ready){
    if(TEAM.seen===null) TEAM.seen=new Set(obs.map(o=>o.id));
    else{
      const nuevos=obs.filter(o=>!TEAM.seen.has(o.id));
      nuevos.forEach(o=>TEAM.seen.add(o.id));
      const ajenos=nuevos.filter(o=>o.por&&o.por!==S.uid);
      if(ajenos.length){
        const quien=[...new Set(ajenos.map(o=>capName(o.por)))];
        TEAM.msg=quien.join(' y ')+' registró '+ajenos.length+(ajenos.length===1?' dato':' datos')+'.';TEAM.msgAt=Date.now();
        ajenos.forEach(o=>{TEAM.fresh[o.id]=Date.now();});
      }
    }
  }
  if(pill){pill.textContent=S.mem?'Sin sincronizar':'En vivo';pill.classList.toggle('off',!!S.mem);}
  live.replaceChildren(TEAM.msg&&Date.now()-TEAM.msgAt<60000?el('div',{class:'impmsg ok',style:'margin:0 0 12px'},TEAM.msg):'');
  const by={};
  obs.forEach(o=>{if(!o.por) return;const g=by[o.por]||(by[o.por]={n:0,last:'',nodos:new Set()});g.n++;g.nodos.add(o.nodo);if(String(o.capturado)>g.last) g.last=String(o.capturado);});
  const people=Object.entries(by).sort((a,b)=>b[1].last.localeCompare(a[1].last));
  box.replaceChildren(...(people.length?people.map(([id,g])=>{
    const activo=Date.now()-new Date(g.last).getTime()<5*60000;
    return el('div',{class:'person'},el('span',{class:'dot'+(activo?' on':''),'aria-hidden':'true'}),el('div',null,el('b',{text:capName(id)}),el('span',{class:'m',text:g.n+(g.n===1?' registro':' registros')+' en '+g.nodos.size+(g.nodos.size===1?' nodo':' nodos')+' · '+agoTxt(g.last)})));
  }):[el('p',{class:'empty',text:'Todavía nadie ha registrado datos.'})]));
  const last=obs.slice().sort((a,b)=>String(b.capturado).localeCompare(String(a.capturado))).slice(0,6);
  rec.replaceChildren(...(last.length?last.map(o=>{
    const v=varById(o.variable),nuevo=TEAM.fresh[o.id]&&Date.now()-TEAM.fresh[o.id]<60000;
    return el('li',null,el('span',null,tagEl(o.id),' ',el('span',{text:v?v.nombre:o.variable}),nuevo?el('span',{class:'newtag',text:'nuevo'}):null),el('span',{class:'m',text:showVal(o)+' · '+capName(o.por)+' · '+agoTxt(o.capturado)}));
  }):[el('li',{class:'empty',text:'Todavía no hay registros.'})]));
}
{
  const _rs=renderSide;
  renderSide=function(){_rs();renderLadder();renderTeam();};
  const _bq=buildQueue;
  buildQueue=function(o){TEAM.qStart=nowIso();return _bq(o);};
  const _av=askVar;
  askVar=function(){
    const it=S.queue[0];
    if(it&&S.phase!=='single'){
      const o=latest(it.nodeId,it.vid);
      if(o&&o.por&&o.por!==S.uid&&String(o.capturado)>TEAM.qStart){
        S.queue.shift();
        const v=varById(it.vid);
        bubble('bot',el('div',{class:'receipt'},el('span',{text:capName(o.por)+' ya registró «'+(v?v.nombre:it.vid)+'»; la salto.'})));
        return askVar();
      }
    }
    return _av();
  };
  setInterval(()=>{if(S.tab==='capture') renderTeam();},20000);
}

/* ===================== Análisis y documentos ===================== */
const AN={sub:'diag',emp:'',corr:'*',aud:'empresa',inclText:false,busy:false,msg:'',msgKind:'',model:null};
const pctS=(a,b)=>b?Math.round(a/b*100)+'%':'—';
const joinY=a=>a.length<=1?(a[0]||''):a.slice(0,-1).join(', ')+' y '+a[a.length-1];
const AUD_ES={empresa:'la empresa (para mejorar su producto y su mercado)',comercial:'el equipo comercial (para cross-selling y ventas)',analisis:'el equipo de análisis (para validar el método y los datos)'};
const KIND_ES={diag:'diagnóstico de una empresa',comp:'comparativo del grupo',casos:'casos de uso de cliente',corr:'lectura por corriente de análisis'};
const G=text=>({t:'p',text,gen:true});
const H=text=>({t:'h',text});
const UL=items=>({t:'ul',items});
const NOTE=text=>({t:'note',text});
const TBL=(cols,rows,extra={})=>({t:'table',cols,rows,...extra});
const SEC=(id,titulo,blocks)=>({id,titulo,blocks:blocks.filter(Boolean)});

function empNodes(emp){return [emp,cliOf(emp.id),...nodesOf('PRD').filter(p=>p.padre===emp.id)].filter(Boolean);}
function covSat(emp){
  const out={};Object.keys(SATS).forEach(k=>{out[k]={done:0,total:0};});
  empNodes(emp).forEach(n=>varsFor(n).forEach(v=>{const o=out[satOf(v)];if(!o) return;o.total++;if(hasObs(n.id,v.id)) o.done++;}));
  return out;
}
function capItems(emp,opt={}){
  const out=[];
  empNodes(emp).forEach(n=>varsFor(n).forEach(v=>{
    if(opt.sat&&satOf(v)!==opt.sat) return;
    if(opt.dims&&!opt.dims.includes(v.dim)) return;
    const r=latest(n.id,v.id);if(!r||r.no_aplica) return;
    out.push({n,v,r});
  }));
  out.sort((a,b)=>dimIndex(a.v.dim)-dimIndex(b.v.dim)||(a.v.gi!=null?a.v.gi:99)-(b.v.gi!=null?b.v.gi:99)||a.v.id.localeCompare(b.v.id));
  return out;
}
const NODO_ES={EMP:'Empresa',CLI:'Cliente',PRD:'Producto'};
function itemRow(it){return [SATS[satOf(it.v)].nombre,DIMS[it.v.dim],it.v.nombre,NODO_ES[it.n.tipo]+(it.n.tipo==='PRD'?': '+it.n.nombre:''),showVal(it.r)];}
function halsFor(emp){
  const ids=new Set(empNodes(emp).map(n=>n.id));
  return nodesOf('HAL').filter(h=>{const e=empOfNode(h);if(e&&e.id===emp.id) return true;return (h.obs||[]).some(id=>S.obs[id]&&ids.has(S.obs[id].nodo));});
}
function qualityOf(emp){
  const ids=new Set(empNodes(emp).map(n=>n.id)),obs=Object.values(S.obs).filter(o=>ids.has(o.nodo));
  const cnt=f=>{const m={};obs.forEach(o=>{const k=f(o)||'sin dato';m[k]=(m[k]||0)+1;});return m;};
  const now=new Date(),ages=obs.map(o=>o.periodo).filter(Boolean).map(p=>{const [y,m]=String(p).split('-').map(Number);return (now.getFullYear()-y)*12+(now.getMonth()+1-m);}).filter(x=>isFinite(x));
  return {n:obs.length,fuente:cnt(o=>o.fuente),conf:cnt(o=>o.confianza),conNota:obs.filter(o=>o.nota&&!o.origen).length,imp:obs.filter(o=>o.origen).length,na:obs.filter(o=>o.no_aplica).length,
    antig:ages.length?{max:Math.max(...ages),med:medianOf(ages)}:null,ultima:obs.reduce((a,o)=>String(o.capturado)>a?String(o.capturado):a,'')};
}
function gapData(node,M0){
  const M=M0||motorStatus(),U=cfg().umb,peers=nodesOf(node.tipo).filter(n=>n.id!==node.id);
  if(peers.length<U.minPares) return {gate:'Hay '+peers.length+(peers.length===1?' par':' pares')+' del mismo tipo y se necesitan '+U.minPares+' para comparar.',dev:[],falt:[]};
  const R=nodeRows(M,node),dev=[];
  if(R.mine) Object.entries(R.mine.vals).forEach(([id,x])=>{
    const v=varById(id);if(!v||!R.filter(v)) return;
    const pv=R.rows.filter(r=>r!==R.mine).map(r=>r.vals[id]).filter(y=>y!=null);
    if(pv.length<U.minPares) return;
    const s=sdev(pv),mu=mean(pv);dev.push({v,x,med:medianOf(pv),n:pv.length,z:s>0?(x-mu)/s:0,pct:Math.round(pv.filter(y=>y<=x).length/pv.length*100)});
  });
  const far=dev.filter(d=>Math.abs(d.z)>=1).sort((a,b)=>Math.abs(b.z)-Math.abs(a.z));
  const falt=[];
  varsFor(node).forEach(v=>{if(hasObs(node.id,v.id)) return;const c=peers.filter(p=>hasObs(p.id,v.id)).length;if(c>=2&&c/peers.length>=.5) falt.push({v,c,of:peers.length});});
  falt.sort((a,b)=>b.c-a.c);
  return {dev:far,falt,comparables:dev.length};
}
function prioPend(emp){
  const out=[];
  nodesOf('PRD').filter(p=>p.padre===emp.id).forEach(p=>{(PRIOR[p.etapa]||[]).forEach(id=>{const v=varById(id);if(v&&!hasObs(p.id,id)) out.push({v,p});});});
  return out;
}

/* ---- 1. diagnóstico por empresa ---- */
function buildDiag(emp){
  const f=emp.ficha||{},clis=clisOf(emp.id),prds=nodesOf('PRD').filter(p=>p.padre===emp.id);
  const cov=covSat(emp),totD=Object.values(cov).reduce((a,c)=>a+c.done,0),totT=Object.values(cov).reduce((a,c)=>a+c.total,0);
  const ranked=Object.keys(cov).filter(k=>cov[k].total).map(k=>({k,p:cov[k].done/cov[k].total,...cov[k]})).sort((a,b)=>b.p-a.p);
  const q=qualityOf(emp),hals=halsFor(emp),pres=nodesOf('PRE').filter(p=>p.padre===emp.id&&p.estado==='abierta');
  const sugs=nodesOf('SUG').filter(s=>{const e2=empOfNode(s);return e2&&e2.id===emp.id;});
  const secs=[];
  secs.push(SEC('ficha','Ficha de la empresa',[
    TBL(['Campo','Dato'],[['Industria',f.industria||'—'],['Categoría',f.categoria||'—'],['Mercado',f.mercado_geo||'—'],['Pregunta de negocio',f.pregunta||'—'],['Decisión que se tomará',f.decision||'—'],['Fuentes disponibles',f.fuentes||'—'],['Segmentos de cliente (buyer persona)',clis.map(c=>segName(c)+(c.tipoCliente?' ('+c.tipoCliente+(c.estrategia?', '+c.estrategia:'')+')':'')).join('; ')||'—']]),
    prds.length?TBL(['Producto','Etapa del ciclo de vida','Variables con dato'],prds.map(p=>{const vs=varsFor(p),d=vs.filter(v=>hasObs(p.id,v.id)).length;return [p.nombre,p.etapa||'—',d+' de '+vs.length];})):NOTE('Todavía no hay productos registrados.')]));
  const top=ranked.filter(r=>r.done>0).slice(0,3),low=ranked.filter(r=>r.done===0);
  const pend=prioPend(emp);
  secs.push(SEC('cobertura','Qué sabemos y qué falta',[
    G('De '+emp.nombre+' hay '+totD+' datos con valor entre '+totT+' variables aplicables a su empresa, su cliente y '+(prds.length===1?'su producto':'sus '+prds.length+' productos')+': una cobertura de '+pctS(totD,totT)+'.'),
    top.length?G('Las corrientes mejor cubiertas son '+joinY(top.map(r=>SATS[r.k].nombre+' ('+Math.round(r.p*100)+'%)'))+'.'):G('Todavía no hay datos capturados en ninguna corriente.'),
    low.length?G('Sin ningún dato: '+joinY(low.map(r=>SATS[r.k].nombre))+'.'):null,
    TBL(['Corriente','Con dato','Aplicables','Cobertura'],ranked.map(r=>[SATS[r.k].nombre,r.done,r.total,Math.round(r.p*100)+'%'])),
    pend.length?H('Prioridades de captura según la etapa de cada producto'):null,
    pend.length?UL(pend.slice(0,10).map(x=>x.v.nombre+' ('+x.p.nombre+')')):null]));
  const items=capItems(emp),per={},rows=[],sensRows=new Set();
  items.forEach(it=>{const k=satOf(it.v);per[k]=(per[k]||0)+1;if(per[k]<=8){if(it.v.tipo==='t') sensRows.add(rows.length);rows.push(itemRow(it));}});
  secs.push(SEC('datos','Datos clave por corriente',[
    items.length?TBL(['Corriente','Área','Variable','Nodo','Valor'],rows.slice(0,90),{valCol:4,sensRows}):NOTE('Todavía no hay datos capturados.'),
    items.length>rows.length?NOTE('Se muestran '+rows.length+' de '+items.length+' datos. El detalle completo está en Lectura por corriente.'):null]));
  const gnodes=[emp,...prds,...clis].filter(Boolean),gblocks=[];let gates=0,anyDev=0;
  gnodes.forEach(n=>{
    const g=gapData(n);
    if(g.gate){gates++;return;}
    anyDev+=g.dev.length;
    if(g.dev.length) gblocks.push(H('Dónde se aleja de sus pares: '+NODO_ES[n.tipo]+(n.tipo==='PRD'?' '+n.nombre:'')),TBL(['Variable','Su valor','Mediana de pares','Pares','Percentil','Distancia (z)'],g.dev.slice(0,12).map(d=>[d.v.nombre,fmt3(d.x),fmt3(d.med),d.n,d.pct+'%',fmt3(d.z)])));
    if(g.falt.length) gblocks.push(H('Lo que otros tienen y a '+(n.tipo==='PRD'?n.nombre:NODO_ES[n.tipo].toLowerCase())+' le falta'),UL(g.falt.slice(0,10).map(x=>x.v.nombre+' ('+x.c+' de '+x.of+' pares)')));
  });
  secs.push(SEC('brechas','Brechas frente a sus pares',[
    gates===gnodes.length?G('Todavía no hay suficientes pares para comparar a '+emp.nombre+': el motor pide al menos '+cfg().umb.minPares+' nodos del mismo tipo.'):G(anyDev?'Frente a los demás nodos del mismo tipo, '+emp.nombre+' se aleja de lo típico en '+anyDev+(anyDev===1?' variable':' variables')+'.':'Frente a los demás nodos del mismo tipo, no hay variables numéricas que se alejen de lo típico.'),
    ...gblocks]));
  secs.push(SEC('hallazgos','Qué se encontró',[
    hals.length?G(hals.length+(hals.length===1?' hallazgo registrado':' hallazgos registrados')+' para '+emp.nombre+'.'):G('Todavía no hay hallazgos registrados para '+emp.nombre+'.'),
    hals.length?TBL(['ID','Hallazgo','Corrientes que conecta','Insight','Implicación','Datos'],hals.map(h=>[h.id,h.hallazgo,(h.sats||[]).map(k=>SATS[k]?SATS[k].nombre:k).join(', '),h.insight||'—',h.implicacion||'—',(h.obs||[]).length])):null]));
  secs.push(SEC('sugerencias','Qué se sugiere',[
    sugs.length?G(sugs.length+(sugs.length===1?' sugerencia con plan de acción.':' sugerencias con plan de acción.')):G('Todavía no hay sugerencias registradas.'),
    sugs.length?TBL(['ID','Clase','Acción','Responsable','Vence','Prioridad','Estado','Avance del indicador'],sugs.map(s=>{const p=prioOf(s);return [s.id,CLASE_ES[s.clase]||'Sugerencia',s.accion,s.responsable||'—',s.vence||s.plazo||'—',p?p.nivel+' ('+p.q+')':'—',s.estado||'—',kpiStatus(s).txt];})):null,
    pres.length?H('Preguntas abiertas'):null,pres.length?UL(pres.map(p=>p.texto)):null]));
  const fu=Object.entries(q.fuente).map(([k,v])=>k+': '+v).join(' · '),cf=Object.entries(q.conf).map(([k,v])=>k+': '+v).join(' · ');
  secs.push(SEC('calidad','Calidad y confianza de los datos',[
    q.n?G('Hay '+q.n+' observaciones de '+emp.nombre+(q.antig?'; la mediana de antigüedad es de '+Math.round(q.antig.med)+(Math.round(q.antig.med)===1?' mes':' meses')+' y el dato más antiguo tiene '+q.antig.max+(q.antig.max===1?' mes.':' meses.'):'.')):G('Todavía no hay observaciones de '+emp.nombre+'.'),
    q.n?TBL(['Medida','Resultado'],[['Observaciones',q.n],['Por fuente',fu||'—'],['Por confianza',cf||'—'],['Con nota de hallazgo',q.conNota],['Importadas de archivos',q.imp],['Marcadas como no aplica',q.na]]):null]));
  return {titulo:'Diagnóstico de '+emp.nombre,subtitulo:'Inteligencia organizacional multidisciplinaria · Grupo Tama · '+new Date().toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}),sections:secs};
}

/* ---- 2. comparativo del grupo ---- */
function buildComp(){
  const emps=nodesOf('EMP'),secs=[],M=motorStatus();
  const info=emps.map(e=>{const cov=covSat(e),d=Object.values(cov).reduce((a,c)=>a+c.done,0),t=Object.values(cov).reduce((a,c)=>a+c.total,0),hs=halsFor(e),sg=nodesOf('SUG').filter(s=>{const e2=empOfNode(s);return e2&&e2.id===e.id;});
    const modelo=[...new Set(clisOf(e.id).map(c=>c.tipoCliente).filter(Boolean))].join(', ');
    return {e,cov,d,t,p:t?d/t:0,prd:nodesOf('PRD').filter(p=>p.padre===e.id).length,hs:hs.length,sgAb:sg.filter(s=>s.estado!=='hecha'&&s.estado!=='descartada').length,modelo:modelo||'—',q:qualityOf(e)};});
  const rk=[...info].sort((a,b)=>b.p-a.p);
  secs.push(SEC('grupo','El grupo en una vista',[
    G('El grupo tiene '+emps.length+(emps.length===1?' empresa registrada':' empresas registradas')+', con '+nodesOf('PRD').length+' productos y '+Object.keys(S.obs).length+' observaciones.'),
    emps.length>1?G('La empresa con más cobertura es '+rk[0].e.nombre+' ('+Math.round(rk[0].p*100)+'%) y la de menos, '+rk[rk.length-1].e.nombre+' ('+Math.round(rk[rk.length-1].p*100)+'%).'):null,
    TBL(['Empresa','Industria','Tipos de cliente','Productos','Datos','Cobertura','Hallazgos','Sugerencias abiertas'],info.map(i=>[i.e.nombre,(i.e.ficha&&i.e.ficha.industria)||'—',i.modelo,i.prd,i.d,Math.round(i.p*100)+'%',i.hs,i.sgAb]))]));
  const keys=Object.keys(SATS);
  secs.push(SEC('corrientes','Cobertura por corriente de análisis',[
    G('La cobertura por corriente muestra dónde está cada empresa y dónde hay más huecos comunes.'),
    TBL(['Empresa',...keys.map(k=>SATS[k].nombre)],info.map(i=>[i.e.nombre,...keys.map(k=>i.cov[k].total?Math.round(i.cov[k].done/i.cov[k].total*100)+'%':'—')]))]));
  const cols=Object.values(M.d.emp.cols).filter(c=>c.n>=2).sort((a,b)=>b.n-a.n).slice(0,10);
  secs.push(SEC('indicadores','Indicadores numéricos comparables',[
    cols.length?G('Estas variables numéricas están capturadas en al menos dos empresas, de modo que se pueden comparar directamente.'):G('Todavía no hay variables numéricas capturadas en al menos dos empresas.'),
    cols.length?TBL(['Variable',...emps.slice(0,8).map(e=>e.nombre)],cols.map(c=>[c.v.nombre,...emps.slice(0,8).map(e=>{const r=M.d.emp.rows.find(x=>x.u.id===e.id);return r&&r.vals[c.v.id]!=null?fmt3(r.vals[c.v.id]):'—';})])):null]));
  const A=M.d.assoc,cands=A.res.filter(x=>x.cand).slice(0,6);
  const gh=nodesOf('HAL').filter(h=>!empOfNode(h));
  secs.push(SEC('hallazgos','Hallazgos del grupo',[
    A.testable?G('El motor probó '+A.testable+' parejas de variables y '+A.res.filter(x=>x.cand).length+' cumplen los criterios para ser candidatas a hallazgo.'):G('Todavía no hay datos suficientes para probar asociaciones entre variables: la pareja con más datos reúne '+A.maxN+' unidades y se necesitan '+cfg().umb.nCorr+'.'),
    cands.length?TBL(['Variable A','Variable B','n','r','p ajustada'],cands.map(c=>[c.a.nombre,c.b.nombre,c.nEff,fmt3(c.r),fmtP(c.pAdj)])):null,
    gh.length?H('Hallazgos registrados a nivel de grupo'):null,gh.length?TBL(['ID','Hallazgo','Estado'],gh.map(h=>[h.id,h.hallazgo,h.estado||'—'])):null,
    NOTE('Una asociación entre variables no prueba causalidad.')]));
  secs.push(SEC('calidad','Calidad de los datos por empresa',[
    G('La calidad se mide por la fuente de cada dato, su confianza y su antigüedad.'),
    TBL(['Empresa','Observaciones','Confianza alta','Importadas de archivos','Antigüedad mediana (meses)'],info.map(i=>[i.e.nombre,i.q.n,i.q.n?Math.round(((i.q.conf.Alta||0)/i.q.n)*100)+'%':'—',i.q.imp,i.q.antig?Math.round(i.q.antig.med):'—']))]));
  return {titulo:'Comparativo del Grupo Tama',subtitulo:'Inteligencia organizacional multidisciplinaria · '+new Date().toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}),sections:secs};
}

/* ---- 3. casos de uso de cliente ---- */
function buildCasos(empSel){
  const emps=empSel?[empSel]:nodesOf('EMP'),pd=profileData(),U=cfg().umb,secs=[];
  emps.forEach(emp=>clisOf(emp.id).forEach(cli=>{
    const prds=nodesOf('PRD').filter(p=>p.padre===emp.id);
    const grab=dims=>{const rows=[],sens=new Set();dims.forEach(d=>varsFor(cli).filter(v=>v.dim===d).forEach(v=>{const r=latest(cli.id,v.id);if(r&&!r.no_aplica){if(v.tipo==='t') sens.add(rows.length);rows.push([DIMS[d],v.nombre,showVal(r)]);}}));return {rows,sens};};
    const perfil=grab(['Q']),mueve=grab(['PC2','PC4','PC5','B','PC1','PC3']),llega=grab(['V','X','S']);
    const missing=[];['Q','PC2','PC4','V','X'].forEach(d=>varsFor(cli).filter(v=>v.dim===d&&!hasObs(cli.id,v.id)).forEach(v=>missing.push(v)));
    const mine=pd.pairs.filter(p=>p.a.c.id===cli.id||p.b.c.id===cli.id).map(p=>({other:p.a.c.id===cli.id?p.b:p.a,sim:p.sim,same:p.same}));
    const ops=mine.filter(o=>o.sim>=U.simCross&&o.other.emp&&nodesOf('PRD').some(q=>q.padre===o.other.emp.id));
    const ppr=prds.map(p=>{const v=allVars().find(x=>x.nombre==='Precio de lista'),r=v&&latest(p.id,v.id);return [p.nombre,p.etapa||'—',r?showVal(r):'—'];});
    secs.push(SEC('caso_'+cli.id,'Caso de uso: '+segName(cli)+' ('+emp.nombre+')',[
      G('El segmento «'+segName(cli)+'» de '+emp.nombre+(cli.tipoCliente?' es de tipo '+cli.tipoCliente:' todavía no tiene tipo definido')+(cli.estrategia?' y se trabaja con una estrategia de '+cli.estrategia.toLowerCase():'')+(cli.descripcion?'. Se describe como «'+cli.descripcion+'»':'')+'. Consume '+(prds.length?(prds.length===1?'el producto ':'los productos ')+joinY(prds.map(p=>p.nombre)):'productos aún no registrados')+'. Su perfil tiene '+perfil.rows.length+' de '+varsFor(cli).filter(v=>v.dim==='Q').length+' variables de audiencia capturadas.'),
      H('Quién es'),perfil.rows.length?TBL(['Área','Variable','Valor'],perfil.rows,{valCol:2,sensRows:perfil.sens}):NOTE('Falta capturar su perfil de audiencia.'),
      H('Qué consume'),prds.length?TBL(['Producto','Etapa','Precio de lista'],ppr):NOTE('No hay productos registrados.'),
      H('Qué lo mueve y cómo decide'),mueve.rows.length?TBL(['Área','Variable','Valor'],mueve.rows.slice(0,30),{valCol:2,sensRows:mueve.sens}):NOTE('Aún no hay datos de motivaciones ni de decisión de compra.'),
      H('Cómo llega y se queda'),llega.rows.length?TBL(['Área','Variable','Valor'],llega.rows.slice(0,30),{valCol:2,sensRows:llega.sens}):NOTE('Aún no hay datos de origen, ciclo de vida ni canales.'),
      H('Oportunidades de cross-selling'),
      ops.length?UL(ops.map(o=>'Se parece '+Math.round(o.sim*100)+'% al segmento «'+segName(o.other.c)+'» de '+o.other.emp.nombre+(o.same.length?' (coinciden en '+o.same.slice(0,4).join(', ')+')':'')+'. Productos para explorar: '+nodesOf('PRD').filter(q=>q.padre===o.other.emp.id).map(q=>q.nombre).join(', ')+'.')):NOTE(mine.length?'Ningún perfil parecido llega al '+Math.round(U.simCross*100)+'% de similitud con productos registrados.':'Todavía no hay otros clientes con perfil comparable.'),
      NOTE('La similitud es de perfil, no de compras: son hipótesis para explorar.'),
      missing.length?H('Para completar el caso'):null,missing.length?UL(missing.slice(0,8).map(v=>v.nombre+' ('+DIMS[v.dim]+')')):null]));
  }));
  if(!secs.length) secs.push(SEC('vacio','Casos de uso',[G('Todavía no hay empresas con cliente registrado.')]));
  return {titulo:'Casos de uso de cliente'+(empSel?': '+empSel.nombre:''),subtitulo:'Inteligencia organizacional multidisciplinaria · '+new Date().toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}),sections:secs};
}

/* ---- 4. lectura por corriente ---- */
function buildCorr(emp,corr){
  const keys=corr&&corr!=='*'?[corr]:Object.keys(SATS),cov=covSat(emp),secs=[];
  keys.forEach(k=>{
    const c=cov[k];if(!c||!c.total) return;
    const items=capItems(emp,{sat:k}),byDim={};
    items.forEach(it=>{(byDim[it.v.dim]||(byDim[it.v.dim]=[])).push(it);});
    const areas=SATS[k].dims.map(d=>{const vs=empNodes(emp).flatMap(n=>varsFor(n).filter(v=>v.dim===d&&satOf(v)===k).map(v=>({n,v})));return {d,total:vs.length,done:(byDim[d]||[]).length};}).filter(a=>a.total);
    const best=[...areas].sort((a,b)=>b.done/b.total-a.done/a.total).filter(a=>a.done>0).slice(0,2),empty=areas.filter(a=>a.done===0);
    const sensRows=new Set(),rows=items.slice(0,60).map((it,i)=>{if(it.v.tipo==='t') sensRows.add(i);return [DIMS[it.v.dim],it.v.nombre,NODO_ES[it.n.tipo]+(it.n.tipo==='PRD'?': '+it.n.nombre:''),showVal(it.r),it.r.nota||''];});
    secs.push(SEC('c_'+k,SATS[k].nombre,[
      G('En '+SATS[k].nombre+', de '+emp.nombre+' hay '+c.done+' datos con valor entre '+c.total+' variables aplicables ('+pctS(c.done,c.total)+').'+(best.length?' Lo más completo: '+joinY(best.map(a=>a.d?DIMS[a.d]+' ('+a.done+' de '+a.total+')':'')) +'.':'')+(empty.length?' Sin datos: '+joinY(empty.slice(0,6).map(a=>DIMS[a.d]))+(empty.length>6?' y otras '+(empty.length-6):'')+'.':'')),
      NOTE(SATS[k].desc),
      rows.length?TBL(['Área','Variable','Nodo','Valor','Nota'],rows,{valCol:3,sensRows}):NOTE('Todavía no hay datos capturados en esta corriente.'),
      items.length>60?NOTE('Se muestran 60 de '+items.length+' datos.'):null,
      TBL(['Área','Con dato','Aplicables'],areas.map(a=>[DIMS[a.d],a.done,a.total]))]));
  });
  return {titulo:'Lectura por corriente: '+emp.nombre,subtitulo:'Inteligencia organizacional multidisciplinaria · '+new Date().toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}),sections:secs};
}

function currentModel(){
  const emps=nodesOf('EMP'),emp=emps.find(e=>e.id===AN.emp)||emps[0];
  if(AN.sub==='comp') return emps.length?buildComp():null;
  if(!emp&&AN.sub!=='casos') return null;
  if(AN.sub==='diag') return buildDiag(emp);
  if(AN.sub==='casos') return buildCasos(AN.emp==='*'?null:(emps.find(e=>e.id===AN.emp)||null));
  if(AN.sub==='corr') return buildCorr(emp,AN.corr);
  return null;
}

/* ---- vista ---- */
function renderModel(model,box){
  const kids=[el('p',{class:'empty',text:model.subtitulo})];
  model.sections.forEach(sec=>{
    const s=el('section',{class:'ansec'},el('h3',{text:sec.titulo}));
    sec.blocks.forEach(b=>{
      if(b.t==='p') s.append(el('p',{text:b.text}));
      else if(b.t==='h') s.append(el('h4',{text:b.text}));
      else if(b.t==='ul') s.append(el('ul',null,...b.items.map(i=>el('li',{text:i}))));
      else if(b.t==='note') s.append(el('p',{class:'empty',text:b.text}));
      else if(b.t==='table'){
        const t=el('table',{class:'tbl'});
        t.append(el('thead',null,el('tr',null,b.cols.map(c=>el('th',{text:c})))));
        const tb=el('tbody');b.rows.forEach(r=>tb.append(el('tr',null,r.map(c=>el('td',{text:String(c==null?'':c)})))));
        t.append(tb);s.append(el('div',{class:'card scroll',style:'margin:8px 0'},t));
      }
    });
    kids.push(s);
  });
  box.replaceChildren(...kids);
}
function anControls(){
  const emps=nodesOf('EMP'),bar=el('div',{class:'filters'});
  if(AN.sub!=='comp'){
    const se=el('select',{'aria-label':'Empresa',onchange:e=>{AN.emp=e.target.value;AN.msg='';renderAnalisis();}});
    if(AN.sub==='casos') se.append(el('option',{value:'*',text:'Todas las empresas'}));
    emps.forEach(e=>se.append(el('option',{value:e.id,text:e.nombre})));
    if(!emps.length) se.append(el('option',{value:'',text:'Primero crea una empresa en Capturar'}));
    se.value=(AN.emp==='*'&&AN.sub==='casos')?'*':(emps.find(e=>e.id===AN.emp)?AN.emp:(emps[0]?emps[0].id:''));
    if(AN.sub==='casos'&&AN.emp==='') se.value='*';
    bar.append(se);
  }
  if(AN.sub==='corr'){
    const sc=el('select',{'aria-label':'Corriente',onchange:e=>{AN.corr=e.target.value;renderAnalisis();}},el('option',{value:'*',text:'Todas las corrientes'}),...Object.keys(SATS).map(k=>el('option',{value:k,text:SATS[k].nombre})));
    sc.value=AN.corr;bar.append(sc);
  }
  return bar;
}
function renderAnalisis(){
  const box=$('#an-body');if(!box) return;
  $$('.asub').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.as===AN.sub)));
  if(AN.sub!=='casos'&&(!AN.emp||AN.emp==='*')&&nodesOf('EMP')[0]) AN.emp=nodesOf('EMP')[0].id;
  if(AN.sub==='casos'&&!AN.emp) AN.emp='*';
  const model=currentModel();AN.model=model;
  const ctl=$('#an-ctl');ctl.replaceChildren(anControls());
  const doc=$('#an-doc');
  if(!model){box.replaceChildren(el('div',{class:'impmsg warn',text:'Todavía no hay empresas. Crea una en Capturar y regresa.'}));doc.replaceChildren();return;}
  renderModel(model,box);
  /* panel del documento */
  const aud=el('select',{'aria-label':'Para quién',onchange:e=>{AN.aud=e.target.value;}},...Object.entries({empresa:'La empresa',comercial:'El equipo comercial',analisis:'El equipo de análisis'}).map(([k,v])=>el('option',{value:k,text:v})));
  aud.value=AN.aud;
  const inc=el('input',{type:'checkbox',checked:AN.inclText,onchange:e=>{AN.inclText=e.target.checked;}});
  const st=AN.msg?el('div',{class:'impmsg '+(AN.msgKind||''),role:'status'},AN.msg):null;
  doc.replaceChildren(el('details',{class:'det',open:AN.docOpen?true:null,ontoggle:e=>{AN.docOpen=e.target.open;}},el('summary',{text:'Descargar como documento de Word'}),
    el('div',{class:'card',style:'margin-top:10px'},
      el('p',{class:'empty',text:'El documento lleva las mismas tablas y datos de esta pestaña, con los textos redactados por Claude y organizados para quien lo va a leer.'}),
      el('div',{class:'filters',style:'margin-top:10px'},el('label',{style:'display:flex;gap:8px;align-items:center;font-size:13px;color:var(--muted)'},'Para',aud)),
      el('label',{style:'display:flex;gap:8px;align-items:flex-start;font-size:13px;color:var(--muted);margin-top:6px'},inc,'Enviar a Claude también los textos libres capturados (por defecto solo se envían cifras, conteos, hallazgos y sugerencias)'),
      el('p',{class:'empty',style:'margin-top:8px',text:'Claude recibe el contenido de las secciones que ves arriba, no las filas de los archivos importados. Te pedirá permiso la primera vez.'}),
      el('div',{class:'row2'},
        el('button',{class:'btn main',type:'button',disabled:AN.busy,onclick:()=>anDoc(true),text:AN.busy?'Generando…':'Documento con redacción de Claude'}),
        el('button',{class:'btn',type:'button',disabled:AN.busy,onclick:()=>anDoc(false),text:'Documento con textos de plantilla'})),
      st)));
}
$$('.asub').forEach(b=>b.addEventListener('click',()=>{AN.sub=b.dataset.as;AN.msg='';renderAnalisis();}));

/* ---- documento ---- */
function serializeSection(sec,inc){
  const parts=[];
  sec.blocks.forEach(b=>{
    if(b.t==='p'||b.t==='note') parts.push(b.text);
    else if(b.t==='h') parts.push('## '+b.text);
    else if(b.t==='ul') parts.push(b.items.map(i=>'- '+i).join('\n'));
    else if(b.t==='table'){
      parts.push(b.cols.join(' | '));
      b.rows.slice(0,25).forEach((r,i)=>parts.push(r.map((c,j)=>(!inc&&b.sensRows&&b.sensRows.has(i)&&j===b.valCol)?'[texto omitido]':String(c==null?'':c)).join(' | ')));
      if(b.rows.length>25) parts.push('(+'+(b.rows.length-25)+' filas)');
    }
  });
  return parts.join('\n');
}
function docPrompt(model){
  const secs=model.sections.map(s=>'### '+s.id+' · '+s.titulo+'\n'+serializeSection(s,AN.inclText)).join('\n\n');
  return `Eres analista senior de una inteligencia organizacional multidisciplinaria del Grupo Tama. Redacta los textos de un documento de ${KIND_ES[AN.sub]} dirigido a ${AUD_ES[AN.aud]}. Te paso el contenido por secciones (texto base y tablas). Tu trabajo es redactar el texto narrativo de cada sección, en español claro y directo.

REGLAS
- Usa solo la información que te paso. No inventes datos, causas ni cifras. Si falta información, dilo con claridad.
- Cita cifras exactas cuando las uses. Distingue datos capturados de hipótesis.
- Una asociación no prueba causalidad. Señala los límites cuando haya pocos datos o baja confianza.
- Para ${AN.aud==='empresa'?'la empresa: enfatiza brechas y mejoras de producto y mercado':AN.aud==='comercial'?'el equipo comercial: enfatiza oportunidades de cross-selling y casos de uso de cliente':'el equipo de análisis: enfatiza calidad de los datos, supuestos y límites del método'}.
- 1 a 3 párrafos por sección, de máximo 110 palabras cada uno. Sin viñetas dentro de los párrafos. Las tablas se incluyen aparte, no las repitas.
- "resumen": 3 a 5 oraciones. "pasos": 3 a 5 próximos pasos concretos.

DOCUMENTO: ${model.titulo}

${secs}

Responde SOLO con JSON con esta forma exacta:
{"resumen":"...","secciones":[{"id":"id de la sección","parrafos":["..."]}],"pasos":["..."]}`;
}
function docxFromModel(model,narr){
  const D=window.docx,kids=[];
  const para=(text,o={})=>new D.Paragraph({children:[new D.TextRun({text:String(text),italics:!!o.italics,size:o.size||22,bold:!!o.bold})],spacing:{after:120}});
  const head=(text,level)=>new D.Paragraph({text:String(text),heading:level,spacing:{before:240,after:120}});
  kids.push(new D.Paragraph({text:model.titulo,heading:D.HeadingLevel.TITLE}));
  kids.push(para(model.subtitulo,{italics:true,size:20}));
  if(narr&&narr.resumen){kids.push(head('Resumen ejecutivo',D.HeadingLevel.HEADING_1));kids.push(para(narr.resumen));}
  model.sections.forEach(sec=>{
    kids.push(head(sec.titulo,D.HeadingLevel.HEADING_1));
    const np=narr&&narr.sec&&narr.sec[sec.id];
    if(np) np.forEach(t=>kids.push(para(t)));
    sec.blocks.forEach(b=>{
      if(b.t==='p'){if(b.gen&&np) return;kids.push(para(b.text));}
      else if(b.t==='h') kids.push(head(b.text,D.HeadingLevel.HEADING_2));
      else if(b.t==='note') kids.push(para(b.text,{italics:true,size:18}));
      else if(b.t==='ul') b.items.forEach(i=>kids.push(new D.Paragraph({children:[new D.TextRun({text:String(i),size:21})],bullet:{level:0}})));
      else if(b.t==='table'){
        const w=Math.floor(100/b.cols.length);
        const cell=(txt,hd)=>new D.TableCell({width:{size:w,type:D.WidthType.PERCENTAGE},shading:hd?{type:D.ShadingType.CLEAR,fill:'DDE7EC',color:'auto'}:undefined,margins:{top:40,bottom:40,left:70,right:70},children:[new D.Paragraph({children:[new D.TextRun({text:String(txt==null?'':txt),size:17,bold:!!hd})]})]});
        kids.push(new D.Table({width:{size:100,type:D.WidthType.PERCENTAGE},rows:[new D.TableRow({tableHeader:true,children:b.cols.map(c=>cell(c,true))}),...b.rows.slice(0,120).map(r=>new D.TableRow({children:r.map(c=>cell(c,false))}))]}));
        kids.push(new D.Paragraph({text:'',spacing:{after:120}}));
      }
    });
  });
  if(narr&&narr.pasos&&narr.pasos.length){kids.push(head('Próximos pasos',D.HeadingLevel.HEADING_1));narr.pasos.forEach(p=>kids.push(new D.Paragraph({children:[new D.TextRun({text:String(p),size:22})],bullet:{level:0}})));}
  return new D.Document({creator:'Inteligencia organizacional multidisciplinaria',title:model.titulo,sections:[{children:kids}]});
}
const slug=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,50);
async function anDoc(useClaude){
  const model=AN.model;if(!model||AN.busy) return;
  AN.busy=true;AN.msg=useClaude?'Claude está redactando los textos…':'Generando el documento…';AN.msgKind='';renderAnalisis();
  try{
    if(!window.docx) throw new Error('La librería de Word no se pudo cargar.');
    let narr=null;
    if(useClaude){
      const sample=await (window.claude&&window.claude.use?window.claude.use('sample'):null);
      if(!sample) throw {code:'no_sample'};
      const out=await sample.json(docPrompt(model),{modelTier:'default',cache:false});
      const sec={};(out&&out.secciones||[]).forEach(s=>{if(s&&s.id&&Array.isArray(s.parrafos)) sec[s.id]=s.parrafos.map(String).filter(Boolean).slice(0,4);});
      narr={resumen:String((out&&out.resumen)||'').slice(0,1200),sec,pasos:((out&&out.pasos)||[]).map(String).slice(0,6)};
    }
    const blob=await window.docx.Packer.toBlob(docxFromModel(model,narr));
    const dl=await (window.claude&&window.claude.use?window.claude.use('downloads'):null);
    if(!dl) throw {code:'no_dl'};
    await dl.save({filename:slug(model.titulo)+'_'+new Date().toISOString().slice(0,10)+'.docx',data:blob});
    AN.msg='Documento listo.';AN.msgKind='ok';
  }catch(e){
    const m={no_sample:'Claude no está disponible en esta vista. Puedes generar el documento con textos de plantilla.',no_dl:'La descarga de archivos no está disponible en esta vista.',not_granted:'No diste permiso para usar Claude.',rate_limited:'Hay demasiadas solicitudes seguidas. Espera un momento.',invalid_json:'Claude respondió con un formato que no pude leer. Intenta de nuevo o usa los textos de plantilla.',declined:'Cancelaste la descarga.'}[e&&e.code];
    AN.msg=m||('No se pudo generar: '+msgOf(e));AN.msgKind=(e&&e.code==='declined')?'':'warn';
  }finally{AN.busy=false;renderAnalisis();}
}

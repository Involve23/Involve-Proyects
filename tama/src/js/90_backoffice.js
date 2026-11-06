/* ===================== Backoffice de variables (catálogo maestro, tipo Tama) ===================== */
const BO={sub:'matriz',fi:{},hi:{},rel:{},sel:null,draft:null,page:0,fCorr:'',fArea:'',fNivel:'',fTipo:'',fEst:'',fTxt:'',fCambios:false,msg:'',kind:'',busy:false,relOpen:null,nota:'',showHist:false,pmsg:'',pkind:''};
const ESTADOS_VAR=['borrador','validada','en uso','descontinuada'];
const FRECS=['Única vez','Mensual','Trimestral','Semestral','Anual','Bajo demanda'];
const NIVEL_ES={E:'Empresa',P:'Producto',C:'Cliente'};
const ESTV_TXT={borrador:'#806000',validada:'#2E6A1A','en uso':'#352B6D',descontinuada:'#72727A'};
const ESTV_BG={borrador:'#FEF5D4',validada:'#E8FDE8','en uso':'#E2DDED',descontinuada:'#EEEDEA'};
const CAMPOS=['pregunta','guia','def','unidad','escala','ejemplo','calc','dueno','frec','duplica','calcCon','dependeDe','aplica','estado'];
const CAMPO_ES={pregunta:'Pregunta',guia:'Guía de respuesta',def:'Qué mide',unidad:'Unidad',escala:'Escala',ejemplo:'Ejemplo',calc:'Cómo se calcula',dueno:'Dueño del dato',frec:'Frecuencia',duplica:'Duplica a',calcCon:'Se calcula con',dependeDe:'Depende de',aplica:'Aplica a (tipos de cliente)',estado:'Estado'};
const DUENO_SAT={MER:'Análisis de mercado',ANT:'Investigación del consumidor',SOC:'Investigación del consumidor',CUA:'Investigación del consumidor',SEM:'Investigación del consumidor',SEN:'Investigación del consumidor',ECO:'Finanzas',DAT:'Datos y analítica',RBI:'Comercial y retail',SLI:'Marketing digital',PSI:'Investigación del consumidor',FIN:'Finanzas',GES:'Dirección'};
const FREC_SAT={MER:'Trimestral',ANT:'Anual',SOC:'Anual',CUA:'Semestral',SEM:'Anual',SEN:'Semestral',ECO:'Trimestral',DAT:'Trimestral',RBI:'Mensual',SLI:'Mensual',PSI:'Semestral',FIN:'Trimestral',GES:'Anual'};
/* relaciones obvias del catálogo actual (se dejan como borrador para validar) */
const REL_DEF={
  'VAR-239':{duplica:['VAR-902']},'VAR-902':{duplica:['VAR-239']},
  'VAR-384':{duplica:['VAR-618']},'VAR-618':{duplica:['VAR-384']},
  'VAR-376':{duplica:['VAR-647']},'VAR-647':{duplica:['VAR-376']},
  'VAR-385':{duplica:['VAR-648']},'VAR-648':{duplica:['VAR-385']},
  'VAR-038':{duplica:['VAR-524']},'VAR-524':{duplica:['VAR-038']},
  'VAR-380':{duplica:['VAR-956']},'VAR-956':{duplica:['VAR-380']},
  'VAR-523':{duplica:['VAR-941']},'VAR-941':{duplica:['VAR-523']},
  'VAR-649':{calcCon:['VAR-648','VAR-647'],calc:'Valor de vida del cliente (LTV) dividido entre el costo de adquisición (CAC).'},
  'VAR-645':{calcCon:['VAR-235','VAR-644'],calc:'(Precio de lista − costo por unidad) / precio de lista, en porcentaje.'},
  'VAR-620':{calcCon:['VAR-618','VAR-619'],calc:'Ingresos totales − costo de ventas.'},
  'VAR-624':{calcCon:['VAR-620','VAR-618'],calc:'Utilidad bruta / ingresos totales, en porcentaje.'},
  'VAR-625':{calcCon:['VAR-622','VAR-618'],calc:'EBITDA / ingresos totales, en porcentaje.'},
  'VAR-626':{calcCon:['VAR-623','VAR-618'],calc:'Utilidad neta / ingresos totales, en porcentaje.'}
};
const bV=v=>v._b||v;
function unitOf(v){
  const n=v.nombre;
  if(v.tipo==='e') return 'Escala 1 a 5';
  if(v.tipo==='p') return '%';
  if(v.tipo==='sn') return 'Sí / No';
  if(v.tipo==='c') return 'Opción';
  if(v.tipo==='n'){
    if(/NPS/.test(n)) return 'Puntos';
    if(/pesos|ingres|presupuesto|costo|gasto|precio|ticket|utilidad|EBITDA|CAC|LTV|inversi[oó]n|ventas|capital/i.test(n)) return 'MXN';
    if(/d[ií]as|ciclo|plazo/i.test(n)) return 'Días';
    if(/periodos|meses/i.test(n)) return 'Periodos';
    return 'Número';
  }
  return 'Texto';
}
function scaleOf(v){
  if(v.tipo==='e') return '1 = muy bajo · 5 = muy alto';
  if(v.tipo==='p') return '0 a 100';
  if(v.tipo==='sn') return 'Sí o No';
  if(v.tipo==='c') return (v.opts||[]).join(' / ');
  if(v.tipo==='n') return /NPS/.test(v.nombre)?'−100 a 100':'Valor numérico';
  return 'Texto libre con evidencia y fuente';
}
function exampleOf(v){
  if(v.tipo==='e') return '4';
  if(v.tipo==='p') return '35';
  if(v.tipo==='sn') return 'Sí';
  if(v.tipo==='c') return (v.opts||[])[0]||'';
  if(v.tipo==='n') return unitOf(v)==='MXN'?'1,500,000':'120';
  return 'Texto breve con evidencia y fuente';
}
function fichaDefault(v){
  const b=bV(v),r=REL_DEF[v.id]||{};
  return {pregunta:b.q||'',guia:b.guia||'',
    def:'Mide «'+v.nombre+'» ('+DIMS[v.dim]+(v.grupo?' › '+v.grupo:'')+') a nivel de '+NIVEL_ES[v.nivel].toLowerCase()+'.',
    unidad:unitOf(v),escala:scaleOf(v),ejemplo:exampleOf(v),calc:r.calc||'Dato capturado directamente; no se calcula.',
    dueno:DUENO_SAT[satOf(v)]||'Por asignar',frec:FREC_SAT[satOf(v)]||'Trimestral',
    duplica:r.duplica||[],calcCon:r.calcCon||[],dependeDe:[],aplica:b.aplica||null,estado:'borrador'};
}
const eff=v=>BO.fi[v.id]?BO.fi[v.id].campos:fichaDefault(v);
const verOf=v=>BO.fi[v.id]?BO.fi[v.id].v:1;
/* aplicar los ajustes del catálogo sobre las variables en uso */
function applyFichas(){
  allVars().forEach(v=>{
    const f=BO.fi[v.id];
    if(!v._b) v._b={q:v.q,guia:v.guia,aplica:v.aplica};
    if(f){
      const c=f.campos||{};
      v.q=c.pregunta||v._b.q;v.guia=c.guia||v._b.guia;
      v.aplica=v.nivel==='C'&&c.aplica&&c.aplica.length?c.aplica:undefined;
      v.estadoVar=c.estado;v.vver=f.v;
    }else{
      v.q=v._b.q;v.guia=v._b.guia;v.aplica=v._b.aplica;v.estadoVar=undefined;v.vver=1;
    }
  });
}
function boSub(db){
  [['vfichas','fi'],['vhist','hi'],['vrel','rel'],['aprend','ap'],['consultas','cons']].forEach(([c,k])=>db.collection(c).onSnapshot(snap=>{
    BO[k]=Object.fromEntries(snap.docs.map(d=>[d.id,d.data()]));
    if(k==='fi') applyFichas();
    scheduleRender();
  },err=>{console.error(err);}));
}
async function boPut(coll,id,data){
  const k={vfichas:'fi',vhist:'hi',vrel:'rel'}[coll],prev=BO[k][id];
  BO[k][id]=data;if(coll==='vfichas') applyFichas();
  scheduleRender();
  if(S.mem) return;
  try{await S.db.doc(coll+'/'+id).set(data);}
  catch(e){if(prev) BO[k][id]=prev;else delete BO[k][id];if(coll==='vfichas') applyFichas();scheduleRender();throw e;}
}
async function boSave(v,campos,nota,extra={}){
  const cur=BO.fi[v.id],prev=cur?cur.campos:fichaDefault(v),ver=cur?cur.v:1;
  const cambios={};
  CAMPOS.forEach(k=>{if(JSON.stringify(prev[k]==null?null:prev[k])!==JSON.stringify(campos[k]==null?null:campos[k])) cambios[k]=[prev[k]==null?null:prev[k],campos[k]==null?null:campos[k]];});
  if(!Object.keys(cambios).length) return {noop:true};
  const nv=ver+1,now=nowIso();
  await boPut('vhist',v.id+'@'+nv,{id:v.id+'@'+nv,var:v.id,v:nv,cuando:now,por:extra.por===undefined?(S.uid||null):extra.por,nota,cambios,campos});
  await boPut('vfichas',v.id,{id:v.id,v:nv,campos,actualizado:now,por:extra.por===undefined?(S.uid||null):extra.por});
  return {nv};
}
/* lanzamientos del catálogo */
const lastRel=()=>Object.values(BO.rel).sort((a,b)=>b.n-a.n)[0]||null;
function curVersions(){const m={};allVars().forEach(v=>{m[v.id]=verOf(v);});return m;}
function diffVers(prev,cur){
  const out=[];
  Object.keys(cur).forEach(id=>{
    if(!prev){if(cur[id]!==1) out.push({id,de:1,a:cur[id]});return;}
    if(!(id in prev)) out.push({id,de:0,a:cur[id]});
    else if(prev[id]!==cur[id]) out.push({id,de:prev[id],a:cur[id]});
  });
  return out;
}
const pendientes=()=>{const lr=lastRel();return diffVers(lr?lr.vars:null,curVersions());};
async function boPublish(tipo,nota){
  const lr=lastRel(),cur=curVersions();
  let major=lr?lr.major:1,minor=lr?lr.minor:0;
  if(lr){if(tipo==='mayor'){major++;minor=0;}else minor++;}
  const est={};allVars().forEach(v=>{const e=eff(v).estado;est[e]=(est[e]||0)+1;});
  const id=await mintId('REL',4);
  await boPut('vrel',id,{id,n:(lr?lr.n:0)+1,nombre:'v'+major+'.'+minor,major,minor,tipo:lr?tipo:'inicial',fecha:nowIso(),por:S.uid||null,nota,vars:cur,total:Object.keys(cur).length,cambios:diffVers(lr?lr.vars:null,cur),estados:est});
  return 'v'+major+'.'+minor;
}

/* ---- datos de la matriz ---- */
function boOrder(v){const k=satOf(v);return [Object.keys(SATS).indexOf(k),SATS[k].dims.indexOf(v.dim),v.gi==null?99:v.gi];}
function boRows(){
  let vs=allVars().slice().sort((a,b)=>{const x=boOrder(a),y=boOrder(b);return x[0]-y[0]||x[1]-y[1]||x[2]-y[2]||a.id.localeCompare(b.id);});
  if(BO.fCorr) vs=vs.filter(v=>satOf(v)===BO.fCorr);
  if(BO.fArea) vs=vs.filter(v=>v.dim===BO.fArea);
  if(BO.fNivel) vs=vs.filter(v=>v.nivel===BO.fNivel);
  if(BO.fTipo) vs=vs.filter(v=>v.nivel==='C'&&(!v.aplica||v.aplica.includes(BO.fTipo)));
  if(BO.fEst) vs=vs.filter(v=>eff(v).estado===BO.fEst);
  if(BO.fCambios){const p=new Set(pendientes().map(x=>x.id));vs=vs.filter(v=>p.has(v.id));}
  if(BO.fTxt){const t=BO.fTxt.toLowerCase();vs=vs.filter(v=>(v.id+' '+v.nombre+' '+(v.q||'')+' '+eff(v).def).toLowerCase().includes(t));}
  return vs;
}
function aplicaTxt(v){
  let s=NIVEL_ES[v.nivel];
  if(v.nivel==='C') s+=' · '+((v.aplica&&v.aplica.length)?v.aplica.join(', '):'todos los tipos');
  const et=Object.keys(PRIOR).filter(e=>PRIOR[e].includes(v.id));
  if(et.length) s+=' · prioritaria en '+et.join(', ');
  return s;
}
function estTag(e){return el('span',{class:'tag',style:'background:'+(ESTV_BG[e]||'#EEEDEA')+';color:'+(ESTV_TXT[e]||'#72727A'),text:e});}
const clip=(s,n)=>{s=String(s||'');return s.length>n?s.slice(0,n-1)+'…':s;};
let ALLOPTS=null;
function allVarSelect(onpick){
  if(!ALLOPTS||ALLOPTS.n!==allVars().length){
    const s=el('select');s.append(el('option',{value:'',text:'+ Agregar variable…'}));
    Object.keys(SATS).forEach(k=>{
      const g=el('optgroup',{label:SATS[k].nombre});
      allVars().filter(v=>satOf(v)===k).forEach(v=>g.append(el('option',{value:v.id,text:v.nombre+' · '+NIVEL_ES[v.nivel]})));
      if(g.children.length) s.append(g);
    });
    ALLOPTS={n:allVars().length,s};
  }
  const s=ALLOPTS.s.cloneNode(true);s.addEventListener('change',e=>{if(e.target.value) onpick(e.target.value);});
  return s;
}

/* ---- ficha de una variable ---- */
function boLabel(txt,input,wide){return el('label',{style:wide?'grid-column:1/-1':''},txt,input);}
function boArea(val,cb,rows){const t=el('textarea',{rows:String(rows||3),maxlength:'600'});t.value=val||'';t.addEventListener('change',e=>cb(e.target.value));return t;}
function boInput(val,cb,max){const i=el('input',{type:'text',maxlength:String(max||160)});i.value=val||'';i.addEventListener('change',e=>cb(e.target.value));return i;}
function relField(label,key,v){
  const d=BO.draft,wrap=el('div',{class:'grp',style:'grid-column:1/-1'});
  wrap.append(el('b',{style:'font-size:13px',text:label}));
  const chips=el('div',{style:'display:flex;flex-wrap:wrap;gap:6px;margin:6px 0'});
  (d[key]||[]).forEach(id=>{
    const o=varById(id);
    chips.append(el('span',{class:'tag',style:'cursor:pointer',title:'Quitar',onclick:()=>{d[key]=d[key].filter(x=>x!==id);renderBackoffice();}},(o?o.nombre:id)+' ×'));
  });
  if(!(d[key]||[]).length) chips.append(el('span',{class:'empty',text:'Sin relaciones.'}));
  wrap.append(chips,allVarSelect(id=>{if(id===v.id||(d[key]||[]).includes(id)) return;d[key]=[...(d[key]||[]),id];renderBackoffice();}));
  return wrap;
}
function histOf(v){
  const rows=Object.values(BO.hi).filter(h=>h.var===v.id).sort((a,b)=>b.v-a.v);
  return rows;
}
function boPanel(){
  const box=$('#bo-panel');if(!box) return;
  const v=S.tab==='backoffice'&&BO.sub==='matriz'&&BO.sel&&varById(BO.sel);
  if(!v){box.hidden=true;box.replaceChildren();return;}
  box.hidden=false;
  if(!BO.draft||BO.draft._id!==v.id) BO.draft={...JSON.parse(JSON.stringify(eff(v))),_id:v.id};
  const d=BO.draft,cov=varCoverage(v),msg=el('div',{class:'impmsg '+(BO.pkind||''),role:'status',hidden:BO.pmsg?null:true},BO.pmsg||'');
  const kids=[
    el('div',{style:'display:flex;justify-content:space-between;align-items:center'},el('div',{class:'eyebrow',text:'Variable · '+v.id}),el('button',{class:'btn',type:'button','aria-label':'Cerrar',text:'×',onclick:()=>{BO.sel=null;BO.draft=null;BO.pmsg='';renderBackoffice();}})),
    el('h2',{style:'font-size:20px;margin:4px 0',text:v.nombre}),
    el('p',{class:'empty',text:SATS[satOf(v)].nombre+' › '+DIMS[v.dim]+(v.grupo?' › '+v.grupo:'')}),
    el('div',{class:'vhead'},estTag(d.estado),el('span',{class:'tag',text:'v'+verOf(v)}),el('span',{class:'dimtag',text:aplicaTxt(v)})),
    el('div',{class:'formgrid',style:'grid-template-columns:1fr 1fr'},
      el('p',{class:'empty',style:'margin:0',text:'Tipo de respuesta: '+TIPO_ES_BO(v)}),
      el('p',{class:'empty',style:'margin:0',text:'Fuente esperada: '+(FUENTES[v.fuente]||'—')}),
      el('p',{class:'empty',style:'margin:0',text:'Cobertura real: '+cov.done+' de '+cov.total+' nodos aplicables'}),
      el('p',{class:'empty',style:'margin:0',text:'Rol en el motor: '+(NUMT.includes(v.tipo)?({dep:'dependiente',ind:'independiente',ctl:'de control',ign:'se ignora'}[roleOf(v)]||roleOf(v)):'no numérica')})),
    msg,
    el('div',{class:'row2'},el('button',{class:'btn',type:'button',disabled:BO.busy,text:BO.busy?'Claude está redactando…':'Proponer ficha con Claude',onclick:()=>boSuggestOne(v)}))
  ];
  const grid=el('div',{class:'formgrid',style:'grid-template-columns:1fr'});
  grid.append(
    boLabel('Pregunta por capturar',boArea(d.pregunta,x=>{d.pregunta=x;},3)),
    boLabel('Guía de respuesta',boArea(d.guia,x=>{d.guia=x;},3)),
    boLabel('Qué mide (definición operacional)',boArea(d.def,x=>{d.def=x;},3)),
    boLabel('Unidad',boInput(d.unidad,x=>{d.unidad=x;},60)),
    boLabel('Escala',boInput(d.escala,x=>{d.escala=x;},160)),
    boLabel('Ejemplo',boInput(d.ejemplo,x=>{d.ejemplo=x;},160)),
    boLabel('Cómo se calcula',boArea(d.calc,x=>{d.calc=x;},2)),
    boLabel('Dueño del dato (rol)',boInput(d.dueno,x=>{d.dueno=x;},80)),
    boLabel('Frecuencia de actualización',(()=>{const s=el('select',null,...FRECS.map(f=>el('option',{value:f,text:f})));s.value=d.frec;s.addEventListener('change',e=>{d.frec=e.target.value;});return s;})()),
    boLabel('Estado',(()=>{const s=el('select',null,...ESTADOS_VAR.map(f=>el('option',{value:f,text:f})));s.value=d.estado;s.addEventListener('change',e=>{d.estado=e.target.value;});return s;})())
  );
  if(v.nivel==='C'){
    const tw=el('div',{class:'grp',style:'grid-column:1/-1'},el('b',{style:'font-size:13px',text:'Aplica a estos tipos de cliente (ninguno marcado = todos)'}));
    const row=el('div',{style:'display:flex;gap:14px;flex-wrap:wrap;margin-top:6px'});
    CLI_TIPOS.forEach(t=>{
      const c=el('input',{type:'checkbox'});c.checked=!!(d.aplica&&d.aplica.includes(t));
      c.addEventListener('change',e=>{const s=new Set(d.aplica||[]);if(e.target.checked) s.add(t);else s.delete(t);d.aplica=s.size?[...s]:null;});
      row.append(el('label',{style:'display:flex;gap:6px;align-items:center;font-size:13px'},c,TIPO_LBL[t]));
    });
    tw.append(row);grid.append(tw);
  }
  grid.append(relField('Duplica a','duplica',v),relField('Se calcula con','calcCon',v),relField('Depende de','dependeDe',v));
  const nota=el('input',{type:'text',maxlength:'240',placeholder:'Qué cambió y por qué'});nota.value=BO.nota||'';nota.addEventListener('input',e=>{BO.nota=e.target.value;});
  grid.append(boLabel('Nota del cambio (obligatoria para crear una versión)',nota));
  kids.push(grid,el('div',{class:'row2'},
    el('button',{class:'btn main',type:'button',disabled:BO.busy,text:'Guardar como versión nueva',onclick:()=>boDoSave(v)}),
    el('button',{class:'btn',type:'button',text:'Descartar cambios',onclick:()=>{BO.draft=null;BO.nota='';BO.pmsg='';renderBackoffice();}})));
  const hs=histOf(v);
  kids.push(el('details',{class:'det',style:'margin-top:16px',open:BO.showHist?true:null,ontoggle:e=>{BO.showHist=e.target.open;}},el('summary',{text:'Historial de versiones ('+(hs.length+1)+')'}),
    el('div',{class:'stack',style:'margin-top:8px'},
      ...hs.map(h=>boHistRow(v,h)),
      el('div',{class:'card',style:'padding:10px'},el('b',{text:'v1 · catálogo base'}),el('p',{class:'empty',style:'margin:4px 0',text:'Ficha sugerida con lo que ya existía.'}),
        BO.fi[v.id]?el('button',{class:'btn',type:'button',text:'Restaurar v1',onclick:()=>boRestore(v,fichaDefault(v),'v1')}):null))));
  box.replaceChildren(...kids);
}
function TIPO_ES_BO(v){return {t:'Texto',n:'Número',p:'Porcentaje',e:'Escala 1 a 5',sn:'Sí/No',c:'Opciones: '+(v.opts||[]).join(' / ')}[v.tipo]||'Texto';}
function boHistRow(v,h){
  const ch=Object.keys(h.cambios||{}).map(k=>CAMPO_ES[k]||k).join(', ');
  return el('div',{class:'card',style:'padding:10px'},el('b',{text:'v'+h.v+' · '+String(h.cuando).slice(0,10)+' · '+capName(h.por)}),
    el('p',{class:'empty',style:'margin:4px 0',text:(h.nota||'')+(ch?' · Cambió: '+ch:'')}),
    h.campos?el('button',{class:'btn',type:'button',text:'Restaurar esta versión',onclick:()=>boRestore(v,h.campos,'v'+h.v)}):null);
}
async function boRestore(v,campos,etq){
  try{const r=await boSave(v,JSON.parse(JSON.stringify(campos)),'Restaurada la ficha de '+etq);BO.draft=null;BO.pmsg=r.noop?'La ficha ya coincide con esa versión.':'Restaurada como v'+r.nv+'.';BO.pkind=r.noop?'':'ok';}
  catch(e){BO.pmsg='No se pudo restaurar: '+msgOf(e);BO.pkind='warn';}
  renderBackoffice();
}
async function boDoSave(v){
  const d=BO.draft,nota=(BO.nota||'').trim();
  if(nota.length<3){BO.pmsg='Escribe una nota del cambio: qué cambió y por qué.';BO.pkind='warn';renderBackoffice();return;}
  BO.busy=true;
  try{
    const campos={};CAMPOS.forEach(k=>{campos[k]=d[k];});
    campos.aplica=v.nivel==='C'&&campos.aplica&&campos.aplica.length?campos.aplica:null;
    const r=await boSave(v,campos,nota);
    if(r.noop){BO.pmsg='No hay cambios que guardar.';BO.pkind='';}
    else{BO.pmsg='Guardado como v'+r.nv+'.';BO.pkind='ok';BO.nota='';BO.draft=null;}
  }catch(e){BO.pmsg='No se pudo guardar: '+msgOf(e)+'. Revisa que tengas permiso de edición.';BO.pkind='warn';}
  BO.busy=false;renderBackoffice();
}

/* ---- propuestas de Claude para las fichas ---- */
function boSuggestPrompt(vs){
  const cand=v=>{
    const mismo=allVars().filter(x=>x.id!==v.id&&x.dim===v.dim),otros=allVars().filter(x=>x.id!==v.id&&x.dim!==v.dim&&satOf(x)===satOf(v));
    return [...mismo,...otros].slice(0,30).map(x=>x.id+'|'+x.nombre+'|'+NIVEL_ES[x.nivel]).join('\n');
  };
  return `Eres analista de datos de una inteligencia organizacional multidisciplinaria. Te paso variables de un catálogo maestro (no hay datos de empresas). Para cada una redacta la ficha de su definición operacional, para que un equipo la valide.

REGLAS
- Usa solo lo que te paso: nombre, ubicación, nivel, tipo de respuesta, pregunta y guía. No inventes fuentes ni cifras.
- "que_mide": qué mide la variable, en una o dos oraciones claras. "unidad": unidad de medida (por ejemplo MXN, %, días, escala 1 a 5, texto). "escala": rango o categorías posibles. "ejemplo": un ejemplo realista del valor a registrar.
- "calculo": cómo se obtiene el valor. Si se captura directamente, di «Dato capturado directamente; no se calcula.». Si se deriva de otras, indica la fórmula.
- "frecuencia": una de: Única vez, Mensual, Trimestral, Semestral, Anual, Bajo demanda. "dueno": un rol o área (no una persona).
- "duplica", "calculo_con", "depende_de": arreglos con ids tomados SOLO de la lista de candidatas de esa variable; vacíos si no hay una relación clara. "duplica" solo si mide casi lo mismo.
- Español claro y directo.

VARIABLES:
${vs.map(v=>'### '+v.id+'\nNombre: '+v.nombre+'\nUbicación: '+SATS[satOf(v)].nombre+' › '+DIMS[v.dim]+(v.grupo?' › '+v.grupo:'')+'\nNivel: '+NIVEL_ES[v.nivel]+'\nTipo de respuesta: '+TIPO_ES_BO(v)+'\nPregunta: '+bV(v).q+'\nGuía: '+(bV(v).guia||'—')+'\nCandidatas para relaciones (id|nombre|nivel):\n'+cand(v)).join('\n\n')}

Responde SOLO con JSON con esta forma exacta:
{"fichas":[{"id":"VAR-xxx","que_mide":"...","unidad":"...","escala":"...","ejemplo":"...","calculo":"...","frecuencia":"Trimestral","dueno":"...","duplica":[],"calculo_con":[],"depende_de":[]}]}`;
}
function boClean(o,v){
  const str=(x,n)=>String(x==null?'':x).slice(0,n),ids=new Set(allVars().map(x=>x.id));
  const arr=a=>Array.isArray(a)?a.map(String).filter(x=>ids.has(x)&&x!==v.id).slice(0,8):[];
  return {def:str(o.que_mide,400),unidad:str(o.unidad,60),escala:str(o.escala,160),ejemplo:str(o.ejemplo,160),calc:str(o.calculo,300),dueno:str(o.dueno,80),
    frec:FRECS.includes(o.frecuencia)?o.frecuencia:'Trimestral',duplica:arr(o.duplica),calcCon:arr(o.calculo_con),dependeDe:arr(o.depende_de)};
}
const BO_ERR={not_granted:'No diste permiso para usar Claude.',rate_limited:'Hay demasiadas solicitudes seguidas. Espera un momento.',invalid_json:'Claude respondió con un formato que no pude leer. Intenta de nuevo.',no_sample:'Claude no está disponible en esta vista.'};
async function boAskClaude(vs){
  const sample=await (window.claude&&window.claude.use?window.claude.use('sample'):null);
  if(!sample) throw {code:'no_sample'};
  const out=await sample.json(boSuggestPrompt(vs),{modelTier:'default',cache:false});
  const m=new Map(((out&&out.fichas)||[]).filter(x=>x&&x.id).map(x=>[x.id,x]));
  return vs.map(v=>({v,c:m.get(v.id)?boClean(m.get(v.id),v):null})).filter(x=>x.c);
}
async function boSuggestOne(v){
  if(BO.busy) return;
  BO.busy=true;BO.pmsg='Claude está redactando la ficha…';BO.pkind='';renderBackoffice();
  try{
    const r=await boAskClaude([v]);
    if(!r.length) throw {code:'invalid_json'};
    Object.assign(BO.draft,r[0].c);
    BO.pmsg='Propuesta cargada en el formulario. Revísala y guarda una versión con tu nota.';BO.pkind='ok';
  }catch(e){BO.pmsg=BO_ERR[e&&e.code]||('No se pudo redactar: '+msgOf(e));BO.pkind='warn';}
  BO.busy=false;renderBackoffice();
}
async function boSuggestBatch(){
  if(BO.busy) return;
  const vs=boRows().filter(v=>!BO.fi[v.id]).slice(0,8);
  if(!vs.length){BO.msg='Las variables visibles ya tienen ficha guardada.';BO.kind='';renderBackoffice();return;}
  BO.busy=true;BO.msg='Claude está redactando '+vs.length+' fichas…';BO.kind='';renderBackoffice();
  try{
    const r=await boAskClaude(vs);
    for(const x of r){
      const campos={...fichaDefault(x.v),...x.c,estado:'borrador'};
      await boSave(x.v,campos,'Borrador propuesto por Claude',{por:null});
    }
    BO.msg='Listo: '+r.length+' fichas en estado borrador, para que el equipo las valide.';BO.kind='ok';
  }catch(e){BO.msg=BO_ERR[e&&e.code]||('No se pudo redactar: '+msgOf(e));BO.kind='warn';}
  BO.busy=false;renderBackoffice();
}

/* ---- exportar ---- */
function boCsv(){
  const head=['id','corriente','area','bloque','variable','nivel','aplica_a','tipo_respuesta','pregunta','guia','que_mide','unidad','escala','ejemplo','como_se_calcula','fuente_esperada','dueno','frecuencia','duplica','se_calcula_con','depende_de','estado','version'];
  const names=a=>(a||[]).map(id=>{const o=varById(id);return o?o.nombre:id;}).join('; ');
  const rows=boRows().map(v=>{const f=eff(v);
    return [v.id,SATS[satOf(v)].nombre,DIMS[v.dim],v.grupo||'',v.nombre,NIVEL_ES[v.nivel],aplicaTxt(v),TIPO_ES_BO(v),bV(v).q,f.guia,f.def,f.unidad,f.escala,f.ejemplo,f.calc,FUENTES[v.fuente]||'',f.dueno,f.frec,names(f.duplica),names(f.calcCon),names(f.dependeDe),f.estado,'v'+verOf(v)].map(csvCell).join(',');});
  return '\ufeff'+head.join(',')+'\n'+rows.join('\n');
}
async function boExport(){
  if(!dlNs){BO.msg='La descarga de archivos no está disponible en esta vista.';BO.kind='warn';renderBackoffice();return;}
  try{await dlNs.save({filename:'Catalogo_maestro_'+new Date().toISOString().slice(0,10)+'.csv',data:boCsv()});BO.msg='Catálogo exportado.';BO.kind='ok';}
  catch(e){if(!e||e.code!=='declined'){BO.msg='No se pudo descargar: '+msgOf(e);BO.kind='warn';}}
  renderBackoffice();
}

/* ---- vistas ---- */
function boStats(){
  const c={};allVars().forEach(v=>{const e=eff(v).estado;c[e]=(c[e]||0)+1;});
  const t=allVars().length,lr=lastRel();
  return el('div',{class:'statrow'},
    el('div',{class:'stat'},el('b',{text:String(t)}),el('span',{text:'Variables'})),
    ...ESTADOS_VAR.map(e=>el('div',{class:'stat'},el('b',{style:'color:'+ESTV_TXT[e],text:String(c[e]||0)}),el('span',{text:e}))),
    el('div',{class:'stat'},el('b',{text:lr?lr.nombre:'—'}),el('span',{text:'Último lanzamiento'})),
    el('div',{class:'stat'},el('b',{text:String(pendientes().length)}),el('span',{text:'Cambios sin lanzar'})));
}
function viewMatriz(){
  const k=[];
  k.push(el('p',{class:'empty',text:'Todo lo que medimos, con su pregunta, en la estructura general tipo Tama (sin datos de empresas). Toca una fila para abrir su ficha, editarla y guardar una versión nueva.'}),boStats());
  const bar=el('div',{class:'filters'});
  const sc=el('select',{'aria-label':'Corriente',onchange:e=>{BO.fCorr=e.target.value;BO.fArea='';BO.page=0;renderBackoffice();}},el('option',{value:'',text:'Todas las corrientes'}),...Object.keys(SATS).map(x=>el('option',{value:x,text:SATS[x].nombre})));sc.value=BO.fCorr;
  const dims=BO.fCorr?SATS[BO.fCorr].dims:[];
  const sa=el('select',{'aria-label':'Análisis (área)',onchange:e=>{BO.fArea=e.target.value;BO.page=0;renderBackoffice();}},el('option',{value:'',text:'Todos los análisis'}),...dims.map(d=>el('option',{value:d,text:DIMS[d]})));sa.value=BO.fArea;sa.disabled=!BO.fCorr;
  const sn=el('select',{'aria-label':'Nivel',onchange:e=>{BO.fNivel=e.target.value;BO.page=0;renderBackoffice();}},el('option',{value:'',text:'Todos los niveles'}),...Object.entries(NIVEL_ES).map(([a,b])=>el('option',{value:a,text:b})));sn.value=BO.fNivel;
  const st=el('select',{'aria-label':'Tipo de cliente',onchange:e=>{BO.fTipo=e.target.value;BO.page=0;renderBackoffice();}},el('option',{value:'',text:'Cualquier tipo de cliente'}),...CLI_TIPOS.map(t=>el('option',{value:t,text:TIPO_LBL[t]})));st.value=BO.fTipo;
  const se=el('select',{'aria-label':'Estado',onchange:e=>{BO.fEst=e.target.value;BO.page=0;renderBackoffice();}},el('option',{value:'',text:'Todos los estados'}),...ESTADOS_VAR.map(t=>el('option',{value:t,text:t})));se.value=BO.fEst;
  const tx=el('input',{type:'search',placeholder:'Buscar por nombre, ID o pregunta','aria-label':'Buscar'});tx.value=BO.fTxt;tx.addEventListener('change',e=>{BO.fTxt=e.target.value;BO.page=0;renderBackoffice();});
  const cb=el('input',{type:'checkbox',style:'width:auto;margin:0'});cb.checked=BO.fCambios;cb.addEventListener('change',e=>{BO.fCambios=e.target.checked;BO.page=0;renderBackoffice();});
  bar.append(sc,sa,sn,st,se,tx,el('label',{style:'display:flex;gap:6px;align-items:center;font-size:13px;color:var(--muted)'},cb,'Solo cambios sin lanzar'));
  k.push(bar);
  const rows=boRows(),PS=50,pages=Math.max(1,Math.ceil(rows.length/PS));
  if(BO.page>=pages) BO.page=pages-1;
  k.push(el('div',{class:'row2',style:'margin-top:0'},
    el('button',{class:'btn',type:'button',onclick:boExport,text:'Exportar a CSV ('+rows.length+')'}),
    el('button',{class:'btn',type:'button',disabled:BO.busy,onclick:boSuggestBatch,text:BO.busy?'Claude está redactando…':'Que Claude proponga las fichas de las visibles sin ficha (máx. 8)'})));
  if(BO.msg) k.push(el('div',{class:'impmsg '+(BO.kind||''),role:'status'},BO.msg));
  const t=el('table',{class:'tbl'});
  t.append(el('thead',null,el('tr',null,['Corriente','Análisis','Variable','Qué mide','Pregunta por capturar','Aplica a','Estado','Versión'].map(h=>el('th',{text:h})))));
  const b=el('tbody');
  rows.slice(BO.page*PS,BO.page*PS+PS).forEach(v=>{
    const f=eff(v);
    b.append(el('tr',{class:'row'+(BO.sel===v.id?' open':''),onclick:()=>{BO.sel=BO.sel===v.id?null:v.id;BO.draft=null;BO.pmsg='';BO.nota='';renderBackoffice();}},
      el('td',{text:SATS[satOf(v)].nombre}),el('td',{text:DIMS[v.dim]+(v.grupo?' › '+v.grupo:'')}),
      el('td',null,el('b',{text:v.nombre}),el('div',{class:'mono',style:'color:var(--muted);font-size:11px',text:v.id})),
      el('td',{text:clip(f.def,150)}),el('td',{text:clip(bV(v).q,170)}),el('td',{text:aplicaTxt(v)}),el('td',null,estTag(f.estado)),el('td',{class:'mono',text:'v'+verOf(v)})));
  });
  t.append(b);
  k.push(el('div',{class:'card scroll'},t));
  k.push(el('div',{class:'row2'},
    el('button',{class:'btn',type:'button',disabled:BO.page<=0,text:'← Anterior',onclick:()=>{BO.page--;renderBackoffice();}}),
    el('span',{class:'empty',text:'Página '+(BO.page+1)+' de '+pages+' · '+rows.length+' variables'}),
    el('button',{class:'btn',type:'button',disabled:BO.page>=pages-1,text:'Siguiente →',onclick:()=>{BO.page++;renderBackoffice();}})));
  return k;
}
function viewLanzamientos(){
  const k=[],lr=lastRel(),pend=pendientes();
  k.push(el('p',{class:'empty',text:'Un lanzamiento congela la versión de cada variable en un momento y guarda qué cambió respecto al lanzamiento anterior. Cada variable además tiene su propia versión.'}),boStats());
  const tipo=el('select',{'aria-label':'Tipo de lanzamiento'},el('option',{value:'menor',text:'Menor (ajustes)'}),el('option',{value:'mayor',text:'Mayor (cambios de estructura)'}));
  const nota=el('input',{type:'text',maxlength:'240',placeholder:'Qué incluye este lanzamiento'});
  const msg=el('span',{class:'res',role:'status'});
  k.push(el('div',{class:'card',style:'margin-top:8px'},
    el('h3',{style:'font-size:16px',text:'Publicar un lanzamiento'}),
    el('p',{class:'empty',text:(lr?'El último fue '+lr.nombre+'. ':'Todavía no hay lanzamientos. ')+'Hay '+pend.length+(pend.length===1?' variable':' variables')+' con cambios sin lanzar.'}),
    el('div',{class:'filters'},...(lr?[tipo]:[]),nota),
    el('div',{class:'row2'},el('button',{class:'btn main',type:'button',disabled:BO.busy,text:lr?'Publicar nuevo lanzamiento':'Publicar el lanzamiento v1.0',onclick:async e=>{
      if(!nota.value.trim()){msg.className='res bad';msg.textContent='Escribe una nota del lanzamiento.';return;}
      e.target.disabled=true;
      try{const n=await boPublish(lr?tipo.value:'inicial',nota.value.trim());BO.msg='Publicado '+n+'.';BO.kind='ok';renderBackoffice();}
      catch(err){e.target.disabled=false;msg.className='res bad';msg.textContent='No se pudo publicar: '+msgOf(err)+'. Revisa que tengas permiso de edición.';}}}),msg)));
  if(pend.length){
    k.push(el('h3',{style:'font-size:16px;margin-top:20px',text:'Cambios sin lanzar ('+pend.length+')'}));
    k.push(el('div',{class:'card scroll'},cambiosTable(pend)));
  }
  const rels=Object.values(BO.rel).sort((a,b)=>b.n-a.n);
  k.push(el('h3',{style:'font-size:16px;margin-top:20px',text:'Lanzamientos ('+rels.length+')'}));
  if(!rels.length) k.push(el('p',{class:'empty',text:'Aún no se ha publicado ninguno.'}));
  rels.forEach(r=>{
    const open=BO.relOpen===r.id;
    k.push(el('div',{class:'card',style:'margin-top:8px'},
      el('div',{style:'display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap'},el('b',{text:r.nombre+' · '+String(r.fecha).slice(0,10)+' · '+capName(r.por)}),el('span',{class:'empty',text:r.total+' variables · '+(r.cambios||[]).length+' con cambios · '+Object.entries(r.estados||{}).map(([a,b])=>b+' '+a).join(', ')})),
      el('p',{style:'margin:6px 0',text:r.nota||''}),
      (r.cambios||[]).length?el('button',{class:'btn',type:'button',text:open?'Ocultar cambios':'Ver cambios',onclick:()=>{BO.relOpen=open?null:r.id;renderBackoffice();}}):null,
      open?el('div',{class:'scroll',style:'margin-top:8px'},cambiosTable(r.cambios)):null));
  });
  return k;
}
function cambiosTable(list){
  const t=el('table',{class:'tbl'});
  t.append(el('thead',null,el('tr',null,['Variable','Cambio de versión','Última nota'].map(h=>el('th',{text:h})))));
  const b=el('tbody');
  list.slice(0,200).forEach(c=>{
    const v=varById(c.id),h=Object.values(BO.hi).filter(x=>x.var===c.id).sort((a,b)=>b.v-a.v)[0];
    b.append(el('tr',null,el('td',null,v?v.nombre:c.id,el('div',{class:'mono',style:'color:var(--muted);font-size:11px',text:c.id})),el('td',{class:'mono',text:(c.de?'v'+c.de:'nueva')+' → v'+c.a}),el('td',{text:h?clip(h.nota,120):''})));
  });
  t.append(b);return t;
}
function renderBackoffice(){
  const box=$('#bo-body');if(!box) return;
  $$('.bsub').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.bs===BO.sub)));
  box.replaceChildren(...(BO.sub==='lanz'?viewLanzamientos():viewMatriz()).filter(Boolean));
  boPanel();
  document.body.classList.toggle('bo-open',!!BO.sel&&BO.sub==='matriz');
}
function renderBackofficeAuto(){
  const a=document.activeElement;
  if(a&&a.closest&&(a.closest('#bo-panel')||a.closest('#bo-body'))&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
  renderBackoffice();
}
$$('.bsub').forEach(b=>b.addEventListener('click',()=>{BO.sub=b.dataset.bs;BO.msg='';renderBackoffice();}));

function ensureFichas(){if(BO.cref!==S.custom){BO.cref=S.custom;applyFichas();}}
applyFichas();

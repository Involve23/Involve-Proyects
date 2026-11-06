/* ===================== Hallazgos y sugerencias ===================== */
const trunc=(s,n)=>String(s).length>n?String(s).slice(0,n-1)+'…':String(s);
function obsPicker(mine,onDone){
  const sel=new Set();
  const list=el('div',{class:'chips'}),chosen=el('div',{class:'chips'}),err=el('div',{class:'err',role:'alert'});
  const q=el('input',{type:'search',placeholder:'Buscar por variable, valor o nodo','aria-label':'Buscar datos',autocomplete:'off',class:'pkq'});
  const lab=o=>{const v=varById(o.variable);return (v?v.nombre:o.variable)+': '+trunc(showVal(o),40);};
  function renderChosen(){
    chosen.replaceChildren(...(sel.size?[...sel].map(id=>el('button',{type:'button',class:'chip primary',onclick:()=>{sel.delete(id);renderList();renderChosen();}},lab(S.obs[id]),el('span',{class:'chipid',text:'× '+id}))):[el('span',{class:'empty',text:'Todavía no has elegido ninguno.'})]));
  }
  function renderList(){
    const t=q.value.trim().toLowerCase();
    const rows=mine.filter(o=>{
      if(!t) return true;
      const v=varById(o.variable),n=S.nodes[o.nodo];
      return [v&&v.nombre,showVal(o),n&&n.nombre,o.id,o.nota].join(' ').toLowerCase().includes(t);
    }).sort((a,b)=>String(b.capturado).localeCompare(String(a.capturado))).slice(0,12);
    list.replaceChildren(...(rows.length?rows.map(o=>el('button',{type:'button',class:'chip'+(sel.has(o.id)?' primary':''),onclick:()=>{if(sel.has(o.id))sel.delete(o.id);else sel.add(o.id);err.textContent='';renderList();renderChosen();}},lab(o),el('span',{class:'chipid',text:o.id}))):[el('span',{class:'empty',text:'Ninguna observación coincide.'})]));
  }
  q.addEventListener('input',renderList);
  renderList();renderChosen();
  return el('div',{class:'stack',style:'gap:10px'},q,list,el('div',{class:'dimtag',text:'Datos elegidos (toca uno para quitarlo):'}),chosen,
    el('div',{class:'inrow'},el('button',{class:'btn',type:'button',text:'Listo',onclick:()=>{if(!sel.size){err.textContent='Elige al menos un dato en el que se apoya el hallazgo.';return;}onDone([...sel]);}}),err));
}
function startInsight(){
  const E=S.ctx.emp&&S.nodes[S.ctx.emp];
  if(!E){say('Primero elige la empresa.');chooseEmpresa();return;}
  const mine=Object.values(S.obs).filter(o=>{const e=empOfNode(S.nodes[o.nodo]);return e&&e.id===E.id;});
  if(!mine.length){say('Todavía no hay datos capturados de '+E.nombre+'. Captura algunos primero y luego registramos el hallazgo.');startCapture();return;}
  S.queue=[];S.then=null;
  say('Vamos a registrar un hallazgo de '+E.nombre+' y la sugerencia que sale de él. El hallazgo es un dato o patrón que apareció; la sugerencia es lo que se hará al respecto. Cada uno recibe su ID y queda ligado a los datos que lo sustentan.');
  askText('1. Hallazgo: ¿qué dato o patrón apareció?','Ej. Los clientes valoran el canal propio pero casi no compran en él',h=>{
    insightObs(E,mine,{hallazgo:h});
  });
}
function insightObs(E,mine,f){
  say('2. Datos: ¿en qué observaciones se apoya el hallazgo? Busca y toca las que lo sustentan. De ellas se deduce qué corrientes y áreas conecta.');
  setComposer(obsPicker(mine,ids=>{
    f.obs=ids;
    f.dims=[...new Set(ids.map(i=>{const v=varById(S.obs[i].variable);return v&&v.dim;}).filter(Boolean))];
    f.sats=[...new Set(f.dims.map(d=>DIMSAT[d]).filter(Boolean))];
    echo(ids.length+(ids.length===1?' dato elegido':' datos elegidos'));
    say('El hallazgo conecta '+f.sats.map(k=>SATS[k].nombre).join(', ')+' (áreas: '+f.dims.map(d=>DIMS[d]).join(', ')+').');
    askText('3. Insight: ¿por qué pasa?','Explica la causa probable y en qué evidencia se apoya',t=>{
      f.insight=t;
      askText('4. Implicación: ¿qué significa para el negocio?','Ej. Se pierde venta recurrente en el canal de mayor margen',t2=>{
        f.implicacion=t2;
        askText('5. Recomendación: ¿qué hay que hacer? Una acción concreta.','Ej. Lanzar un descuento por primera compra en el canal propio',t3=>{f.accion=t3;insightPlan(E,f);});
      });
    });
  }));
}
function insightPlan(E,f){
  say('Ahora el plan de acción de la sugerencia.');
  const steps=[
    {key:'responsable',q:'6. Responsable: ¿quién se encarga?',ph:'Nombre o puesto'},
    {key:'plazo',q:'7. Plazo: ¿para cuándo?',ph:'Ej. 30 días, o 2026-12-15'},
    {key:'kpi',q:'8. Indicador de seguimiento: ¿cómo sabremos que funcionó?',ph:'Ej. Recompra a 90 días de 35% o más'}
  ];
  if(f.dims.length>1) steps.unshift({key:'dimension',q:'¿Cuál es el área principal sobre la que actúa la sugerencia?',chips:f.dims.map(d=>d+' · '+DIMS[d])});
  runSteps(steps,{},d=>{
    f.responsable=d.responsable;f.plazo=d.plazo;f.kpi=d.kpi;
    f.dimension=d.dimension?d.dimension.split(' · ')[0]:f.dims[0];
    createInsight(E,f);
  });
}
async function createInsight(E,f){
  const wait=say('Registrando el hallazgo y la sugerencia…');
  try{
    const hid=await mintId('HAL',4);
    const hal={id:hid,tipo:'HAL',nombre:trunc(f.hallazgo,70),padre:E.id,prd:S.ctx.prd||null,hallazgo:f.hallazgo,insight:f.insight,implicacion:f.implicacion,dims:f.dims,sats:f.sats,obs:f.obs,estado:'abierto',creado:nowIso(),por:S.uid||null};
    await put('nodes',hid,hal);
    const sid=await mintId('SUG',4);
    const sug={id:sid,tipo:'SUG',nombre:trunc(f.accion,70),padre:hid,accion:f.accion,dimension:f.dimension,responsable:f.responsable,plazo:f.plazo,kpi:f.kpi,estado:'propuesta',creado:nowIso(),por:S.uid||null};
    await put('nodes',sid,sug);
    wait.remove();
    bubble('bot',el('div',{class:'receipt'},tagEl(hid),el('span',{text:'hallazgo · se apoya en '+f.obs.length+(f.obs.length===1?' dato':' datos')+' · pertenece a'}),tagEl(E.id)));
    bubble('bot',el('div',{class:'receipt'},tagEl(sid),el('span',{text:'sugerencia · sale de'}),tagEl(hid)));
    menu('Hallazgo y sugerencia registrados. Los ves en el grafo, abriendo la empresa, y en Base de datos › Hallazgos.');
  }catch(e){
    wait.remove();say('No se pudo registrar: '+msgOf(e)+'. Revisa que tengas permiso de edición en este artefacto.');
    menu();
  }
}
function addInsights(e,rows){
  nodesOf('HAL').filter(h=>h.padre===e.id).forEach(h=>{rows.push(h);nodesOf('SUG').filter(s=>s.padre===h.id).forEach(s=>rows.push(s));});
  nodesOf('SUG').filter(s=>s.padre===e.id).forEach(s=>rows.push(s));
}
function renderHal(){
  const t=$('#halTbl');t.replaceChildren();
  t.append(el('thead',null,el('tr',null,['Hallazgo','Empresa','Qué se encontró','Corrientes','Insight','Implicación','Datos','Sugerencia','Acción','Responsable','Plazo','Indicador','Estado'].map(h=>el('th',{text:h})))));
  const b=el('tbody');
  const hs=nodesOf('HAL').sort((a,c)=>String(c.creado).localeCompare(String(a.creado)));
  if(!hs.length) b.append(el('tr',null,el('td',{colspan:13,class:'empty',text:'Todavía no hay hallazgos. Regístralos desde Capturar › Registrar hallazgos y sugerencias.'})));
  hs.forEach(h=>{
    const e=empOfNode(h),sugs=nodesOf('SUG').filter(s=>s.padre===h.id);
    const common=[el('td',{class:'mono',text:h.id}),el('td',{text:e?e.nombre:'—'}),el('td',{text:h.hallazgo}),el('td',{text:(h.sats||[]).map(k=>SATS[k]?SATS[k].nombre:k).join(', ')}),el('td',{text:h.insight}),el('td',{text:h.implicacion}),el('td',{class:'num',text:(h.obs||[]).length})];
    if(!sugs.length) b.append(el('tr',null,...common,el('td',{colspan:6,class:'empty',text:'Sin sugerencia'})));
    sugs.forEach(s=>{
      const sel=el('select',{'aria-label':'Estado de la sugerencia',onchange:ev=>{put('nodes',s.id,{...s,estado:ev.target.value}).catch(err=>{ev.target.value=s.estado;});}},
        ...['propuesta','en curso','hecha','descartada'].map(x=>el('option',{value:x,text:x})));
      sel.value=s.estado||'propuesta';
      b.append(el('tr',null,...common,el('td',{class:'mono',text:s.id}),el('td',{text:s.accion}),el('td',{text:s.responsable}),el('td',{text:s.plazo}),el('td',{text:s.kpi}),el('td',null,sel)));
    });
  });
  t.append(b);
}

/* ---- completar la ficha de una empresa ya creada ---- */
function completarFicha(emp){
  say('Completemos la ficha de '+emp.nombre+'. Son pocas preguntas y quedan guardadas en su nodo.');
  runSteps([
    {key:'industria',q:'¿En qué industria está '+emp.nombre+'?',chips:INDUSTRIAS},
    {key:'categoria',q:'¿En qué categoría compite?',ph:'Ej. botanas saladas, software de nómina…'},
    {key:'geo',q:'¿En qué mercado geográfico opera?',ph:'Ej. México; México y Centroamérica…'},
    {key:'pregunta',q:'¿Qué pregunta de negocio queremos resolver con el análisis?',ph:'Ej. ¿Por qué baja la recompra?'},
    {key:'decision',q:'¿Qué decisión se va a tomar con el análisis?',ph:'Ej. Reformular el producto estrella'},
    {key:'fuentes',q:'¿Qué fuentes de información hay disponibles?',ph:'Ventas, encuestas, reportes…',optional:true},
    {key:'persona',q:'¿Cómo describes al cliente típico de esta empresa? Es el buyer persona que consume sus productos.',ph:'Ej. Reclutador de empresa mediana, B2B',optional:true}
  ],{},async f=>{
    const wait=say('Guardando la ficha…');
    try{
      const node={...S.nodes[emp.id],ficha:{industria:f.industria,categoria:f.categoria,mercado_geo:f.geo,pregunta:f.pregunta,decision:f.decision,fuentes:f.fuentes||''}};
      await put('nodes',emp.id,node);
      const c=await ensureCli(node,f.persona||'');
      if(f.persona&&c&&!c.descripcion) await put('nodes',c.id,{...c,descripcion:f.persona});
      wait.remove();
      S.ctx.emp=emp.id;S.ctx.prd=null;renderPath();
      const cli=cliOf(emp.id),perfil=cli&&varsFor(cli).some(v=>v.dim==='Q'&&hasObs(cli.id,v.id));
      if(cli&&!perfil){
        say('Ficha guardada. Ahora armemos el perfil del cliente: su audiencia.');
        S.dimMode='Q';S.phase=null;S.queue=buildQueue({dim:'Q'});S.then=()=>choosePrd(S.nodes[emp.id]);S.thenMsg='Perfil listo. Ahora los productos.';
        askVar();
      }else{say('Ficha guardada.');choosePrd(S.nodes[emp.id]);}
    }catch(e){wait.remove();say('No se pudo guardar la ficha: '+msgOf(e)+'. Revisa que tengas permiso de edición.');choosePrd(emp);}
  });
}

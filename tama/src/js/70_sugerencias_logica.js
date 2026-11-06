/* ===================== Sugerencias ===================== */
const SG={sub:'bandeja',fEmp:'',fTipo:'',fEst:'',fResp:'',busy:false,msg:'',kind:'',open:null,showDisc:false,edit:null};
const SIGTIPO={hallazgo:'Hallazgo sin sugerencia',brecha:'Brecha frente a pares',cross:'Cross-selling',datos:'Hueco de datos',alerta:'Alerta',valor:'Valor del producto o la empresa',calidad:'Calidad de los datos'};
const CLASE_ES={sugerencia:'Sugerencia',insight:'Insight',alerta:'Alerta'};
const SEV_ES={1:'alta',2:'media',3:'baja'};
const ESTADOS=['propuesta','en curso','hecha','descartada'];
const nodeLabel=n=>(NODO_ES[n.tipo]||n.tipo)+(n.tipo==='PRD'?' '+n.nombre:'');
const vidByName=nm=>{const v=allVars().find(x=>x.nombre===nm);return v?v.id:null;};
function nodeFor3(v,e,p){
  if(v.nivel==='E') return e.id;
  if(v.nivel==='C'){const c=cliOf(e.id);return c?c.id:null;}
  return p?p.id:null;
}
const RULES=[
  {k:'sat_baja',v:'Satisfacción y lealtad',cond:x=>x<=2,tipo:'alerta',sev:1,titulo:'Satisfacción baja del cliente',txt:x=>'La satisfacción es '+fmt3(x)+' de 5.'},
  {k:'sat_alta',v:'Satisfacción y lealtad',cond:x=>x>=4,tipo:'valor',sev:3,titulo:'Satisfacción alta del cliente',txt:x=>'La satisfacción es '+fmt3(x)+' de 5.'},
  {k:'nps_bajo',v:'NPS',cond:x=>x<=0,tipo:'alerta',sev:1,titulo:'NPS negativo o nulo',txt:x=>'El NPS es '+fmt3(x)+'.'},
  {k:'nps_alto',v:'NPS',cond:x=>x>=50,tipo:'valor',sev:3,titulo:'NPS alto',txt:x=>'El NPS es '+fmt3(x)+'.'},
  {k:'ltvcac_bajo',v:'Relación LTV/CAC',cond:x=>x<3,tipo:'alerta',sev:1,titulo:'Relación LTV/CAC por debajo de 3',txt:x=>'La relación LTV/CAC es '+fmt3(x)+'.'},
  {k:'ltvcac_alto',v:'Relación LTV/CAC',cond:x=>x>=5,tipo:'valor',sev:3,titulo:'Relación LTV/CAC sólida',txt:x=>'La relación LTV/CAC es '+fmt3(x)+'.'},
  {k:'mneto_neg',v:'Margen neto',cond:x=>x<0,tipo:'alerta',sev:1,titulo:'Margen neto negativo',txt:x=>'El margen neto es '+fmt3(x)+'%.'},
  {k:'uneta_neg',v:'Utilidad neta',cond:x=>x<0,tipo:'alerta',sev:1,titulo:'Utilidad neta negativa',txt:x=>'La utilidad neta es '+fmt3(x)+'.'},
  {k:'ebitda_neg',v:'Margen EBITDA',cond:x=>x<0,tipo:'alerta',sev:1,titulo:'Margen EBITDA negativo',txt:x=>'El margen EBITDA es '+fmt3(x)+'%.'},
  {k:'liq_baja',v:'Razón circulante',cond:x=>x<1,tipo:'alerta',sev:1,titulo:'Liquidez corriente menor a 1',txt:x=>'La razón circulante es '+fmt3(x)+'.'},
  {k:'recompra_baja',v:'Tasa de recompra',cond:x=>x<=20,tipo:'alerta',sev:2,titulo:'Recompra baja',txt:x=>'La tasa de recompra es '+fmt3(x)+'%.'},
  {k:'recompra_alta',v:'Tasa de recompra',cond:x=>x>=60,tipo:'valor',sev:3,titulo:'Recompra alta',txt:x=>'La tasa de recompra es '+fmt3(x)+'%.'},
  {k:'churn_alto',v:'Churn',cond:x=>x>=30,tipo:'alerta',sev:1,titulo:'Abandono alto',txt:x=>'El churn es '+fmt3(x)+'%.'},
  {k:'churn_bajo',v:'Churn',cond:x=>x<=5,tipo:'valor',sev:3,titulo:'Abandono bajo',txt:x=>'El churn es '+fmt3(x)+'%.'}
];
function ruleSignals(){
  const out=[];
  RULES.forEach(r=>{
    const id=vidByName(r.v),v=id&&varById(id);if(!v) return;
    const T={E:'EMP',C:'CLI',P:'PRD'}[v.nivel];
    nodesOf(T).forEach(n=>{
      const rec=latest(n.id,id),x=numericVal(v,rec);if(x==null||!r.cond(x)) return;
      const e=empOfNode(n);
      out.push({key:(r.tipo)+':'+r.k+':'+n.id,tipo:r.tipo,emp:e?e.id:null,nodo:n.id,titulo:r.titulo+' ('+nodeLabel(n)+')',sev:r.sev,ev:[r.txt(x)+' Fuente: '+rec.id+(rec.periodo?' ('+rec.periodo+')':'')+'.','Regla inicial de umbral, por validar con el equipo.'],obs:[rec.id],vars:[id]});
    });
  });
  const pid=vidByName('Precio de lista'),cid=vidByName('Costo por unidad');
  if(pid&&cid) nodesOf('PRD').forEach(p=>{
    const rp=latest(p.id,pid),rc=latest(p.id,cid),a=numericVal(varById(pid),rp),b=numericVal(varById(cid),rc);
    if(a==null||b==null||a<=0) return;
    const m=(a-b)/a,e=empOfNode(p);
    if(m<.15) out.push({key:'alerta:margen_unit:'+p.id,tipo:'alerta',emp:e?e.id:null,nodo:p.id,titulo:(m<0?'Margen unitario negativo':'Margen unitario bajo')+' ('+p.nombre+')',sev:m<0?1:2,ev:['Precio de lista '+fmt3(a)+' y costo por unidad '+fmt3(b)+': margen unitario de '+fmt3(m*100)+'%.','Regla inicial de umbral (15%), por validar.'],obs:[rp.id,rc.id],vars:[pid,cid]});
    else if(m>=.5) out.push({key:'valor:margen_unit:'+p.id,tipo:'valor',emp:e?e.id:null,nodo:p.id,titulo:'Margen unitario amplio ('+p.nombre+')',sev:3,ev:['Precio de lista '+fmt3(a)+' y costo por unidad '+fmt3(b)+': margen unitario de '+fmt3(m*100)+'%.'],obs:[rp.id,rc.id],vars:[pid,cid]});
  });
  return out;
}
function detectSignals(){
  const sigs=[],M=motorStatus(),U=cfg().umb,emps=nodesOf('EMP');
  nodesOf('HAL').forEach(h=>{
    if(h.estado==='descartado'||nodesOf('SUG').some(s=>s.padre===h.id)) return;
    const e=empOfNode(h);
    sigs.push({key:'hal:'+h.id,tipo:'hallazgo',emp:e?e.id:null,nodo:h.id,titulo:'Hallazgo sin sugerencia: '+h.nombre,sev:h.origen==='motor'?2:1,ev:['Hallazgo '+h.id+': '+h.hallazgo,h.insight?'Insight: '+h.insight:null,h.implicacion?'Implicación: '+h.implicacion:null,h.metodo?'Método: '+h.metodo:null].filter(Boolean),obs:h.obs||[],vars:[]});
  });
  emps.forEach(e=>{
    [e,...clisOf(e.id),...nodesOf('PRD').filter(p=>p.padre===e.id)].filter(Boolean).forEach(n=>{
      const g=gapData(n,M);if(g.gate) return;
      g.dev.slice(0,3).forEach(d=>{const rec=latest(n.id,d.v.id);sigs.push({key:'brecha:'+n.id+':'+d.v.id,tipo:'brecha',emp:e.id,nodo:n.id,titulo:'Brecha en «'+d.v.nombre+'» ('+nodeLabel(n)+')',sev:Math.abs(d.z)>=2?1:2,ev:['«'+d.v.nombre+'» vale '+fmt3(d.x)+' frente a una mediana de pares de '+fmt3(d.med)+' (distancia z = '+fmt3(d.z)+', percentil '+d.pct+', '+d.n+' pares).','No se sabe si más o menos es mejor: hay que interpretar la dirección.'],obs:rec?[rec.id]:[],vars:[d.v.id]});});
      if(g.falt.length) sigs.push({key:'faltantes:'+n.id,tipo:'datos',emp:e.id,nodo:n.id,titulo:'Datos que sus pares tienen y falta capturar ('+nodeLabel(n)+')',sev:3,ev:g.falt.slice(0,8).map(x=>x.v.nombre+' ('+x.c+' de '+x.of+' pares)'),obs:[],vars:g.falt.slice(0,8).map(x=>x.v.id)});
    });
  });
  M.pd.pairs.filter(p=>p.sim>=U.simCross&&p.a.emp&&p.b.emp&&p.a.emp.id!==p.b.emp.id).forEach(p=>[[p.a,p.b],[p.b,p.a]].forEach(([x,y])=>{
    const prods=nodesOf('PRD').filter(q=>q.padre===y.emp.id);if(!prods.length) return;
    sigs.push({key:'cross:'+x.emp.id+'>'+y.emp.id,tipo:'cross',emp:x.emp.id,nodo:x.c.id,titulo:'Cross-selling: productos de '+y.emp.nombre+' para el cliente de '+x.emp.nombre,sev:2,ev:['Similitud de perfil: '+Math.round(p.sim*100)+'% ('+p.shared+' variables en común).','Coinciden en: '+(p.same.slice(0,6).join(', ')||'—')+'.','Productos de '+y.emp.nombre+': '+prods.map(q=>q.nombre).join(', ')+'.','Es una similitud de perfil, no de compras: es una hipótesis.'],obs:[],vars:[]});
  }));
  emps.forEach(e=>nodesOf('PRD').filter(p=>p.padre===e.id).forEach(p=>{
    const pend=(PRIOR[p.etapa]||[]).map(id=>varById(id)).filter(v=>{if(!v) return false;const nid=nodeFor3(v,e,p);return nid&&!hasObs(nid,v.id);});
    if(!pend.length) return;
    sigs.push({key:'prio:'+p.id,tipo:'datos',emp:e.id,nodo:p.id,titulo:'Capturar lo prioritario de la etapa de '+p.nombre,sev:pend.length/(PRIOR[p.etapa]||[1]).length>.5?2:3,ev:['Etapa: '+p.etapa+'. Faltan: '+pend.slice(0,8).map(v=>v.nombre).join(', ')+'.'],obs:[],vars:pend.slice(0,8).map(v=>v.id)});
  }));
  emps.forEach(e=>{
    const q=qualityOf(e);if(!q.n) return;
    if(q.antig&&q.antig.med>=6) sigs.push({key:'calidad:viejo:'+e.id,tipo:'calidad',emp:e.id,nodo:e.id,titulo:'Datos desactualizados de '+e.nombre,sev:2,ev:['La mediana de antigüedad de los datos es de '+Math.round(q.antig.med)+' meses y el más antiguo tiene '+q.antig.max+'.'],obs:[],vars:[]});
    const low=(q.conf.Baja||0)/q.n;
    if(low>=.3) sigs.push({key:'calidad:baja:'+e.id,tipo:'calidad',emp:e.id,nodo:e.id,titulo:'Mucha información de baja confianza en '+e.nombre,sev:2,ev:[Math.round(low*100)+'% de las observaciones están marcadas con confianza baja.'],obs:[],vars:[]});
  });
  sigs.push(...ruleSignals());
  const seen=new Set();
  return sigs.filter(s=>{if(seen.has(s.key)) return false;seen.add(s.key);return true;}).sort((a,b)=>a.sev-b.sev);
}
/* ---- puntaje y plazos ---- */
function prioOf(s){
  if(!s.impacto||!s.esfuerzo) return null;
  const score=s.impacto*(6-s.esfuerzo);
  const q=s.impacto>=4&&s.esfuerzo<=2?'Ganancia rápida':s.impacto>=4&&s.esfuerzo>=3?'Apuesta grande':s.impacto<=3&&s.esfuerzo<=2?'Relleno':s.impacto<=2&&s.esfuerzo>=4?'Evitar o repensar':'Intermedia';
  return {score,nivel:score>=15?'Alta':score>=8?'Media':'Baja',q};
}
function venceOf(dias,plazo,desde){
  const base=desde?new Date(desde):new Date();
  if(Number(dias)>0){const d=new Date(base);d.setDate(d.getDate()+Number(dias));return isoD(d);}
  const m=/(\d{4})-(\d{2})-(\d{2})/.exec(String(plazo||''));if(m) return m[0];
  const n=/(\d+)\s*(d[ií]as?|semanas?|meses?)/i.exec(String(plazo||''));
  if(n){const k=/sem/i.test(n[2])?7:/mes/i.test(n[2])?30:1,d=new Date(base);d.setDate(d.getDate()+Number(n[1])*k);return isoD(d);}
  return null;
}
const hoyISO=()=>isoD(new Date());
const vencida=s=>!!s.vence&&s.vence<hoyISO()&&(s.estado==='propuesta'||s.estado==='en curso'||!s.estado);
/* ---- seguimiento del indicador con datos nuevos ---- */
function kpiStatus(s){
  if(!s.kpiVar||!s.kpiNodo) return {v:'sin indicador',txt:'Sin indicador medible ligado.'};
  const v=varById(s.kpiVar);if(!v) return {v:'sin indicador',txt:'La variable del indicador ya no existe.'};
  const desde=String(s.creado||''),obs=Object.values(S.obs).filter(o=>o.nodo===s.kpiNodo&&o.variable===s.kpiVar&&!o.no_aplica&&String(o.capturado)>desde).sort((a,b)=>String(a.capturado).localeCompare(String(b.capturado)));
  const pts=obs.map(o=>({o,x:numericVal(v,o)})).filter(p=>p.x!=null);
  const base=s.base&&s.base.valor!=null?Number(s.base.valor):null;
  if(!pts.length) return {v:'sin datos nuevos',txt:'Todavía no hay datos nuevos del indicador'+(base!=null?' (base: '+fmt3(base)+')':'')+'.',base,pts:[]};
  const cur=pts[pts.length-1].x,res={base,cur,pts,n:pts.length};
  if(base==null){res.v='sin base';res.txt='Hay datos nuevos ('+fmt3(cur)+'), pero no se guardó un valor base al aceptar.';return res;}
  const delta=cur-base,pct=base?delta/Math.abs(base)*100:null;
  const sube=s.direccion!=='bajar',bien=sube?delta>0:delta<0;
  res.delta=delta;res.pct=pct;
  if(s.meta!=null&&isFinite(s.meta)){
    res.prog=(s.meta-base)!==0?(cur-base)/(s.meta-base):null;
    if(sube?cur>=s.meta:cur<=s.meta){res.v='meta alcanzada';res.txt='Meta alcanzada: '+fmt3(cur)+' frente a una meta de '+fmt3(s.meta)+' (base '+fmt3(base)+').';return res;}
  }
  const chico=pct!=null&&Math.abs(pct)<5;
  if(chico){res.v='sin cambio';res.txt='Sin cambio relevante: '+fmt3(base)+' → '+fmt3(cur)+' ('+fmt3(pct)+'%).';}
  else if(bien){res.v='mejorando';res.txt='Mejorando: '+fmt3(base)+' → '+fmt3(cur)+' ('+(pct>0?'+':'')+fmt3(pct)+'%)'+(res.prog!=null?', '+Math.round(Math.max(0,res.prog)*100)+'% del camino a la meta':'')+'.';}
  else{res.v='empeoró';res.txt='Empeoró: '+fmt3(base)+' → '+fmt3(cur)+' ('+(pct>0?'+':'')+fmt3(pct)+'%).';}
  return res;
}
/* ---- borradores con Claude ---- */
function sgContext(sig){
  const e=sig.emp&&S.nodes[sig.emp],f=(e&&e.ficha)||{},p=sig.nodo&&S.nodes[sig.nodo];
  return {empresa:e?e.nombre:'(grupo)',industria:f.industria||'',categoria:f.categoria||'',pregunta_de_negocio:f.pregunta||'',decision:f.decision||'',nodo:p?nodeLabel(p):'',etapa:p&&p.tipo==='PRD'?p.etapa:''};
}
function numVarsWithData(extra){
  const ids=new Set(extra||[]);
  Object.values(S.obs).forEach(o=>{const v=varById(o.variable);if(v&&NUMT.includes(v.tipo)) ids.add(o.variable);});
  return [...ids].map(id=>varById(id)).filter(v=>v&&NUMT.includes(v.tipo)).slice(0,60);
}
function sgPrompt(batch){
  const vs=numVarsWithData(batch.flatMap(s=>s.vars||[]));
  return `Eres analista de negocio de una inteligencia organizacional multidisciplinaria. Te paso señales detectadas con datos reales de empresas del Grupo Tama. Redacta, para cada una, un borrador que el equipo revisará (aceptará, editará o descartará).

REGLAS
- Usa solo la evidencia que te paso. No inventes cifras, causas ni hechos. Si la evidencia no basta para recomendar una acción, clasifica como "insight" y propón qué dato falta.
- "clase": "sugerencia" si hay una acción concreta; "alerta" si es un riesgo que requiere atención; "insight" si es un aprendizaje o una fortaleza sin acción inmediata.
- "accion": una acción concreta y verificable, en una o dos oraciones (para un insight, qué hacer con el aprendizaje o qué dato capturar).
- "responsable": un puesto o rol (no una persona). "plazo": texto como «30 días»; "dias": número de días.
- "kpi_texto": cómo se medirá que funcionó. "kpi_variable": el id de UNA variable numérica de la lista que sirva para medirlo, o null. "direccion": "subir" o "bajar" según qué es mejor. "meta": número objetivo si se puede razonar a partir de la evidencia, o null.
- "impacto" y "esfuerzo": enteros de 1 a 5 (1 = muy bajo, 5 = muy alto), con "limites": una frase sobre la fiabilidad de la evidencia.
- Español claro y directo. Una asociación o una similitud de perfil no prueban causalidad.

VARIABLES NUMÉRICAS DISPONIBLES (id|variable|nivel):
${vs.map(v=>v.id+'|'+v.nombre+'|'+v.nivel).join('\n')||'(ninguna)'}

SEÑALES:
${batch.map(s=>'### '+s.key+' · '+SIGTIPO[s.tipo]+'\nContexto: '+JSON.stringify(sgContext(s))+'\nTítulo: '+s.titulo+'\nEvidencia:\n'+s.ev.map(x=>'- '+x).join('\n')).join('\n\n')}

Responde SOLO con JSON con esta forma exacta:
{"borradores":[{"senal":"clave exacta de la señal","clase":"sugerencia|alerta|insight","titulo":"...","accion":"...","por_que":"...","responsable":"...","plazo":"...","dias":30,"kpi_texto":"...","kpi_variable":"VAR-xxx o null","direccion":"subir|bajar","meta":null,"impacto":3,"esfuerzo":3,"limites":"..."}]}`;
}
const CL_ERR={not_granted:'No diste permiso para usar Claude.',rate_limited:'Hay demasiadas solicitudes seguidas. Espera un momento.',invalid_json:'Claude respondió con un formato que no pude leer. Intenta de nuevo.',no_sample:'Claude no está disponible en esta vista. Puedes escribir el borrador tú.'};
function cleanDraft(o,sig){
  const int=(x,d)=>{const n=Math.round(Number(x));return n>=1&&n<=5?n:d;};
  const v=o&&o.kpi_variable&&varById(o.kpi_variable);
  return {clase:['sugerencia','alerta','insight'].includes(o&&o.clase)?o.clase:'sugerencia',titulo:String((o&&o.titulo)||sig.titulo).slice(0,140),accion:String((o&&o.accion)||'').slice(0,500),por_que:String((o&&o.por_que)||'').slice(0,500),
    responsable:String((o&&o.responsable)||'').slice(0,80),plazo:String((o&&o.plazo)||'').slice(0,60),dias:Math.max(0,Math.min(365,Math.round(Number(o&&o.dias)||0))),kpi_texto:String((o&&o.kpi_texto)||'').slice(0,300),
    kpi_variable:v&&NUMT.includes(v.tipo)?v.id:null,direccion:(o&&o.direccion)==='bajar'?'bajar':'subir',meta:o&&o.meta!=null&&isFinite(Number(o.meta))?Number(o.meta):null,
    impacto:int(o&&o.impacto,3),esfuerzo:int(o&&o.esfuerzo,3),limites:String((o&&o.limites)||'').slice(0,300)};
}
async function saveDrafts(items){
  const ids=await mintBlock('SGD',4,items.length);
  for(let i=0;i<items.length;i++){
    const {sig,b}=items[i],id=ids[i];
    await put('nodes',id,{id,tipo:'SGD',nombre:trunc(b.titulo,70),padre:sig.emp||(nodesOf('GRP')[0]||{}).id||null,senal:sig.key,senalTipo:sig.tipo,senalNodo:sig.nodo||null,titulo:sig.titulo,evidencia:sig.ev,obs:(sig.obs||[]).slice(0,100),vars:sig.vars||[],estado:'borrador',borrador:b,creado:nowIso(),por:S.uid||null});
  }
}
async function sgDraftWithClaude(sigs){
  if(!sigs.length||SG.busy) return;
  SG.busy=true;SG.msg='Claude está redactando '+sigs.length+(sigs.length===1?' borrador…':' borradores…');SG.kind='';renderSugerencias();
  try{
    const sample=await (window.claude&&window.claude.use?window.claude.use('sample'):null);
    if(!sample) throw {code:'no_sample'};
    const out=await sample.json(sgPrompt(sigs),{modelTier:'default',cache:false});
    const byKey=new Map(((out&&out.borradores)||[]).filter(x=>x&&x.senal).map(x=>[x.senal,x]));
    const items=sigs.map(sig=>({sig,b:cleanDraft(byKey.get(sig.key),sig)}));
    await saveDrafts(items);
    SG.msg='Listo: '+items.length+(items.length===1?' borrador en la bandeja.':' borradores en la bandeja.');SG.kind='ok';
  }catch(e){SG.msg=CL_ERR[e&&e.code]||('No se pudo redactar: '+msgOf(e));SG.kind='warn';}
  finally{SG.busy=false;renderSugerencias();}
}
async function sgDraftManual(sig){
  try{await saveDrafts([{sig,b:cleanDraft(null,sig)}]);SG.msg='Borrador creado para que lo escribas.';SG.kind='ok';}
  catch(e){SG.msg='No se pudo crear: '+msgOf(e);SG.kind='warn';}
  renderSugerencias();
}
/* ---- aceptar un borrador ---- */
function kpiNodeFor(d,v){
  if(!v) return null;
  const e=d.padre&&S.nodes[d.padre]?empOfNode(S.nodes[d.padre])||S.nodes[d.padre]:null;
  const emp=e&&e.tipo==='EMP'?e:(d.senalNodo&&empOfNode(S.nodes[d.senalNodo]));
  if(!emp) return null;
  if(v.nivel==='E') return emp.id;
  if(v.nivel==='C'){const sn0=d.senalNodo&&S.nodes[d.senalNodo];if(sn0&&sn0.tipo==='CLI') return sn0.id;const c=clisOf(emp.id)[0];return c?c.id:null;}
  const sn=d.senalNodo&&S.nodes[d.senalNodo];
  if(sn&&sn.tipo==='PRD') return sn.id;
  const ps=nodesOf('PRD').filter(p=>p.padre===emp.id);return ps.length?ps[0].id:null;
}
async function sgAccept(d,b){
  const v=b.kpi_variable?varById(b.kpi_variable):null,kn=kpiNodeFor(d,v);
  let base=null;
  if(v&&kn){const rec=latest(kn,v.id),x=numericVal(v,rec);if(x!=null) base={valor:x,periodo:rec.periodo||null,obs:rec.id,fecha:nowIso()};}
  const hal=d.senalTipo==='hallazgo'&&d.senalNodo&&S.nodes[d.senalNodo]?d.senalNodo:null;
  const sid=(await mintBlock('SUG',4,1))[0];
  const now=nowIso();
  await put('nodes',sid,{id:sid,tipo:'SUG',nombre:trunc(b.titulo,70),padre:hal||d.padre,clase:b.clase,accion:b.accion||b.titulo,porque:b.por_que,dimension:v?v.dim:null,responsable:b.responsable,plazo:b.plazo,vence:venceOf(b.dias,b.plazo,now),
    kpi:b.kpi_texto,kpiVar:v?v.id:null,kpiNodo:kn,direccion:b.direccion,meta:b.meta,base,impacto:b.impacto,esfuerzo:b.esfuerzo,limites:b.limites,origen:{tipo:d.senalTipo,senal:d.senal},obs:d.obs||[],estado:'propuesta',creado:now,por:S.uid||null});
  await put('nodes',d.id,{...d,borrador:b,estado:'aceptado',sug:sid});
  return sid;
}

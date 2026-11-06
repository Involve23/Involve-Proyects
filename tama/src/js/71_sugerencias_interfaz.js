/* ===================== Sugerencias: interfaz ===================== */
const ESTCOL={propuesta:'#4C34B2','en curso':'#0BB9B9',hecha:'#9BD97E',descartada:'#A0A0A8'};
const KPICOL={'meta alcanzada':'#2E6A1A',mejorando:'#0BB9B9','sin cambio':'#9789D0',empeoró:'#EF4444','sin datos nuevos':'#A0A0A8','sin indicador':'#8A8A92','sin base':'#8A8A92'};
const KPITXT={'meta alcanzada':'#2E6A1A',mejorando:'#2E6A1A','sin cambio':'#3F3672',empeoró:'#B01A1A','sin datos nuevos':'#72727A','sin indicador':'#72727A','sin base':'#72727A'};
function inkOn(hex){const h=String(hex).replace('#','');const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);return (0.2126*r+0.7152*g+0.0722*b)>150?'#0F0F0F':'#FFFFFF';}
const QCOL={'Ganancia rápida':'#9BD97E','Apuesta grande':'#4C34B2','Relleno':'#9789D0','Evitar o repensar':'#EF4444','Intermedia':'#0BB9B9'};
let NUMOPTS=null;
function numVarSelect(value,onchange){
  if(!NUMOPTS||NUMOPTS.n!==allVars().length){
    const s=el('select');
    s.append(el('option',{value:'',text:'— sin variable medible —'}));
    Object.keys(SATS).forEach(k=>{
      const g=el('optgroup',{label:SATS[k].nombre});
      allVars().filter(v=>satOf(v)===k&&NUMT.includes(v.tipo)).forEach(v=>g.append(el('option',{value:v.id,text:v.nombre+' · '+NIVELES[v.nivel]})));
      if(g.children.length) s.append(g);
    });
    NUMOPTS={n:allVars().length,s};
  }
  const s=NUMOPTS.s.cloneNode(true);s.value=value||'';if(onchange) s.addEventListener('change',e=>onchange(e.target.value||null));
  return s;
}
function fld(label,input,wide){return el('label',{style:wide?'grid-column:1/-1':''},label,input);}
function selN(val,cb){const s=el('select',null,...[1,2,3,4,5].map(n=>el('option',{value:String(n),text:String(n)})));s.value=String(val||3);s.addEventListener('change',e=>cb(Number(e.target.value)));return s;}
function inp(val,cb,o={}){const i=el(o.area?'textarea':'input',{type:o.type||'text',value:val==null?'':String(val),rows:o.area?3:null,maxlength:o.max||300,placeholder:o.ph||''});if(o.area) i.value=val==null?'':String(val);i.addEventListener('change',e=>cb(e.target.value));return i;}

/* ---- gráficas ---- */
function barsSVG(rows,keys,w=560){
  const rh=26,L=170,R=20,T=8,Bm=34,H=T+Math.max(1,rows.length)*rh+Bm;
  const max=Math.max(1,...rows.map(r=>keys.reduce((a,k)=>a+(r.vals[k.k]||0),0)));
  const svg=svgEl('svg',{viewBox:'0 0 '+w+' '+H,width:'100%',role:'img'});
  rows.forEach((r,i)=>{
    const y=T+i*rh;let x=L;
    svg.append(svgEl('text',{x:L-8,y:y+16,'text-anchor':'end','font-size':11,fill:'#0F0F0F'},trunc(r.label,26)));
    keys.forEach(k=>{const n=r.vals[k.k]||0;if(!n) return;const bw=n/max*(w-L-R);svg.append(svgEl('rect',{x,y:y+3,width:bw,height:rh-8,fill:k.color,rx:2}),svgEl('text',{x:x+bw/2,y:y+16,'text-anchor':'middle','font-size':10,fill:inkOn(k.color)},n));x+=bw;});
  });
  const step=Math.floor((w-20)/keys.length);keys.forEach((k,i)=>{const lx=10+i*step,ly=H-12;svg.append(svgEl('rect',{x:lx,y:ly-9,width:10,height:10,fill:k.color,rx:2}),svgEl('text',{x:lx+14,y:ly,'font-size':11,fill:'#72727A'},k.label));});
  return svg;
}
function matrixSVG(items){
  const W=560,Hh=390,L=54,T=14,R=14,B=48,pw=W-L-R,ph=Hh-T-B;
  const X=e=>L+(e-.5)/5*pw,Y=i=>T+(5.5-i)/5*ph;
  const xm=L+2.5/5*pw,ym=T+2/5*ph;
  const svg=svgEl('svg',{viewBox:'0 0 '+W+' '+Hh,width:'100%',role:'img','aria-label':'Matriz de impacto y esfuerzo'});
  svg.append(svgEl('rect',{x:L,y:T,width:xm-L,height:ym-T,fill:'#EEF9E6'}),svgEl('rect',{x:xm,y:T,width:L+pw-xm,height:ym-T,fill:'#F4F2F7'}),
    svgEl('rect',{x:L,y:ym,width:xm-L,height:T+ph-ym,fill:'#F6F6F4'}),svgEl('rect',{x:xm,y:ym,width:L+pw-xm,height:T+ph-ym,fill:'#FFF0F3'}));
  [['Ganancias rápidas',L+8,T+16],['Apuestas grandes',xm+8,T+16],['Rellenos',L+8,T+ph-8],['Evitar o repensar',xm+8,T+ph-8]].forEach(([t,x,y])=>svg.append(svgEl('text',{x,y,'font-size':11,fill:'#72727A'},t)));
  for(let k=1;k<=5;k++){
    svg.append(svgEl('text',{x:X(k),y:Hh-26,'text-anchor':'middle','font-size':11,fill:'#72727A'},k),svgEl('text',{x:L-10,y:Y(k)+4,'text-anchor':'end','font-size':11,fill:'#72727A'},k));
  }
  svg.append(svgEl('text',{x:L+pw/2,y:Hh-6,'text-anchor':'middle','font-size':12,fill:'#0F0F0F'},'Esfuerzo →'),svgEl('text',{x:14,y:T+ph/2,'text-anchor':'middle','font-size':12,fill:'#0F0F0F',transform:'rotate(-90 14 '+(T+ph/2)+')'},'Impacto →'));
  const cnt={};
  items.forEach(s=>{
    const key=s.impacto+'-'+s.esfuerzo,k=cnt[key]=(cnt[key]||0)+1,ang=k*2.4,rad=k>1?11+(k>4?7:0):0;
    const cx=X(s.esfuerzo)+Math.cos(ang)*rad,cy=Y(s.impacto)+Math.sin(ang)*rad;
    const g=svgEl('g',{style:'cursor:pointer',tabindex:'0',role:'button','aria-label':s.id+': '+s.nombre},svgEl('title',null,s.id+' · '+s.nombre),svgEl('circle',{cx,cy,r:13,fill:ESTCOL[s.estado||'propuesta'],stroke:'#FFFFFF','stroke-width':1.5}),svgEl('text',{x:cx,y:cy+3.5,'text-anchor':'middle','font-size':9,fill:inkOn(ESTCOL[s.estado||'propuesta']),'pointer-events':'none'},s.id.slice(4,8)));
    g.addEventListener('click',()=>{SG.open=s.id;SG.sub='seg';renderSugerencias();});
    svg.append(g);
  });
  return svg;
}
function lineSVG(st,s){
  const W=320,Hh=120,L=36,R=10,T=10,B=22,pw=W-L-R,ph=Hh-T-B;
  const ys=[st.base,...st.pts.map(p=>p.x)].filter(v=>v!=null);if(s.meta!=null) ys.push(Number(s.meta));
  let lo=Math.min(...ys),hi=Math.max(...ys);if(lo===hi){lo-=1;hi+=1;}
  const pad=(hi-lo)*.1;lo-=pad;hi+=pad;
  const pts=[];if(st.base!=null) pts.push({x:st.base,l:'base'});st.pts.forEach(p=>pts.push({x:p.x,l:String(p.o.periodo||'')}));
  const X=i=>L+(pts.length>1?i/(pts.length-1):.5)*pw,Y=v=>T+(hi-v)/(hi-lo)*ph;
  const svg=svgEl('svg',{viewBox:'0 0 '+W+' '+Hh,width:'100%',role:'img','aria-label':'Evolución del indicador'});
  svg.append(svgEl('line',{x1:L,y1:T,x2:L,y2:T+ph,stroke:'#D8D7D3'}),svgEl('line',{x1:L,y1:T+ph,x2:L+pw,y2:T+ph,stroke:'#D8D7D3'}),
    svgEl('text',{x:L-4,y:T+8,'text-anchor':'end','font-size':9,fill:'#72727A'},fmt3(hi)),svgEl('text',{x:L-4,y:T+ph,'text-anchor':'end','font-size':9,fill:'#72727A'},fmt3(lo)));
  if(s.meta!=null) svg.append(svgEl('line',{x1:L,y1:Y(Number(s.meta)),x2:L+pw,y2:Y(Number(s.meta)),stroke:'#2E6A1A','stroke-dasharray':'4 3'}),svgEl('text',{x:L+pw,y:Y(Number(s.meta))-3,'text-anchor':'end','font-size':9,fill:'#2E6A1A'},'meta '+fmt3(Number(s.meta))));
  svg.append(svgEl('polyline',{points:pts.map((p,i)=>X(i)+','+Y(p.x)).join(' '),fill:'none',stroke:'#4C34B2','stroke-width':2.5}));
  pts.forEach((p,i)=>svg.append(svgEl('circle',{cx:X(i),cy:Y(p.x),r:3.5,fill:i===0&&st.base!=null?'#0BB9B9':'#4C34B2'}),svgEl('text',{x:X(i),y:Hh-6,'text-anchor':'middle','font-size':8,fill:'#72727A'},p.l)));
  return svg;
}

/* ---- datos de la vista ---- */
function sgEmpName(n){const e=empOfNode(n);return e?e.nombre:'Grupo';}
function allSug(){return nodesOf('SUG');}
function handledKeys(){return new Set(nodesOf('SGD').map(d=>d.senal));}
function sugFiltered(){
  return allSug().filter(s=>{const e=empOfNode(s);
    if(SG.fEmp&&(!e||e.id!==SG.fEmp)) return false;
    if(SG.fEst&&(s.estado||'propuesta')!==SG.fEst) return false;
    if(SG.fResp&&(s.responsable||'')!==SG.fResp) return false;
    return true;});
}
function sgFilters(showEst){
  const bar=el('div',{class:'filters'});
  const se=el('select',{'aria-label':'Empresa',onchange:e=>{SG.fEmp=e.target.value;renderSugerencias();}},el('option',{value:'',text:'Todas las empresas'}),...nodesOf('EMP').map(e=>el('option',{value:e.id,text:e.nombre})));se.value=SG.fEmp;bar.append(se);
  if(showEst){
    const st=el('select',{'aria-label':'Estado',onchange:e=>{SG.fEst=e.target.value;renderSugerencias();}},el('option',{value:'',text:'Todos los estados'}),...ESTADOS.map(x=>el('option',{value:x,text:x})));st.value=SG.fEst;bar.append(st);
    const resp=[...new Set(allSug().map(s=>s.responsable).filter(Boolean))];
    const sr=el('select',{'aria-label':'Responsable',onchange:e=>{SG.fResp=e.target.value;renderSugerencias();}},el('option',{value:'',text:'Todos los responsables'}),...resp.map(x=>el('option',{value:x,text:x})));sr.value=SG.fResp;bar.append(sr);
  }
  return bar;
}

/* ---- bandeja ---- */
function draftCard(d){
  const b=SG.edit&&SG.edit[d.id]?SG.edit[d.id]:(SG.edit=SG.edit||{},SG.edit[d.id]={...d.borrador});
  const emp=d.padre&&S.nodes[d.padre]?(empOfNode(S.nodes[d.padre])||S.nodes[d.padre]):null;
  const msg=el('span',{class:'res',role:'status'});
  const card=el('div',{class:'card',style:'margin-top:10px'});
  card.append(el('div',{class:'vhead'},tagEl(d.id),el('span',{class:'tag',text:SIGTIPO[d.senalTipo]||d.senalTipo}),el('span',{class:'dimtag',text:emp?emp.nombre:'Grupo'})),
    el('h3',{style:'font-size:16px;margin:6px 0',text:d.titulo}),
    el('ul',{style:'margin:4px 0 10px;padding-left:20px;color:var(--muted);font-size:13px'},...(d.evidencia||[]).map(x=>el('li',{text:x}))));
  const grid=el('div',{class:'formgrid'},
    fld('Clase',(()=>{const s=el('select',null,...Object.entries(CLASE_ES).map(([k,v])=>el('option',{value:k,text:v})));s.value=b.clase;s.addEventListener('change',e=>{b.clase=e.target.value;});return s;})()),
    fld('Título',inp(b.titulo,v=>{b.titulo=v;},{max:140})),
    fld('Acción',inp(b.accion,v=>{b.accion=v;},{area:true,max:500}),true),
    fld('Por qué',inp(b.por_que,v=>{b.por_que=v;},{area:true,max:500}),true),
    fld('Responsable (rol)',inp(b.responsable,v=>{b.responsable=v;},{max:80})),
    fld('Plazo',inp(b.plazo,v=>{b.plazo=v;},{max:60,ph:'Ej. 30 días'})),
    fld('Días para el plazo',inp(b.dias||'',v=>{b.dias=Math.max(0,Number(v)||0);},{type:'number',max:5})),
    fld('Cómo se medirá',inp(b.kpi_texto,v=>{b.kpi_texto=v;},{max:300})),
    fld('Variable del indicador',numVarSelect(b.kpi_variable,v=>{b.kpi_variable=v;})),
    fld('Dirección',(()=>{const s=el('select',null,el('option',{value:'subir',text:'Subir es mejor'}),el('option',{value:'bajar',text:'Bajar es mejor'}));s.value=b.direccion;s.addEventListener('change',e=>{b.direccion=e.target.value;});return s;})()),
    fld('Meta (número)',inp(b.meta==null?'':b.meta,v=>{b.meta=v===''||!isFinite(Number(v))?null:Number(v);},{type:'number',max:20})),
    fld('Impacto (1 a 5)',selN(b.impacto,n=>{b.impacto=n;})),
    fld('Esfuerzo (1 a 5)',selN(b.esfuerzo,n=>{b.esfuerzo=n;})),
    fld('Límites de la evidencia',inp(b.limites,v=>{b.limites=v;},{max:300}),true));
  card.append(grid,el('div',{class:'row2'},
    el('button',{class:'btn main',type:'button',text:'Aceptar como sugerencia',onclick:async e=>{
      if(!b.accion.trim()&&b.clase!=='insight'){msg.className='res bad';msg.textContent='Escribe la acción antes de aceptar.';return;}
      e.target.disabled=true;
      try{const sid=await sgAccept(d,b);delete SG.edit[d.id];SG.msg='Registrada como '+sid+'.';SG.kind='ok';renderSugerencias();}
      catch(err){e.target.disabled=false;msg.className='res bad';msg.textContent='No se pudo registrar: '+msgOf(err);}}}),
    el('button',{class:'btn',type:'button',text:'Guardar cambios',onclick:async()=>{try{await put('nodes',d.id,{...d,borrador:{...b}});msg.className='res ok';msg.textContent='Guardado.';}catch(err){msg.className='res bad';msg.textContent='No se pudo guardar: '+msgOf(err);}}}),
    el('button',{class:'btn',type:'button',text:'Descartar',onclick:async()=>{try{await put('nodes',d.id,{...d,estado:'descartado'});delete SG.edit[d.id];renderSugerencias();}catch(err){msg.className='res bad';msg.textContent='No se pudo descartar: '+msgOf(err);}}}),msg));
  return card;
}
function viewBandeja(){
  const k=[],handled=handledKeys();
  let sigs=detectSignals().filter(s=>!handled.has(s.key));
  if(SG.fEmp) sigs=sigs.filter(s=>s.emp===SG.fEmp);
  if(SG.fTipo) sigs=sigs.filter(s=>s.tipo===SG.fTipo);
  const drafts=nodesOf('SGD').filter(d=>d.estado==='borrador'&&(!SG.fEmp||(d.padre===SG.fEmp)));
  const bar=sgFilters(false);
  const st=el('select',{'aria-label':'Tipo de señal',onchange:e=>{SG.fTipo=e.target.value;renderSugerencias();}},el('option',{value:'',text:'Todos los tipos'}),...Object.entries(SIGTIPO).map(([kk,v])=>el('option',{value:kk,text:v})));st.value=SG.fTipo;bar.append(st);
  k.push(el('p',{class:'empty',text:'Los detectores buscan señales en lo capturado: hallazgos sin sugerencia, brechas frente a pares, cross-selling, huecos de datos, alertas, valor del producto y calidad de los datos. Claude redacta un borrador de cada una y tú decides.'}),bar);
  if(SG.msg) k.push(el('div',{class:'impmsg '+(SG.kind||''),role:'status'},SG.msg));
  k.push(el('h3',{style:'font-size:17px;margin-top:14px',text:'Borradores por revisar ('+drafts.length+')'}));
  if(!drafts.length) k.push(el('p',{class:'empty',text:'No hay borradores. Pídele a Claude que redacte los de las señales de abajo.'}));
  drafts.forEach(d=>k.push(draftCard(d)));
  k.push(el('h3',{style:'font-size:17px;margin-top:26px',text:'Señales detectadas ('+sigs.length+')'}));
  const top=sigs.slice(0,5);
  k.push(el('div',{class:'row2'},el('button',{class:'btn main',type:'button',disabled:SG.busy||!top.length,onclick:()=>sgDraftWithClaude(top),text:SG.busy?'Claude está redactando…':'Que Claude redacte las '+top.length+' más prioritarias'})));
  k.push(el('p',{class:'empty',style:'margin-top:6px',text:'Claude recibe la evidencia de cada señal (cifras, nombres de variables y de empresas, textos de hallazgos), no filas de archivos ni textos libres capturados. Te pedirá permiso la primera vez.'}));
  if(!sigs.length) k.push(el('p',{class:'empty',text:'No hay señales nuevas con los datos actuales.'}));
  const t=el('table',{class:'tbl'});
  t.append(el('thead',null,el('tr',null,['Severidad','Tipo','Empresa','Señal y evidencia',''].map(h=>el('th',{text:h})))));
  const b=el('tbody');
  sigs.slice(0,80).forEach(s=>{
    const e=s.emp&&S.nodes[s.emp];
    b.append(el('tr',null,el('td',{text:SEV_ES[s.sev]}),el('td',{text:SIGTIPO[s.tipo]}),el('td',{text:e?e.nombre:'Grupo'}),
      el('td',null,el('b',{text:s.titulo}),el('ul',{style:'margin:4px 0 0;padding-left:18px;color:var(--muted);font-size:12.5px'},...s.ev.map(x=>el('li',{text:x})))),
      el('td',null,el('div',{class:'stack',style:'gap:6px;min-width:150px'},
        el('button',{class:'btn',type:'button',disabled:SG.busy,onclick:()=>sgDraftWithClaude([s]),text:'Redactar con Claude'}),
        el('button',{class:'btn',type:'button',onclick:()=>sgDraftManual(s),text:'Escribirlo yo'}),
        el('button',{class:'btn',type:'button',disabled:SG.busy,onclick:()=>sgIgnore(s),text:'Ignorar'})))));
  });
  t.append(b);k.push(el('div',{class:'card scroll',style:'margin-top:8px'},t));
  const disc=nodesOf('SGD').filter(d=>d.estado==='descartado');
  if(disc.length){
    k.push(el('details',{class:'det',style:'margin-top:18px'},el('summary',{text:'Descartadas ('+disc.length+')'}),
      el('div',{class:'stack',style:'margin-top:8px'},...disc.map(d=>el('div',{class:'row2',style:'margin:0'},tagEl(d.id),el('span',{text:d.titulo}),el('button',{class:'btn',type:'button',text:'Restaurar',onclick:async()=>{await put('nodes',d.id,{...d,estado:'borrador'});renderSugerencias();}}))))));
  }
  return k;
}
/* ---- prioridad ---- */
function viewPrioridad(){
  const k=[],open=sugFiltered().filter(s=>s.estado!=='hecha'&&s.estado!=='descartada');
  k.push(el('p',{class:'empty',text:'Cada sugerencia se ubica por su impacto y su esfuerzo (1 a 5). El puntaje es impacto × (6 − esfuerzo): premia lo que rinde mucho con poco trabajo. Toca un punto para abrir su seguimiento.'}),sgFilters(false));
  const pr=open.filter(s=>s.impacto&&s.esfuerzo),sin=open.filter(s=>!(s.impacto&&s.esfuerzo));
  if(!pr.length) k.push(el('div',{class:'impmsg warn',text:'Todavía no hay sugerencias abiertas con impacto y esfuerzo.'}));
  else k.push(el('div',{class:'card',style:'max-width:620px'},matrixSVG(pr)));
  const rows=[...pr].sort((a,b)=>prioOf(b).score-prioOf(a).score);
  if(rows.length){
    const t=el('table',{class:'tbl'});
    t.append(el('thead',null,el('tr',null,['ID','Sugerencia','Empresa','Impacto','Esfuerzo','Puntaje','Nivel','Cuadrante','Responsable','Estado'].map(h=>el('th',{text:h})))));
    const b=el('tbody');
    rows.forEach(s=>{const p=prioOf(s);b.append(el('tr',{class:'row',onclick:()=>{SG.open=s.id;SG.sub='seg';renderSugerencias();}},el('td',{class:'mono',text:s.id}),el('td',{text:s.nombre}),el('td',{text:sgEmpName(s)}),el('td',{class:'num',text:s.impacto}),el('td',{class:'num',text:s.esfuerzo}),el('td',{class:'num',text:p.score}),el('td',{text:p.nivel}),el('td',{text:p.q}),el('td',{text:s.responsable||'—'}),el('td',{text:s.estado||'propuesta'})));});
    t.append(b);k.push(el('h3',{style:'font-size:16px;margin-top:20px',text:'Orden de prioridad'}),el('div',{class:'card scroll'},t));
  }
  if(sin.length){
    k.push(el('h3',{style:'font-size:16px;margin-top:20px',text:'Sin priorizar ('+sin.length+')'}));
    const t=el('table',{class:'tbl'});
    t.append(el('thead',null,el('tr',null,['ID','Sugerencia','Impacto','Esfuerzo'].map(h=>el('th',{text:h})))));
    const b=el('tbody');
    sin.forEach(s=>{
      const patch={impacto:s.impacto||3,esfuerzo:s.esfuerzo||3};
      const save=()=>put('nodes',s.id,{...s,...patch}).then(()=>renderSugerencias()).catch(()=>{});
      b.append(el('tr',null,el('td',{class:'mono',text:s.id}),el('td',{text:s.nombre}),el('td',null,selN(patch.impacto,n=>{patch.impacto=n;save();})),el('td',null,selN(patch.esfuerzo,n=>{patch.esfuerzo=n;save();}))));});
    t.append(b);k.push(el('div',{class:'card scroll'},t));
  }
  return k;
}
/* ---- seguimiento ---- */
function sugDetail(s){
  const patch={},msg=el('span',{class:'res',role:'status'}),st=kpiStatus(s);
  const box=el('div',{class:'card',style:'margin:8px 0'});
  box.append(el('div',{class:'vhead'},tagEl(s.id),el('span',{class:'tag',text:CLASE_ES[s.clase]||'Sugerencia'}),el('span',{class:'dimtag',text:sgEmpName(s)})),
    el('h3',{style:'font-size:16px;margin:6px 0',text:s.nombre}),
    s.accion&&s.accion!==s.nombre?el('p',{text:s.accion}):null,
    s.porque?el('p',{class:'empty',text:'Por qué: '+s.porque}):null,
    s.limites?el('p',{class:'empty',text:'Límites de la evidencia: '+s.limites}):null);
  box.append(el('div',{class:'impmsg',style:'border-color:'+(KPICOL[st.v]||'#8A8A92')},el('b',{text:'Indicador: '}),st.txt),
    st.pts&&(st.pts.length||st.base!=null)?el('div',{style:'max-width:360px'},lineSVG(st,s)):null);
  if(st.v==='meta alcanzada'&&s.estado!=='hecha') box.append(el('div',{class:'row2'},el('button',{class:'btn main',type:'button',text:'Marcar como hecha',onclick:async()=>{await put('nodes',s.id,{...s,estado:'hecha'});renderSugerencias();}})));
  const v=s.kpiVar?varById(s.kpiVar):null;
  box.append(el('div',{class:'formgrid'},
    fld('Estado',(()=>{const x=el('select',null,...ESTADOS.map(e=>el('option',{value:e,text:e})));x.value=s.estado||'propuesta';x.addEventListener('change',e=>{patch.estado=e.target.value;});return x;})()),
    fld('Responsable',inp(s.responsable||'',x=>{patch.responsable=x;},{max:80})),
    fld('Plazo',inp(s.plazo||'',x=>{patch.plazo=x;patch.vence=venceOf(0,x,s.creado)||s.vence||null;},{max:60})),
    fld('Vence (AAAA-MM-DD)',inp(s.vence||'',x=>{patch.vence=/^\d{4}-\d{2}-\d{2}$/.test(x)?x:null;},{max:10})),
    fld('Variable del indicador',numVarSelect(s.kpiVar,x=>{patch.kpiVar=x;const nv=x&&varById(x);patch.kpiNodo=nv?kpiNodeFor({padre:s.padre,senalNodo:s.kpiNodo},nv)||s.kpiNodo:null;if(nv&&patch.kpiNodo){const rec=latest(patch.kpiNodo,nv.id),val=numericVal(nv,rec);if(val!=null) patch.base={valor:val,periodo:rec.periodo||null,obs:rec.id,fecha:nowIso()};}})),
    fld('Dirección',(()=>{const x=el('select',null,el('option',{value:'subir',text:'Subir es mejor'}),el('option',{value:'bajar',text:'Bajar es mejor'}));x.value=s.direccion||'subir';x.addEventListener('change',e=>{patch.direccion=e.target.value;});return x;})()),
    fld('Meta (número)',inp(s.meta==null?'':s.meta,x=>{patch.meta=x===''||!isFinite(Number(x))?null:Number(x);},{type:'number',max:20})),
    fld('Impacto',selN(s.impacto,n=>{patch.impacto=n;})),fld('Esfuerzo',selN(s.esfuerzo,n=>{patch.esfuerzo=n;}))));
  box.append(el('div',{class:'row2'},el('button',{class:'btn main',type:'button',text:'Guardar',onclick:async()=>{try{await put('nodes',s.id,{...s,...patch});msg.className='res ok';msg.textContent='Guardado.';renderSugerencias();}catch(e){msg.className='res bad';msg.textContent='No se pudo guardar: '+msgOf(e);}}}),msg));
  return box;
}
function viewSeguimiento(){
  const k=[],list=sugFiltered();
  k.push(el('p',{class:'empty',text:'Seguimiento de cada sugerencia: estado, responsable, plazo y el indicador medido con los datos que se capturen después de aceptarla. Un indicador mejora si el cambio frente a la base es de al menos 5% en la dirección buena.'}),sgFilters(true));
  if(!list.length){k.push(el('div',{class:'impmsg warn',text:'Todavía no hay sugerencias registradas. Acepta borradores en la Bandeja o registra una desde el chat.'}));return k;}
  const t=el('table',{class:'tbl'});
  t.append(el('thead',null,el('tr',null,['ID','Empresa','Clase','Sugerencia','Responsable','Vence','Estado','Indicador'].map(h=>el('th',{text:h})))));
  const b=el('tbody');
  list.sort((a,c)=>(vencida(c)-vencida(a))||String(a.vence||'9999').localeCompare(String(c.vence||'9999'))).forEach(s=>{
    const stt=kpiStatus(s);
    b.append(el('tr',{class:'row'+(SG.open===s.id?' open':''),onclick:()=>{SG.open=SG.open===s.id?null:s.id;renderSugerencias();}},el('td',{class:'mono',text:s.id}),el('td',{text:sgEmpName(s)}),el('td',{text:CLASE_ES[s.clase]||'Sugerencia'}),el('td',{text:s.nombre}),el('td',{text:s.responsable||'—'}),
      el('td',{style:vencida(s)?'color:var(--red)':'',text:s.vence?(vencida(s)?s.vence+' (vencida)':s.vence):'—'}),el('td',{text:s.estado||'propuesta'}),el('td',null,el('span',{class:'tag',style:'color:'+(KPITXT[stt.v]||'#72727A'),text:stt.v}))));
  });
  t.append(b);k.push(el('div',{class:'card scroll'},t));
  const op=SG.open&&S.nodes[SG.open];
  if(op&&op.tipo==='SUG') k.push(sugDetail(op));
  return k;
}
/* ---- tablero ---- */
function viewTablero(){
  const k=[],all=allSug(),hoy=hoyISO();
  const abiertas=all.filter(s=>s.estado!=='hecha'&&s.estado!=='descartada'),venc=all.filter(vencida);
  const kp={};all.forEach(s=>{const v=kpiStatus(s).v;kp[v]=(kp[v]||0)+1;});
  k.push(el('div',{class:'statrow'},...[[all.length,'Sugerencias'],[abiertas.length,'Abiertas'],[all.filter(s=>s.estado==='en curso').length,'En curso'],[all.filter(s=>s.estado==='hecha').length,'Hechas'],[venc.length,'Vencidas'],[(kp.mejorando||0)+(kp['meta alcanzada']||0),'Indicadores que mejoran']].map(([n,l])=>el('div',{class:'stat'},el('b',{text:String(n)}),el('span',{text:l})))));
  if(!all.length){k.push(el('div',{class:'impmsg warn',text:'Todavía no hay sugerencias para mostrar.'}));return k;}
  const byEmp=nodesOf('EMP').map(e=>({label:e.nombre,vals:Object.fromEntries(ESTADOS.map(x=>[x,all.filter(s=>{const ee=empOfNode(s);return ee&&ee.id===e.id&&(s.estado||'propuesta')===x;}).length]))})).filter(r=>Object.values(r.vals).some(n=>n));
  const orphan=all.filter(s=>!empOfNode(s));if(orphan.length) byEmp.push({label:'Grupo',vals:Object.fromEntries(ESTADOS.map(x=>[x,orphan.filter(s=>(s.estado||'propuesta')===x).length]))});
  k.push(el('h3',{style:'font-size:16px;margin-top:6px',text:'Por empresa y estado'}),el('div',{class:'card',style:'max-width:640px'},barsSVG(byEmp,ESTADOS.map(x=>({k:x,label:x,color:ESTCOL[x]})))));
  const resp={};all.forEach(s=>{const r=s.responsable||'Sin responsable';const o=resp[r]||(resp[r]={abiertas:0,vencidas:0});if(s.estado!=='hecha'&&s.estado!=='descartada'){o.abiertas++;if(vencida(s)) o.vencidas++;}});
  const rrows=Object.entries(resp).filter(([,o])=>o.abiertas).map(([label,o])=>({label,vals:{ok:o.abiertas-o.vencidas,venc:o.vencidas}}));
  if(rrows.length) k.push(el('h3',{style:'font-size:16px;margin-top:20px',text:'Por responsable'}),el('div',{class:'card',style:'max-width:640px'},barsSVG(rrows,[{k:'ok',label:'En plazo',color:'#4C34B2'},{k:'venc',label:'Vencidas',color:'#EF4444'}])));
  const kr=Object.keys(KPICOL).filter(x=>kp[x]).map(x=>({label:x,vals:{n:kp[x]}}));
  k.push(el('h3',{style:'font-size:16px;margin-top:20px',text:'Qué pasó con los indicadores'}),el('div',{class:'card',style:'max-width:640px'},barsSVG(kr,[{k:'n',label:'Sugerencias',color:'#9789D0'}])));
  const q={};all.filter(s=>s.estado!=='hecha'&&s.estado!=='descartada').forEach(s=>{const p=prioOf(s);const kk=p?p.q:'Sin priorizar';q[kk]=(q[kk]||0)+1;});
  k.push(el('h3',{style:'font-size:16px;margin-top:20px',text:'Abiertas por cuadrante de prioridad'}),el('div',{class:'card',style:'max-width:640px'},barsSVG(Object.entries(q).map(([label,n])=>({label,vals:{n}})),[{k:'n',label:'Sugerencias abiertas',color:'#0BB9B9'}])));
  return k;
}
const SG_VIEWS={bandeja:viewBandeja,prio:viewPrioridad,seg:viewSeguimiento,tab:viewTablero};
function renderSugerencias(){
  const box=$('#sg-body');if(!box) return;
  $$('.gsub').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.gs===SG.sub)));
  box.replaceChildren(...(SG_VIEWS[SG.sub]||viewBandeja)().filter(Boolean));
}
function renderSugerenciasAuto(){
  const a=document.activeElement;
  if(a&&a.closest&&a.closest('#sg-body')&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
  renderSugerencias();
}
async function sgIgnore(sig){
  try{
    const id=(await mintBlock('SGD',4,1))[0];
    await put('nodes',id,{id,tipo:'SGD',nombre:trunc(sig.titulo,70),padre:sig.emp||(nodesOf('GRP')[0]||{}).id||null,senal:sig.key,senalTipo:sig.tipo,senalNodo:sig.nodo||null,titulo:sig.titulo,evidencia:sig.ev,obs:(sig.obs||[]).slice(0,100),vars:sig.vars||[],estado:'descartado',borrador:cleanDraft(null,sig),creado:nowIso(),por:S.uid||null});
  }catch(e){SG.msg='No se pudo ignorar: '+msgOf(e);SG.kind='warn';}
  renderSugerencias();
}
$$('.gsub').forEach(b=>b.addEventListener('click',()=>{SG.sub=b.dataset.gs;renderSugerencias();}));

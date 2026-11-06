/* ===================== Importar CSV ===================== */
const AGGS=['suma','promedio','mediana','minimo','maximo','ultimo','conteo','distintos','frecuentes','rango','moda'];
const AGG_ES={suma:'Suma',promedio:'Promedio',mediana:'Mediana',minimo:'Mínimo',maximo:'Máximo',ultimo:'Último valor',conteo:'Conteo de filas',distintos:'Valores distintos',frecuentes:'Más frecuentes',rango:'Rango',moda:'Más frecuente'};
const IMP={emp:'',prd:'',cli:'',name:'',size:0,header:true,headers:[],rows:[],prof:[],shape:'tabla',ficha:null,map:[],nuevas:[],preguntas:[],resumen:'',periodo:'',busy:false,msg:'',msgKind:'',saved:null,claudeUsed:false};
const normT=s=>String(s==null?'':s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const prettify=s=>{const t=String(s).replace(/[_\-]+/g,' ').trim();return t.charAt(0).toUpperCase()+t.slice(1);};
const fmtN=x=>x==null?'—':(Math.abs(x)>=1000?Number(x).toLocaleString('es-MX',{maximumFractionDigits:2}):String(Math.round(x*10000)/10000));

/* ---- lectura del archivo ---- */
function readText(file,enc){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(String(fr.result));fr.onerror=()=>rej(fr.error||new Error('No se pudo leer el archivo'));fr.readAsText(file,enc);});}
function parseCSV(text){
  if(text.charCodeAt(0)===0xFEFF) text=text.slice(1);
  const head=text.split(/\r?\n/).slice(0,5).join('\n');
  let best=',',bs=-1;
  [',',';','\t','|'].forEach(d=>{const c=head.split(d).length;if(c>bs){bs=c;best=d;}});
  const rows=[];let row=[],cell='',q=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(q){if(ch==='"'){if(text[i+1]==='"'){cell+='"';i++;}else q=false;}else cell+=ch;}
    else if(ch==='"') q=true;
    else if(ch===best){row.push(cell);cell='';}
    else if(ch==='\n'||ch==='\r'){
      if(ch==='\r'&&text[i+1]==='\n') i++;
      row.push(cell);cell='';
      if(row.length>1||row[0]!=='') rows.push(row);
      row=[];
    }else cell+=ch;
  }
  if(cell!==''||row.length){row.push(cell);rows.push(row);}
  return {delim:best,rows};
}
function numParse(s){
  if(s==null) return null;
  let t=String(s).trim();if(!t) return null;
  t=t.replace(/[\s$€%]/g,'').replace(/^\((.*)\)$/,'-$1');
  if(/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t=t.replace(/\./g,'').replace(',','.');
  else if(/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) t=t.replace(/,/g,'');
  else t=t.replace(',','.');
  if(!/^-?\d*\.?\d+(e[+-]?\d+)?$/i.test(t)) return null;
  const n=Number(t);return Number.isFinite(n)?n:null;
}
function dateParse(s){
  const t=String(s).trim();let m,d;
  if((m=/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/.exec(t))) d=new Date(+m[1],+m[2]-1,+m[3]);
  else if((m=/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/.exec(t))) d=new Date(+m[3],+m[2]-1,+m[1]);
  else return null;
  return isNaN(d)||(m&&((+m[2]>12&&m[1].length===4)))?null:d;
}
const isoD=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');

/* ---- perfil de columnas (nada de esto sale de la página salvo lo que tú autorices) ---- */
function profileColumns(headers,rows){
  return headers.map((h,ci)=>{
    const vals=[];let empty=0;
    for(const r of rows){const v=r[ci];if(v==null||String(v).trim()==='') empty++;else vals.push(String(v).trim());}
    const n=vals.length;
    const nums=[];vals.forEach(v=>{const x=numParse(v);if(x!==null)nums.push(x);});
    const dsample=vals.slice(0,500).map(dateParse).filter(Boolean);
    const sample200=vals.slice(0,200);
    const sensible=/mail|correo|tel[eé]f|phone|celular|whats|nombre|name|rfc|curp|direcci|address|nss|contrase|apellido/i.test(h)||(sample200.length&&sample200.filter(v=>/@/.test(v)||/^\+?\d[\d\s-]{8,}$/.test(v)).length>sample200.length*.2);
    const freq=new Map();vals.forEach(v=>freq.set(v,(freq.get(v)||0)+1));
    let tipo='texto';
    if(n&&nums.length/n>=.9) tipo='numero';
    else if(n&&dsample.length/Math.min(n,500)>=.8) tipo='fecha';
    else if(n&&freq.size<=2&&[...freq.keys()].every(v=>/^(si|sí|no|true|false|yes|1|0|verdadero|falso)$/i.test(v))) tipo='booleano';
    const p={i:ci,nombre:h,tipo,n,vacios:empty,pctVacios:rows.length?Math.round(empty/rows.length*100):0,distintos:freq.size,sensible:!!sensible,top:[...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8)};
    if(tipo==='numero'){
      const s=nums.slice().sort((a,b)=>a-b);
      p.min=s[0];p.max=s[s.length-1];p.sum=nums.reduce((a,b)=>a+b,0);p.mean=p.sum/nums.length;
      p.median=s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2;
      p.last=nums[nums.length-1];p.nn=nums.length;
    }
    if(tipo==='fecha'){
      let a=null,b=null;vals.forEach(v=>{const d=dateParse(v);if(!d)return;if(!a||d<a)a=d;if(!b||d>b)b=d;});
      p.fmin=a?isoD(a):null;p.fmax=b?isoD(b):null;
    }
    if(tipo==='booleano'){p.pctTrue=n?vals.filter(v=>/^(si|sí|true|yes|1|verdadero)$/i.test(v)).length/n*100:0;}
    return p;
  });
}
function colDesc(p){
  if(p.tipo==='numero') return 'número · mín '+fmtN(p.min)+' · máx '+fmtN(p.max)+' · prom '+fmtN(p.mean);
  if(p.tipo==='fecha') return 'fecha · '+p.fmin+' a '+p.fmax;
  if(p.tipo==='booleano') return 'sí/no · '+Math.round(p.pctTrue)+'% sí';
  if(p.sensible) return 'texto · posible dato personal ('+p.distintos+' distintos)';
  return 'texto · '+p.distintos+' distintos'+(p.distintos<=8&&p.top.length?' · '+p.top.slice(0,3).map(t=>t[0]).join(', '):'');
}

/* ---- valores calculados ---- */
function computeValue(v,p,agg,escala){
  if(!v||!p) return null;
  const lab=(agg?AGG_ES[agg]||agg:'Valor')+' de «'+p.nombre+'» ('+p.n+' filas con dato)';
  const get=k=>({suma:p.sum,promedio:p.mean,mediana:p.median,minimo:p.min,maximo:p.max,ultimo:p.last,conteo:p.n,distintos:p.distintos})[k];
  const r4=x=>Math.round(x*10000)/10000;
  if(v.tipo==='n'||v.tipo==='p'||v.tipo==='e'){
    let x;
    if(p.tipo==='numero') x=get(['frecuentes','moda','rango'].includes(agg)?'promedio':(agg||'promedio'));
    else if(p.tipo==='booleano'&&v.tipo==='p') x=p.pctTrue;
    else if(agg==='conteo') x=p.n;
    else if(agg==='distintos') x=p.distintos;
    else return null;
    if(x==null||!isFinite(x)) return null;
    if(v.tipo==='p'){
      if(p.tipo==='numero'&&(escala==='fraccion'||(escala!=='porcentaje'&&p.min>=0&&p.max<=1&&agg!=='conteo'&&agg!=='distintos'))) x=x*100;
      x=Math.max(0,Math.min(100,x));
    }
    if(v.tipo==='e') x=Math.max(1,Math.min(5,Math.round(x)));
    return {val:r4(x),nota:lab};
  }
  if(v.tipo==='sn'){
    if(p.tipo==='booleano') return {val:p.pctTrue>=50?'Sí':'No',nota:lab};
    const m=p.top[0]&&normT(p.top[0][0]);
    if(/^(si|yes|true|1|verdadero)$/.test(m)) return {val:'Sí',nota:lab};
    if(/^(no|false|0|falso)$/.test(m)) return {val:'No',nota:lab};
    return null;
  }
  if(v.tipo==='c'){
    const mode=p.top[0]?p.top[0][0]:null;if(!mode) return null;
    const o=(v.opts||[]).find(o=>normT(o)===normT(mode));
    return o?{val:o,nota:lab}:null;
  }
  return {val:textSummary(p,agg),nota:lab};
}
function textSummary(p,agg){
  if(p.sensible&&p.tipo==='texto') return p.distintos+' valores distintos en '+p.n+' filas (columna con posibles datos personales: no se guardan los valores)';
  if(p.tipo==='numero') return 'Promedio '+fmtN(p.mean)+' · mín '+fmtN(p.min)+' · máx '+fmtN(p.max)+' · suma '+fmtN(p.sum)+' ('+p.n+' filas)';
  if(p.tipo==='fecha') return 'Del '+p.fmin+' al '+p.fmax+' ('+p.n+' filas)';
  if(p.tipo==='booleano') return Math.round(p.pctTrue)+'% sí ('+p.n+' filas)';
  const tot=p.n||1;
  return p.top.slice(0,agg==='moda'?1:4).map(t=>t[0]+' ('+Math.round(t[1]/tot*100)+'%)').join(', ')+(p.distintos>4?' · '+p.distintos+' valores distintos':'');
}
function fichaValue(v,raw){
  const s=String(raw==null?'':raw).trim();if(!s||!v) return null;
  if(v.tipo==='n'){const x=numParse(s);return x==null?null:{val:x,nota:'valor del archivo'};}
  if(v.tipo==='p'){let x=numParse(s);if(x==null) return null;if(!/%/.test(s)&&x>=0&&x<=1) x*=100;return {val:Math.max(0,Math.min(100,x)),nota:'valor del archivo'};}
  if(v.tipo==='e'){const x=numParse(s);return x==null?null:{val:Math.max(1,Math.min(5,Math.round(x))),nota:'valor del archivo'};}
  if(v.tipo==='sn'){const t=normT(s);if(/^(si|yes|true|1|verdadero)$/.test(t)) return {val:'Sí',nota:'valor del archivo'};if(/^(no|false|0|falso)$/.test(t)) return {val:'No',nota:'valor del archivo'};return null;}
  if(v.tipo==='c'){const o=(v.opts||[]).find(o=>normT(o)===normT(s));return o?{val:o,nota:'valor del archivo'}:null;}
  return {val:s.slice(0,300),nota:'valor del archivo'};
}

/* ---- ficha (variable, valor) ---- */
function guessFicha(){
  if(IMP.prof.length>5||IMP.rows.length<2||IMP.rows.length>400) return null;
  const keyRe=/variable|indicador|concepto|campo|pregunta|atributo|m[eé]trica|rubro|par[aá]metro|[ií]tem|descripci[oó]n/i;
  const valRe=/valor|respuesta|resultado|value|dato/i;
  const keyIx=IMP.prof.findIndex(p=>keyRe.test(p.nombre)&&p.tipo==='texto'&&!p.sensible&&p.distintos>=Math.max(2,p.n*.9));
  if(keyIx<0) return null;
  const vp=IMP.prof.find((p,i)=>i!==keyIx&&valRe.test(p.nombre));
  if(!vp) return null;
  const labels=IMP.rows.map(r=>String(r[keyIx]||'').trim()).filter(Boolean);
  if(labels.some(l=>l.length>80||/@/.test(l))) return null;
  return {keyIx,valueIx:vp.i,labels:[...new Set(labels)].slice(0,200)};
}

/* ---- Claude: propone el mapeo y las preguntas (solo nombres y estadísticas) ---- */
function colSummary(p){
  const o={columna:p.nombre,tipo:p.tipo,no_vacios:p.n,vacios_pct:p.pctVacios,distintos:p.distintos};
  if(p.tipo==='numero'){o.min=p.min;o.max=p.max;o.promedio=Math.round(p.mean*100)/100;o.mediana=p.median;}
  if(p.tipo==='fecha'){o.fecha_min=p.fmin;o.fecha_max=p.fmax;}
  if(p.tipo==='booleano') o.pct_si=Math.round(p.pctTrue);
  if(p.sensible){o.posible_dato_personal=true;}
  else if(p.tipo==='texto'&&p.distintos<=30&&p.distintos<=p.n*.5){o.categorias=[...new Map(p.top).entries()].slice(0,8).map(([v,c])=>({valor:v,pct:Math.round(c/Math.max(1,p.n)*100)}));}
  return o;
}
function impPrompt(){
  const cat=allVars().map(v=>[v.id,v.nombre,SATS[satOf(v)].nombre,DIMS[v.dim],v.nivel,v.tipo].join('|')).join('\n');
  const dims=Object.keys(DIMS).map(d=>d+'='+DIMS[d]).join('; ');
  const cols=IMP.prof.slice(0,150).map(colSummary);
  const fi=IMP.ficha&&!IMP.prof[IMP.ficha.keyIx].sensible?{columna_clave:IMP.prof[IMP.ficha.keyIx].nombre,columna_valor:IMP.prof[IMP.ficha.valueIx].nombre,etiquetas:IMP.ficha.labels}:null;
  return `Eres analista de datos de un modelo de inteligencia organizacional. Te paso el resumen de un archivo CSV de una empresa y el catálogo de variables del modelo. Tu trabajo: decidir a qué variable del catálogo corresponde cada columna, proponer variables nuevas para lo que no encaje, y formular preguntas útiles para quien captura.

REGLAS
- Solo ves nombres de columnas y estadísticas, nunca filas. No inventes datos.
- Usa SOLO ids del catálogo (formato VAR-xxx). Una variable se asigna a una sola columna: la más adecuada. Si ninguna encaja bien, usa null.
- El nivel de la variable es E (empresa), P (producto) o C (cliente / buyer persona). Tenlo en cuenta.
- Para columnas numéricas elige la agregación con sentido: ventas o ingresos → suma; precios, tasas y calificaciones → promedio; fechas no se mapean salvo que haya una variable de fecha; etc. Opciones: ${AGGS.join(', ')}. Para porcentajes indica "escala": "fraccion" si los valores van de 0 a 1, o "porcentaje" si van de 0 a 100.
- Si el archivo parece una ficha (una fila por variable, con columna clave y columna valor), responde forma "ficha" y mapea cada etiqueta.
- Las columnas marcadas posible_dato_personal no deben mapearse a variables de texto que revelen datos personales; si acaso, a conteos o distintos.
- Para las columnas que no encajan en ninguna variable pero son valiosas para el análisis, propón una variable nueva en "nuevas": nombre claro, "dim" (código de un área de la lista de áreas; si dudas usa "IM"), nivel (E, P o C), tipo (t texto, n número, p porcentaje, e escala 1 a 5, sn sí/no), una pregunta concreta y una guía breve de cómo responder para que el dato sirva al análisis.
- Formula hasta 10 preguntas para quien captura: concretas, redactadas en español, sobre lo que el archivo sugiere pero no resuelve (vacíos, cambios bruscos, columnas ambiguas, variables clave que faltan). Enlaza una pregunta con una variable del catálogo SOLO si la respuesta cabe en el tipo de esa variable (número, porcentaje, escala, sí/no, opción o texto); si no, deja variable en null.

ÁREAS (código=nombre): ${dims}

CATÁLOGO (id|variable|corriente|área|nivel|tipo):
${cat}

ARCHIVO: ${IMP.name} · ${IMP.rows.length} filas · ${IMP.prof.length} columnas
RESUMEN DE COLUMNAS:
${JSON.stringify(cols)}
${fi?'POSIBLE FICHA (etiquetas de la columna clave, sin sus valores): '+JSON.stringify(fi):''}

Responde SOLO con JSON con esta forma exacta:
{"forma":"tabla|ficha|otra","resumen":"una o dos frases de qué parece contener el archivo","columnas":[{"columna":"nombre exacto","variable":"VAR-xxx o null","agregacion":"suma|promedio|...","escala":"fraccion|porcentaje|null","confianza":"alta|media|baja","motivo":"una frase"}],"ficha":null o {"columna_clave":"...","columna_valor":"...","etiquetas":[{"etiqueta":"...","variable":"VAR-xxx o null","confianza":"alta|media|baja"}]},"nuevas":[{"columna":"nombre exacto o etiqueta","nombre":"...","dim":"código","nivel":"E|P|C","tipo":"t|n|p|e|sn","agregacion":"...","pregunta":"...","guia":"...","motivo":"..."}],"preguntas":[{"texto":"...","variable":"VAR-xxx o null"}]}`;
}
const CLAUDE_ERR={not_granted:'No diste permiso para usar Claude. Puedes mapear a mano.',rate_limited:'Hay demasiadas solicitudes seguidas. Espera un momento e intenta de nuevo.',invalid_json:'Claude respondió con un formato que no pude leer. Intenta de nuevo o mapea a mano.',aborted:'Se detuvo el análisis.'};
let impCtl=null;
async function impAskClaude(){
  const sample=await (window.claude&&window.claude.use?window.claude.use('sample'):null);
  if(!sample){IMP.msg='Claude no está disponible en esta vista. Mapea las columnas a mano.';IMP.msgKind='warn';impRenderWork();return;}
  IMP.busy=true;IMP.msg='Claude está leyendo el resumen de las columnas…';IMP.msgKind='';impRenderWork();
  impCtl=new AbortController();
  try{
    const plan=await sample.json(impPrompt(),{modelTier:'default',cache:false,signal:impCtl.signal});
    impApplyPlan(plan);IMP.claudeUsed=true;
    IMP.msg='Claude propuso un mapeo. Revísalo: nada se guarda hasta que lo confirmes.';IMP.msgKind='ok';
  }catch(e){
    IMP.msg=CLAUDE_ERR[e&&e.code]||('No se pudo usar Claude: '+msgOf(e));IMP.msgKind='warn';
  }finally{IMP.busy=false;impCtl=null;impRenderWork();}
}
function impApplyPlan(plan){
  if(!plan||typeof plan!=='object') throw {code:'invalid_json'};
  const okAgg=a=>AGGS.includes(a)?a:null;
  const dimOk=d=>(DIMS[d]?d:'IM');
  IMP.resumen=String(plan.resumen||'').slice(0,400);
  IMP.shape=plan.forma==='ficha'&&IMP.ficha?'ficha':'tabla';
  const nuevasByCol=new Map();
  (plan.nuevas||[]).forEach(n=>{if(n&&n.columna) nuevasByCol.set(normT(n.columna),n);});
  if(IMP.shape==='ficha'){
    const f=IMP.ficha,kp=IMP.prof[f.keyIx],vp=IMP.prof[f.valueIx];
    const lab=new Map();((plan.ficha&&plan.ficha.etiquetas)||[]).forEach(x=>{if(x&&x.etiqueta)lab.set(normT(x.etiqueta),x);});
    const seen=new Set();IMP.map=[];
    IMP.rows.forEach(r=>{
      const k=String(r[f.keyIx]||'').trim();if(!k||seen.has(k)) return;seen.add(k);
      const m=lab.get(normT(k));const nv=nuevasByCol.get(normT(k));
      const vid=m&&m.variable&&varById(m.variable)?m.variable:null;
      const row={key:k,kind:'ficha',valorFicha:r[f.valueIx],variable:vid||(nv?'__new':null),incluir:!!(vid||nv),conf:(m&&m.confianza)||(nv?'media':''),motivo:'',agg:null};
      if(nv&&!vid){row.nuevo={nombre:String(nv.nombre||prettify(k)).slice(0,80),dim:dimOk(nv.dim),nivel:['E','P','C'].includes(nv.nivel)?nv.nivel:'E',tipo:['t','n','p','e','sn'].includes(nv.tipo)?nv.tipo:'t',q:String(nv.pregunta||'').slice(0,300),guia:String(nv.guia||'').slice(0,400),aprobar:true};}
      IMP.map.push(row);
    });
  }else{
    const byCol=new Map();(plan.columnas||[]).forEach(c=>{if(c&&c.columna) byCol.set(normT(c.columna),c);});
    IMP.map=IMP.prof.map(p=>{
      const c=byCol.get(normT(p.nombre)),nv=nuevasByCol.get(normT(p.nombre));
      const vid=c&&c.variable&&varById(c.variable)?c.variable:null;
      const row={key:p.nombre,kind:'col',prof:p,variable:vid||(nv?'__new':null),agg:okAgg(c&&c.agregacion)||okAgg(nv&&nv.agregacion)||(p.tipo==='numero'?'promedio':'frecuentes'),escala:(c&&c.escala)||null,incluir:!!(vid||nv),conf:(c&&c.confianza)||(nv?'media':''),motivo:String((c&&c.motivo)||(nv&&nv.motivo)||'').slice(0,200)};
      if(nv&&!vid){row.nuevo={nombre:String(nv.nombre||prettify(p.nombre)).slice(0,80),dim:dimOk(nv.dim),nivel:['E','P','C'].includes(nv.nivel)?nv.nivel:'E',tipo:['t','n','p','e','sn'].includes(nv.tipo)?nv.tipo:'t',q:String(nv.pregunta||'').slice(0,300),guia:String(nv.guia||'').slice(0,400),aprobar:true};}
      if(p.sensible&&row.variable&&row.variable!=='__new'){const v=varById(row.variable);if(v&&v.tipo==='t'){row.agg='distintos';}}
      return row;
    });
  }
  IMP.preguntas=(plan.preguntas||[]).filter(q=>q&&q.texto).slice(0,12).map(q=>({texto:String(q.texto).slice(0,300),variable:q.variable&&varById(q.variable)?q.variable:null,guardar:true}));
}
/* mapeo manual con reglas simples: parecido entre nombre de columna y nombre de variable */
const STOP=new Set(['de','la','el','los','las','del','por','en','y','a','con','para','un','una','o']);
const tok=s=>new Set(normT(s).split(' ').filter(t=>t&&!STOP.has(t)));
function heuristicVar(name){
  const a=tok(name);if(!a.size) return null;
  let best=null,bs=0;
  allVars().forEach(v=>{const b=tok(v.nombre);let i=0;a.forEach(t=>{if(b.has(t))i++;});const j=i/(a.size+b.size-i);if(j>bs){bs=j;best=v.id;}});
  return bs>=.5?best:null;
}
function impManualPlan(){
  IMP.shape=IMP.ficha&&IMP.prof.length<=3?'ficha':'tabla';
  IMP.map=[];
  if(IMP.shape==='ficha'){
    const f=IMP.ficha,seen=new Set();
    IMP.rows.forEach(r=>{const k=String(r[f.keyIx]||'').trim();if(!k||seen.has(k))return;seen.add(k);const vid=heuristicVar(k);IMP.map.push({key:k,kind:'ficha',valorFicha:r[f.valueIx],variable:vid,incluir:!!vid,conf:'',motivo:'',agg:null});});
  }else{
    IMP.map=IMP.prof.map(p=>{const vid=p.sensible?null:heuristicVar(p.nombre);return {key:p.nombre,kind:'col',prof:p,variable:vid,agg:p.tipo==='numero'?'promedio':'frecuentes',escala:null,incluir:!!vid,conf:'',motivo:''};});
  }
  IMP.msg='Mapeo sugerido con reglas simples (parecido de nombres). Ajústalo a mano.';IMP.msgKind='';
}

/* ---- interfaz ---- */
const impFileEl=el('input',{type:'file',accept:'.csv,.tsv,.txt,text/csv,text/plain','aria-label':'Archivo CSV'});
let VAROPTS=null;
function varOptionsTemplate(){
  const sel=el('select');
  sel.append(el('option',{value:'',text:'— sin variable —'}),el('option',{value:'__new',text:'+ Crear variable nueva'}));
  Object.keys(SATS).forEach(k=>{
    const g=el('optgroup',{label:SATS[k].nombre});
    allVars().filter(v=>satOf(v)===k).forEach(v=>g.append(el('option',{value:v.id,text:v.nombre+' · '+(DIMS[v.dim]||'')+' · '+NIVELES[v.nivel]})));
    if(g.children.length) sel.append(g);
  });
  return sel;
}
function impStatus(){return IMP.msg?el('div',{class:'impmsg '+(IMP.msgKind||''),role:'status'},IMP.msg):null;}
function impRenderDest(){
  const box=$('#imp-dest');if(!box) return;
  const emps=nodesOf('EMP');
  if(!IMP.emp&&S.ctx.emp&&S.nodes[S.ctx.emp]){IMP.emp=S.ctx.emp;IMP.prd=S.ctx.prd||'';}
  const se=el('select',{'aria-label':'Empresa destino',onchange:e=>{IMP.emp=e.target.value;IMP.prd='';IMP.cli='';impRenderDest();}},
    el('option',{value:'',text:emps.length?'Elige la empresa…':'Primero crea una empresa en Capturar'}),...emps.map(e=>el('option',{value:e.id,text:e.nombre})));
  se.value=IMP.emp&&S.nodes[IMP.emp]?IMP.emp:'';
  const prds=IMP.emp?nodesOf('PRD').filter(p=>p.padre===IMP.emp):[];
  const sp=el('select',{'aria-label':'Producto destino',onchange:e=>{IMP.prd=e.target.value;impRenderWork();}},
    el('option',{value:'',text:'Sin producto (solo empresa y cliente)'}),...prds.map(p=>el('option',{value:p.id,text:p.nombre})));
  sp.value=IMP.prd&&S.nodes[IMP.prd]?IMP.prd:'';sp.disabled=!IMP.emp;
  const clisI=IMP.emp?clisOf(IMP.emp):[];
  const sc=el('select',{'aria-label':'Segmento de cliente destino',onchange:e=>{IMP.cli=e.target.value;impRenderWork();}},
    ...clisI.map(c=>el('option',{value:c.id,text:'Cliente: '+segLabel(c)})));
  if(!IMP.cli||!S.nodes[IMP.cli]||S.nodes[IMP.cli].padre!==IMP.emp) IMP.cli=clisI[0]?clisI[0].id:'';
  sc.value=IMP.cli;sc.disabled=!IMP.emp||!clisI.length;
  box.replaceChildren(el('h3',{style:'font-size:16px',text:'1. ¿De qué empresa es la información?'}),
    el('p',{class:'empty',style:'margin:4px 0 10px',text:'Cada dato se guarda en el nodo que le corresponde por su nivel: la empresa, su cliente o el producto elegido.'}),
    el('div',{class:'filters'},se,sp,sc));
}
function impRenderWork(){
  const box=$('#imp-work');if(!box) return;
  const kids=[];
  kids.push(el('h3',{style:'font-size:16px',text:'2. Sube el archivo'}),
    el('p',{class:'empty',style:'margin:4px 0 10px',text:'CSV de cualquier forma (tabla con muchas filas o ficha de variable y valor; separador coma, punto y coma, tabulador o barra). Se lee en tu navegador. Las filas no se guardan: solo los valores calculados.'}));
  const hdr=el('label',{style:'display:flex;gap:6px;align-items:center;font-size:13px;color:var(--muted)'},el('input',{type:'checkbox',checked:IMP.header,onchange:e=>{IMP.header=e.target.checked;if(IMP._file) impLoad(IMP._file);}}),'La primera fila son encabezados');
  kids.push(el('div',{class:'filters'},impFileEl,hdr));
  const st=impStatus();if(st) kids.push(st);
  if(IMP.prof.length){
    kids.push(el('h3',{style:'font-size:16px;margin-top:18px',text:'3. Qué contiene «'+IMP.name+'»'}),
      el('p',{class:'empty',style:'margin:4px 0 10px',text:IMP.rows.length.toLocaleString('es-MX')+' filas · '+IMP.prof.length+' columnas'+(IMP.periodo?' · periodo detectado '+IMP.periodo:'')+(IMP.resumen?' · '+IMP.resumen:'')}));
    const t=el('table',{class:'tbl'});
    t.append(el('thead',null,el('tr',null,['Columna','Qué contiene','Vacíos'].map(h=>el('th',{text:h})))));
    const b=el('tbody');
    IMP.prof.slice(0,60).forEach(p=>b.append(el('tr',null,el('td',{text:p.nombre}),el('td',{text:colDesc(p)}),el('td',{class:'num',text:p.pctVacios+'%'}))));
    t.append(b);
    kids.push(el('div',{class:'card scroll',style:'max-height:260px'},t));
    if(IMP.prof.length>60) kids.push(el('p',{class:'empty',text:'Se muestran las primeras 60 columnas.'}));
    const sensibles=IMP.prof.filter(p=>p.sensible).map(p=>p.nombre);
    if(sensibles.length) kids.push(el('div',{class:'impmsg warn',text:'Posibles datos personales en: '+sensibles.join(', ')+'. De esas columnas no se envían valores a Claude ni se guardan; solo conteos.'}));
    kids.push(el('div',{class:'row2'},
      el('button',{class:'btn main',type:'button',disabled:IMP.busy||!IMP.emp,onclick:impAskClaude,text:IMP.busy?'Claude está leyendo…':'Que Claude proponga el mapeo y las preguntas'}),
      IMP.busy?el('button',{class:'btn',type:'button',onclick:()=>{if(impCtl)impCtl.abort();},text:'Detener'}):el('button',{class:'btn',type:'button',disabled:!IMP.emp,onclick:()=>{impManualPlan();impRenderWork();},text:'Mapear a mano, con sugerencias simples'}),
      !IMP.emp?el('span',{class:'res bad',text:'Elige primero la empresa.'}):null));
    kids.push(el('p',{class:'empty',style:'margin-top:6px',text:'Claude solo recibe nombres de columnas y estadísticas (en columnas de texto con valores repetidos y pocas categorías, las categorías y su frecuencia), nunca filas.'+(IMP.ficha?' Como el archivo parece una ficha, también recibirá las etiquetas de la columna «'+IMP.prof[IMP.ficha.keyIx].nombre+'» (los nombres de las variables, sin sus valores).':'')+' Te pedirá permiso la primera vez.'}));
  }
  if(IMP.map.length) kids.push(...impMapUI());
  box.replaceChildren(...kids.filter(Boolean));
}
function impPreviewText(row){
  const v=impVarObj(row);if(!v) return '—';
  const r=row.kind==='ficha'?fichaValue(v,row.valorFicha):computeValue(v,row.prof,row.agg,row.escala);
  if(!r) return 'no se puede calcular con esta variable';
  return String(r.val);
}
function impVarObj(row){
  if(row.variable==='__new'){const n=row.nuevo||(row.nuevo=impNewDefault(row));return {id:'__new',nombre:n.nombre,tipo:n.tipo,nivel:n.nivel,opts:null};}
  return row.variable?varById(row.variable):null;
}
function impNewDefault(row){
  const p=row.prof;
  const tipo=p?(p.tipo==='numero'?'n':p.tipo==='booleano'?'sn':'t'):'t';
  return {nombre:prettify(row.key),dim:'IM',nivel:'E',tipo,q:'',guia:'',aprobar:true};
}
function impMapUI(){
  const out=[];
  if(!VAROPTS) VAROPTS=varOptionsTemplate();
  out.push(el('h3',{style:'font-size:16px;margin-top:20px',text:'4. Revisa el mapeo'}),
    el('p',{class:'empty',style:'margin:4px 0 10px',text:IMP.shape==='ficha'?'Cada fila del archivo es una variable. Elige a cuál corresponde y confirma el valor que se guardaría.':'Elige a qué variable corresponde cada columna y cómo resumirla. Las filas marcadas son las que se guardarán.'}));
  const t=el('table',{class:'tbl'});
  const showAgg=IMP.shape!=='ficha';
  t.append(el('thead',null,el('tr',null,['Guardar',IMP.shape==='ficha'?'Etiqueta':'Columna',IMP.shape==='ficha'?'Valor en el archivo':'Qué contiene','Variable',showAgg?'Cómo resumirla':null,'Valor que se guardaría','Confianza'].filter(Boolean).map(h=>el('th',{text:h})))));
  const b=el('tbody');
  IMP.map.forEach(row=>{
    const prev=el('td',{class:'mono',text:impPreviewText(row)});
    const chk=el('input',{type:'checkbox',checked:row.incluir,'aria-label':'Guardar '+row.key,onchange:e=>{row.incluir=e.target.checked;impRenderNuevas();}});
    const sel=VAROPTS.cloneNode(true);sel.value=row.variable||'';
    sel.setAttribute('aria-label','Variable para '+row.key);
    sel.addEventListener('change',e=>{
      row.variable=e.target.value||null;
      if(row.variable==='__new'&&!row.nuevo) row.nuevo=impNewDefault(row);
      if(row.variable) row.incluir=true;
      chk.checked=row.incluir;
      prev.textContent=impPreviewText(row);impRenderNuevas();
    });
    let aggCell=null;
    if(showAgg){
      const ag=el('select',{'aria-label':'Resumen de '+row.key},...AGGS.map(a=>el('option',{value:a,text:AGG_ES[a]})));
      ag.value=row.agg||'promedio';
      ag.addEventListener('change',e=>{row.agg=e.target.value;prev.textContent=impPreviewText(row);});
      aggCell=el('td',null,ag);
    }
    b.append(el('tr',null,el('td',null,chk),el('td',{text:row.key}),
      el('td',{text:row.kind==='ficha'?String(row.valorFicha==null?'':row.valorFicha).slice(0,80):colDesc(row.prof)}),
      el('td',null,sel),aggCell,prev,el('td',{title:row.motivo||'',text:row.conf||'—'})));
  });
  t.append(b);
  out.push(el('div',{class:'card scroll',style:'max-height:420px'},t));
  out.push(el('div',{id:'imp-nuevas'}));
  out.push(el('div',{id:'imp-preg'}));
  out.push(el('div',{id:'imp-save'}));
  setTimeout(()=>{impRenderNuevas();impRenderPreg();impRenderSave();},0);
  return out;
}
function impRenderNuevas(){
  const box=$('#imp-nuevas');if(!box) return;
  const rows=IMP.map.filter(r=>r.variable==='__new'&&r.incluir);
  if(!rows.length){box.replaceChildren();return;}
  const dimSel=()=>{const s=el('select');Object.keys(SATS).forEach(k=>{const g=el('optgroup',{label:SATS[k].nombre});SATS[k].dims.forEach(d=>{if(DIMS[d]) g.append(el('option',{value:d,text:d+' · '+DIMS[d]}));});s.append(g);});return s;};
  const t=el('table',{class:'tbl'});
  t.append(el('thead',null,el('tr',null,['Crear','Columna','Nombre de la variable','Área','Se llena en','Respuesta','Pregunta y guía'].map(h=>el('th',{text:h})))));
  const b=el('tbody');
  rows.forEach(r=>{
    const n=r.nuevo;
    const ap=el('input',{type:'checkbox',checked:n.aprobar!==false,'aria-label':'Crear variable '+n.nombre,onchange:e=>{n.aprobar=e.target.checked;}});
    const nm=el('input',{type:'text',value:n.nombre,maxlength:80,'aria-label':'Nombre',onchange:e=>{n.nombre=e.target.value.trim()||prettify(r.key);}});
    const ds=dimSel();ds.value=DIMS[n.dim]?n.dim:'IM';ds.addEventListener('change',e=>{n.dim=e.target.value;});
    const nv=el('select',null,el('option',{value:'E',text:'Empresa'}),el('option',{value:'P',text:'Producto'}),el('option',{value:'C',text:'Cliente'}));nv.value=n.nivel;nv.addEventListener('change',e=>{n.nivel=e.target.value;});
    const tp=el('select',null,...Object.entries({t:'Texto',n:'Número',p:'Porcentaje',e:'Escala 1 a 5',sn:'Sí / No'}).map(([k,v])=>el('option',{value:k,text:v})));tp.value=n.tipo;tp.addEventListener('change',e=>{n.tipo=e.target.value;impRenderWork();});
    const q=el('input',{type:'text',value:n.q,placeholder:'Pregunta (opcional)',maxlength:300,'aria-label':'Pregunta',onchange:e=>{n.q=e.target.value;}});
    const g=el('input',{type:'text',value:n.guia,placeholder:'Guía de respuesta (opcional)',maxlength:400,'aria-label':'Guía',onchange:e=>{n.guia=e.target.value;}});
    b.append(el('tr',null,el('td',null,ap),el('td',{text:r.key}),el('td',null,nm),el('td',null,ds),el('td',null,nv),el('td',null,tp),el('td',null,el('div',{class:'stack',style:'gap:6px;min-width:260px'},q,g))));
  });
  t.append(b);
  box.replaceChildren(el('h3',{style:'font-size:16px;margin-top:20px',text:'5. Variables nuevas propuestas'}),
    el('p',{class:'empty',style:'margin:4px 0 10px',text:'Estas columnas no encajan en ninguna variable del catálogo. Si las apruebas, se crean como variables nuevas, disponibles solo para esta empresa. Corrige el nombre y el área si hace falta.'}),
    el('div',{class:'card scroll'},t),
    el('label',{style:'display:flex;gap:6px;align-items:center;font-size:13px;color:var(--muted);margin-top:8px'},el('input',{type:'checkbox',checked:IMP.todas===true,onchange:e=>{IMP.todas=e.target.checked;}}),'Dejarlas disponibles para todas las empresas'));
}
function impRenderPreg(){
  const box=$('#imp-preg');if(!box) return;
  if(!IMP.preguntas.length){box.replaceChildren();return;}
  box.replaceChildren(el('h3',{style:'font-size:16px;margin-top:20px',text:'6. Preguntas que formuló Claude'}),
    el('p',{class:'empty',style:'margin:4px 0 10px',text:'Quedan como preguntas abiertas de la empresa. Las respondes en el chat, y cada respuesta se guarda como dato.'}),
    el('div',{class:'stack',style:'gap:6px'},...IMP.preguntas.map(q=>{
      const v=q.variable?varById(q.variable):null;
      return el('label',{style:'display:flex;gap:8px;align-items:flex-start;font-size:14px'},el('input',{type:'checkbox',checked:q.guardar,onchange:e=>{q.guardar=e.target.checked;}}),
        el('span',null,q.texto,v?el('span',{class:'dimtag',text:'  → '+v.nombre}):null));
    })));
}
function impRenderSave(){
  const box=$('#imp-save');if(!box) return;
  const sel=IMP.map.filter(r=>r.incluir&&r.variable);
  const sinProd=sel.filter(r=>{const v=impVarObj(r);return v&&v.nivel==='P'&&!IMP.prd;}).length;
  box.replaceChildren(el('div',{class:'row2',style:'margin-top:18px'},
    el('button',{class:'btn main',type:'button',id:'imp-go',disabled:IMP.busy||!IMP.emp||!sel.length,onclick:impSave,text:'Guardar '+sel.length+(sel.length===1?' dato':' datos')+' en la base'}),
    sinProd?el('span',{class:'res bad',text:sinProd+' son de nivel producto y no elegiste producto: se omitirán.'}):null),
    ...(IMP.saved?[el('div',{class:'impmsg ok'},IMP.saved)]:[]));
}

/* ---- carga ---- */
async function impLoad(file){
  IMP._file=file;IMP.saved=null;IMP.map=[];IMP.preguntas=[];IMP.resumen='';IMP.claudeUsed=false;
  try{
    if(file.size>15*1024*1024) throw new Error('El archivo pesa más de 15 MB.');
    let text=await readText(file,'utf-8');
    if(text.includes('\uFFFD')) text=await readText(file,'windows-1252');
    const parsed=parseCSV(text);
    if(parsed.rows.length<2&&!(parsed.rows.length===1&&!IMP.header)) throw new Error('El archivo no tiene filas de datos.');
    const width=Math.max(...parsed.rows.slice(0,50).map(r=>r.length));
    let headers,data;
    if(IMP.header){headers=parsed.rows[0].map((h,i)=>String(h).trim()||'columna '+(i+1));data=parsed.rows.slice(1);}
    else{headers=Array.from({length:width},(_,i)=>'columna '+(i+1));data=parsed.rows;}
    const seen={};headers=headers.map(h=>{seen[h]=(seen[h]||0)+1;return seen[h]>1?h+' ('+seen[h]+')':h;});
    data=data.map(r=>{const x=r.slice(0,headers.length);while(x.length<headers.length)x.push('');return x;});
    IMP.name=file.name;IMP.size=file.size;IMP.headers=headers;IMP.rows=data;
    IMP.prof=profileColumns(headers,data);
    IMP.ficha=guessFicha();
    const dc=IMP.prof.find(p=>p.tipo==='fecha'&&p.fmax);
    IMP.periodo=dc?dc.fmax.slice(0,7):'';
    IMP.msg='Archivo leído (separador «'+(parsed.delim==='\t'?'tabulador':parsed.delim)+'»).';IMP.msgKind='ok';
  }catch(e){
    IMP.prof=[];IMP.rows=[];IMP.msg='No se pudo leer el archivo: '+msgOf(e);IMP.msgKind='warn';
  }
  impRenderWork();
}
impFileEl.addEventListener('change',()=>{const f=impFileEl.files&&impFileEl.files[0];if(f) impLoad(f);});

/* ---- guardado ---- */
async function mintBlock(prefix,width,count,opt={}){
  const base=opt.base||0;
  if(S.mem){const out=[];for(let i=0;i<count;i++){const n=(S.memC[prefix]!=null?S.memC[prefix]:base)+1;S.memC[prefix]=n;out.push(fmtId(prefix,n,width,opt.noCheck));}return out;}
  const ref=S.db.doc('counters/'+prefix);
  for(let i=0;i<7;i++){
    const r=await ref.acquire({holder:S.uid||S.holder,ttlMs:2000});
    if(r.acquired){
      const snap=await ref.get();
      const cur=snap.exists&&typeof snap.data().n==='number'?snap.data().n:base;
      const n=cur+count;
      if(snap.exists){try{await ref.update({n});}catch(e){await ref.set({n});}}else{await ref.set({n});}
      return Array.from({length:count},(_,k)=>fmtId(prefix,cur+1+k,width,opt.noCheck));
    }
    await sleep(500+Math.random()*600);
  }
  throw new Error('No se pudieron reservar los IDs. Intenta de nuevo.');
}
const VARJUMP=n=>n>=201&&n<1001?1001:n;
function nodeForImp(v){
  if(!v) return null;
  if(v.nivel==='E') return IMP.emp;
  if(v.nivel==='C'){const c=IMP.cli&&S.nodes[IMP.cli]&&S.nodes[IMP.cli].padre===IMP.emp?S.nodes[IMP.cli]:clisOf(IMP.emp)[0];return c&&appliesTo(v,c.tipoCliente)?c.id:null;}
  return IMP.prd||null;
}
async function impSave(){
  if(IMP.busy||!IMP.emp) return;
  const emp=S.nodes[IMP.emp];if(!emp) return;
  IMP.busy=true;IMP.saved=null;impRenderSave();
  const prog=t=>{IMP.msg=t;IMP.msgKind='';const m=document.querySelector('#imp-work .impmsg');if(m){m.textContent=t;m.className='impmsg';}else impRenderWork();};
  try{
    await ensureCli(emp,'');
    const rows=IMP.map.filter(r=>r.incluir&&r.variable);
    /* 1) variables nuevas aprobadas */
    const nuevasRows=rows.filter(r=>r.variable==='__new'&&r.nuevo&&r.nuevo.aprobar!==false);
    const impId=(await mintBlock('IMP',4,1))[0];
    const newIds=[];
    for(const r of nuevasRows){
      const n=r.nuevo;
      const id=await mintId('VAR',3,{noCheck:true,base:60,jump:VARJUMP});
      await put('catalog',id,{id,dim:DIMS[n.dim]?n.dim:'IM',nombre:n.nombre,nivel:n.nivel,fuente:'I',tipo:n.tipo,q:n.q||'¿Cuál es el valor de «'+n.nombre+'»? Indica unidad y periodo.',guia:n.guia||'Registra el dato con su unidad y periodo, y de dónde sale.',hint:'Importada de '+IMP.name,opts:null,emp:IMP.todas?null:IMP.emp,origen:impId,creado:nowIso(),por:S.uid||null});
      r.variable=id;newIds.push(id);
    }
    /* 2) valores */
    const items=[];let omitidas=0,sinNodo=0;
    rows.forEach(r=>{
      if(r.variable==='__new'){omitidas++;return;}
      const v=varById(r.variable);if(!v){omitidas++;return;}
      const nodo=nodeForImp(v);if(!nodo){sinNodo++;return;}
      const res=r.kind==='ficha'?fichaValue(v,r.valorFicha):computeValue(v,r.prof,r.agg,r.escala);
      if(!res){omitidas++;return;}
      items.push({v,nodo,res,key:r.key});
    });
    const periodo=IMP.periodo||new Date().toISOString().slice(0,7);
    const ids=items.length?await mintBlock('OBS',6,items.length):[];
    const catv=allVars().length,obsIds=[];
    for(let i=0;i<items.length;i+=10){
      prog('Guardando datos '+Math.min(i+10,items.length)+' de '+items.length+'…');
      await Promise.all(items.slice(i,i+10).map((it,j)=>{
        const id=ids[i+j];obsIds.push(id);
        return put('obs',id,{id,nodo:it.nodo,variable:it.v.id,valor:it.res.val,no_aplica:false,fuente:'Archivo',confianza:'Media',periodo,capturado:nowIso(),por:S.uid||null,catv,vver:it.v.vver||1,
          nota:'Importado de «'+IMP.name+'»: '+it.res.nota,origen:impId});
      }));
    }
    /* 3) registro de la importación */
    await put('nodes',impId,{id:impId,tipo:'IMP',nombre:IMP.name,padre:emp.id,prd:IMP.prd||null,archivo:IMP.name,filas:IMP.rows.length,columnas:IMP.prof.length,forma:IMP.shape,resumen:IMP.resumen,claude:IMP.claudeUsed,periodo,
      mapeo:rows.slice(0,200).map(r=>({k:r.key,v:r.variable,a:r.agg||null})),nuevas:newIds,obs:obsIds.slice(0,500),omitidas,sin_nodo:sinNodo,creado:nowIso(),por:S.uid||null});
    /* 4) preguntas abiertas */
    const pq=IMP.preguntas.filter(q=>q.guardar);
    if(pq.length){
      const pids=await mintBlock('PRE',4,pq.length);
      for(let i=0;i<pq.length;i++){
        const q=pq[i];
        await put('nodes',pids[i],{id:pids[i],tipo:'PRE',nombre:trunc(q.texto,70),padre:emp.id,prd:IMP.prd||null,texto:q.texto,variable:q.variable||null,imp:impId,estado:'abierta',creado:nowIso(),por:S.uid||null});
      }
    }
    IMP.saved='Listo: '+impId+' · '+obsIds.length+(obsIds.length===1?' dato guardado':' datos guardados')+(newIds.length?' · '+newIds.length+(newIds.length===1?' variable nueva':' variables nuevas'):'')+(pq.length?' · '+pq.length+(pq.length===1?' pregunta abierta':' preguntas abiertas'):'')+(omitidas?' · '+omitidas+' omitidos por no poder calcularse':'')+(sinNodo?' · '+sinNodo+' sin nodo destino (elige un producto)':'')+'.';
    IMP.msg='';IMP.map=[];IMP.prof=[];IMP.rows=[];IMP.preguntas=[];IMP._file=null;impFileEl.value='';
  }catch(e){
    IMP.saved=null;IMP.msg='No se pudo guardar: '+msgOf(e)+'. Revisa que tengas permiso de edición.';IMP.msgKind='warn';
  }finally{
    IMP.busy=false;impRenderWork();impRenderSave_after();scheduleRender();
  }
}
function impRenderSave_after(){
  const box=$('#imp-work');if(!box||!IMP.saved) return;
  const goChat=nodesOf('PRE').some(p=>p.padre===IMP.emp&&p.estado==='abierta');
  box.append(el('div',{class:'impmsg ok',style:'margin-top:14px'},IMP.saved),
    el('div',{class:'row2'},
      goChat?el('button',{class:'btn main',type:'button',onclick:()=>{S.ctx.emp=IMP.emp;S.ctx.prd=IMP.prd||null;setTab('capture');startPre();},text:'Responder las preguntas en el chat'}):null,
      el('button',{class:'btn',type:'button',onclick:()=>{IMP.saved=null;impRenderWork();},text:'Importar otro archivo'})));
}

/* ---- historial ---- */
function impRenderHist(){
  const box=$('#imp-hist');if(!box) return;
  const imps=nodesOf('IMP').sort((a,b)=>String(b.creado).localeCompare(String(a.creado)));
  const pres=nodesOf('PRE').sort((a,b)=>String(b.creado).localeCompare(String(a.creado)));
  const t1=el('table',{class:'tbl'});
  t1.append(el('thead',null,el('tr',null,['Importación','Archivo','Empresa','Forma','Filas','Datos','Variables nuevas','Fecha','Subió'].map(h=>el('th',{text:h})))));
  const b1=el('tbody');
  if(!imps.length) b1.append(el('tr',null,el('td',{colspan:9,class:'empty',text:'Todavía no hay importaciones.'})));
  imps.forEach(n=>{const e=empOfNode(n);b1.append(el('tr',null,el('td',{class:'mono',text:n.id}),el('td',{text:n.archivo}),el('td',{text:e?e.nombre:'—'}),el('td',{text:n.forma}),el('td',{class:'num',text:n.filas}),el('td',{class:'num',text:(n.obs||[]).length}),el('td',{class:'num',text:(n.nuevas||[]).length}),el('td',{text:n.creado?new Date(n.creado).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'}):''}),el('td',{text:capName(n.por)})));});
  t1.append(b1);
  const t2=el('table',{class:'tbl'});
  t2.append(el('thead',null,el('tr',null,['Pregunta','Empresa','Texto','Variable','Estado'].map(h=>el('th',{text:h})))));
  const b2=el('tbody');
  if(!pres.length) b2.append(el('tr',null,el('td',{colspan:5,class:'empty',text:'Todavía no hay preguntas abiertas.'})));
  pres.forEach(n=>{const e=empOfNode(n),v=n.variable?varById(n.variable):null;b2.append(el('tr',null,el('td',{class:'mono',text:n.id}),el('td',{text:e?e.nombre:'—'}),el('td',{text:n.texto}),el('td',{text:v?v.nombre:'—'}),el('td',{text:n.estado==='respondida'?'respondida':n.estado==='abierta'?'abierta':n.estado})));});
  t2.append(b2);
  box.replaceChildren(el('h3',{style:'font-size:16px;margin-top:26px',text:'Importaciones anteriores'}),el('div',{class:'card scroll',style:'margin-top:8px'},t1),
    el('h3',{style:'font-size:16px;margin-top:20px',text:'Preguntas abiertas'}),el('div',{class:'card scroll',style:'margin-top:8px'},t2));
}
let impReady=false;
function renderImp(){
  if(!impReady){impReady=true;impRenderDest();impRenderWork();}
  else{
    /* refresco ligero: destinos y variables, sin tocar lo que el usuario está editando */
    const emps=nodesOf('EMP').map(e=>e.id+e.nombre).join('|');
    if(IMP._empSig!==emps){IMP._empSig=emps;impRenderDest();}
    const vs=Object.keys(S.custom).length;
    if(IMP._vcount!==vs){IMP._vcount=vs;VAROPTS=null;}
  }
  impRenderHist();
}

/* ---- preguntas abiertas en el chat ---- */
function startPre(){
  const E=S.ctx.emp&&S.nodes[S.ctx.emp];
  if(!E){chooseEmpresa();return;}
  const pend=nodesOf('PRE').filter(p=>p.padre===E.id&&p.estado==='abierta');
  if(!pend.length){menu('No hay preguntas abiertas de '+E.nombre+'.');return;}
  S.queue=[];S.then=null;S.curSat=null;
  say('Hay '+pend.length+(pend.length===1?' pregunta abierta':' preguntas abiertas')+' de '+E.nombre+', que salieron de los archivos importados.');
  nextPre();
}
function nextPre(){
  const E=S.ctx.emp&&S.nodes[S.ctx.emp];if(!E) return;
  const pend=nodesOf('PRE').filter(p=>p.padre===E.id&&p.estado==='abierta'&&!(S._preSkip||new Set()).has(p.id));
  if(!pend.length){S._preSkip=new Set();menu('Terminamos las preguntas abiertas.');return;}
  const p=pend[0];
  const v=p.variable?varById(p.variable):null;
  const nid=v?nodeForVar(v):null;
  if(v&&nid){
    S.dimMode=null;S.phase='single';S.queue=[{vid:v.id,nodeId:nid,qx:p.texto,preId:p.id}];
    S.then=()=>nextPre();
    divider('Pregunta abierta '+p.id);
    askVar();
  }else{
    askText(p.texto,'Tu respuesta',t=>{
      if(!t){(S._preSkip||(S._preSkip=new Set())).add(p.id);nextPre();return;}
      put('nodes',p.id,{...p,estado:'respondida',respuesta:t,respondida:nowIso(),respondio:S.uid||null}).catch(()=>{});
      nextPre();
    },{optional:true});
  }
}

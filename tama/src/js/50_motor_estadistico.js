/* ===================== Motor estadístico ===================== */
/* ---- matemáticas ---- */
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
const sdev=a=>{if(a.length<2)return 0;const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)*(x-m),0)/(a.length-1));};
const medianOf=a=>{const s=[...a].sort((x,y)=>x-y),n=s.length;return n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2;};
function pearson(x,y){
  const n=x.length;if(n<3) return null;
  const mx=mean(x),my=mean(y);let sxy=0,sxx=0,syy=0;
  for(let i=0;i<n;i++){const dx=x[i]-mx,dy=y[i]-my;sxy+=dx*dy;sxx+=dx*dx;syy+=dy*dy;}
  if(sxx===0||syy===0) return null;
  return sxy/Math.sqrt(sxx*syy);
}
function ranksOf(a){
  const idx=a.map((v,i)=>[v,i]).sort((p,q)=>p[0]-q[0]),r=Array(a.length);let i=0;
  while(i<idx.length){let j=i;while(j+1<idx.length&&idx[j+1][0]===idx[i][0])j++;const rk=(i+j)/2+1;for(let k=i;k<=j;k++)r[idx[k][1]]=rk;i=j+1;}
  return r;
}
const spearman=(x,y)=>pearson(ranksOf(x),ranksOf(y));
function lgamma(x){
  const c=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5];
  let y=x,t=x+5.5;t-=(x+.5)*Math.log(t);let s=1.000000000190015;for(let j=0;j<6;j++)s+=c[j]/++y;
  return -t+Math.log(2.5066282746310005*s/x);
}
function betacf(a,b,x){
  const qab=a+b,qap=a+1,qam=a-1;let c=1,d=1-qab*x/qap;if(Math.abs(d)<1e-30)d=1e-30;d=1/d;let h=d;
  for(let m=1;m<=300;m++){
    const m2=2*m;let aa=m*(b-m)*x/((qam+m2)*(a+m2));
    d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;h*=d*c;
    aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));
    d=1+aa*d;if(Math.abs(d)<1e-30)d=1e-30;c=1+aa/c;if(Math.abs(c)<1e-30)c=1e-30;d=1/d;
    const del=d*c;h*=del;if(Math.abs(del-1)<1e-10)break;
  }
  return h;
}
function betai(a,b,x){
  if(x<=0) return 0;if(x>=1) return 1;
  const bt=Math.exp(lgamma(a+b)-lgamma(a)-lgamma(b)+a*Math.log(x)+b*Math.log(1-x));
  return x<(a+1)/(a+b+2)?bt*betacf(a,b,x)/a:1-bt*betacf(b,a,1-x)/b;
}
const tP2=(t,df)=>betai(df/2,.5,df/(df+t*t));
function tCdf(t,df){const p=tP2(Math.abs(t),df)/2;return t>0?1-p:p;}
function tQuant(p,df){let lo=-60,hi=60;for(let i=0;i<90;i++){const mid=(lo+hi)/2;if(tCdf(mid,df)<p)lo=mid;else hi=mid;}return (lo+hi)/2;}
function invertM(M){
  const n=M.length,A=M.map((r,i)=>[...r,...Array.from({length:n},(_,j)=>i===j?1:0)]);
  for(let c=0;c<n;c++){
    let p=c;for(let r=c+1;r<n;r++) if(Math.abs(A[r][c])>Math.abs(A[p][c])) p=r;
    if(Math.abs(A[p][c])<1e-10) return null;
    [A[c],A[p]]=[A[p],A[c]];const d=A[c][c];for(let j=0;j<2*n;j++) A[c][j]/=d;
    for(let r=0;r<n;r++){if(r===c) continue;const f=A[r][c];for(let j=0;j<2*n;j++) A[r][j]-=f*A[c][j];}
  }
  return A.map(r=>r.slice(n));
}
function olsFit(X,y){
  const n=y.length,k=X[0].length+1,A=X.map(r=>[1,...r]);
  const XtX=Array.from({length:k},()=>Array(k).fill(0)),Xty=Array(k).fill(0);
  for(let i=0;i<n;i++) for(let a=0;a<k;a++){Xty[a]+=A[i][a]*y[i];for(let b=0;b<k;b++) XtX[a][b]+=A[i][a]*A[i][b];}
  const inv=invertM(XtX);if(!inv) return null;
  const beta=inv.map(r=>r.reduce((s,v,j)=>s+v*Xty[j],0));
  const fit=A.map(r=>r.reduce((s,v,j)=>s+v*beta[j],0));
  const sse=y.reduce((s,v,i)=>s+(v-fit[i])*(v-fit[i]),0),my=mean(y),sst=y.reduce((s,v)=>s+(v-my)*(v-my),0);
  const df=n-k;if(df<=0) return null;
  const s2=sse/df,se=inv.map((r,i)=>Math.sqrt(Math.max(0,s2*r[i])));
  const t=beta.map((b,i)=>se[i]>0?b/se[i]:Infinity),p=t.map(v=>isFinite(v)?tP2(v,df):0);
  const r2=sst>0?1-sse/sst:0,adj=1-(1-r2)*(n-1)/df;
  const F=r2>=1?Infinity:(r2/(k-1))/((1-r2)/df),pF=isFinite(F)?betai(df/2,(k-1)/2,df/(df+(k-1)*F)):0;
  return {beta,se,t,p,r2,adj,n,df,F,pF,rmse:Math.sqrt(s2)};
}

/* ---- configuración (roles y umbrales), guardada como un nodo más ---- */
const UMB0={nCorr:8,obsPorVar:10,minPerfiles:15,periodosPron:6,alfa:.05,efecto:.5,simCross:.6,minPares:3,ajustar:true};
function cfg(){const n=S.nodes['CFG-MOTOR'];return {umb:{...UMB0,...((n&&n.umbrales)||{})},roles:(n&&n.roles)||{}};}
const DEP_RE=/ingres|margen|utilidad|ebitda|recompra|churn|abandono|nps|participaci|share|satisfacci|ltv|retorno|roe\b|roa\b|roic|ventas|conversi|lealtad|crecimiento/i;
function roleOf(v){
  const c=cfg().roles[v.id];if(c) return c;
  return DEP_RE.test(v.nombre)?'dep':'ind';
}
const ROLE_ES={dep:'Dependiente',ind:'Independiente',ctl:'Control',ign:'Ignorar'};
function numericVal(v,rec){
  if(!rec||rec.no_aplica) return null;
  if(v.tipo==='n'||v.tipo==='p'||v.tipo==='e'){const x=typeof rec.valor==='number'?rec.valor:numParse(rec.valor);return x==null||!isFinite(x)?null:x;}
  if(v.tipo==='sn') return rec.valor==='Sí'?1:rec.valor==='No'?0:null;
  return null;
}
const NUMT=['n','p','e','sn'];

/* ---- tablas de análisis ---- */
function xsData(level){
  const units=nodesOf(level),vars=allVars().filter(v=>NUMT.includes(v.tipo)&&roleOf(v)!=='ign');
  const rows=units.map(u=>{
    const emp=empOfNode(u),vals={},obs={};
    vars.forEach(v=>{
      let nid=null;
      if(v.nivel==='E') nid=emp&&emp.id;
      else if(v.nivel==='C') nid=u.tipo==='CLI'?u.id:null;
      else if(u.tipo==='PRD') nid=u.id;
      if(!nid) return;
      if(v.emp&&(!emp||v.emp!==emp.id)) return;
      const rec=latest(nid,v.id),x=numericVal(v,rec);
      if(x!=null){vals[v.id]=x;obs[v.id]=rec.id;}
    });
    return {u,emp,vals,obs};
  });
  const cols={};
  vars.forEach(v=>{const n=rows.reduce((a,r)=>a+(r.vals[v.id]!=null?1:0),0);if(n>0) cols[v.id]={v,n};});
  return {level,rows,cols};
}
function scanPairs(D){
  const ids=Object.keys(D.cols).filter(id=>D.cols[id].n>=3),out=[];
  for(let a=0;a<ids.length;a++) for(let b=a+1;b<ids.length;b++){
    const va=D.cols[ids[a]].v,vb=D.cols[ids[b]].v;
    if((D.level==='PRD'&&va.nivel!=='P'&&vb.nivel!=='P')||(D.level==='CLI'&&va.nivel!=='C'&&vb.nivel!=='C')) continue;
    const xs=[],ys=[],emps=new Set(),ev=[];
    D.rows.forEach(r=>{const x=r.vals[va.id],y=r.vals[vb.id];if(x!=null&&y!=null){xs.push(x);ys.push(y);if(r.emp) emps.add(r.emp.id);ev.push(r.obs[va.id],r.obs[vb.id]);}});
    if(xs.length<3) continue;
    const inh=(D.level==='PRD'&&(va.nivel!=='P'||vb.nivel!=='P'))||(D.level==='CLI'&&(va.nivel!=='C'||vb.nivel!=='C'));
    out.push({a:va,b:vb,n:xs.length,nEff:inh?emps.size:xs.length,inh,level:D.level,xs,ys,ev});
  }
  return out;
}
function evalPairs(pairs){
  const U=cfg().umb,testable=pairs.filter(p=>p.nEff>=U.nCorr),m=Math.max(1,testable.length);
  const res=testable.map(p=>{
    const r=pearson(p.xs,p.ys);if(r==null) return null;
    const rho=spearman(p.xs,p.ys),df=Math.max(1,p.nEff-2);
    const pv=Math.abs(r)>=1?0:tP2(r*Math.sqrt(df/(1-r*r)),df),pAdj=Math.min(1,pv*m);
    let stable=true;
    for(let i=0;i<p.xs.length&&stable;i++){
      const r2=pearson(p.xs.filter((_,j)=>j!==i),p.ys.filter((_,j)=>j!==i));
      if(r2==null||Math.sign(r2)!==Math.sign(r)||Math.abs(r2)<U.efecto) stable=false;
    }
    const sig=(U.ajustar?pAdj:pv)<U.alfa;
    return {...p,r,rho,p:pv,pAdj,stable,sig,cand:sig&&Math.abs(r)>=U.efecto&&stable,m};
  }).filter(Boolean).sort((x,y)=>Math.abs(y.r)-Math.abs(x.r));
  return {res,testable:testable.length,total:pairs.length,maxN:pairs.reduce((a,p)=>Math.max(a,p.nEff),0)};
}
function seriesOf(nodeId,varId){
  const m=new Map();
  Object.values(S.obs).forEach(o=>{
    if(o.nodo!==nodeId||o.variable!==varId||o.no_aplica) return;
    const cur=m.get(o.periodo);if(!cur||String(o.capturado)>String(cur.capturado)) m.set(o.periodo,o);
  });
  const v=varById(varId);
  return [...m.entries()].map(([per,o])=>({per,val:numericVal(v,o),obs:o.id})).filter(x=>x.val!=null).sort((a,b)=>String(a.per).localeCompare(String(b.per)));
}
function maxPeriods(){
  const m=new Map();
  Object.values(S.obs).forEach(o=>{
    const v=varById(o.variable);if(!v||!NUMT.includes(v.tipo)||o.no_aplica) return;
    const k=o.nodo+'|'+o.variable;if(!m.has(k)) m.set(k,new Set());m.get(k).add(o.periodo);
  });
  let best=0,bk=null;m.forEach((s,k)=>{if(s.size>best){best=s.size;bk=k;}});
  return {n:best,key:bk};
}
let MC={sig:'',d:null};
function motorData(){
  const sig=Object.keys(S.obs).length+'|'+Object.keys(S.nodes).length+'|'+Object.keys(S.custom).length+'|'+JSON.stringify(cfg());
  if(MC.sig===sig&&MC.d) return MC.d;
  const emp=xsData('EMP'),prd=xsData('PRD'),cli=xsData('CLI');
  const pairs=[...scanPairs(emp),...scanPairs(prd),...scanPairs(cli)];
  MC={sig,d:{emp,prd,cli,assoc:evalPairs(pairs),per:maxPeriods()}};
  return MC.d;
}

/* ---- perfiles de cliente ---- */
function clientVec(c){
  const out={};
  varsFor(c).forEach(v=>{
    const r=latest(c.id,v.id);if(!r||r.no_aplica||r.valor==null) return;
    if(NUMT.includes(v.tipo)){const x=numericVal(v,r);if(x!=null) out[v.id]={v,x};}
    else out[v.id]={v,s:normT(r.valor)};
  });
  return out;
}
function profileSim(a,b,ranges){
  const ids=Object.keys(a).filter(id=>b[id]);if(ids.length<3) return null;
  let sum=0;const same=[];
  ids.forEach(id=>{
    if(a[id].x!=null){const rg=ranges[id]||0;sum+=rg>0?1-Math.abs(a[id].x-b[id].x)/rg:1;}
    else{const eq=a[id].s===b[id].s;sum+=eq?1:0;if(eq) same.push(a[id].v.nombre);}
  });
  return {sim:sum/ids.length,shared:ids.length,same};
}
function profileData(){
  const U=cfg().umb,clis=nodesOf('CLI').map(c=>({c,vec:clientVec(c),emp:empOfNode(c)}));
  const ranges={};
  clis.forEach(k=>Object.entries(k.vec).forEach(([id,o])=>{if(o.x!=null){(ranges[id]||(ranges[id]=[])).push(o.x);}}));
  Object.keys(ranges).forEach(id=>{ranges[id]=Math.max(...ranges[id])-Math.min(...ranges[id]);});
  const pairs=[];
  for(let i=0;i<clis.length;i++) for(let j=i+1;j<clis.length;j++){
    const s=profileSim(clis[i].vec,clis[j].vec,ranges);
    if(s) pairs.push({a:clis[i],b:clis[j],...s});
  }
  pairs.sort((x,y)=>y.sim-x.sim);
  /* grupos por enlace promedio */
  let groups=null;
  if(clis.length>=U.minPerfiles){
    let cl=clis.map((k,i)=>({m:[i]}));
    const simAt=(i,j)=>{const p=pairs.find(q=>(q.a===clis[i]&&q.b===clis[j])||(q.a===clis[j]&&q.b===clis[i]));return p?p.sim:0;};
    for(;;){
      let best=-1,bi=-1,bj=-1;
      for(let i=0;i<cl.length;i++) for(let j=i+1;j<cl.length;j++){
        let s=0,c=0;cl[i].m.forEach(x=>cl[j].m.forEach(y=>{s+=simAt(x,y);c++;}));
        if(s/c>best){best=s/c;bi=i;bj=j;}
      }
      if(best<U.simCross) break;
      cl[bi]={m:[...cl[bi].m,...cl[bj].m]};cl.splice(bj,1);
    }
    groups=cl.map(g=>g.m.map(i=>clis[i]));
  }
  return {clis,pairs,groups};
}

/* ---- interfaz ---- */
function svgEl(tag,attrs,...kids){
  const e=document.createElementNS('http://www.w3.org/2000/svg',tag);
  if(attrs) for(const k in attrs) e.setAttribute(k,attrs[k]);
  kids.forEach(c=>{if(c!=null) e.append(c.nodeType?c:document.createTextNode(String(c)));});
  return e;
}
const MS={sub:'resumen',brecha:'',regDep:'',regInd:[],regRes:null,pronNode:'',pronVar:'',sug:null,sugBusy:false,sugMsg:'',sugKind:''};
const fmt3=x=>x==null||!isFinite(x)?'—':Math.abs(x)>=100?String(Math.round(x)):String(Math.round(x*1000)/1000);
const fmtP=p=>p==null?'—':p<.001?'< 0.001':String(Math.round(p*1000)/1000);
function gate(txt){return el('div',{class:'impmsg warn'},txt);}
function note(txt){return el('p',{class:'empty',style:'margin:6px 0 10px',text:txt});}
function dimsSats(vars){
  const dims=[...new Set(vars.map(v=>v.dim))],sats=[...new Set(dims.map(d=>DIMSAT[d]).filter(Boolean))];
  return {dims,sats};
}

/* estado general */
function motorStatus(){
  const d=motorData(),U=cfg().umb,pd=profileData();
  const nEmp=nodesOf('EMP').length,nPrd=nodesOf('PRD').length,nCli=nodesOf('CLI').length;
  const periods=new Set(Object.values(S.obs).map(o=>o.periodo).filter(Boolean)).size;
  const numVars=new Set([...Object.keys(d.emp.cols),...Object.keys(d.prd.cols)]);
  const st=[];
  st.push({k:'panorama',nombre:'Panorama y brechas',ok:numVars.size>0&&nEmp+nPrd>=2,txt:numVars.size?(nEmp+nPrd>=2?'Corre con '+numVars.size+' variables numéricas.':'Necesita al menos 2 nodos para comparar.'):'Aún no hay variables numéricas con datos.'});
  const A=d.assoc;
  st.push({k:'asoc',nombre:'Asociaciones',ok:A.testable>0,txt:A.testable>0?A.testable+' parejas con datos suficientes.':'La pareja con más datos tiene '+A.maxN+' unidades; se necesitan '+U.nCorr+'.'});
  st.push({k:'asoc',nombre:'Regresión',ok:A.maxN>=U.obsPorVar,txt:A.maxN>=U.obsPorVar?'Hay al menos '+U.obsPorVar+' unidades con datos para una variable explicativa.':'Con '+A.maxN+' unidades no alcanza: hacen falta '+U.obsPorVar+' por variable explicativa.'});
  const okP=pd.pairs.length>0;
  st.push({k:'perfiles',nombre:'Perfiles parecidos y cross-selling',ok:okP,txt:okP?pd.pairs.length+' pares de clientes comparables.':'Se necesitan 2 clientes con al menos 3 variables en común ('+nCli+' clientes ahora).'});
  st.push({k:'perfiles',nombre:'Agrupación de perfiles',ok:nCli>=U.minPerfiles,txt:nCli>=U.minPerfiles?'Hay '+nCli+' clientes.':'Con '+nCli+' clientes no alcanza: se necesitan '+U.minPerfiles+'.'});
  st.push({k:'pron',nombre:'Pronóstico',ok:d.per.n>=U.periodosPron,txt:d.per.n>=U.periodosPron?'Hay series de '+d.per.n+' periodos.':'La serie más larga tiene '+d.per.n+' periodos; se necesitan '+U.periodosPron+'.'});
  return {d,pd,nEmp,nPrd,nCli,periods,numVars:numVars.size,st};
}
function suggestionPrompt(M){
  const U=cfg().umb;
  const vars=[];
  const seen=new Set();
  [M.d.emp,M.d.prd,M.d.cli].forEach(D=>Object.values(D.cols).forEach(c=>{if(seen.has(c.v.id)) return;seen.add(c.v.id);
    vars.push([c.v.id,c.v.nombre,SATS[satOf(c.v)].nombre,c.v.nivel,roleOf(c.v),c.n].join('|'));}));
  const status=M.st.map(s=>({analisis:s.nombre,corre:s.ok,detalle:s.txt}));
  return `Eres analista estadístico de un modelo de inteligencia organizacional multidisciplinaria. Te paso un inventario de qué datos hay (solo conteos, sin valores) y qué análisis ya cumplen sus umbrales. Recomienda qué análisis conviene correr ahora, en qué orden, y qué datos conviene capturar para habilitar los que aún no corren.

CONTEXTO
- Los datos son agregados: un valor por variable, nodo y periodo. Hay pocas empresas y pocos periodos, así que sé realista y no recomiendes lo que no se sostiene.
- Análisis disponibles (usa estos códigos): panorama, brechas, asociacion, regresion, perfiles, crossselling, pronostico.
- Umbrales vigentes: ${JSON.stringify(U)}.
- Roles: dep = variable dependiente (resultado), ind = independiente, ctl = control.
- Nodos: ${M.nEmp} empresas, ${M.nPrd} productos, ${M.nCli} clientes, ${M.periods} periodos distintos.

ESTADO DE LOS ANÁLISIS
${JSON.stringify(status)}

VARIABLES NUMÉRICAS CON DATOS (id|variable|corriente|nivel|rol|unidades con dato):
${vars.join('\n')||'(ninguna)'}

Responde SOLO con JSON con esta forma:
{"resumen":"dos frases sobre qué se puede y qué no se puede analizar hoy","recomendaciones":[{"analisis":"panorama|brechas|asociacion|regresion|perfiles|crossselling|pronostico","prioridad":"alta|media|baja","por_que":"una frase","accion":"qué correr o qué mirar","variables":["VAR-xxx"]}],"captura_sugerida":[{"variable":"VAR-xxx","por_que":"una frase"}]}
Máximo 6 recomendaciones y 8 variables en captura_sugerida; usa solo ids del inventario o del catálogo real.`;
}
async function motorAskClaude(){
  const sample=await (window.claude&&window.claude.use?window.claude.use('sample'):null);
  if(!sample){MS.sugMsg='Claude no está disponible en esta vista.';MS.sugKind='warn';renderMotor();return;}
  MS.sugBusy=true;MS.sugMsg='Claude está revisando el inventario de datos…';MS.sugKind='';renderMotor();
  try{
    const out=await sample.json(suggestionPrompt(motorStatus()),{modelTier:'default',cache:false});
    MS.sug={resumen:String((out&&out.resumen)||'').slice(0,500),
      rec:((out&&out.recomendaciones)||[]).slice(0,6).map(r=>({analisis:String(r.analisis||''),prioridad:String(r.prioridad||''),por_que:String(r.por_que||'').slice(0,300),accion:String(r.accion||'').slice(0,300),variables:(r.variables||[]).filter(id=>varById(id)).slice(0,6)})),
      cap:((out&&out.captura_sugerida)||[]).filter(c=>c&&varById(c.variable)).slice(0,8).map(c=>({variable:c.variable,por_que:String(c.por_que||'').slice(0,250)}))};
    MS.sugMsg='';
  }catch(e){
    MS.sugMsg=({not_granted:'No diste permiso para usar Claude.',rate_limited:'Hay demasiadas solicitudes seguidas. Espera un momento.',invalid_json:'Claude respondió con un formato que no pude leer. Intenta de nuevo.'})[e&&e.code]||('No se pudo usar Claude: '+msgOf(e));MS.sugKind='warn';
  }finally{MS.sugBusy=false;renderMotor();}
}
const ANALISIS_SUB={panorama:'panorama',brechas:'panorama',asociacion:'asoc',regresion:'asoc',perfiles:'perfiles',crossselling:'perfiles',pronostico:'pron'};
function viewResumen(M){
  const k=[];
  k.push(el('div',{class:'statrow'},...[[M.nEmp,'Empresas'],[M.nPrd,'Productos'],[M.nCli,'Clientes'],[M.periods,'Periodos distintos'],[M.numVars,'Variables numéricas con datos']].map(([n,l])=>el('div',{class:'stat'},el('b',{text:String(n)}),el('span',{text:l})))));
  k.push(el('h3',{style:'font-size:16px',text:'Qué análisis corren hoy'}));
  const t=el('table',{class:'tbl'});
  t.append(el('thead',null,el('tr',null,['Análisis','Estado','Detalle'].map(h=>el('th',{text:h})))));
  const b=el('tbody');
  M.st.forEach(s=>b.append(el('tr',{class:'row',onclick:()=>{MS.sub=s.k;renderMotor();}},el('td',{text:s.nombre}),el('td',null,el('span',{class:'badge '+(s.ok?'ok':'todo'),text:s.ok?'Corre':'Faltan datos'})),el('td',{text:s.txt}))));
  t.append(b);k.push(el('div',{class:'card scroll',style:'margin:8px 0 20px'},t));
  k.push(el('h3',{style:'font-size:16px',text:'Qué conviene analizar, según Claude'}));
  k.push(note('Claude recibe solo conteos (cuántas unidades tienen dato en cada variable y qué análisis cumplen los umbrales), nunca valores. Te pedirá permiso la primera vez.'));
  k.push(el('div',{class:'row2'},el('button',{class:'btn main',type:'button',disabled:MS.sugBusy,onclick:motorAskClaude,text:MS.sugBusy?'Claude está revisando…':'Que Claude sugiera qué analizar'})));
  if(MS.sugMsg) k.push(el('div',{class:'impmsg '+(MS.sugKind||'')},MS.sugMsg));
  if(MS.sug){
    if(MS.sug.resumen) k.push(el('p',{style:'margin:12px 0',text:MS.sug.resumen}));
    MS.sug.rec.forEach(r=>{
      const sub=ANALISIS_SUB[r.analisis];
      k.push(el('div',{class:'card',style:'margin-top:8px'},
        el('div',{class:'vhead'},el('span',{class:'tag',text:r.analisis}),el('span',{class:'dimtag',text:'prioridad '+r.prioridad})),
        el('p',{style:'margin-top:6px',text:r.por_que}),el('p',{class:'empty',text:r.accion}),
        r.variables.length?el('p',{class:'mono',text:r.variables.map(id=>varById(id).nombre).join(' · ')}):null,
        sub?el('div',{class:'ctrls',style:'margin-top:8px'},el('button',{class:'btn',type:'button',onclick:()=>{MS.sub=sub;renderMotor();},text:'Ir a este análisis'})):null));
    });
    if(MS.sug.cap.length){
      k.push(el('h3',{style:'font-size:16px;margin-top:18px',text:'Datos que conviene capturar'}));
      MS.sug.cap.forEach(c=>{const v=varById(c.variable);k.push(el('p',{style:'margin:6px 0'},tagEl(v.id),' '+v.nombre+' — '+c.por_que));});
    }
  }
  return k;
}

/* panorama y brechas */
function nodeRows(M,node){
  if(node.tipo==='PRD') return {rows:M.d.prd.rows,mine:M.d.prd.rows.find(r=>r.u.id===node.id),filter:v=>v.nivel==='P'};
  if(node.tipo==='CLI') return {rows:M.d.cli.rows,mine:M.d.cli.rows.find(r=>r.u.id===node.id),filter:v=>v.nivel==='C'};
  return {rows:M.d.emp.rows,mine:M.d.emp.rows.find(r=>r.u.id===node.id),filter:v=>v.nivel==='E'};
}
function viewPanorama(M){
  const k=[],U=cfg().umb;
  k.push(note('Variables numéricas con datos. Los productos y las empresas se resumen por separado.'));
  const t=el('table',{class:'tbl'});
  t.append(el('thead',null,el('tr',null,['Variable','Nivel','Unidades','Promedio','Mediana','Mínimo','Máximo','Variación (CV)'].map(h=>el('th',{text:h})))));
  const b=el('tbody');
  const rows=[];
  [M.d.emp,M.d.prd,M.d.cli].forEach(D=>Object.values(D.cols).forEach(c=>{
    if((D.level==='PRD'&&c.v.nivel!=='P')||(D.level==='CLI'&&c.v.nivel!=='C')) return;
    const xs=D.rows.map(r=>r.vals[c.v.id]).filter(x=>x!=null);
    const mu=mean(xs),cv=mu?sdev(xs)/Math.abs(mu):null;
    rows.push({c,xs,mu,cv});
  }));
  rows.sort((a,b2)=>b2.xs.length-a.xs.length);
  if(!rows.length) b.append(el('tr',null,el('td',{colspan:8,class:'empty',text:'Todavía no hay variables numéricas con datos.'})));
  rows.slice(0,60).forEach(r=>b.append(el('tr',null,el('td',{text:r.c.v.nombre}),el('td',{text:NIVELES[r.c.v.nivel]}),el('td',{class:'num',text:r.xs.length}),el('td',{class:'num',text:fmt3(r.mu)}),el('td',{class:'num',text:fmt3(medianOf(r.xs))}),el('td',{class:'num',text:fmt3(Math.min(...r.xs))}),el('td',{class:'num',text:fmt3(Math.max(...r.xs))}),el('td',{class:'num',text:r.xs.length>1&&r.cv!=null?fmt3(r.cv):'—'}))));
  t.append(b);k.push(el('div',{class:'card scroll',style:'max-height:340px'},t));
  k.push(el('h3',{style:'font-size:16px;margin-top:22px',text:'Brechas de un nodo frente a sus pares'}));
  k.push(note('Compara un nodo con los demás de su mismo tipo. Muestra dónde se aleja de lo típico y qué tienen los demás que a este le falta.'));
  const nodes=[...nodesOf('EMP'),...nodesOf('CLI'),...nodesOf('PRD')];
  const sel=el('select',{'aria-label':'Nodo',onchange:e=>{MS.brecha=e.target.value;renderMotor();}},el('option',{value:'',text:'Elige un nodo…'}),...nodes.map(n=>el('option',{value:n.id,text:({EMP:'Empresa',CLI:'Cliente',PRD:'Producto'})[n.tipo]+' · '+n.nombre})));
  sel.value=MS.brecha&&S.nodes[MS.brecha]?MS.brecha:'';
  k.push(el('div',{class:'filters'},sel));
  const node=MS.brecha&&S.nodes[MS.brecha];
  if(node){
    const peers=nodesOf(node.tipo).filter(n=>n.id!==node.id);
    if(peers.length<U.minPares) k.push(gate('Hay '+peers.length+(peers.length===1?' par':' pares')+' para comparar; se necesitan al menos '+U.minPares+'. Captura más nodos del mismo tipo.'));
    else{
      const R=nodeRows(M,node);
      const dev=[];
      if(R.mine) Object.entries(R.mine.vals).forEach(([id,x])=>{
        const v=varById(id);if(!v||!R.filter(v)) return;
        const pv=R.rows.filter(r=>r!==R.mine&&(node.tipo==='CLI'?true:r.u.id!==node.id)).map(r=>r.vals[id]).filter(y=>y!=null);
        if(pv.length<U.minPares) return;
        const s=sdev(pv),mu=mean(pv),z=s>0?(x-mu)/s:0;
        dev.push({v,x,med:medianOf(pv),n:pv.length,z,pct:Math.round(pv.filter(y=>y<=x).length/pv.length*100)});
      });
      dev.sort((a,b2)=>Math.abs(b2.z)-Math.abs(a.z));
      const far=dev.filter(d=>Math.abs(d.z)>=1);
      const t2=el('table',{class:'tbl'});
      t2.append(el('thead',null,el('tr',null,['Variable','Su valor','Mediana de pares','Pares','Percentil','Distancia (z)'].map(h=>el('th',{text:h})))));
      const b2=el('tbody');
      if(!far.length) b2.append(el('tr',null,el('td',{colspan:6,class:'empty',text:dev.length?'Ninguna variable se aleja de sus pares (|z| menor que 1).':'No hay variables numéricas comparables con '+U.minPares+' o más pares.'})));
      far.slice(0,30).forEach(d=>b2.append(el('tr',null,el('td',{text:d.v.nombre}),el('td',{class:'num',text:fmt3(d.x)}),el('td',{class:'num',text:fmt3(d.med)}),el('td',{class:'num',text:d.n}),el('td',{class:'num',text:d.pct+'%'}),el('td',{class:'num',text:fmt3(d.z)}))));
      t2.append(b2);
      k.push(el('h4',{style:'margin:12px 0 6px',text:'Dónde se aleja de lo típico'}),el('div',{class:'card scroll'},t2));
      const falt=[];
      varsFor(node).forEach(v=>{
        if(hasObs(node.id,v.id)) return;
        const c=peers.filter(p=>hasObs(p.id,v.id)).length;
        if(c>=2&&c/peers.length>=.5) falt.push({v,c});
      });
      falt.sort((a,b2)=>b2.c-a.c);
      k.push(el('h4',{style:'margin:16px 0 6px',text:'Lo que otros tienen y a este nodo le falta'}));
      if(!falt.length) k.push(note('No hay variables que la mayoría de sus pares tenga y este nodo no.'));
      else{
        const por={};falt.slice(0,40).forEach(f=>{(por[SATS[satOf(f.v)].nombre]||(por[SATS[satOf(f.v)].nombre]=[])).push(f);});
        Object.entries(por).forEach(([sn,arr])=>k.push(el('div',{class:'grp',style:'margin:6px 0'},el('b',{style:'font-size:13px',text:sn}),el('div',{class:'chips'},...arr.map(f=>el('span',{class:'chip',text:f.v.nombre+' ('+f.c+' de '+peers.length+')'}))))));
      }
    }
  }
  return k;
}

/* asociaciones y regresión */
async function registrarCandidato(c,btn){
  if(btn) btn.disabled=true;
  try{
    const hid=await mintId('HAL',4),grp=nodesOf('GRP')[0],vars=c.vars.map(id=>varById(id)).filter(Boolean),{dims,sats}=dimsSats(vars);
    await put('nodes',hid,{id:hid,tipo:'HAL',nombre:trunc(c.titulo,70),padre:grp?grp.id:null,hallazgo:c.texto,insight:'Por explicar: el motor encontró la relación; falta la causa probable.',implicacion:'Por definir.',dims,sats,obs:[...new Set(c.obs)].slice(0,200),origen:'motor',metodo:c.metodo,estadisticos:c.est,estado:'abierto',creado:nowIso(),por:S.uid||null});
    if(btn){btn.textContent='Registrado como '+hid;}
  }catch(e){if(btn){btn.disabled=false;btn.textContent='No se pudo registrar: '+msgOf(e);}}
}
function pairText(p){
  const dir=p.r>0?'positiva':'negativa',fuerza=Math.abs(p.r)>=.8?'muy fuerte':Math.abs(p.r)>=.6?'fuerte':'moderada';
  return 'Entre «'+p.a.nombre+'» y «'+p.b.nombre+'» hay una asociación '+dir+' '+fuerza+' (r = '+fmt3(p.r)+', n = '+p.nEff+', p ajustada = '+fmtP(p.pAdj)+'). Es una asociación, no prueba causalidad.';
}
function viewAsoc(M){
  const k=[],U=cfg().umb,A=M.d.assoc;
  k.push(note('Correlaciones entre variables numéricas con '+U.nCorr+' o más unidades con dato. Se reportan Pearson y Spearman, el valor p y el valor p ajustado por el número de parejas probadas'+(U.ajustar?' (se usa el ajustado para decidir)':'')+'. Un resultado es candidato a hallazgo si es significativo, su efecto es de al menos '+U.efecto+' y se sostiene al quitar cada unidad (estabilidad).'));
  if(!A.testable) k.push(gate('Todavía no hay parejas con datos suficientes: la que más tiene reúne '+A.maxN+' unidades y se necesitan '+U.nCorr+'. Con menos datos, una correlación puede salir fuerte por azar, así que el motor no la calcula.'));
  else{
    k.push(el('p',{class:'mono',text:A.testable+' parejas probadas · '+A.res.filter(x=>x.cand).length+' candidatas a hallazgo'}));
    const t=el('table',{class:'tbl'});
    t.append(el('thead',null,el('tr',null,['Variable A','Variable B','n','r (Pearson)','ρ (Spearman)','p','p ajustada','Estable','Resultado'].map(h=>el('th',{text:h})))));
    const b=el('tbody');
    A.res.slice(0,60).forEach(p=>{
      const btn=p.cand?el('button',{class:'btn main',type:'button',text:'Registrar como hallazgo'}):null;
      if(btn) btn.addEventListener('click',()=>registrarCandidato({titulo:'Asociación entre '+p.a.nombre+' y '+p.b.nombre,texto:pairText(p),vars:[p.a.id,p.b.id],obs:p.ev,metodo:'Correlación de Pearson (n = '+p.nEff+')',est:{r:p.r,rho:p.rho,p:p.p,pAdj:p.pAdj,n:p.nEff}},btn));
      b.append(el('tr',null,el('td',{text:p.a.nombre}),el('td',{text:p.b.nombre}),el('td',{class:'num',text:p.nEff}),el('td',{class:'num',text:fmt3(p.r)}),el('td',{class:'num',text:fmt3(p.rho)}),el('td',{class:'num',text:fmtP(p.p)}),el('td',{class:'num',text:fmtP(p.pAdj)}),el('td',{text:p.stable?'sí':'no'}),el('td',null,p.cand?btn:el('span',{class:'dimtag',text:p.sig?'significativa, pero no estable o de efecto bajo':'no significativa'}))));
    });
    t.append(b);k.push(el('div',{class:'card scroll',style:'max-height:380px'},t));
  }
  k.push(el('h3',{style:'font-size:16px;margin-top:22px',text:'Regresión lineal'}));
  k.push(note('Explica una variable dependiente con hasta 5 variables independientes. Se corre solo si hay al menos '+U.obsPorVar+' unidades completas por variable explicativa.'));
  const all=[...new Map([...Object.values(M.d.emp.cols),...Object.values(M.d.prd.cols),...Object.values(M.d.cli.cols)].map(c=>[c.v.id,c.v])).values()].sort((a,b)=>a.nombre.localeCompare(b.nombre));
  const dep=el('select',{'aria-label':'Dependiente',onchange:e=>{MS.regDep=e.target.value;MS.regInd=MS.regInd.filter(id=>id!==MS.regDep);MS.regRes=null;renderMotor();}},el('option',{value:'',text:'Variable dependiente…'}),...all.map(v=>el('option',{value:v.id,text:v.nombre+(roleOf(v)==='dep'?' (resultado)':'')})));
  dep.value=MS.regDep;
  const ind=el('div',{class:'chips'},...all.filter(v=>v.id!==MS.regDep).slice(0,80).map(v=>el('button',{type:'button',class:'chip'+(MS.regInd.includes(v.id)?' primary':''),onclick:()=>{if(MS.regInd.includes(v.id))MS.regInd=MS.regInd.filter(x=>x!==v.id);else if(MS.regInd.length<5)MS.regInd=[...MS.regInd,v.id];MS.regRes=null;renderMotor();},text:v.nombre})));
  k.push(el('div',{class:'filters'},dep),el('div',{class:'dimtag',text:'Variables independientes (hasta 5):'}),ind,el('div',{class:'row2'},el('button',{class:'btn main',type:'button',disabled:!MS.regDep||!MS.regInd.length,onclick:()=>{MS.regRes=runRegression(M);renderMotor();},text:'Correr regresión'})));
  if(MS.regRes) k.push(...regView(MS.regRes));
  return k;
}
function runRegression(M){
  const U=cfg().umb,y=varById(MS.regDep),xs=MS.regInd.map(id=>varById(id));
  const all=[y,...xs],hasP=all.some(v=>v.nivel==='P'),hasC=all.some(v=>v.nivel==='C');
  if(hasP&&hasC) return {y,xs,n:0,nEff:0,need:0,level:'—',inh:false,gate:'No se pueden mezclar variables de producto y de cliente en un mismo modelo: no comparten unidad de análisis.'};
  const D=hasP?M.d.prd:hasC?M.d.cli:M.d.emp;
  const rows=D.rows.filter(r=>r.vals[y.id]!=null&&xs.every(v=>r.vals[v.id]!=null));
  const emps=new Set(rows.map(r=>r.emp&&r.emp.id).filter(Boolean));
  const inh=(hasP&&all.some(v=>v.nivel!=='P'))||(hasC&&all.some(v=>v.nivel!=='C'));
  const nEff=inh?emps.size:rows.length,need=U.obsPorVar*xs.length;
  const res={y,xs,n:rows.length,nEff,need,level:D.level,inh};
  if(nEff<need){res.gate='Hay '+nEff+(inh?' empresas distintas':' unidades')+' con datos completos y se necesitan '+need+' ('+U.obsPorVar+' por variable explicativa). No se corre para evitar un modelo que solo ajusta al azar.';return res;}
  const fit=olsFit(rows.map(r=>xs.map(v=>r.vals[v.id])),rows.map(r=>r.vals[y.id]));
  if(!fit){res.gate='Las variables explicativas son colineales o no varían lo suficiente: el modelo no se puede estimar.';return res;}
  res.fit=fit;res.ev=rows.flatMap(r=>[r.obs[y.id],...xs.map(v=>r.obs[v.id])]);
  res.cand=fit.pF<(U.alfa)&&fit.adj>=.25;
  return res;
}
function regView(R){
  const k=[];
  if(R.gate){k.push(gate(R.gate));return k;}
  const f=R.fit;
  k.push(el('p',{class:'mono',style:'margin-top:12px',text:'n = '+R.nEff+' · R² = '+fmt3(f.r2)+' · R² ajustado = '+fmt3(f.adj)+' · F p = '+fmtP(f.pF)+' · error estándar = '+fmt3(f.rmse)}));
  const t=el('table',{class:'tbl'});
  t.append(el('thead',null,el('tr',null,['Término','Coeficiente','Error estándar','t','p'].map(h=>el('th',{text:h})))));
  const b=el('tbody');
  ['Intercepto',...R.xs.map(v=>v.nombre)].forEach((n,i)=>b.append(el('tr',null,el('td',{text:n}),el('td',{class:'num',text:fmt3(f.beta[i])}),el('td',{class:'num',text:fmt3(f.se[i])}),el('td',{class:'num',text:fmt3(f.t[i])}),el('td',{class:'num',text:fmtP(f.p[i])}))));
  t.append(b);k.push(el('div',{class:'card scroll'},t));
  if(R.inh) k.push(note('Hay variables de empresa o cliente repetidas entre productos de la misma empresa: el tamaño efectivo que se usa es el número de empresas distintas.'));
  if(R.cand){
    const btn=el('button',{class:'btn main',type:'button',text:'Registrar como hallazgo'});
    btn.addEventListener('click',()=>registrarCandidato({titulo:'Modelo de '+R.y.nombre+' explicado por '+R.xs.map(v=>v.nombre).join(', '),texto:'Un modelo lineal explica «'+R.y.nombre+'» con '+R.xs.map(v=>'«'+v.nombre+'»').join(', ')+' (R² ajustado = '+fmt3(f.adj)+', n = '+R.nEff+', p del modelo = '+fmtP(f.pF)+'). Es una asociación, no prueba causalidad.',vars:[R.y.id,...R.xs.map(v=>v.id)],obs:R.ev,metodo:'Regresión lineal (n = '+R.nEff+')',est:{r2:f.r2,adj:f.adj,pF:f.pF,n:R.nEff}},btn));
    k.push(el('div',{class:'row2'},btn));
  }else k.push(note('El modelo no cumple los criterios para proponerlo como hallazgo (significancia y R² ajustado de al menos 0.25).'));
  return k;
}

/* perfiles parecidos y cross-selling */
function viewPerfiles(M){
  const k=[],U=cfg().umb,P=M.pd;
  k.push(note('Compara los perfiles de los clientes de distintas empresas con la distancia de Gower, que mezcla variables numéricas y de texto. Solo se comparan clientes con al menos 3 variables en común. Es una similitud de perfil, no de compras.'));
  if(!P.pairs.length) k.push(gate('Hay '+P.clis.length+' clientes y ninguna pareja comparte 3 variables o más. Captura el perfil (Audiencia) de más clientes.'));
  else{
    const t=el('table',{class:'tbl'});
    t.append(el('thead',null,el('tr',null,['Cliente A','Cliente B','Similitud','Variables en común','Coinciden en'].map(h=>el('th',{text:h})))));
    const b=el('tbody');
    P.pairs.slice(0,40).forEach(p=>b.append(el('tr',null,el('td',{text:p.a.emp?p.a.emp.nombre:p.a.c.nombre}),el('td',{text:p.b.emp?p.b.emp.nombre:p.b.c.nombre}),el('td',{class:'num',text:Math.round(p.sim*100)+'%'}),el('td',{class:'num',text:p.shared}),el('td',{text:p.same.slice(0,6).join(', ')||'—'}))));
    t.append(b);k.push(el('div',{class:'card scroll'},t));
    k.push(el('h3',{style:'font-size:16px;margin-top:22px',text:'Oportunidades de cross-selling'}));
    k.push(note('Si dos clientes se parecen al menos '+Math.round(U.simCross*100)+'%, los productos de la empresa de uno son una hipótesis para el cliente del otro. No hay datos de compra cruzada, así que se trata de ideas para explorar.'));
    const ops=[];
    P.pairs.filter(p=>p.sim>=U.simCross&&p.a.emp&&p.b.emp&&p.a.emp.id!==p.b.emp.id).forEach(p=>{
      [[p.a,p.b],[p.b,p.a]].forEach(([x,y])=>{
        const prods=nodesOf('PRD').filter(q=>q.padre===y.emp.id);
        if(prods.length) ops.push({x,y,prods,sim:p.sim,same:p.same});
      });
    });
    if(!ops.length) k.push(gate('Ninguna pareja llega a '+Math.round(U.simCross*100)+'% de similitud con productos de la otra empresa registrados.'));
    ops.forEach(o=>k.push(el('div',{class:'card',style:'margin-top:8px'},el('p',null,'El cliente de ',el('b',{text:o.x.emp.nombre}),' se parece '+Math.round(o.sim*100)+'% al de ',el('b',{text:o.y.emp.nombre}),'. Productos de '+o.y.emp.nombre+' para explorar con él: '+o.prods.map(q=>q.nombre).join(', ')+'.'),
      o.same.length?el('p',{class:'empty',text:'Coinciden en: '+o.same.slice(0,6).join(', ')}):null)));
  }
  k.push(el('h3',{style:'font-size:16px;margin-top:22px',text:'Grupos de perfiles'}));
  if(!P.groups) k.push(gate('Hay '+P.clis.length+' clientes y se necesitan '+U.minPerfiles+' para agrupar con sentido. Mientras tanto, usa el ranking de similitud de arriba.'));
  else P.groups.forEach((g,i)=>k.push(el('p',{style:'margin:6px 0'},el('b',{text:'Grupo '+(i+1)+': '}),g.map(x=>x.emp?x.emp.nombre:x.c.nombre).join(', '))));
  return k;
}

/* pronóstico */
function viewPron(M){
  const k=[],U=cfg().umb;
  k.push(note('Tendencia lineal de una variable en el tiempo para un nodo. El pronóstico con intervalo del 80% se calcula solo con '+U.periodosPron+' o más periodos.'));
  const keys=new Map();
  Object.values(S.obs).forEach(o=>{const v=varById(o.variable);if(!v||!NUMT.includes(v.tipo)||o.no_aplica) return;const key=o.nodo+'|'+o.variable;if(!keys.has(key)) keys.set(key,new Set());keys.get(key).add(o.periodo);});
  const opts=[...keys.entries()].filter(([,s])=>s.size>=2).sort((a,b2)=>b2[1].size-a[1].size);
  if(!opts.length){k.push(gate('Ninguna variable tiene datos en 2 periodos o más. Captura la misma variable en periodos distintos (usa el selector Periodo del chat).'));return k;}
  const sel=el('select',{'aria-label':'Serie',onchange:e=>{MS.pronKey=e.target.value;renderMotor();}},...opts.map(([key,s])=>{const [nid,vid]=key.split('|');const n=S.nodes[nid],v=varById(vid);return el('option',{value:key,text:(n?n.nombre:nid)+' · '+(v?v.nombre:vid)+' ('+s.size+' periodos)'});}));
  MS.pronKey=opts.some(([key])=>key===MS.pronKey)?MS.pronKey:opts[0][0];sel.value=MS.pronKey;
  k.push(el('div',{class:'filters'},sel));
  k.push(note('Los periodos se tratan como equidistantes. Si faltan meses entre uno y otro, la tendencia puede sesgarse.'));
  const [nid,vid]=MS.pronKey.split('|'),ser=seriesOf(nid,vid),n=ser.length;
  const t=el('table',{class:'tbl'});
  t.append(el('thead',null,el('tr',null,['Periodo','Valor'].map(h=>el('th',{text:h})))));
  const b=el('tbody');ser.forEach(s=>b.append(el('tr',null,el('td',{text:s.per}),el('td',{class:'num',text:fmt3(s.val)}))));
  t.append(b);k.push(el('div',{class:'card scroll',style:'max-width:360px'},t));
  if(n>=2){const ch=(ser[n-1].val-ser[0].val)/(Math.abs(ser[0].val)||1)*100;k.push(el('p',{class:'mono',style:'margin-top:8px',text:'Variación entre el primer y el último periodo: '+fmt3(ch)+'%'}));}
  if(n<U.periodosPron){k.push(gate('Hay '+n+' periodos y se necesitan '+U.periodosPron+' para pronosticar. Faltan '+(U.periodosPron-n)+'.'));return k;}
  const xs=ser.map((_,i)=>i),ys=ser.map(s=>s.val),fit=olsFit(xs.map(x=>[x]),ys);
  if(!fit){k.push(gate('La serie no tiene variación suficiente para estimar una tendencia.'));return k;}
  const xb=mean(xs),sxx=xs.reduce((s,x)=>s+(x-xb)*(x-xb),0),tq=tQuant(.9,fit.df);
  const fc=[1,2,3].map(h=>{const x0=n-1+h,yh=fit.beta[0]+fit.beta[1]*x0,se=fit.rmse*Math.sqrt(1+1/n+(x0-xb)*(x0-xb)/sxx);return {h,y:yh,lo:yh-tq*se,hi:yh+tq*se};});
  const tf=el('table',{class:'tbl',style:'margin-top:10px'});
  tf.append(el('thead',null,el('tr',null,['Periodos adelante','Pronóstico','Intervalo 80%'].map(h=>el('th',{text:h})))));
  const bf=el('tbody');fc.forEach(f=>bf.append(el('tr',null,el('td',{class:'num',text:'+'+f.h}),el('td',{class:'num',text:fmt3(f.y)}),el('td',{class:'num',text:fmt3(f.lo)+' a '+fmt3(f.hi)}))));
  tf.append(bf);
  k.push(el('p',{class:'mono',style:'margin-top:10px',text:'Tendencia: '+fmt3(fit.beta[1])+' por periodo · R² = '+fmt3(fit.r2)+' · p de la tendencia = '+fmtP(fit.p[1])}),el('div',{class:'card scroll',style:'max-width:460px'},tf));
  return k;
}

/* configuración */
function viewConfig(M){
  const k=[],U=cfg().umb;
  k.push(note('Los umbrales deciden cuándo un análisis tiene datos suficientes y cuándo un resultado es candidato a hallazgo. Los roles dicen qué variables son resultados, explicativas o de control.'));
  const fields=[['nCorr','Mínimo de unidades para una correlación',1],['obsPorVar','Unidades por variable explicativa en regresión',1],['minPerfiles','Mínimo de clientes para agrupar perfiles',1],['periodosPron','Mínimo de periodos para pronosticar',1],['minPares','Mínimo de pares para comparar brechas',1],['alfa','Nivel de significancia',.01],['efecto','Efecto mínimo (|r|)',.05],['simCross','Similitud mínima para cross-selling (0 a 1)',.05]];
  const inputs={};
  const grid=el('div',{class:'formgrid'},...fields.map(([key,label,step])=>{inputs[key]=el('input',{type:'number',step:String(step),value:String(U[key]),'aria-label':label});return el('label',null,label,inputs[key]);}));
  const aj=el('input',{type:'checkbox',checked:U.ajustar});
  k.push(el('div',{class:'card'},grid,el('label',{style:'display:flex;gap:8px;align-items:center;margin-top:12px;color:var(--muted);font-size:13px'},aj,'Ajustar el valor p por el número de parejas probadas (recomendado)')));
  const res=el('span',{class:'res',role:'status'});
  const rolesSel={};
  const vars=[...new Map([...Object.values(M.d.emp.cols),...Object.values(M.d.prd.cols),...Object.values(M.d.cli.cols)].map(c=>[c.v.id,c.v])).values()].sort((a,b)=>a.nombre.localeCompare(b.nombre));
  const t=el('table',{class:'tbl'});
  t.append(el('thead',null,el('tr',null,['Variable','Nivel','Rol'].map(h=>el('th',{text:h})))));
  const b=el('tbody');
  if(!vars.length) b.append(el('tr',null,el('td',{colspan:3,class:'empty',text:'Todavía no hay variables numéricas con datos. Los roles aparecerán aquí.'})));
  vars.forEach(v=>{const s=el('select',{'aria-label':'Rol de '+v.nombre},...Object.entries(ROLE_ES).map(([r,l])=>el('option',{value:r,text:l})));s.value=roleOf(v);rolesSel[v.id]=s;b.append(el('tr',null,el('td',{text:v.nombre}),el('td',{text:NIVELES[v.nivel]}),el('td',null,s)));});
  t.append(b);
  k.push(el('h3',{style:'font-size:16px;margin-top:18px',text:'Roles de las variables'}),note('Propuesta inicial: dependientes los resultados (ingresos, márgenes, recompra, abandono, NPS, participación…); independientes las demás. Corrígela.'),el('div',{class:'card scroll',style:'max-height:340px'},t));
  k.push(el('div',{class:'row2'},el('button',{class:'btn main',type:'button',text:'Guardar configuración',onclick:async()=>{
    const umb={};fields.forEach(([key])=>{const x=Number(inputs[key].value);if(isFinite(x)&&x>=0) umb[key]=x;});umb.ajustar=aj.checked;
    const roles={...cfg().roles};Object.entries(rolesSel).forEach(([id,s])=>{if(s.value!==(DEP_RE.test(varById(id).nombre)?'dep':'ind')||roles[id]) roles[id]=s.value;});
    try{await put('nodes','CFG-MOTOR',{id:'CFG-MOTOR',tipo:'CFG',nombre:'Configuración del motor',umbrales:umb,roles,creado:nowIso(),por:S.uid||null});res.className='res ok';res.textContent='Configuración guardada.';}
    catch(e){res.className='res bad';res.textContent='No se pudo guardar: '+msgOf(e);}
  }}),el('button',{class:'btn',type:'button',text:'Volver a los valores iniciales',onclick:async()=>{try{await put('nodes','CFG-MOTOR',{id:'CFG-MOTOR',tipo:'CFG',nombre:'Configuración del motor',umbrales:{},roles:{},creado:nowIso(),por:S.uid||null});}catch(e){}}}),res));
  return k;
}
const MOTOR_VIEWS={resumen:viewResumen,panorama:viewPanorama,asoc:viewAsoc,perfiles:viewPerfiles,pron:viewPron,config:viewConfig};
function renderMotor(){
  const box=$('#motor-body');if(!box) return;
  $$('.msub').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.ms===MS.sub)));
  const M=motorStatus();
  const kids=(MOTOR_VIEWS[MS.sub]||viewResumen)(M);
  box.replaceChildren(...kids.filter(Boolean));
}
$$('.msub').forEach(b=>b.addEventListener('click',()=>{MS.sub=b.dataset.ms;renderMotor();}));

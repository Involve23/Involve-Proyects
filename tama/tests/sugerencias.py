"""Señales, borradores, aceptación, prioridad, seguimiento del indicador y tablero."""
import os, tempfile
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = os.path.join(tempfile.gettempdir(), "tama-pruebas")
os.makedirs(TMP, exist_ok=True)
import json, base64, random
from playwright.sync_api import sync_playwright
errs=[]
D3=RAIZ+'/vendor/d3.min.js'; DX=RAIZ+'/vendor/docx.umd.js'
MOCK = r'''
window.__prompts=[];
window.claude={use:async(n)=>{
  if(n!=='sample') return null;
  const f=async()=>({text:''});
  f.json=async(prompt,opts)=>{ window.__prompts.push(prompt);
    const keys=[...prompt.matchAll(/^### (\S+) ·/gm)].map(m=>m[1]);
    const nps=allVars().find(v=>v.nombre==='NPS').id, sat=allVars().find(v=>v.nombre==='Satisfacción y lealtad').id;
    return {borradores:keys.map((k,i)=>({senal:k,clase:k.startsWith('valor')?'insight':(k.startsWith('alerta')?'alerta':'sugerencia'),titulo:'Borrador para '+k,accion:'Acción concreta para '+k,por_que:'Porque la evidencia lo indica',responsable:'Dirección comercial',plazo:'30 días',dias:30,kpi_texto:'NPS sube',kpi_variable:i%2?nps:sat,direccion:'subir',meta:i%2?80:5,impacto:(i%5)+1,esfuerzo:((i+2)%5)+1,limites:'Pocos datos'}))}; };
  return f; }};
'''
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_page(viewport={'width':1280,'height':900})
    pg.add_init_script(MOCK)
    pg.on('pageerror',lambda e: errs.append(('pageerror',str(e)[:400])))
    pg.on('console',lambda m: errs.append(('console',m.text[:300])) if m.type=='error' else None)
    def route(r):
        u=r.request.url
        if 'd3@7.9.0' in u: r.fulfill(body=open(D3,'rb').read(),content_type='application/javascript'); return
        if 'docx@8.5.0' in u: r.fulfill(body=open(DX,'rb').read(),content_type='application/javascript'); return
        r.continue_()
    pg.route('**/*',route)
    pg.goto('file://'+RAIZ+'/dist/principal.html'); pg.wait_for_timeout(2500)
    random.seed(11)
    pg.evaluate('''()=>{
      const id=n=>allVars().find(v=>v.nombre===n).id;
      const V={ing:id('Ingresos totales'),mkt:id('Presupuesto de marketing'),nps:id('NPS'),sat:id('Satisfacción y lealtad'),precio:id('Precio de lista'),costo:id('Costo por unidad'),ind:id('Industria'),mod:id('Modelo de venta'),tam:id('Tamaño de empresa'),reg:id('Región'),edad:id('Rango de edad'),mneto:id('Margen neto'),recompra:id('Tasa de recompra')};
      window.__V=V;
      let o=0,n=0;
      const mk=(tipo,nombre,padre)=>{const k=++n;const idn=tipo+'-'+String(k).padStart(4,'0')+'-0';S.nodes[idn]={id:idn,tipo,nombre,padre,estado:'activo'};return idn;};
      const addObs=(nodo,variable,valor,per)=>{const idd='OBS-'+String(++o).padStart(6,'0')+'-0';S.obs[idd]={id:idd,nodo,variable,valor,no_aplica:false,fuente:'Interna',confianza:o%3?'Media':'Baja',periodo:per||'2026-04',capturado:new Date(2026,3,1,0,0,o).toISOString()};return idd;};
      const grp=mk('GRP','Grupo Tama',null);
      const inds=['Retail','Servicios','Retail','Consumo','Servicios','Retail','Consumo','Retail'];
      for(let i=0;i<8;i++){
        const e=mk('EMP','Empresa '+(i+1),grp);S.nodes[e].ficha={industria:inds[i],categoria:'cat',mercado_geo:'México',pregunta:'¿Por qué baja la recompra?',decision:'Reformular'};
        const c=mk('CLI','Cliente de Empresa '+(i+1),e);const p=mk('PRD','Producto '+(i+1),e);S.nodes[p].etapa='Madurez';
        const ing=1000+i*120+(Math.random()-.5)*60;
        addObs(e,V.ing,Math.round(ing));addObs(e,V.mkt,Math.round(ing*.1));addObs(e,V.nps,i<2?-5:(i>5?70:30+i));addObs(e,V.mneto,i===3?-4:12);
        addObs(c,V.sat,i%4===0?2:4);addObs(c,V.ind,inds[i]);addObs(c,V.mod,i%3===0?'B2C':'B2B');addObs(c,V.tam,i%2?'200':'50');addObs(c,V.reg,i%4?'Centro':'Norte');addObs(c,V.edad,i%2?'25-40':'40-55');
        addObs(p,V.precio,100);addObs(p,V.costo,i===1?120:(i===2?95:40));addObs(c,V.recompra,i===5?10:50);
      }
      const e0=Object.values(S.nodes).find(n=>n.tipo==='EMP'&&n.nombre==='Empresa 1').id;
      S.nodes['HAL-0001-0']={id:'HAL-0001-0',tipo:'HAL',nombre:'Ingresos siguen al marketing',padre:e0,hallazgo:'Las ventas siguen al presupuesto',insight:'Mayor inversión, mayor alcance',implicacion:'Riesgo si baja',dims:['FI1'],sats:['FIN'],obs:Object.values(S.obs).filter(x=>x.nodo===e0).slice(0,2).map(x=>x.id),estado:'abierto',creado:'2026-04-02'};
      S.idx=null;MC.sig='';scheduleRender();
    }''')
    pg.click('.tab[data-tab="sugerencias"]'); pg.wait_for_timeout(800)
    print('SEÑALES por tipo',pg.evaluate('JSON.stringify(detectSignals().reduce((a,s)=>{a[s.tipo]=(a[s.tipo]||0)+1;return a},{}))'))
    print('ejemplos',pg.evaluate('detectSignals().filter(s=>["alerta","valor","brecha"].includes(s.tipo)).slice(0,5).map(s=>s.tipo+": "+s.titulo+" | "+s.ev[0])'))
    pg.click('#sg-body button:has-text("Que Claude redacte")'); pg.wait_for_timeout(1500)
    print('MSG',pg.inner_text('#sg-body .impmsg')[:120],'| borradores',pg.evaluate('nodesOf("SGD").filter(d=>d.estado==="borrador").length'))
    pr=pg.evaluate('window.__prompts[0]')
    print('PROMPT',len(pr),'| incluye contexto de empresa','pregunta_de_negocio' in pr,'| incluye lista de variables numéricas','VARIABLES NUMÉRICAS' in pr)
    # aceptar 2 borradores
    for _ in range(2):
        pg.click('#sg-body button:has-text("Aceptar como sugerencia") >> nth=0'); pg.wait_for_timeout(700)
    print('SUG',pg.evaluate('nodesOf("SUG").map(s=>s.id+" clase="+s.clase+" kpiVar="+(varById(s.kpiVar)||{}).nombre+" base="+(s.base?s.base.valor:null)+" meta="+s.meta+" vence="+s.vence+" imp/esf="+s.impacto+"/"+s.esfuerzo).join("\\n")'))
    # prioridad
    pg.click('.gsub[data-gs="prio"]'); pg.wait_for_timeout(500)
    print('PRIORIDAD círculos',pg.evaluate('document.querySelectorAll("#sg-body svg circle").length'),'| filas',pg.evaluate('document.querySelectorAll("#sg-body tbody tr").length'))
    # nuevos datos del indicador -> medir
    pg.evaluate('''()=>{
      nodesOf('SUG').forEach((s,i)=>{const v=varById(s.kpiVar);if(!v||!s.kpiNodo)return;
        const idd='OBS-9'+String(i).padStart(5,'0')+'-0';S.obs[idd]={id:idd,nodo:s.kpiNodo,variable:s.kpiVar,valor:(s.base?s.base.valor:0)+(i?15:-0.2),no_aplica:false,fuente:'Interna',confianza:'Media',periodo:'2026-10',capturado:new Date(Date.now()+86400000).toISOString()};});
      S.idx=null;scheduleRender();}''')
    pg.click('.gsub[data-gs="seg"]'); pg.wait_for_timeout(500)
    print('KPI',pg.evaluate('nodesOf("SUG").map(s=>s.id+": "+kpiStatus(s).v+" | "+kpiStatus(s).txt).join("\\n")'))
    pg.evaluate('SG.open=nodesOf("SUG")[0].id;renderSugerencias()'); pg.wait_for_timeout(300)
    print('DETALLE tiene gráfica',pg.evaluate('!!document.querySelector("#sg-body .card svg")'))
    pg.click('.gsub[data-gs="tab"]'); pg.wait_for_timeout(500)
    print('TABLERO',pg.inner_text('#sg-body .statrow').replace('\n',' | '),'| svgs',pg.evaluate('document.querySelectorAll("#sg-body svg").length'))
    pg.screenshot(path=TMP+'/sg1.png',full_page=True)
    # análisis ve las sugerencias
    pg.click('.tab[data-tab="analisis"]'); pg.wait_for_timeout(500)
    e1=pg.evaluate('nodesOf("EMP").find(e=>nodesOf("SUG").some(s=>{const x=empOfNode(s);return x&&x.id===e.id})).id')
    pg.select_option('#an-ctl select',e1); pg.wait_for_timeout(400)
    print('ANÁLISIS sugerencias:',pg.inner_text('#an-body').split('Qué se sugiere')[1][:300].replace('\n',' | '))
    print('errs',errs)
    b.close()

"""Pestaña Análisis y generación del documento de Word (con redacción simulada de Claude)."""
import os, tempfile
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = os.path.join(tempfile.gettempdir(), "tama-pruebas")
os.makedirs(TMP, exist_ok=True)
import json, base64, random
from playwright.sync_api import sync_playwright
errs=[]
D3=RAIZ+'/vendor/d3.min.js'; DX=RAIZ+'/vendor/docx.umd.js'
MOCK = r'''
window.__prompts=[];window.__saved=null;
window.claude={use:async(n)=>{
  if(n==='downloads') return {save:async({filename,data})=>{ const buf=await data.arrayBuffer(); window.__saved={filename,size:buf.byteLength,b64:btoa(String.fromCharCode(...new Uint8Array(buf)))}; return {status:'saved'}; }};
  if(n!=='sample') return null;
  const f=async()=>({text:''});
  f.json=async(prompt,opts)=>{ window.__prompts.push(prompt);
    const ids=[...prompt.matchAll(/^### ([a-z_A-Z0-9\-]+) ·/gm)].map(m=>m[1]);
    return {resumen:"Resumen de prueba redactado por Claude con base en los datos disponibles.",secciones:ids.map(id=>({id,parrafos:["Párrafo redactado para la sección "+id+".","Segundo párrafo con límites y cautelas."]})),pasos:["Capturar más periodos","Validar los roles de variables"]}; };
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
    print('docx lib',pg.evaluate('!!window.docx'))
    random.seed(7)
    pg.evaluate('''()=>{
      const id=n=>allVars().find(v=>v.nombre===n).id;
      const V={ing:id('Ingresos totales'),mkt:id('Presupuesto de marketing'),mb:id('Margen bruto'),nps:id('NPS'),sat:id('Satisfacción y lealtad'),precio:id('Precio de lista'),dem:id('Demanda actual'),ind:id('Industria'),mod:id('Modelo de venta'),tam:id('Tamaño de empresa'),reg:id('Región'),edad:id('Rango de edad'),val:id('Valores centrales'),mot:id('Motivos funcionales'),pc2:id('Emociones al comprar'),orig:id('Inbound')};
      let o=0,n=0;
      const mk=(tipo,nombre,padre)=>{const k=++n;const idn=tipo+'-'+String(k).padStart(4,'0')+'-0';S.nodes[idn]={id:idn,tipo,nombre,padre,estado:'activo'};return idn;};
      const addObs=(nodo,variable,valor,per)=>{const idd='OBS-'+String(++o).padStart(6,'0')+'-0';S.obs[idd]={id:idd,nodo,variable,valor,no_aplica:false,fuente:o%3?'Interna':'Archivo',confianza:o%4?'Media':'Alta',periodo:per||'2026-10',capturado:new Date(2026,9,1,0,0,o).toISOString(),origen:o%5===0?'IMP-0001-8':undefined};return idd;};
      const grp=mk('GRP','Grupo Tama',null);
      const inds=['Retail','Servicios','Retail','Consumo','Servicios','Retail','Consumo','Retail'];
      const ids=[];
      for(let i=0;i<8;i++){
        const e=mk('EMP','Empresa '+(i+1),grp);S.nodes[e].ficha={industria:inds[i],categoria:'cat '+i,mercado_geo:'México',pregunta:'¿Por qué baja la recompra?',decision:'Reformular'};
        const c=mk('CLI','Cliente de Empresa '+(i+1),e);S.nodes[c].descripcion='Comprador '+(i%2?'B2B':'B2C')+' de '+inds[i];
        const p=mk('PRD','Producto '+(i+1),e);S.nodes[p].etapa='Madurez';ids.push([e,c,p]);
        const ing=1000+i*120+(Math.random()-.5)*60;
        addObs(e,V.ing,Math.round(ing));addObs(e,V.mkt,Math.round(ing*.1+(Math.random()-.5)*8));addObs(e,V.mb,Math.round(30+Math.random()*20));addObs(e,V.nps,Math.round(20+Math.random()*60));
        addObs(c,V.sat,1+Math.round(Math.random()*4));addObs(c,V.ind,inds[i]);addObs(c,V.mod,i%3===0?'B2C':'B2B');addObs(c,V.tam,i%2?'200 empleados':'50 empleados');addObs(c,V.reg,i%4?'Centro':'Norte');addObs(c,V.edad,i%2?'25-40':'40-55');
        if(i<5){addObs(c,V.val,'Familia y estabilidad');addObs(c,V.mot,'Ahorro de tiempo');}
        const pr=50+i*5;addObs(p,V.precio,pr);addObs(p,V.dem,Math.round(1000-pr*8));
      }
      const e0=ids[0][0],o1=Object.values(S.obs).filter(x=>x.nodo===e0).slice(0,2).map(x=>x.id);
      S.nodes['HAL-0001-0']={id:'HAL-0001-0',tipo:'HAL',nombre:'Ingresos dependen del presupuesto de marketing',padre:e0,hallazgo:'Las ventas siguen al presupuesto',insight:'Mayor inversión, mayor alcance',implicacion:'Riesgo si baja la inversión',dims:['FI1'],sats:['FIN','MER'],obs:o1,estado:'abierto',creado:'2026-10-02'};
      S.nodes['SUG-0001-0']={id:'SUG-0001-0',tipo:'SUG',nombre:'Diversificar canales',padre:'HAL-0001-0',accion:'Diversificar canales de captación',dimension:'FI1',responsable:'Dirección comercial',plazo:'60 días',kpi:'Ingresos por canal propio',estado:'propuesta',creado:'2026-10-02'};
      S.nodes['PRE-0001-0']={id:'PRE-0001-0',tipo:'PRE',nombre:'q',padre:e0,texto:'¿Qué provocó la caída de agosto?',variable:null,estado:'abierta',creado:'2026-10-03'};
      S.idx=null;MC.sig='';scheduleRender();
    }''')
    pg.click('.tab[data-tab="analisis"]'); pg.wait_for_timeout(700)
    t=pg.inner_text('#an-body')
    print('DIAG secciones',pg.evaluate('AN.model.sections.map(s=>s.id).join(",")'),'| len',len(t))
    print('DIAG extracto',t[:700].replace('\n',' | '))
    for sub in ['comp','casos','corr']:
        pg.click(f'.asub[data-as="{sub}"]'); pg.wait_for_timeout(500)
        print(sub.upper(),pg.evaluate('AN.model.sections.map(s=>s.id).join(",")'),'|',pg.inner_text('#an-body')[:260].replace('\n',' | '))
    pg.select_option('#an-ctl select >> nth=0',index=1) if pg.evaluate('document.querySelectorAll("#an-ctl select").length')>0 else None
    # documento con Claude (lectura por corriente de empresa 1)
    pg.click('.asub[data-as="diag"]'); pg.wait_for_timeout(400)
    pg.evaluate("document.querySelector('#an-doc details').open=true")
    pg.click('#an-doc button:has-text("Documento con redacción de Claude")'); pg.wait_for_timeout(2500)
    print('MSG',pg.inner_text('#an-doc .impmsg'))
    sv=pg.evaluate('window.__saved?{filename:__saved.filename,size:__saved.size}:null')
    print('SAVED',sv)
    pr=pg.evaluate('window.__prompts[0]')
    print('PROMPT chars',len(pr),'| incluye "Familia y estabilidad"?', 'Familia y estabilidad' in pr,'| incluye "[texto omitido]"?','[texto omitido]' in pr)
    open(TMP+'/diag.docx','wb').write(base64.b64decode(pg.evaluate('window.__saved.b64')))
    # plantilla
    pg.evaluate('window.__saved=null')
    pg.click('#an-doc button:has-text("Documento con textos de plantilla")'); pg.wait_for_timeout(1500)
    open(TMP+'/diag_plantilla.docx','wb').write(base64.b64decode(pg.evaluate('window.__saved.b64')))
    # casos + comparativo docs
    pg.click('.asub[data-as="comp"]'); pg.wait_for_timeout(300)
    pg.evaluate("document.querySelector('#an-doc details').open=true")
    pg.click('#an-doc button:has-text("Documento con redacción de Claude")'); pg.wait_for_timeout(2000)
    open(TMP+'/comp.docx','wb').write(base64.b64decode(pg.evaluate('window.__saved.b64')))
    pg.screenshot(path=TMP+'/an1.png',full_page=True)
    print('errs',errs)
    b.close()

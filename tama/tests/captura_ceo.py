"""Captura para CEO: alta de ficha, productos y clientes, varios nodos a la vez y pendientes con el equipo."""
import os, tempfile
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = os.path.join(tempfile.gettempdir(), "tama-pruebas")
os.makedirs(TMP, exist_ok=True)
import json
from playwright.sync_api import sync_playwright
errs=[]
D3=RAIZ+'/vendor/d3.min.js'; DX=RAIZ+'/vendor/docx.umd.js'
MOCK = r'''
window.__calls=[];window.__ext=0;
function parseVars(p){const i=p.indexOf('VARIABLES POR LLENAR');const sec=p.slice(i).split('OTRAS VARIABLES')[0];return [...sec.matchAll(/^(VAR-\d+) \| ([^|]+) \| tipo: ([^|]+) \|/gm)].map(m=>({id:m[1],n:m[2].trim(),t:m[3].trim()}));}
function parseOthers(p){const sec=(p.split('OTRAS VARIABLES PENDIENTES')[1]||'').split('PREGUNTA QUE HICISTE')[0];return [...sec.matchAll(/^(VAR-\d+) \| ([^|]+) \| (.+)$/gm)].map(m=>({id:m[1],n:m[2].trim(),t:m[3].trim()}));}
function val(t){if(t.startsWith('Número'))return '120';if(t.startsWith('Porcentaje'))return '35';if(t.startsWith('Escala'))return '4';if(t.startsWith('Sí'))return 'Sí';if(t.startsWith('Opciones'))return t.replace('Opciones: ','').split(' / ')[0];return 'Texto dicho por la persona';}
window.claude={use:async(n)=>{
  if(n!=='sample') return null;
  const f=async()=>({text:''});
  f.json=async(prompt)=>{ window.__calls.push(prompt.slice(0,50));
    if(!prompt.includes('RESPUESTA ACTUAL')&&prompt.includes('PREGUNTA QUE HICISTE')&&prompt.includes('"industria"')) return {industria:'Servicios',categoria:'Reclutamiento y evaluación',mercado:'México',pregunta:'¿Por qué baja la recompra?',decision:'Reformular el producto estrella',fuentes:'Ventas y encuestas',comentario:'Gracias, ya tengo una idea clara de la empresa.'};
    if(!prompt.includes('RESPUESTA ACTUAL')&&prompt.includes('PREGUNTA QUE HICISTE')&&prompt.includes('"productos"')) return {productos:[{nombre:'Connect',etapa:'Madurez',nota:'más de dos años'},{nombre:'Métría',etapa:'Lanzamiento',nota:''},{nombre:'Galaxia',etapa:'',nota:''}],comentario:'Tres productos, anotados.'};
    if(!prompt.includes('RESPUESTA ACTUAL')&&prompt.includes('PREGUNTA QUE HICISTE')&&prompt.includes('"clientes"')) return {clientes:[{nombre:'Dueños de pymes',tipo:'B2B',estrategia:'Adquisición'},{nombre:'Líderes de RH',tipo:'B2B',estrategia:'Retención'}],comentario:'Dos tipos de cliente.'};
    if(prompt.includes('RESPUESTA ACTUAL')){
      window.__ext++;const vs=parseVars(prompt),oth=parseOthers(prompt);
      const nodes=(prompt.match(/NODOS \(usa[^:]*: ([^\n]+)/)||[])[1];const names=nodes?nodes.split(', '):[null];
      const valores=[];
      vs.slice(0,2).forEach((v,i)=>names.forEach((nm,j)=>{const o={id:v.id,valor:val(v.t),confianza:i===1?'deducido':'literal',evidencia:'lo dijo la persona'};if(nm) o.nodo=nm;valores.push(o);}));
      if(oth.length){const o={id:oth[0].id,valor:val(oth[0].t),confianza:'literal',evidencia:'lo mencionó de pasada'};if(nodes) o.nodo='todos';valores.push(o);window.__other=oth[0].id;}
      return {valores,no_aplica:[],faltan:vs.slice(2).map(v=>({id:v.id,pista:'Cuéntame un dato aproximado'})),seguimiento:null,aprendizajes:[{tipo:'producto',texto:'Connect es el producto maduro'}],contradicciones:[],comentario:'Gracias, eso ayuda.'};
    }
    return {intro:'Este bloque nos dice cómo se posiciona.',pregunta:'Cuéntame de cada producto cómo lo ves.',sugerencias:[],ejemplos:['Ejemplo uno','Ejemplo dos'],donde:'Con ventas.'};
  };
  return f; }};
'''
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_page(viewport={'width':1440,'height':900})
    pg.add_init_script(MOCK)
    pg.on('pageerror',lambda e: errs.append(('pageerror',str(e)[:300])))
    pg.on('console',lambda m: errs.append(('console',m.text[:200])) if m.type=='error' else None)
    def route(r):
        u=r.request.url
        if 'd3@7.9.0' in u: r.fulfill(body=open(D3,'rb').read(),content_type='application/javascript'); return
        if 'docx@8.5.0' in u: r.fulfill(body=open(DX,'rb').read(),content_type='application/javascript'); return
        if 'fonts.g' in u: r.abort(); return
        r.continue_()
    pg.route('**/*',route)
    pg.goto('file://'+RAIZ+'/dist/captura_involve.html'); pg.wait_for_timeout(2200)
    chat=lambda: [l for l in pg.inner_text('#chat').split('\n') if l.strip()]
    print('NAV:',pg.inner_text('.sidebar .tabs').replace('\n',' | '),'| marca:',pg.inner_text('.brand').replace('\n',' | '))
    pg.evaluate('''()=>{S.nodes['GRP-0001-8']={id:'GRP-0001-8',tipo:'GRP',nombre:'Grupo Tama',padre:null};S.nodes['EMP-0001-8']={id:'EMP-0001-8',tipo:'EMP',nombre:'Involve',padre:'GRP-0001-8',alias:[]};S.memC={OBS:0,CLI:0,EMP:1,GRP:1,PRD:0,CON:0};S.idx=null;scheduleRender();}''')
    pg.wait_for_timeout(500)
    print('BIENVENIDA:',chat()[-3:])
    pg.fill('#composer textarea','Vendemos plataformas de reclutamiento y evaluación en México.'); pg.click('#composer .btn.main:has-text("Enviar")'); pg.wait_for_timeout(800)
    print('FICHA review:',pg.inner_text('.cvcard').replace('\n',' | ')[:200])
    pg.click('.cvcard .btn.main:has-text("Guardar la ficha")'); pg.wait_for_timeout(1200)
    print('ficha guardada:',pg.evaluate('JSON.stringify(S.nodes["EMP-0001-8"].ficha)')[:120])
    pg.fill('#composer textarea','Connect, Métría y Galaxia.'); pg.click('#composer .btn.main:has-text("Enviar")'); pg.wait_for_timeout(800)
    pg.click('.cvcard .btn.main:has-text("Crear los productos")'); pg.wait_for_timeout(1500)
    print('productos:',pg.evaluate('nodesOf("PRD").map(p=>p.nombre+":"+p.etapa).join(", ")'))
    pg.fill('#composer textarea','Dueños de pymes y líderes de RH.'); pg.click('#composer .btn.main:has-text("Enviar")'); pg.wait_for_timeout(800)
    pg.click('.cvcard .btn.main:has-text("Crear los tipos de cliente")'); pg.wait_for_timeout(1800)
    print('clientes:',pg.evaluate('clisOf("EMP-0001-8").map(c=>segName(c)+"/"+c.tipoCliente+"/"+c.estrategia).join(", ")'))
    print('MENÚ:',pg.inner_text('#composer').replace('\n',' | ')[:300])
    print('ruta:',pg.inner_text('#ladder').replace('\n',' | ')[:300],'| chip avance:',pg.inner_text('#progchip'))
    # paso 1: productos juntos
    pg.click('#composer .chip:has-text("1 · Tus productos")'); pg.wait_for_timeout(1500)
    print('PASO 1:',chat()[-4:])
    pg.fill('#composer textarea','Connect es líder; Métría apenas arranca; Galaxia está en pruebas.'); pg.click('#composer .btn.main:has-text("Enviar")'); pg.wait_for_timeout(1200)
    rows=pg.evaluate('[...document.querySelectorAll(".cvcard .cvvar,.cvcard .cvsub")].map(e=>e.textContent)'); print('REVISIÓN multi: secciones',rows)
    print('badges:',pg.evaluate('[...document.querySelectorAll(".cvcard")].pop().querySelectorAll(".cvb")').__len__() if False else pg.evaluate('[...[...document.querySelectorAll(".cvcard")].pop().querySelectorAll(".cvb")].map(b=>b.textContent)'),'| ext calls',pg.evaluate('window.__ext'))
    print('filas:',pg.evaluate('document.querySelectorAll(".cvcard .cvrow").length'),'| etiquetas:',pg.evaluate('[...document.querySelectorAll(".cvcard .cvrow .cvck b")].slice(0,6).map(b=>b.textContent)'))
    n0=pg.evaluate('Object.keys(S.obs).length')
    pg.click('.cvcard .btn.main:has-text("Guardar lo que entendí")'); pg.wait_for_timeout(2000)
    print('MSG guardar:',pg.evaluate('(()=>{const c=[...document.querySelectorAll(".cvcard")].pop();return c.querySelector(".res").textContent})()'))
    print('obs',n0,'→',pg.evaluate('Object.keys(S.obs).length'),'| por producto:',pg.evaluate('JSON.stringify(Object.values(S.obs).reduce((a,o)=>{const n=S.nodes[o.nodo];const k=n?n.nombre:o.nodo;a[k]=(a[k]||0)+1;return a;},{}))'))
    print('variable de otro bloque ya registrada:',pg.evaluate('(()=>{const id=window.__other;return id?nodesOf("PRD").map(p=>hasObs(p.id,id)).join(","):"sin otras"})()'))
    # preguntar al equipo
    pg.click('#composer .chip:has-text("Siguiente bloque")'); pg.wait_for_timeout(1500)
    pg.click('#composer .chip:has-text("No sé: preguntar al equipo")'); pg.wait_for_timeout(300)
    print('EQUIPO:',pg.inner_text('#composer').replace('\n',' | ')[:200])
    pg.click('#composer .chip:has-text("A Marketing")'); pg.wait_for_timeout(300)
    pg.fill('#composer textarea','Pregúntale a Ana de producto'); pg.click('#composer .btn.main:has-text("Enviar")'); pg.wait_for_timeout(1500)
    print('consulta:',pg.evaluate('JSON.stringify(Object.values(BO.cons).map(c=>({para:c.para,estado:c.estado,nota:c.nota,vars:c.bloque.vars.length,pares:c.bloque.pares.length})))'))
    print('tras enviar:',chat()[-3:])
    # vista de pendientes
    pg.click('.tab[data-tab="consultas"]'); pg.wait_for_timeout(500)
    print('PENDIENTES:',pg.inner_text('#cons-body').replace('\n',' | ')[:360])
    print('vista:',pg.evaluate('(()=>{const v=document.querySelector("#v-consultas");const b=document.querySelector("#cons-body .btn.main");const r=b.getBoundingClientRect();return JSON.stringify({hidden:v.hidden,disp:getComputedStyle(v).display,tab:S.tab,w:r.width,h:r.height,y:r.y,vis:getComputedStyle(b).visibility,op:getComputedStyle(b).opacity,parentDisp:getComputedStyle(v.parentElement).display})})()'))
    pg.click('#cons-body .btn.main:has-text("Responder")'); pg.wait_for_timeout(1500)
    print('RESPONDER:',chat()[-3:])
    pg.fill('#composer textarea','Respuesta del equipo de marketing.'); pg.click('#composer .btn.main:has-text("Enviar")'); pg.wait_for_timeout(1200)
    pg.click('.cvcard >> nth=-1 >> .btn.main:has-text("Guardar lo que entendí")'); pg.wait_for_timeout(2000)
    print('consulta tras responder:',pg.evaluate('JSON.stringify(Object.values(BO.cons).map(c=>c.estado+(c.parcial?"(parcial)":"")))'))
    pg.screenshot(path=TMP+'/ceo1.png')
    print('errs',errs)
    b.close()

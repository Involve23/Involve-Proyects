"""Captura conversacional por bloques con Claude simulado."""
import os, tempfile
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = os.path.join(tempfile.gettempdir(), "tama-pruebas")
os.makedirs(TMP, exist_ok=True)
import re,json
from playwright.sync_api import sync_playwright
errs=[]
D3=RAIZ+'/vendor/d3.min.js'; DX=RAIZ+'/vendor/docx.umd.js'
MOCK = r'''
window.__calls=[];window.__ext=0;window.__failOpen=false;
function parseVars(p){const sec=p.split('VARIABLES')[1]||'';return [...sec.matchAll(/^(VAR-\d+) \| ([^|]+) \| tipo: ([^|]+) \|/gm)].map(m=>({id:m[1],n:m[2].trim(),t:m[3].trim()}));}
function val(t){if(t.startsWith('Número'))return '120';if(t.startsWith('Porcentaje'))return '35';if(t.startsWith('Escala'))return '4';if(t.startsWith('Sí'))return 'Sí';if(t.startsWith('Opciones'))return t.replace('Opciones: ','').split(' / ')[0];return 'Texto de ejemplo dicho por la persona';}
window.claude={use:async(n)=>{
  if(n!=='sample') return null;
  const f=async()=>({text:''});
  f.json=async(prompt)=>{ window.__calls.push(prompt.slice(0,60));
    if(prompt.includes('RESPUESTA ACTUAL')){
      window.__ext++;const vs=parseVars(prompt);
      const first=window.__ext===1;
      return {valores:vs.map((v,i)=>({id:v.id,valor:i===0?val(v.t):(i===1?val(v.t):null),confianza:i===1?'deducido':'literal',evidencia:i===0?'lo dijo la persona':'se infiere'})).filter((v,i)=>first?i<2:true),no_aplica:[],faltan:vs.slice(first?2:0,first?3:0).map(v=>({id:v.id,pista:'Cuéntame un dato aproximado'})),
        seguimiento:first?{pregunta:'¿Y qué tanto cambia entre temporadas?',ejemplo:'Sube 20% en diciembre'}:null,
        aprendizajes:first?[{tipo:'competidor',texto:'Compite con plataformas de evaluación de talento'},{tipo:'termino',texto:'Connect = producto de reclutamiento'}]:[],contradicciones:[],comentario:'Gracias, eso ayuda mucho.'};
    }
    if(prompt.includes('no sabe qué responder')||prompt.includes('no sabe')) return {pasos:['Revisa las propuestas ganadas','Cuenta clientes activos'],pregunta:'¿Cuántos clientes activos tienes hoy?'};
    if(window.__failOpen) return {};
    return {intro:'Este bloque nos dice dónde compite.',pregunta:'Cuéntame con tus palabras cómo es el mercado de Connect.',sugerencias:['Compite en reclutamiento digital para pymes.','Sus competidores son bolsas de trabajo.'],ejemplos:['Mercado de reclutamiento para pymes de 50 a 500 personas','Tres plataformas conocidas'],donde:'Suele estar con ventas.'};
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
    pg.goto('file://'+RAIZ+'/dist/principal.html'); pg.wait_for_timeout(2000)
    pg.evaluate('''()=>{
      S.nodes['GRP-0001-8']={id:'GRP-0001-8',tipo:'GRP',nombre:'Grupo Tama',padre:null};
      S.nodes['EMP-0001-8']={id:'EMP-0001-8',tipo:'EMP',nombre:'Involve',padre:'GRP-0001-8',ficha:{industria:'Servicios',categoria:'Reclutamiento',mercado_geo:'México',pregunta:'¿Por qué baja la recompra?',decision:'Reformular'}};
      S.nodes['CLI-0001-8']={id:'CLI-0001-8',tipo:'CLI',nombre:'x',padre:'EMP-0001-8',segmento:'Gestores de talento',tipoCliente:'B2B',estrategia:'Adquisición'};
      S.nodes['PRD-0001-8']={id:'PRD-0001-8',tipo:'PRD',nombre:'Connect',padre:'EMP-0001-8',etapa:'Madurez'};
      S.memC={OBS:0,CLI:1,EMP:1,GRP:1,PRD:1};S.idx=null;scheduleRender();}''')
    pg.click('.tab[data-tab="capture"]'); pg.evaluate('chooseEmpresa()'); pg.wait_for_timeout(300)
    pg.click('#composer .chip:has-text("Involve")'); pg.wait_for_timeout(400)
    pg.click('#composer .chip:has-text("Producto «Connect»")'); pg.wait_for_timeout(1200)
    chat=lambda: pg.inner_text('#chat')
    print('INICIO:',[l for l in chat().split('\n') if l.strip()][-6:])
    print('composer:',pg.inner_text('#composer').replace('\n',' | ')[:420])
    # sugerencia -> texto
    pg.click('#composer .cvsug .chip >> nth=0'); print('textarea tras sugerencia:',pg.input_value('#composer textarea'))
    # No sé qué responder
    pg.click('#composer .chip:has-text("No sé qué responder")'); pg.wait_for_timeout(300)
    print('EJEMPLOS:',[l for l in chat().split('\n') if l.strip()][-6:])
    pg.click('#composer .chip:has-text("Ayúdame a estimarlo")'); pg.wait_for_timeout(900)
    print('ESTIMAR:',[l for l in chat().split('\n') if l.strip()][-5:])
    # responder
    pg.fill('#composer textarea','Compite en reclutamiento digital para pymes, contra plataformas de evaluación. Son unos 120 clientes.')
    pg.click('#composer .btn.main:has-text("Enviar")'); pg.wait_for_timeout(1200)
    print('REVISIÓN:',pg.inner_text('.cvcard').replace('\n',' | ')[:520])
    badges=pg.evaluate('[...document.querySelectorAll(".cvcard .cvb")].map(b=>b.textContent)'); print('badges',badges)
    # valor inválido en una fila numérica/escala -> intentar con vacío
    n_before=pg.evaluate('Object.keys(S.obs).length')
    pg.click('.cvcard .btn.main:has-text("Guardar lo que entendí")'); pg.wait_for_timeout(1200)
    print('guardado:',pg.inner_text('.cvcard .res'),'| obs',n_before,'→',pg.evaluate('Object.keys(S.obs).length'))
    print('obs nuevas:',pg.evaluate('Object.values(S.obs).map(o=>varById(o.variable).nombre+"="+o.valor+" | "+o.nota+" | "+o.captura).join(" ;; ")')[:420])
    print('memoria:',pg.evaluate('JSON.stringify(memItems("EMP-0001-8").map(i=>i.tipo+":"+i.texto))'),'| panel:',pg.inner_text('#mem').replace('\n',' | ')[:200])
    print('SEGUIMIENTO:',[l for l in chat().split('\n') if l.strip()][-3:])
    # responder seguimiento
    pg.fill('#composer textarea','Sube 20% en diciembre.')
    pg.click('#composer .btn.main:has-text("Enviar")'); pg.wait_for_timeout(1200)
    print('REVISIÓN 2 filas:',pg.evaluate('document.querySelectorAll(".cvcard:last-of-type .cvrow").length'))
    pg.click('.cvcard >> nth=-1 >> .btn.main:has-text("Guardar lo que entendí")'); pg.wait_for_timeout(1200)
    print('tras guardar:',[l for l in chat().split('\n') if l.strip()][-3:],'| chips:',pg.inner_text('#composer').replace('\n',' | ')[:160])
    pg.click('#composer .chip:has-text("Siguiente bloque")'); pg.wait_for_timeout(1200)
    print('BLOQUE 2:',[l for l in chat().split('\n') if l.strip()][-3:])
    # borrar memoria
    pg.click('#mem .memx >> nth=0'); pg.wait_for_timeout(400)
    print('memoria tras quitar:',pg.evaluate('memItems("EMP-0001-8").length'))
    # valor inválido
    pg.evaluate('window.__failOpen=true')
    pg.screenshot(path=TMP+'/conv1.png')
    print('llamadas:',pg.evaluate('window.__calls.length'),'errs',errs)
    b.close()

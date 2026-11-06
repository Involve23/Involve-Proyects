"""Importar un CSV: perfila columnas y comprueba que a Claude solo llegan nombres y estadísticas, nunca filas ni correos."""
import os, tempfile
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = os.path.join(tempfile.gettempdir(), "tama-pruebas")
os.makedirs(TMP, exist_ok=True)
import json, random
from playwright.sync_api import sync_playwright
errs=[]
D3=RAIZ+'/vendor/d3.min.js'
random.seed(3)
rows=['Fecha;Cliente;Correo;Canal;Ventas;Descuento;Satisfacción']
tot=0
for i in range(30):
    v=round(random.uniform(500,3000),2); tot+=v
    s=('%.2f'%v).replace('.',',')
    d=f'{(i%28)+1:02d}/03/2026'
    rows.append(f'{d};Cliente {i};cliente{i}@correo.com;{random.choice(["Online","Tienda","Mayoreo"])};"{s}";0,{random.randint(0,3)};{random.randint(3,5)}')
csv=('\n'.join(rows)).encode('utf-8')
print('suma esperada',round(tot,2))
MOCK = r'''
window.__prompts=[];
window.claude={use:async(n)=>{ if(n!=='sample') return null;
  const f=async()=>({text:''});
  f.json=async(prompt,opts)=>{ window.__prompts.push(prompt); return window.__plan(); };
  return f; }};
'''
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_page(viewport={'width':1280,'height':900})
    pg.add_init_script(MOCK)
    pg.on('pageerror',lambda e: errs.append(('pageerror',str(e)[:400])))
    pg.on('console',lambda m: errs.append(('console',m.text[:300])) if m.type=='error' else None)
    pg.route('**/*',lambda r: r.fulfill(body=open(D3,'rb').read(),content_type='application/javascript') if 'd3@7.9.0' in r.request.url else r.continue_())
    pg.goto('file://'+RAIZ+'/dist/principal.html'); pg.wait_for_timeout(2500)
    ids=pg.evaluate('''()=>{const f=n=>allVars().find(v=>v.nombre===n).id;return {ventas:f('Ingresos totales'),desc:f('Descuento otorgado'),sat:f('Satisfacción y lealtad'),txt:f('Mensaje de ahorro de tiempo')}}''')
    print('ids',ids)
    plan={"forma":"tabla","resumen":"Ventas diarias por canal con satisfacción","columnas":[
      {"columna":"Ventas","variable":ids['ventas'],"agregacion":"suma","escala":None,"confianza":"alta","motivo":"Ventas en pesos"},
      {"columna":"Descuento","variable":ids['desc'],"agregacion":"promedio","escala":None,"confianza":"media","motivo":"Descuento medio"},
      {"columna":"Satisfacción","variable":ids['sat'],"agregacion":"promedio","escala":None,"confianza":"alta","motivo":"Escala de 1 a 5"},
      {"columna":"Fecha","variable":None,"agregacion":"rango","escala":None,"confianza":"baja","motivo":""},
      {"columna":"Cliente","variable":None,"agregacion":"distintos","escala":None,"confianza":"baja","motivo":""},
      {"columna":"Correo","variable":None,"agregacion":"distintos","escala":None,"confianza":"baja","motivo":""},
      {"columna":"Canal","variable":None,"agregacion":"frecuentes","escala":None,"confianza":"media","motivo":""}],
      "ficha":None,
      "nuevas":[{"columna":"Canal","nombre":"Canal de venta principal","dim":"S","nivel":"E","tipo":"t","agregacion":"frecuentes","pregunta":"¿Qué canal concentra más ventas?","guia":"Indica el canal y su porcentaje de ventas.","motivo":"No hay variable de canal por ventas"}],
      "preguntas":[{"texto":"¿Qué mensaje de ahorro de tiempo se usa para vender en Tienda?","variable":ids['txt']},{"texto":"¿Qué provocó los picos de ventas a mitad de mes?","variable":None}]}
    pg.evaluate('window.__plan=()=>('+json.dumps(plan)+')')
    # empresa + producto
    pg.click('.tab[data-tab="capture"]'); pg.wait_for_timeout(300)
    def chip(label): pg.click(f'#composer .chip:has-text("{label}")'); pg.wait_for_timeout(120)
    def txt(t):
        sel='#composer textarea' if pg.query_selector('#composer textarea') else '#composer input[type=number]'
        pg.fill(sel,t); pg.click('#composer .btn:has-text("Registrar")'); pg.wait_for_timeout(120)
    chip('Nueva empresa'); txt('Empresa Uno'); chip('Consumo'); txt('x'); txt('x'); txt('x'); txt('x'); chip('Omitir'); chip('Omitir'); pg.wait_for_timeout(500)
    txt('Segmento uno'); chip('B2B (empresa)'); chip('Adquisición'); pg.wait_for_timeout(400); chip('No, ya están todos'); pg.wait_for_timeout(300)
    for _ in range(40):
        if pg.evaluate('S.queue.length')==0: break
        pg.evaluate("()=>{const c=document.querySelector('#composer');const ch=[...c.querySelectorAll('.chip')].filter(x=>!x.classList.contains('quiet'));if(ch.length){ch[0].click();return}const ta=c.querySelector('textarea');ta.value='x';c.querySelector('.inrow .btn').click();}"); pg.wait_for_timeout(50)
    chip('Nuevo producto'); txt('Papas'); chip('Madurez'); chip('Omitir'); pg.wait_for_timeout(300)
    # ir a importar desde el chat
    chip('Importar un CSV'); pg.wait_for_timeout(500)
    print('tab',pg.evaluate('S.tab+"/"+S.sub'),'| destino',pg.evaluate('document.querySelector("#imp-dest select").value===S.ctx.emp'))
    pg.set_input_files('#imp-work input[type=file]',files=[{'name':'ventas.csv','mimeType':'text/csv','buffer':csv}]); pg.wait_for_timeout(600)
    print('perfil',pg.inner_text('#imp-work .impmsg').replace('\n',' '),'|',pg.evaluate('IMP.prof.map(p=>p.nombre+":"+p.tipo+(p.sensible?"(sensible)":"")).join(", ")'))
    print('periodo',pg.evaluate('IMP.periodo'),'| filas',pg.evaluate('IMP.rows.length'))
    # Claude (simulado)
    pg.click('#imp-work button:has-text("Que Claude proponga")'); pg.wait_for_timeout(900)
    pr=pg.evaluate('window.__prompts[0]')
    print('prompt chars',len(pr),'| contiene correos',('@correo.com' in pr),'| contiene "Cliente 7"',('Cliente 7' in pr),'| hay filas',('ana@' in pr),'| contiene nombres de columna','Satisfacción' in pr and 'Ventas' in pr,'| categorias Canal','Online' in pr)
    print('mapeo filas',pg.evaluate('IMP.map.map(r=>r.key+"→"+(r.variable||"-")+"["+(r.agg||"")+"]"+(r.incluir?"✓":"")).join(" | ")'))
    pg.screenshot(path=TMP+'/i1.png',full_page=True)
    print('nuevas visibles',pg.evaluate('!!document.querySelector("#imp-nuevas table")'),'| preguntas',pg.evaluate('IMP.preguntas.length'))
    pg.click('#imp-go'); pg.wait_for_timeout(1500)
    print('saved:',pg.evaluate('IMP.saved'))
    print('obs importadas',pg.evaluate('Object.values(S.obs).filter(o=>o.origen).map(o=>varById(o.variable).nombre+"="+o.valor+" @"+o.nodo+" | "+o.nota).join("\\n")'))
    print('IMP node',pg.evaluate('nodesOf("IMP").map(n=>n.id+" "+n.archivo+" filas="+n.filas+" obs="+n.obs.length+" nuevas="+n.nuevas.join("/")+" periodo="+n.periodo).join(";")'))
    print('custom',pg.evaluate('JSON.stringify(Object.values(S.custom).map(v=>({id:v.id,nombre:v.nombre,dim:v.dim,emp:v.emp,guia:v.guia})))'))
    print('PRE',pg.evaluate('nodesOf("PRE").map(n=>n.id+" "+n.estado+" var="+n.variable).join(";")'))
    # preguntas en el chat
    pg.click('#imp-work button:has-text("Responder las preguntas en el chat")'); pg.wait_for_timeout(500)
    print('chat tras ir:',pg.inner_text('#chat')[-380:].replace('\n',' | '))
    pg.fill('#composer textarea','Sí, solo se aplica a mayoreo'); pg.click('#composer .inrow .btn'); pg.wait_for_timeout(500)
    print('chat siguiente:',pg.inner_text('#chat')[-260:].replace('\n',' | '))
    pg.fill('#composer textarea','Campaña de quincena'); pg.click('#composer .inrow .btn'); pg.wait_for_timeout(500)
    print('PRE estados',pg.evaluate('nodesOf("PRE").map(n=>n.id+" "+n.estado+(n.respuesta?" resp="+n.respuesta:"")).join(" ; ")'))
    print('obs desc ahora',pg.evaluate('Object.values(S.obs).filter(o=>o.variable==="'+ids['desc']+'").map(o=>o.valor+"/"+(o.origen?"imp":"chat")).join(", ")'))
    # historial
    pg.click('.tab[data-tab="data"]'); pg.click('.subtab[data-sub="imp"]'); pg.wait_for_timeout(500)
    print('historial',pg.inner_text('#imp-hist')[:300].replace('\n',' | '))
    # grafo: variable nueva visible
    print('allVars',pg.evaluate('allVars().length'),'| nueva en S',pg.evaluate('Object.keys(S.custom).join(",")'))
    print('errs',errs)
    b.close()

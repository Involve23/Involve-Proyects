"""Completar la ficha de una empresa ya creada desde el chat."""
import os, tempfile
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = os.path.join(tempfile.gettempdir(), "tama-pruebas")
os.makedirs(TMP, exist_ok=True)
from playwright.sync_api import sync_playwright
errs=[]
D3=RAIZ+'/vendor/d3.min.js'; DX=RAIZ+'/vendor/docx.umd.js'
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_page(viewport={'width':1280,'height':850})
    pg.on('pageerror',lambda e: errs.append(('pageerror',str(e)[:400])))
    pg.on('console',lambda m: errs.append(('console',m.text[:300])) if m.type=='error' else None)
    def route(r):
        u=r.request.url
        if 'd3@7.9.0' in u: r.fulfill(body=open(D3,'rb').read(),content_type='application/javascript'); return
        if 'docx@8.5.0' in u: r.fulfill(body=open(DX,'rb').read(),content_type='application/javascript'); return
        r.continue_()
    pg.route('**/*',route)
    pg.goto('file://'+RAIZ+'/dist/principal.html'); pg.wait_for_timeout(2000)
    pg.evaluate('''()=>{
      const names=['Involve','Doble Cinco','Impuldesa','Involvia','Urvem'],dig=[8,6,4,2,9];
      S.nodes['GRP-0001-8']={id:'GRP-0001-8',tipo:'GRP',nombre:'Grupo Tama',padre:null,estado:'activo',alias:[]};
      names.forEach((n,i)=>{const k=String(i+1).padStart(4,'0')+'-'+dig[i];
        S.nodes['EMP-'+k]={id:'EMP-'+k,tipo:'EMP',nombre:n,padre:'GRP-0001-8',estado:'activo',alias:[]};
        S.nodes['CLI-'+k]={id:'CLI-'+k,tipo:'CLI',nombre:'Cliente de '+n,descripcion:'',padre:'EMP-'+k,estado:'activo',alias:[]};});
      S.idx=null;scheduleRender();}''')
    print('ids válidos',pg.evaluate('Object.keys(S.nodes).map(i=>i+":"+verifyId(i)).join(" ")'))
    pg.click('.tab[data-tab="universe"]'); pg.wait_for_timeout(2500)
    print('stats',pg.inner_text('#g-stats'))
    print('etiquetas',pg.evaluate('[...document.querySelectorAll("#gsvg g.gn text")].map(t=>t.textContent).filter(Boolean).join(" | ")'))
    print('opacidades',pg.evaluate('[...new Set([...document.querySelectorAll("#gsvg g.gn circle")].map(c=>c.getAttribute("opacity")))]'))
    pg.screenshot(path=TMP+'/s5.png')
    # chat
    pg.click('.tab[data-tab="capture"]'); pg.evaluate('chooseEmpresa()'); pg.wait_for_timeout(400)
    pg.click('#composer .chip:has-text("Involve") >> nth=0'); pg.wait_for_timeout(500)
    print('chips tras elegir:',pg.inner_text('#composer').replace('\n',' | ')[:300])
    pg.click('#composer .chip:has-text("Completar ficha")'); pg.wait_for_timeout(300)
    def chip(label): pg.click(f'#composer .chip:has-text("{label}")'); pg.wait_for_timeout(120)
    def txt(t):
        sel='#composer textarea' if pg.query_selector('#composer textarea') else '#composer input[type=number]'
        pg.fill(sel,t); pg.click('#composer .btn:has-text("Registrar")'); pg.wait_for_timeout(150)
    chip('Servicios'); txt('Reclutamiento'); txt('México'); txt('Más candidatos'); txt('Plan comercial'); chip('Omitir'); txt('Reclutador de empresa mediana, B2B'); pg.wait_for_timeout(600)
    print('ficha',pg.evaluate('JSON.stringify(S.nodes["EMP-0001-8"].ficha)'),'| cliente desc',pg.evaluate('S.nodes["CLI-0001-8"].descripcion'))
    print('chat:',pg.inner_text('#chat')[-260:].replace('\n',' | '))
    print('errs',errs)
    b.close()

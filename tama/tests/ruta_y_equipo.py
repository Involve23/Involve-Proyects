"""Ruta de lo particular a lo general y panel de equipo en vivo."""
import os, tempfile
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = os.path.join(tempfile.gettempdir(), "tama-pruebas")
os.makedirs(TMP, exist_ok=True)
from playwright.sync_api import sync_playwright
errs=[]
D3=RAIZ+'/vendor/d3.min.js'; DX=RAIZ+'/vendor/docx.umd.js'
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_page(viewport={'width':1440,'height':900})
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
      S.nodes['EMP-0001-8']={id:'EMP-0001-8',tipo:'EMP',nombre:'Involve',padre:'GRP-0001-8',ficha:{industria:'Servicios'}};
      S.nodes['EMP-0002-6']={id:'EMP-0002-6',tipo:'EMP',nombre:'Doble Cinco',padre:'GRP-0001-8',ficha:{industria:'Retail'}};
      S.nodes['CLI-0001-8']={id:'CLI-0001-8',tipo:'CLI',nombre:'Cliente de Involve',padre:'EMP-0001-8',segmento:'Reclutador de pyme',tipoCliente:'B2B',estrategia:'Retención'};
      S.nodes['CLI-0002-6']={id:'CLI-0002-6',tipo:'CLI',nombre:'Cliente de Doble Cinco',padre:'EMP-0002-6',segmento:'Comprador',tipoCliente:'B2C',estrategia:'Adquisición'};
      S.nodes['PRD-0001-8']={id:'PRD-0001-8',tipo:'PRD',nombre:'Metría',padre:'EMP-0001-8',etapa:'Madurez'};
      S.nodes['PRD-0002-6']={id:'PRD-0002-6',tipo:'PRD',nombre:'Galaxia',padre:'EMP-0001-8',etapa:'Lanzamiento'};
      S.memC={OBS:0,CLI:2,EMP:2,GRP:1,PRD:2};S.idx=null;scheduleRender();
      window.fillNode=(id)=>{varsFor(S.nodes[id]).forEach(v=>{const k='OBS-9'+Math.random().toString(36).slice(2,8)+'-0';S.obs[k]={id:k,nodo:id,variable:v.id,valor:'x',no_aplica:true,fuente:'Interna',confianza:'Media',periodo:'2026-10',capturado:new Date().toISOString(),por:S.uid||'yo'};});S.idx=null;};
    }''')
    pg.click('.tab[data-tab="capture"]'); pg.evaluate('chooseEmpresa()'); pg.wait_for_timeout(400)
    pg.click('#composer .chip:has-text("Involve")'); pg.wait_for_timeout(500)
    print('chips de la ruta:',pg.inner_text('#composer').replace('\n',' | ')[:520])
    print('ruta lateral:',pg.inner_text('#ladder').replace('\n',' | ')[:420])
    # nivel 1: producto
    pg.click('#composer .chip:has-text("Producto «Galaxia»")'); pg.wait_for_timeout(500)
    print('mensaje:',pg.evaluate('document.querySelector("#chat").innerText.split("\\n").filter(x=>x.includes("Nivel")).slice(-1)[0]'))
    print('chips:',pg.inner_text('#composer').replace('\n',' | ')[:300])
    # completar Metría y Galaxia -> siguiente = segmento
    pg.evaluate('fillNode("PRD-0001-8");fillNode("PRD-0002-6");renderSide()')
    pg.evaluate('S.ctx.prd="PRD-0002-6";startCapture()'); pg.wait_for_timeout(300)
    print('siguiente tras completar productos:',pg.evaluate('nextLevelChip().label'))
    pg.click('#composer .chip:has-text("Siguiente nivel")'); pg.wait_for_timeout(500)
    print('ahora:',pg.evaluate('document.querySelector("#chat").innerText.split("\\n").filter(x=>x.includes("Nivel")).slice(-1)[0]'))
    pg.evaluate('fillNode("CLI-0001-8");S.ctx.cli="CLI-0001-8";S.ctx.prd=null;startCapture()'); pg.wait_for_timeout(300)
    print('siguiente tras completar segmento:',pg.evaluate('nextLevelChip().label'))
    pg.evaluate('fillNode("EMP-0001-8");S.ctx.cli=null;S.ctx.prd=null;startCapture()'); pg.wait_for_timeout(300)
    print('siguiente tras completar empresa:',pg.evaluate('nextLevelChip().label'))
    pg.click('#composer .chip:has-text("Siguiente nivel")'); pg.wait_for_timeout(500)
    print('grupo:',pg.inner_text('#chat').split('\n')[-1][:260],'| chips:',pg.inner_text('#composer').replace('\n',' | ')[:300])
    # equipo en vivo
    pg.evaluate('''()=>{S.names['u2']='Ana Pérez';const v=allVars().find(v=>v.nivel==='E');const k='OBS-777777-0';S.obs[k]={id:k,nodo:'EMP-0002-6',variable:v.id,valor:'5',no_aplica:false,fuente:'Interna',confianza:'Media',periodo:'2026-10',capturado:new Date().toISOString(),por:'u2'};S.idx=null;scheduleRender();}''')
    pg.wait_for_timeout(600)
    print('equipo:',pg.inner_text('#team-live').replace('\n',' '),'|',pg.inner_text('#team').replace('\n',' | ')[:200])
    print('registro nuevo:','nuevo' in pg.inner_text('#recent'))
    # saltar variable ya registrada por otra persona
    pg.evaluate('''()=>{S.ctx.emp='EMP-0002-6';S.ctx.prd=null;S.ctx.cli=null;S.ctx.grp=false;S.phase=null;S.dimMode=null;
      const vs=allVars().filter(v=>v.nivel==='E'&&!hasObs('EMP-0002-6',v.id));S.queue=buildQueue();window.__first=S.queue[0].vid;window.__n=S.queue.length;
      const k='OBS-888888-0';S.obs[k]={id:k,nodo:'EMP-0002-6',variable:S.queue[0].vid,valor:'7',no_aplica:false,fuente:'Interna',confianza:'Media',periodo:'2026-10',capturado:new Date(Date.now()+1000).toISOString(),por:'u2'};S.idx=null;askVar();}''')
    pg.wait_for_timeout(500)
    print('cola:',pg.evaluate('__n'),'→',pg.evaluate('S.queue.length'),'| aviso:',pg.evaluate('document.querySelector("#chat").innerText.split("\\n").filter(x=>x.includes("ya registró")).slice(-1)[0]'))
    pg.screenshot(path=TMP+'/flow1.png')
    print('errs',errs)
    b.close()

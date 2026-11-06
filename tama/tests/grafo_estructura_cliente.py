"""Grafo: empresa, cliente y producto con sus 13 corrientes."""
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
      S.nodes['PRD-0001-8']={id:'PRD-0001-8',tipo:'PRD',nombre:'Metría',padre:'EMP-0001-8',etapa:'Madurez'};
      const V={ing:allVars().find(v=>v.nombre==='Ingresos totales').id,ind:allVars().find(v=>v.nombre==='Industria').id,precio:allVars().find(v=>v.nombre==='Precio de lista').id};
      let o=0;const add=(nodo,variable,valor)=>{const id='OBS-'+String(++o).padStart(6,'0')+'-0';S.obs[id]={id,nodo,variable,valor,no_aplica:false,fuente:'Interna',confianza:'Media',periodo:'2026-10',capturado:new Date(2026,9,2,0,0,o).toISOString()};};
      add('EMP-0001-8',V.ing,1500000);add('CLI-0001-8',V.ind,'Retail');add('PRD-0001-8',V.precio,350);
      window.__V=V;S.idx=null;scheduleRender();}''')
    pg.click('.tab[data-tab="universe"]'); pg.wait_for_timeout(2500)
    print('INICIAL',pg.inner_text('#g-stats'))
    pg.evaluate('gClick(GR.map.get("EMP-0001-8"))'); pg.wait_for_timeout(2500)
    print('EMPRESA abierta',pg.inner_text('#g-stats'),'| hijos de la empresa',pg.evaluate('GR.nodes.filter(n=>n.parent==="EMP-0001-8").map(n=>n.kind+":"+n.label).join(", ")'))
    print('corrientes tenues',pg.evaluate('GR.nodes.filter(n=>n.parent==="EMP-0001-8"&&n.kind==="corr"&&n.pend).length'),'de',pg.evaluate('GR.nodes.filter(n=>n.parent==="EMP-0001-8"&&n.kind==="corr").length'))
    pg.screenshot(path=TMP+'/e1.png')
    pg.evaluate('gClick(GR.map.get("EMP-0001-8~FIN"))'); pg.wait_for_timeout(1500)
    pg.evaluate('gClick(GR.map.get("EMP-0001-8~FIN~FI1"))'); pg.wait_for_timeout(1500)
    print('áreas de Finanzas (empresa):',pg.evaluate('GR.nodes.filter(n=>n.parent==="EMP-0001-8~FIN").map(n=>n.label).join(" | ")'))
    pg.evaluate('gClick(GR.map.get("EMP-0001-8~FIN~FI1~g0"))'); pg.wait_for_timeout(1500)
    vn=pg.evaluate('GR.nodes.filter(n=>n.kind==="var"&&n.state==="cap").map(n=>n.label+"="+n.state).join(", ")')
    print('variables con dato visibles:',vn)
    pg.evaluate('gClick(GR.map.get("EMP-0001-8~FIN"))'); pg.wait_for_timeout(600)
    print('panel corriente:',pg.inner_text('#gpanel')[:260].replace('\n',' | '))
    # cliente
    pg.evaluate('gClick(GR.map.get("CLI-0001-8"))'); pg.wait_for_timeout(2000)
    print('CLIENTE corrientes',pg.evaluate('GR.nodes.filter(n=>n.parent==="CLI-0001-8").map(n=>n.label+(n.pend?"(tenue)":"")+"["+n.done+"/"+n.total+"]").join(", ")'))
    pg.evaluate('gClick(GR.map.get("CLI-0001-8~GES"))'); pg.wait_for_timeout(500)
    print('panel corriente sin variables:',pg.inner_text('#gpanel')[:240].replace('\n',' | '))
    # producto
    pg.evaluate('gClick(GR.map.get("PRD-0001-8"))'); pg.wait_for_timeout(2000)
    print('PRODUCTO corrientes con datos',pg.evaluate('GR.nodes.filter(n=>n.parent==="PRD-0001-8"&&!n.pend).map(n=>n.label+"["+n.done+"/"+n.total+"]").join(", ")'))
    pg.screenshot(path=TMP+'/e2.png')
    # capturar desde la corriente
    pg.evaluate('gClick(GR.map.get("PRD-0001-8~MER"))'); pg.wait_for_timeout(500)
    pg.click('#gpanel .btn.main'); pg.wait_for_timeout(600)
    print('chat desde corriente',pg.evaluate('S.tab'),'| cola',pg.evaluate('S.queue.length'),'| nodo',pg.evaluate('S.queue[0].nodeId'))
    print('errs',errs)
    b.close()

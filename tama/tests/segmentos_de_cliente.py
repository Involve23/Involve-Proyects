"""Segmentos de cliente: tipo, estrategia y variables que aplican según el tipo."""
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
    pg.goto('file://'+RAIZ+'/dist/principal.html'); pg.wait_for_timeout(2200)
    print('catálogo',pg.evaluate('allVars().length'),'| nuevas',pg.evaluate('allVars().filter(v=>+v.id.slice(4)>=901).length'),'| con aplica',pg.evaluate('allVars().filter(v=>v.aplica).length'))
    print('corrientes con dims nuevas',pg.evaluate('JSON.stringify(Object.fromEntries(Object.keys(SATS).map(k=>[k,SATS[k].dims.length])))'))
    pg.evaluate('''()=>{
      const names=['Involve','Doble Cinco'],dig=[8,6];
      S.nodes['GRP-0001-8']={id:'GRP-0001-8',tipo:'GRP',nombre:'Grupo Tama',padre:null,estado:'activo',alias:[]};
      names.forEach((n,i)=>{const k=String(i+1).padStart(4,'0')+'-'+dig[i];
        S.nodes['EMP-'+k]={id:'EMP-'+k,tipo:'EMP',nombre:n,padre:'GRP-0001-8',estado:'activo',alias:[]};
        S.nodes['CLI-'+k]={id:'CLI-'+k,tipo:'CLI',nombre:'Cliente de '+n,descripcion:'',padre:'EMP-'+k,estado:'activo',alias:[]};});
      S.memC={CLI:2,EMP:2,GRP:1,OBS:0};S.idx=null;scheduleRender();}''')
    pg.click('.tab[data-tab="capture"]'); pg.evaluate('chooseEmpresa()'); pg.wait_for_timeout(400)
    pg.click('#composer .chip:has-text("Involve")'); pg.wait_for_timeout(500)
    print('chips tras elegir:',pg.inner_text('#composer').replace('\n',' | ')[:400])
    # completar ficha primero
    pg.click('#composer .chip:has-text("Completar ficha")'); pg.wait_for_timeout(300)
    def chip(label): pg.click(f'#composer .chip:has-text("{label}")'); pg.wait_for_timeout(150)
    def txt(t):
        sel='#composer textarea' if pg.query_selector('#composer textarea') else '#composer input'
        pg.fill(sel,t); pg.click('#composer .btn:has-text("Registrar")'); pg.wait_for_timeout(200)
    chip('Servicios'); txt('Reclutamiento'); txt('México'); txt('Más candidatos'); txt('Plan comercial'); chip('Omitir'); pg.wait_for_timeout(700)
    print('chat tras ficha:',pg.inner_text('#chat')[-200:].replace('\n',' | '))
    # segmento 1: B2B / Adquisición
    txt('Reclutador de pyme'); chip('B2B (empresa)'); chip('Adquisición'); pg.wait_for_timeout(900)
    print('nodo CLI-0001-8',pg.evaluate('JSON.stringify({s:S.nodes["CLI-0001-8"].segmento,t:S.nodes["CLI-0001-8"].tipoCliente,e:S.nodes["CLI-0001-8"].estrategia})'))
    print('obs del segmento',pg.evaluate('Object.values(S.obs).filter(o=>o.nodo==="CLI-0001-8").map(o=>varById(o.variable).nombre+"="+o.valor).join(" | ")'))
    # otro segmento: B2C / Retención
    chip('Sí, agregar otro'); pg.wait_for_timeout(500)
    txt('Candidato final'); chip('B2C (persona)'); chip('Retención'); pg.wait_for_timeout(900)
    chip('No, ya están todos'); pg.wait_for_timeout(700)
    print('clientes de Involve',pg.evaluate('clisOf("EMP-0001-8").map(c=>c.id+":"+c.segmento+"/"+c.tipoCliente+"/"+c.estrategia).join(" ; ")'))
    # primera pregunta de perfil: debe ser de B2B (sin edad)
    q=pg.inner_text('#chat')
    print('pregunta de perfil actual (últimas líneas):',q[-330:].replace('\n',' | '))
    print('variables que aplican: B2B',pg.evaluate('varsFor(S.nodes["CLI-0001-8"]).length'),'| B2C',pg.evaluate('varsFor(clisOf("EMP-0001-8")[1]).length'),'| sin tipo',pg.evaluate('allVars().filter(v=>v.nivel==="C").length'))
    print('Rango de edad aplica a B2B?',pg.evaluate('varsFor(S.nodes["CLI-0001-8"]).some(v=>v.nombre==="Rango de edad")'),'| a B2C?',pg.evaluate('varsFor(clisOf("EMP-0001-8")[1]).some(v=>v.nombre==="Rango de edad")'))
    # grafo
    pg.click('.tab[data-tab="universe"]'); pg.wait_for_timeout(2200)
    print('etiquetas cliente',pg.evaluate('GR.nodes.filter(n=>n.kind==="cli").map(n=>n.label).join(" | ")'))
    pg.evaluate('gClick(GR.map.get("EMP-0001-8"))'); pg.wait_for_timeout(1200)
    pg.evaluate('gClick(GR.map.get("CLI-0001-8"))'); pg.wait_for_timeout(1500)
    print('corrientes del segmento B2B',pg.evaluate('GR.nodes.filter(n=>n.parent==="CLI-0001-8").map(n=>n.label.slice(0,12)+"["+n.done+"/"+n.total+"]").join(", ")'))
    pg.screenshot(path=TMP+'/seg1.png')
    print('errs',errs)
    b.close()

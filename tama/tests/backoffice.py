"""Backoffice: matriz, ficha, versiones, lanzamientos y propuestas de Claude."""
import os, tempfile
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = os.path.join(tempfile.gettempdir(), "tama-pruebas")
os.makedirs(TMP, exist_ok=True)
from playwright.sync_api import sync_playwright
errs=[]
D3=RAIZ+'/vendor/d3.min.js'; DX=RAIZ+'/vendor/docx.umd.js'
MOCK = r'''
window.__prompts=[];
window.claude={use:async(n)=>{
  if(n!=='sample') return null;
  const f=async()=>({text:''});
  f.json=async(prompt,opts)=>{ window.__prompts.push(prompt);
    const ids=[...prompt.matchAll(/^### (VAR-\d+)/gm)].map(m=>m[1]);
    return {fichas:ids.map(id=>({id,que_mide:'Qué mide propuesto para '+id,unidad:'MXN',escala:'Valor numérico',ejemplo:'1,500,000',calculo:'Dato capturado directamente; no se calcula.',frecuencia:'Mensual',dueno:'Finanzas',duplica:[],calculo_con:['VAR-999999'],depende_de:[]}))}; };
  return f; }};
'''
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_page(viewport={'width':1400,'height':900})
    pg.add_init_script(MOCK)
    pg.on('pageerror',lambda e: errs.append(('pageerror',str(e)[:400])))
    pg.on('console',lambda m: errs.append(('console',m.text[:300])) if m.type=='error' else None)
    def route(r):
        u=r.request.url
        if 'd3@7.9.0' in u: r.fulfill(body=open(D3,'rb').read(),content_type='application/javascript'); return
        if 'docx@8.5.0' in u: r.fulfill(body=open(DX,'rb').read(),content_type='application/javascript'); return
        r.continue_()
    pg.route('**/*',route)
    pg.goto('file://'+RAIZ+'/dist/principal.html'); pg.wait_for_timeout(2200)
    pg.click('.tab[data-tab="backoffice"]'); pg.wait_for_timeout(600)
    print('stats',pg.inner_text('#bo-body .statrow').replace('\n',' | '))
    print('filas visibles',pg.evaluate('document.querySelectorAll("#bo-body tbody tr").length'),'| total filtradas',pg.evaluate('boRows().length'),'| pie',pg.inner_text('#bo-body .row2:last-of-type span'))
    # filtro Finanzas
    pg.select_option('#bo-body select >> nth=0','FIN'); pg.wait_for_timeout(300)
    print('Finanzas',pg.evaluate('boRows().length'),'| áreas',pg.evaluate('document.querySelectorAll("#bo-body select")[1].options.length-1'))
    # abrir VAR-649
    pg.evaluate('BO.sel="VAR-649";BO.draft=null;renderBackoffice()'); pg.wait_for_timeout(300)
    print('panel',pg.inner_text('#bo-panel')[:420].replace('\n',' | '))
    print('relaciones por defecto',pg.evaluate('JSON.stringify({calcCon:BO.draft.calcCon,calc:BO.draft.calc,estado:BO.draft.estado})'))
    pg.screenshot(path=TMP+'/bo1.png')
    # editar pregunta y guardar sin nota -> advertencia
    pg.fill('#bo-panel textarea >> nth=0','¿Cuántas veces el valor de vida cubre el costo de adquisición?')
    pg.click('#bo-panel button:has-text("Guardar como versión nueva")'); pg.wait_for_timeout(300)
    print('sin nota:',pg.inner_text('#bo-panel .impmsg'))
    pg.fill('#bo-panel input[placeholder="Qué cambió y por qué"]','Pregunta más clara'); 
    pg.select_option('#bo-panel select >> nth=1','validada')
    pg.click('#bo-panel button:has-text("Guardar como versión nueva")'); pg.wait_for_timeout(500)
    print('guardado:',pg.inner_text('#bo-panel .impmsg'),'| v',pg.evaluate('BO.fi["VAR-649"].v'),'| q vigente',pg.evaluate('varById("VAR-649").q'),'| estado',pg.evaluate('eff(varById("VAR-649")).estado'))
    # descontinuar Modelo de venta
    pg.evaluate('BO.sel="VAR-239";BO.draft=null;renderBackoffice()'); pg.wait_for_timeout(200)
    pg.evaluate('BO.draft.estado="descontinuada";BO.nota="Se reemplaza por Tipo de cliente";boDoSave(varById("VAR-239"))'); pg.wait_for_timeout(500)
    pg.evaluate('''()=>{S.nodes['GRP-0001-8']={id:'GRP-0001-8',tipo:'GRP',nombre:'Grupo Tama',padre:null};S.nodes['EMP-0001-8']={id:'EMP-0001-8',tipo:'EMP',nombre:'Involve',padre:'GRP-0001-8'};S.nodes['CLI-0001-8']={id:'CLI-0001-8',tipo:'CLI',nombre:'Cliente de Involve',padre:'EMP-0001-8',tipoCliente:'B2B'};S.idx=null;}''')
    print('Modelo de venta en el cliente:',pg.evaluate('varsFor(S.nodes["CLI-0001-8"]).some(v=>v.id==="VAR-239")'),'| cobertura del satélite lo cuenta:',pg.evaluate('applicableNodes(varById("VAR-239")).length'))
    # lanzamiento
    pg.click('.bsub[data-bs="lanz"]'); pg.wait_for_timeout(300)
    print('pendientes',pg.evaluate('pendientes().length'))
    pg.fill('#bo-body input[placeholder="Qué incluye este lanzamiento"]','Primer lanzamiento'); pg.click('#bo-body button:has-text("Publicar el lanzamiento v1.0")'); pg.wait_for_timeout(500)
    print('lanzamiento',pg.evaluate('JSON.stringify(Object.values(BO.rel).map(r=>({n:r.nombre,total:r.total,cambios:r.cambios,estados:r.estados})))'))
    print('pendientes tras publicar',pg.evaluate('pendientes().length'))
    # nuevo cambio y lanzamiento menor
    pg.evaluate('BO.sub="matriz";BO.sel="VAR-624";BO.draft=null;renderBackoffice()'); pg.wait_for_timeout(200)
    pg.evaluate('BO.draft.unidad="Porcentaje";BO.nota="Unidad explícita";boDoSave(varById("VAR-624"))'); pg.wait_for_timeout(400)
    pg.click('.bsub[data-bs="lanz"]'); pg.wait_for_timeout(300)
    print('pendientes ahora',pg.evaluate('JSON.stringify(pendientes())'))
    pg.fill('#bo-body input[placeholder="Qué incluye este lanzamiento"]','Ajuste de unidades'); pg.click('#bo-body button:has-text("Publicar nuevo lanzamiento")'); pg.wait_for_timeout(500)
    print('lanzamientos',pg.evaluate('Object.values(BO.rel).sort((a,b)=>a.n-b.n).map(r=>r.nombre+":"+r.cambios.length).join(" , ")'))
    # claude: una y lote
    pg.click('.bsub[data-bs="matriz"]'); pg.wait_for_timeout(300)
    pg.evaluate('BO.sel="VAR-618";BO.draft=null;renderBackoffice()'); pg.wait_for_timeout(200)
    pg.click('#bo-panel button:has-text("Proponer ficha con Claude")'); pg.wait_for_timeout(900)
    print('claude una:',pg.inner_text('#bo-panel .impmsg'),'| def',pg.evaluate('BO.draft.def'),'| relación inválida filtrada',pg.evaluate('JSON.stringify(BO.draft.calcCon)'))
    pg.evaluate('BO.sel=null;BO.draft=null;BO.fCorr="ECO";renderBackoffice()'); pg.wait_for_timeout(200)
    pg.click('#bo-body button:has-text("Que Claude proponga")'); pg.wait_for_timeout(1500)
    print('lote:',pg.inner_text('#bo-body .impmsg'),'| fichas ECO guardadas',pg.evaluate('Object.keys(BO.fi).filter(id=>varById(id)&&satOf(varById(id))==="ECO").length'))
    # restaurar
    pg.evaluate('BO.sel="VAR-649";BO.draft=null;renderBackoffice()'); pg.wait_for_timeout(200)
    pg.evaluate('boRestore(varById("VAR-649"),fichaDefault(varById("VAR-649")),"v1")'); pg.wait_for_timeout(500)
    print('restaurada',pg.evaluate('BO.fi["VAR-649"].v+" "+varById("VAR-649").q.slice(0,50)+" "+eff(varById("VAR-649")).estado'))
    # csv
    csv=pg.evaluate('boCsv()'); print('CSV líneas',len(csv.split('\n')),'| cabecera',csv.split('\n')[0][:120])
    # observación con versión
    pg.evaluate('''async()=>{S.memC={OBS:0};await saveSegmento(S.nodes["EMP-0001-8"],S.nodes["CLI-0001-8"],{segmento:"X",tipo:"B2B",estrategia:"Retención"});}'''); pg.wait_for_timeout(500)
    print('obs con vver',pg.evaluate('Object.values(S.obs).map(o=>varById(o.variable).nombre+":v"+o.vver).join(" | ")'))
    pg.screenshot(path=TMP+'/bo2.png')
    print('errs',errs)
    b.close()

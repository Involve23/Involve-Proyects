"""Capturas de cada pestaña (uso: capturas_de_pantalla.py ANCHO ALTO ETIQUETA). Es una prueba de humo visual."""
import os, tempfile
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = os.path.join(tempfile.gettempdir(), "tama-pruebas")
os.makedirs(TMP, exist_ok=True)
import sys
from playwright.sync_api import sync_playwright
errs=[]
D3=RAIZ+'/vendor/d3.min.js'; DX=RAIZ+'/vendor/docx.umd.js'
W=int(sys.argv[1]) if len(sys.argv)>1 else 1440; H=int(sys.argv[2]) if len(sys.argv)>2 else 900; TAG=sys.argv[3] if len(sys.argv)>3 else 'd'
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_page(viewport={'width':W,'height':H})
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
      const id=n=>allVars().find(v=>v.nombre===n).id;
      const V={ing:id('Ingresos totales'),nps:id('NPS'),sat:id('Satisfacción y lealtad'),precio:id('Precio de lista'),costo:id('Costo por unidad'),ind:id('Industria'),mod:id('Modelo de venta'),mneto:id('Margen neto')};
      let o=0,n=0;
      const mk=(tipo,nombre,padre)=>{const k=++n;const idn=tipo+'-'+String(k).padStart(4,'0')+'-0';S.nodes[idn]={id:idn,tipo,nombre,padre,estado:'activo'};return idn;};
      const add=(nodo,variable,valor)=>{const idd='OBS-'+String(++o).padStart(6,'0')+'-0';S.obs[idd]={id:idd,nodo,variable,valor,no_aplica:false,fuente:'Interna',confianza:o%3?'Media':'Baja',periodo:'2026-04',capturado:new Date(2026,3,1,0,0,o).toISOString()};};
      const grp=mk('GRP','Grupo Tama',null);
      const nm=['Involve','Doble Cinco','Impuldesa','Involvia','Urvem'];
      for(let i=0;i<5;i++){
        const e=mk('EMP',nm[i],grp);S.nodes[e].ficha={industria:'Servicios',categoria:'cat',mercado_geo:'México',pregunta:'¿Por qué baja la recompra?',decision:'Reformular'};
        const c=mk('CLI','Cliente de '+nm[i],e);S.nodes[c].segmento='Segmento '+(i+1);S.nodes[c].tipoCliente=['B2B','B2C','B2B','B2C','B2B'][i];S.nodes[c].estrategia='Retención';
        const p=mk('PRD','Producto '+(i+1),e);S.nodes[p].etapa='Madurez';
        if(i<4){add(e,V.ing,1000+i*150);add(e,V.nps,i<2?-5:60);add(e,V.mneto,i===3?-4:12);add(c,V.sat,i%2?2:4);add(c,V.ind,'Retail');add(p,V.precio,100);add(p,V.costo,i===1?120:40);}
      }
      S.nodes['HAL-0001-0']={id:'HAL-0001-0',tipo:'HAL',nombre:'Ingresos siguen al marketing',padre:Object.values(S.nodes).find(x=>x.tipo==='EMP').id,hallazgo:'Las ventas siguen al presupuesto',insight:'x',implicacion:'y',dims:[],sats:['FIN'],obs:[],estado:'abierto',creado:'2026-04-02'};
      S.nodes['SUG-0001-0']={id:'SUG-0001-0',tipo:'SUG',nombre:'Diversificar canales',padre:S.nodes['HAL-0001-0'].padre,clase:'sugerencia',accion:'Diversificar canales de captación',responsable:'Dirección comercial',plazo:'60 días',vence:'2026-12-20',impacto:4,esfuerzo:2,estado:'propuesta',creado:'2026-10-02'};
      S.nodes['SUG-0002-0']={id:'SUG-0002-0',tipo:'SUG',nombre:'Revisar precios',padre:S.nodes['HAL-0001-0'].padre,clase:'alerta',accion:'Revisar precios',responsable:'Finanzas',plazo:'30 días',vence:'2026-09-01',impacto:3,esfuerzo:4,estado:'en curso',creado:'2026-08-02'};
      S.memC={CLI:5,EMP:5,GRP:1,OBS:0};S.idx=null;MC.sig='';scheduleRender();}''')
    pg.wait_for_timeout(500)
    tabs=['universe','capture','data','motor','analisis','sugerencias','backoffice','how']
    for t in tabs:
        if W<980: pg.click('#menubtn'); pg.wait_for_timeout(500)
        pg.click(f'.tab[data-tab="{t}"]'); pg.wait_for_timeout(1800 if t=='universe' else 700)
        if t=='universe':
            pg.evaluate('gClick(GR.map.get(GR.nodes.find(n=>n.kind==="emp").id))'); pg.wait_for_timeout(1500)
        if t=='backoffice':
            pg.evaluate('BO.fCorr="FIN";BO.sel="VAR-649";BO.draft=null;renderBackoffice()'); pg.wait_for_timeout(400)
        pg.screenshot(path=TMP+f'/g_{TAG}_{t}.png')
    if W<980: pg.click('#menubtn'); pg.wait_for_timeout(500)
    pg.click('.tab[data-tab="sugerencias"]'); pg.wait_for_timeout(300)
    pg.click('.gsub[data-gs="prio"]'); pg.wait_for_timeout(500); pg.screenshot(path=TMP+f'/g_{TAG}_prio.png')
    pg.click('.gsub[data-gs="tab"]'); pg.wait_for_timeout(600); pg.screenshot(path=TMP+f'/g_{TAG}_tablero.png',full_page=False)
    print('errs',errs)
    b.close()

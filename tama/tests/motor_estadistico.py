"""Motor estadístico: panorama, asociaciones, regresión, perfiles y pronóstico, con umbrales y datos sintéticos."""
import os, tempfile
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = os.path.join(tempfile.gettempdir(), "tama-pruebas")
os.makedirs(TMP, exist_ok=True)
import json, random
from playwright.sync_api import sync_playwright
errs=[]
D3=RAIZ+'/vendor/d3.min.js'
MOCK = r'''
window.__prompts=[];
window.claude={use:async(n)=>{ if(n!=='sample') return null;
  const f=async()=>({text:''});
  f.json=async(prompt,opts)=>{ window.__prompts.push(prompt); return {resumen:"Hay datos para asociaciones y perfiles; el pronóstico aún no.",recomendaciones:[{analisis:"asociacion",prioridad:"alta",por_que:"12 empresas con ingresos y presupuesto",accion:"Revisa la correlación",variables:[]},{analisis:"pronostico",prioridad:"baja",por_que:"Pocos periodos",accion:"Captura más periodos",variables:[]}],captura_sugerida:[]}; };
  return f; }};
'''
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_page(viewport={'width':1280,'height':900})
    pg.add_init_script(MOCK)
    pg.on('pageerror',lambda e: errs.append(('pageerror',str(e)[:400])))
    pg.on('console',lambda m: errs.append(('console',m.text[:300])) if m.type=='error' else None)
    pg.route('**/*',lambda r: r.fulfill(body=open(D3,'rb').read(),content_type='application/javascript') if 'd3@7.9.0' in r.request.url else r.continue_())
    pg.goto('file://'+RAIZ+'/dist/principal.html'); pg.wait_for_timeout(2000)
    # comprobación numérica
    print('NUM',pg.evaluate('''()=>({p_t2_10:tP2(2.0,10).toFixed(4),q90_5:tQuant(.9,5).toFixed(3),q975_30:tQuant(.975,30).toFixed(3),
      r:pearson([1,2,3,4,5],[2,4,5,4,5]).toFixed(4),sp:spearman([1,2,3,4,5],[5,6,7,8,7]).toFixed(4),
      fit:(()=>{const f=olsFit([[1],[2],[3],[4],[5]],[2.1,3.9,6.2,7.8,10.1]);return [f.beta[0].toFixed(3),f.beta[1].toFixed(3),f.r2.toFixed(4),f.p[1].toFixed(5)]})()})'''))
    # datos sintéticos
    random.seed(7)
    pg.evaluate('''()=>{
      const id=n=>allVars().find(v=>v.nombre===n).id;
      const V={ing:id('Ingresos totales'),mkt:id('Presupuesto de marketing'),mb:id('Margen bruto'),nps:id('NPS'),sat:id('Satisfacción y lealtad'),
               precio:id('Precio de lista'),dem:id('Demanda actual'),costo:id('Costo por unidad'),ind:id('Industria'),mod:id('Modelo de venta'),tam:id('Tamaño de empresa'),reg:id('Región'),edad:id('Rango de edad')};
      window.__V=V;
      let o=0,n=0;
      const mk=(tipo,nombre,padre)=>{const k=++n;const idn=tipo+'-'+String(k).padStart(4,'0')+'-0';S.nodes[idn]={id:idn,tipo,nombre,padre,estado:'activo'};return idn;};
      const grp=mk('GRP','Grupo Tama',null);
      const addObs=(nodo,variable,valor,per)=>{const idd='OBS-'+String(++o).padStart(6,'0')+'-0';S.obs[idd]={id:idd,nodo,variable,valor,no_aplica:false,fuente:'Interna',confianza:'Media',periodo:per||'2026-10',capturado:new Date(2026,9,1,0,0,o).toISOString()};return idd;};
      const inds=['Retail','Servicios','Retail','Consumo','Servicios','Retail','Consumo','Retail','Servicios','Consumo','Retail','Servicios'];
      for(let i=0;i<12;i++){
        const e=mk('EMP','Empresa '+(i+1),grp);S.nodes[e].ficha={};
        const c=mk('CLI','Cliente '+(i+1),e);
        const p=mk('PRD','Producto '+(i+1),e);S.nodes[p].etapa='Madurez';
        const ing=1000+i*120+(Math.random()-.5)*60;
        addObs(e,V.ing,Math.round(ing));addObs(e,V.mkt,Math.round(ing*.1+(Math.random()-.5)*8));addObs(e,V.mb,Math.round(30+Math.random()*20));addObs(e,V.nps,Math.round(20+Math.random()*60));
        addObs(c,V.sat,1+Math.round(Math.random()*4));
        addObs(c,V.ind,inds[i]);addObs(c,V.mod,i%3===0?'B2C':'B2B');addObs(c,V.tam,i%2?'200 empleados':'50 empleados');addObs(c,V.reg,i%4?'Centro':'Norte');addObs(c,V.edad,i%2?'25-40':'40-55');
        const pr=50+i*5+(Math.random()-.5)*6;
        addObs(p,V.precio,Math.round(pr*10)/10);addObs(p,V.dem,Math.round(1000-pr*8+(Math.random()-.5)*30));addObs(p,V.costo,Math.round(pr*.6*10)/10);
      }
      // serie de 5 y de 6 periodos
      const e0=Object.values(S.nodes).find(n=>n.tipo==='EMP'&&n.nombre==='Empresa 2').id;
      const e1=Object.values(S.nodes).find(n=>n.tipo==='EMP'&&n.nombre==='Empresa 3').id;
      ['2026-05','2026-06','2026-07','2026-08','2026-09'].forEach((per,k)=>addObs(e0,V.nps,40+k*3+(k%2),per));
      ['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09'].forEach((per,k)=>addObs(e1,V.nps,30+k*4+(k%2),per));
      S.idx=null;MC.sig='';scheduleRender();
    }''')
    pg.click('.tab[data-tab="motor"]'); pg.wait_for_timeout(600)
    print('RESUMEN',pg.inner_text('#motor-body')[:700].replace('\n',' | '))
    # asociaciones
    pg.click('.msub[data-ms="asoc"]'); pg.wait_for_timeout(500)
    print('ASOC',pg.evaluate('(()=>{const A=motorData().assoc;return JSON.stringify({testable:A.testable,total:A.total,cands:A.res.filter(x=>x.cand).map(x=>x.a.nombre+"~"+x.b.nombre+" r="+x.r.toFixed(2)+" n="+x.nEff+" padj="+x.pAdj.toFixed(4)),top:A.res.slice(0,3).map(x=>x.a.nombre+"~"+x.b.nombre+" r="+x.r.toFixed(2)+" sig="+x.sig+" stable="+x.stable)})})()'))
    # registrar un candidato
    if pg.query_selector('#motor-body button:has-text("Registrar como hallazgo")'):
        pg.click('#motor-body button:has-text("Registrar como hallazgo") >> nth=0'); pg.wait_for_timeout(500)
        print('HAL motor',pg.evaluate('nodesOf("HAL").map(h=>h.id+" "+h.nombre+" origen="+h.origen+" obs="+h.obs.length+" estado="+h.estado)'))
    # regresión
    V=pg.evaluate('window.__V')
    pg.select_option('#motor-body select', V['ing'])
    pg.wait_for_timeout(300)
    pg.evaluate("()=>{const b=[...document.querySelectorAll('#motor-body .chip')].find(x=>x.textContent==='Presupuesto de marketing');b.click();}"); pg.wait_for_timeout(300)
    pg.click('#motor-body button:has-text("Correr regresión")'); pg.wait_for_timeout(500)
    print('REG',pg.evaluate('MS.regRes?JSON.stringify({gate:MS.regRes.gate,n:MS.regRes.nEff,need:MS.regRes.need,r2:MS.regRes.fit&&MS.regRes.fit.r2.toFixed(3),b:MS.regRes.fit&&MS.regRes.fit.beta.map(x=>+x.toFixed(3)),pF:MS.regRes.fit&&MS.regRes.fit.pF.toExponential(2),cand:MS.regRes.cand}):"sin resultado"'))
    # regresión con producto (nivel producto)
    pg.evaluate('MS.regDep=window.__V.dem;MS.regInd=[window.__V.precio,window.__V.mkt];MS.regRes=runRegression(motorStatus());renderMotor()')
    print('REG2',pg.evaluate('JSON.stringify({gate:MS.regRes.gate,n:MS.regRes.nEff,inh:MS.regRes.inh,level:MS.regRes.level})'))
    # panorama y brechas
    pg.click('.msub[data-ms="panorama"]'); pg.wait_for_timeout(300)
    emp=pg.evaluate('nodesOf("EMP")[0].id')
    pg.evaluate(f'MS.brecha="{emp}";renderMotor()'); pg.wait_for_timeout(300)
    print('BRECHAS',pg.inner_text('#motor-body')[-420:].replace('\n',' | '))
    # perfiles
    pg.click('.msub[data-ms="perfiles"]'); pg.wait_for_timeout(300)
    print('PERFILES',pg.evaluate('(()=>{const P=motorStatus().pd;return JSON.stringify({clis:P.clis.length,pares:P.pairs.length,top:P.pairs.slice(0,2).map(p=>p.a.emp.nombre+"~"+p.b.emp.nombre+" "+Math.round(p.sim*100)+"% shared="+p.shared+" same="+p.same.join("/")),grupos:P.groups&&P.groups.map(g=>g.map(x=>x.emp.nombre).join("+"))})})()'))
    print('CROSS texto',pg.inner_text('#motor-body')[-300:].replace('\n',' | '))
    # pronóstico
    pg.click('.msub[data-ms="pron"]'); pg.wait_for_timeout(300)
    print('PRON1',pg.inner_text('#motor-body')[:420].replace('\n',' | '))
    keys=pg.evaluate('[...document.querySelectorAll("#motor-body select option")].map(o=>o.value+"="+o.textContent)')
    print('opciones',keys[:3])
    k6=[o for o in keys if '6 periodos' in o][0].split('=')[0]
    pg.select_option('#motor-body select',k6); pg.wait_for_timeout(300)
    print('PRON6',pg.inner_text('#motor-body')[-380:].replace('\n',' | '))
    # configuración
    pg.click('.msub[data-ms="config"]'); pg.wait_for_timeout(300)
    pg.fill('#motor-body input[aria-label="Mínimo de unidades para una correlación"]','20')
    pg.click('#motor-body button:has-text("Guardar configuración")'); pg.wait_for_timeout(400)
    print('CFG',pg.evaluate('JSON.stringify(cfg().umb.nCorr)'),'| testable ahora',pg.evaluate('motorData().assoc.testable'))
    # Claude sugiere
    pg.click('.msub[data-ms="resumen"]'); pg.wait_for_timeout(300)
    pg.click('#motor-body button:has-text("Que Claude sugiera")'); pg.wait_for_timeout(700)
    pr=pg.evaluate('window.__prompts[0]')
    print('CLAUDE prompt chars',len(pr),'| valores filtrados? (ej. 1000-1500 ingresos)',any(s in pr for s in ['Cliente 1','Empresa 1','Retail']),'| contiene nombres de variables','Ingresos totales' in pr)
    print('CLAUDE ui',pg.inner_text('#motor-body')[-420:].replace('\n',' | '))
    pg.screenshot(path=TMP+'/mo1.png',full_page=True)
    print('errs',errs)
    b.close()

"""Auditoría: todas las variables aplicables se pueden capturar por la interfaz, sin repetidos ni pendientes."""
import os, tempfile
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = os.path.join(tempfile.gettempdir(), "tama-pruebas")
os.makedirs(TMP, exist_ok=True)
from playwright.sync_api import sync_playwright
import json
errs=[]
D3=RAIZ+'/vendor/d3.min.js'
AUTO = r'''
() => {
  // responde la pregunta visible según el tipo de control en el compositor
  const c=document.querySelector('#composer');
  const sc=c.querySelector('.scale button'); if(sc){ sc.click(); return 'scale'; }
  const ta=c.querySelector('textarea'); if(ta){ ta.value='dato de prueba'; c.querySelector('.inrow .btn').click(); return 'text'; }
  const num=c.querySelector('input[type=number]'); if(num){ num.value='42'; c.querySelector('.inrow .btn').click(); return 'num'; }
  const chips=[...c.querySelectorAll('.chip')].filter(x=>!x.classList.contains('quiet'));
  if(chips.length){ chips[0].click(); return 'chip'; }
  return 'none';
}
'''
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_page(viewport={'width':1280,'height':800})
    pg.on('pageerror',lambda e: errs.append(('pageerror',str(e)[:300])))
    pg.on('console',lambda m: errs.append(('console',m.text[:200])) if m.type=='error' else None)
    pg.route('**/*',lambda r: r.fulfill(body=open(D3,'rb').read(),content_type='application/javascript') if 'd3@7.9.0' in r.request.url else (r.abort() if 'docx@' in r.request.url else r.continue_()))
    pg.goto('file://'+RAIZ+'/dist/principal.html'); pg.wait_for_timeout(2000)
    # --- auditoría estática
    st=pg.evaluate('''()=>{
      const out={total:allVars().length,tipos:{},sinOpts:[],sinPregunta:[],nivelMal:[],sinSat:[],dimMal:[],genericas:0,porNivel:{}};
      allVars().forEach(v=>{
        out.tipos[v.tipo]=(out.tipos[v.tipo]||0)+1;
        out.porNivel[v.nivel]=(out.porNivel[v.nivel]||0)+1;
        if(v.tipo==='c'&&!(v.opts&&v.opts.length)) out.sinOpts.push(v.id);
        if(!v.q||v.q.length<8) out.sinPregunta.push(v.id);
        if(!['E','P','C'].includes(v.nivel)) out.nivelMal.push(v.id);
        if(!SATS[satOf(v)]) out.sinSat.push(v.id);
        if(!DIMS[v.dim]) out.dimMal.push(v.id);
        if(/^¿Qué se sabe de «/.test(v.q)) out.genericas++;
      });
      out.prior={};Object.keys(PRIOR).forEach(k=>out.prior[k]=PRIOR[k].filter(id=>!varById(id)).length);
      return out;}''')
    print('ESTATICA',json.dumps(st,ensure_ascii=False))
    # --- recorrido dinámico: empresa + producto, todas las corrientes
    pg.click('.tab[data-tab="capture"]'); pg.wait_for_timeout(300)
    def chip(label): pg.click(f'#composer .chip:has-text("{label}")'); pg.wait_for_timeout(120)
    def txt(t):
        sel='#composer textarea' if pg.query_selector('#composer textarea') else '#composer input[type=number]'
        pg.fill(sel,t); pg.click('#composer .btn:has-text("Registrar")'); pg.wait_for_timeout(150)
    chip('Nueva empresa'); txt('Empresa Auditoría'); chip('Consumo'); txt('x'); txt('x'); txt('x'); txt('x'); chip('Omitir'); chip('Omitir'); pg.wait_for_timeout(500)
    txt('Segmento B2B'); chip('B2B (empresa)'); chip('Adquisición'); pg.wait_for_timeout(500)
    chip('Sí, agregar otro'); pg.wait_for_timeout(400)
    txt('Segmento B2C'); chip('B2C (persona)'); chip('Retención'); pg.wait_for_timeout(500)
    chip('No, ya están todos'); pg.wait_for_timeout(300)
    # perfil (Audiencia) automático de cada segmento
    kinds={}
    for _ in range(80):
        q=pg.evaluate('S.queue.length')
        if q==0 and pg.query_selector('#composer .chip:has-text("Nuevo producto")'): break
        if q==0: pg.wait_for_timeout(100); continue
        k=pg.evaluate(AUTO); kinds[k]=kinds.get(k,0)+1; pg.wait_for_timeout(25)
    chip('Nuevo producto'); txt('Producto Auditoría'); chip('Madurez'); chip('Omitir'); pg.wait_for_timeout(300)
    corrs=pg.evaluate('Object.keys(SATS)')
    res={}
    segs=pg.evaluate('clisOf(S.ctx.emp).map(c=>c.id)')
    for si,sid in enumerate(segs):
      pg.evaluate(f'captureNode("{sid}")'); pg.wait_for_timeout(200)
      for k in corrs:
        pg.evaluate(f'startCorr("{k}")'); pg.wait_for_timeout(100)
        n0=pg.evaluate('S.queue.length')
        guard=0
        while pg.evaluate('S.queue.length')>0 and guard<400:
            kk=pg.evaluate(AUTO); kinds[kk]=kinds.get(kk,0)+1; guard+=1
        res[str(si)+k]=(n0,guard)
        pg.wait_for_timeout(100)
    pg.wait_for_timeout(600)
    print('PREGUNTAS POR CORRIENTE',res)
    print('tipos de control usados',kinds)
    fin=pg.evaluate('''()=>{
      const nodes=[S.ctx.emp,S.ctx.prd,...clisOf(S.ctx.emp).map(c=>c.id)];
      const out={obs:Object.keys(S.obs).length,pend:[],dups:0};
      nodes.forEach(n=>{varsFor(S.nodes[n]).forEach(v=>{if(!hasObs(n,v.id)) out.pend.push(v.id+'@'+n);});});
      const seen={};Object.values(S.obs).forEach(o=>{const k=o.nodo+'|'+o.variable;seen[k]=(seen[k]||0)+1;});
      out.dups=Object.values(seen).filter(x=>x>1).length;
      out.aplicables=nodes.reduce((a,n)=>a+varsFor(S.nodes[n]).length,0);
      return out;}''')
    print('FINAL',json.dumps(fin,ensure_ascii=False)[:700])
    print('errs',errs[:5])
    b.close()

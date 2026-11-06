"""Prueba del servidor local: arranca el servidor con una API de Anthropic simulada y una carpeta de datos temporal,
abre la aplicación en un navegador real y revisa base de datos, sincronización en vivo, interpretación y descargas."""
import json, os, subprocess, sys, tempfile, threading, time, urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUERTO, PUERTO_API = 3188, 3989


class FalsaAnthropic(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_POST(self):
        n = int(self.headers.get('content-length', 0))
        cuerpo = json.loads(self.rfile.read(n))
        texto = '```json\n{"eco": "' + cuerpo['messages'][0]['content'][:12] + '", "modelo": "' + cuerpo['model'] + '"}\n```'
        self.send_response(200)
        self.send_header('content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'content': [{'type': 'text', 'text': texto}]}).encode())


api = HTTPServer(('127.0.0.1', PUERTO_API), FalsaAnthropic)
threading.Thread(target=api.serve_forever, daemon=True).start()
datos = tempfile.mkdtemp(prefix='tama-datos-')
env = dict(os.environ, PUERTO=str(PUERTO), DATOS_DIR=datos, ANTHROPIC_API_KEY='clave-de-prueba',
           ANTHROPIC_URL=f'http://127.0.0.1:{PUERTO_API}/v1/messages', CLAUDE_MODEL='modelo-de-prueba')
srv = subprocess.Popen(['node', os.path.join(RAIZ, 'server', 'servidor-local.mjs')], cwd=RAIZ, env=env,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
fallos = []


def verifica(nombre, ok, detalle=''):
    print(('OK    ' if ok else 'FALLA '), nombre, detalle)
    if not ok:
        fallos.append(nombre)


try:
    for _ in range(40):
        try:
            urllib.request.urlopen(f'http://127.0.0.1:{PUERTO}/api/capacidades', timeout=1)
            break
        except Exception:
            time.sleep(0.25)
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(accept_downloads=True)
        pg = ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        pg.route('**/fonts.g*', lambda r: r.abort())
        pg.goto(f'http://127.0.0.1:{PUERTO}/app/principal')
        pg.wait_for_timeout(2500)
        verifica('la aplicación usa la base local (no el modo sin base)', pg.evaluate('S.mem===false'))
        verifica('la estructura inicial está sembrada (5 empresas)', pg.evaluate('nodesOf("EMP").length') == 5,
                 str(pg.evaluate('nodesOf("EMP").map(e=>e.nombre).join(", ")')))
        verifica('hay usuario y puede escribir', pg.evaluate('S.uid') == 'local' and pg.evaluate('S.canWrite') is True)
        pg.evaluate('put("nodes","PRD-9999-0",{id:"PRD-9999-0",tipo:"PRD",nombre:"Producto de prueba",padre:"EMP-0001-8",etapa:"Madurez"})')
        pg.wait_for_timeout(700)
        archivo = os.path.join(datos, 'principal', 'nodes.json')
        verifica('lo guardado queda en datos-locales', 'PRD-9999-0' in open(archivo, encoding='utf-8').read())
        idn = pg.evaluate('mintId("OBS",6)')
        verifica('los IDs se reservan con su dígito verificador', bool(pg.evaluate('verifyId(%s)' % json.dumps(idn))), idn)
        pg2 = ctx.new_page()
        pg2.route('**/fonts.g*', lambda r: r.abort())
        pg2.goto(f'http://127.0.0.1:{PUERTO}/app/principal')
        pg2.wait_for_timeout(2000)
        pg2.evaluate('put("nodes","PRD-9998-1",{id:"PRD-9998-1",tipo:"PRD",nombre:"Desde la otra pestaña",padre:"EMP-0002-6",etapa:"Madurez"})')
        pg.wait_for_timeout(1500)
        verifica('lo que guarda otra pestaña aparece en vivo', pg.evaluate('!!S.nodes["PRD-9998-1"]'))
        r = pg.evaluate('(async()=>{const s=await window.claude.use("sample");const o=await s.json("hola desde la prueba");return JSON.stringify(o)})()')
        verifica('la interpretación llega por el proxy y devuelve JSON', json.loads(r).get('modelo') == 'modelo-de-prueba', r)
        with pg.expect_download() as d:
            pg.evaluate('window.claude.use("downloads").then(dl=>dl.save({filename:"prueba.csv",data:"a,b\\n1,2"}))')
        verifica('la descarga funciona', d.value.suggested_filename == 'prueba.csv')
        pc = ctx.new_page()
        pc.route('**/fonts.g*', lambda r: r.abort())
        pc.goto(f'http://127.0.0.1:{PUERTO}/app/captura_involve')
        pc.wait_for_timeout(2500)
        verifica('la captura por empresa arranca con su empresa sembrada', 'asistente de captura de Involve' in pc.inner_text('#chat'))
        verifica('sin errores de JavaScript', not errs, str(errs[:2]))
        b.close()
finally:
    srv.terminate()
    api.shutdown()
print('\nRESULTADO:', 'todo bien' if not fallos else 'fallaron: ' + ', '.join(fallos))
sys.exit(1 if fallos else 0)

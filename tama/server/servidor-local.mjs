#!/usr/bin/env node
/* Servidor local: sirve los HTML de dist/ y reemplaza lo que en claude.ai da la plataforma:
 *   - base de datos compartida  -> archivos JSON en datos-locales/<app>/
 *   - usuario                   -> el nombre de USUARIO_NOMBRE en .env
 *   - descargas                 -> descarga normal del navegador
 *   - interpretación con Claude -> proxy a la API de Anthropic (necesita ANTHROPIC_API_KEY en .env)
 * Sin dependencias: solo Node 18 o superior. Escucha solo en 127.0.0.1 para no exponer tu clave. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ---------- configuración (.env) ---------- */
function cargarEnv() {
  const f = path.join(RAIZ, '.env');
  if (!fs.existsSync(f)) return;
  for (const linea of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(linea);
    if (m && !linea.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
cargarEnv();
const PUERTO = Number(process.env.PUERTO || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const CLAVE = process.env.ANTHROPIC_API_KEY || '';
const MODELO = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';
const URL_API = process.env.ANTHROPIC_URL || 'https://api.anthropic.com/v1/messages';
const USUARIO = { id: process.env.USUARIO_ID || 'local', nombre: process.env.USUARIO_NOMBRE || 'Brayan' };
const DIST = path.join(RAIZ, 'dist');
const DATOS = process.env.DATOS_DIR ? path.resolve(process.env.DATOS_DIR) : path.join(RAIZ, 'datos-locales');
const SEMILLAS = path.join(RAIZ, 'semillas');
const VENDOR = path.join(RAIZ, 'vendor');

/* ---------- base de datos en archivos ---------- */
const memoria = new Map(); // app -> { coleccion -> { id -> { data, version, updatedAt } } }
const pendientes = new Map(); // archivo -> temporizador de escritura
const clientesSSE = new Map(); // app -> Set(res)
const leases = new Map(); // "app/coleccion/id" -> { holder, vence }

const archivoColeccion = (app, c) => path.join(DATOS, app, c + '.json');
function cargarApp(app) {
  if (memoria.has(app)) return memoria.get(app);
  const colecciones = {};
  const dir = path.join(DATOS, app);
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) if (f.endsWith('.json')) colecciones[f.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  } else {
    const semilla = path.join(SEMILLAS, app + '.json');
    if (fs.existsSync(semilla)) {
      const s = JSON.parse(fs.readFileSync(semilla, 'utf8'));
      const ahora = new Date().toISOString();
      for (const [c, docs] of Object.entries(s)) {
        colecciones[c] = {};
        for (const [id, data] of Object.entries(docs)) colecciones[c][id] = { data, version: 1, updatedAt: ahora };
        guardar(app, c, colecciones[c]);
      }
      console.log(`  Semilla cargada para "${app}".`);
    }
  }
  memoria.set(app, colecciones);
  return colecciones;
}
function guardar(app, c, datos) {
  const f = archivoColeccion(app, c);
  clearTimeout(pendientes.get(f));
  pendientes.set(f, setTimeout(() => {
    fs.mkdirSync(path.dirname(f), { recursive: true });
    const tmp = f + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(datos, null, 1));
    fs.renameSync(tmp, f); // escritura atómica
    pendientes.delete(f);
  }, 150));
}
function escribirTodo() {
  for (const [app, cols] of memoria) for (const [c, datos] of Object.entries(cols)) {
    const f = archivoColeccion(app, c);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, JSON.stringify(datos, null, 1));
  }
}
function avisar(app, coleccion) {
  for (const res of clientesSSE.get(app) || []) res.write(`data: ${JSON.stringify({ coll: coleccion })}\n\n`);
}

/* ---------- utilidades HTTP ---------- */
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const enviar = (res, codigo, cuerpo, tipo = 'application/json; charset=utf-8', extra = {}) => {
  res.writeHead(codigo, { 'Content-Type': tipo, 'Cache-Control': 'no-store', ...extra });
  res.end(typeof cuerpo === 'string' || Buffer.isBuffer(cuerpo) ? cuerpo : JSON.stringify(cuerpo));
};
const leerCuerpo = (req) => new Promise((ok, mal) => {
  const trozos = [];
  req.on('data', (t) => { trozos.push(t); if (Buffer.concat(trozos).length > 20e6) { mal(new Error('Cuerpo demasiado grande')); req.destroy(); } });
  req.on('end', () => { try { const s = Buffer.concat(trozos).toString('utf8'); ok(s ? JSON.parse(s) : {}); } catch (e) { mal(e); } });
  req.on('error', mal);
});
const apps = () => (fs.existsSync(DIST) ? fs.readdirSync(DIST).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5)) : []);

/* ---------- interpretación con Claude ---------- */
function extraerJson(texto) {
  let t = String(texto).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(t); } catch (e) { /* se intenta recortar */ }
  const a = t.search(/[\[{]/);
  const b = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
  if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
  throw new Error('sin JSON');
}
async function interpretar({ prompt, modo }) {
  if (!CLAVE) return { codigo: 'no_sample', mensaje: 'Falta ANTHROPIC_API_KEY en .env' };
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 120000);
  try {
    const r = await fetch(URL_API, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': CLAVE, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODELO, max_tokens: 4096, messages: [{ role: 'user', content: prompt }] }),
      signal: ctl.signal,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const codigo = r.status === 401 || r.status === 403 ? 'not_granted' : r.status === 429 ? 'rate_limited' : 'error';
      return { codigo, mensaje: (j.error && j.error.message) || 'Error ' + r.status };
    }
    const texto = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
    if (modo === 'text') return { resultado: texto };
    try { return { resultado: extraerJson(texto) }; } catch (e) { return { codigo: 'invalid_json', mensaje: 'La respuesta no era JSON' }; }
  } catch (e) {
    return { codigo: 'error', mensaje: e.name === 'AbortError' ? 'Tiempo de espera agotado' : String(e.message || e) };
  } finally { clearTimeout(t); }
}

/* ---------- páginas ---------- */
function paginaInicio() {
  const lista = apps().map((a) => `<li><a href="/app/${a}">${a}</a></li>`).join('') || '<li>No hay nada en dist/. Ejecuta <code>npm run construir</code>.</li>';
  return `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Servidor local · Tama</title>
<style>body{font:16px/1.55 system-ui,sans-serif;max-width:640px;margin:48px auto;padding:0 20px;color:#0f0f0f;background:#f2f2f2}h1{font-size:28px}li{margin:6px 0}a{color:#4c34b2;font-weight:600}.ok{color:#2e6a1a}.no{color:#806000}code{background:#fff;padding:2px 6px;border-radius:6px}</style>
<h1>Servidor local</h1>
<p>Abre una de estas aplicaciones. Cada una guarda sus datos aparte en <code>datos-locales/</code>.</p><ul>${lista}</ul>
<p>Interpretación con Claude: ${CLAVE ? `<span class="ok">activa</span> (modelo <code>${MODELO}</code>)` : '<span class="no">no configurada</span>. Sin ella, la captura sigue con una pregunta a la vez. Pon tu clave en <code>.env</code> (ver <code>.env.example</code>).'}</p>
<p>Usuario: <strong>${USUARIO.nombre}</strong></p></html>`;
}
function paginaApp(nombre) {
  const f = path.join(DIST, nombre + '.html');
  if (!fs.existsSync(f)) return null;
  let h = fs.readFileSync(f, 'utf8');
  h = h.replace('<head>', `<head>\n<script src="/__runtime.js?app=${encodeURIComponent(nombre)}"></script>`);
  // d3 y docx se sirven desde vendor/ para que funcione sin internet
  h = h.replace('https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js', '/vendor/d3.min.js').replace('https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js', '/vendor/docx.umd.js');
  return h;
}

/* ---------- ruteo ---------- */
const servidor = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const p = url.pathname;
    if (p === '/' ) return enviar(res, 200, paginaInicio(), TIPOS['.html']);
    if (p.startsWith('/app/')) {
      const h = paginaApp(decodeURIComponent(p.slice(5)));
      return h ? enviar(res, 200, h, TIPOS['.html']) : enviar(res, 404, 'No existe esa aplicación en dist/', 'text/plain; charset=utf-8');
    }
    if (p === '/__runtime.js') return enviar(res, 200, fs.readFileSync(path.join(RAIZ, 'server', 'runtime-cliente.js')), TIPOS['.js']);
    if (p.startsWith('/vendor/')) {
      const f = path.join(VENDOR, path.basename(p));
      return fs.existsSync(f) ? enviar(res, 200, fs.readFileSync(f), TIPOS['.js'], { 'Cache-Control': 'max-age=86400' }) : enviar(res, 404, 'No existe');
    }
    if (p === '/api/capacidades') return enviar(res, 200, { sample: !!CLAVE, modelo: MODELO });
    if (p === '/api/usuario') return enviar(res, 200, USUARIO);
    if (p === '/api/sample' && req.method === 'POST') {
      const cuerpo = await leerCuerpo(req);
      return enviar(res, 200, await interpretar({ prompt: String(cuerpo.prompt || ''), modo: cuerpo.modo === 'text' ? 'text' : 'json' }));
    }
    const m = /^\/api\/([^/]+)\/(db|events|exportar|importar)(?:\/([^/]+))?(?:\/([^/]+))?(?:\/(acquire))?$/.exec(p);
    if (m) {
      const [, app, tipo, coleccion, id, accion] = m;
      if (!apps().includes(app)) return enviar(res, 404, { error: 'app desconocida' });
      const cols = cargarApp(app);
      if (tipo === 'events') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
        res.write(': conectado\n\n');
        if (!clientesSSE.has(app)) clientesSSE.set(app, new Set());
        clientesSSE.get(app).add(res);
        const latido = setInterval(() => res.write(': latido\n\n'), 25000);
        req.on('close', () => { clearInterval(latido); clientesSSE.get(app).delete(res); });
        return;
      }
      if (tipo === 'exportar') return enviar(res, 200, JSON.stringify(cols, null, 1), TIPOS['.json'], { 'Content-Disposition': `attachment; filename="${app}.json"` });
      if (tipo === 'importar' && req.method === 'POST') {
        const cuerpo = await leerCuerpo(req);
        for (const [c, docs] of Object.entries(cuerpo)) { cols[c] = docs; guardar(app, c, cols[c]); avisar(app, c); }
        return enviar(res, 200, { ok: true });
      }
      if (tipo === 'db') {
        const col = (cols[coleccion] = cols[coleccion] || {});
        if (!id) {
          if (req.method !== 'GET') return enviar(res, 405, { error: 'método no permitido' });
          return enviar(res, 200, { docs: Object.entries(col).map(([i, d]) => ({ id: i, data: d.data, version: d.version, updatedAt: d.updatedAt })) });
        }
        if (accion === 'acquire' && req.method === 'POST') {
          const { holder = 'x', ttlMs = 2000 } = await leerCuerpo(req);
          const clave = `${app}/${coleccion}/${id}`, ahora = Date.now(), l = leases.get(clave);
          if (!l || l.vence < ahora || l.holder === holder) { leases.set(clave, { holder, vence: ahora + ttlMs }); return enviar(res, 200, { acquired: true }); }
          return enviar(res, 200, { acquired: false });
        }
        if (req.method === 'GET') return col[id] ? enviar(res, 200, { id, data: col[id].data, version: col[id].version }) : enviar(res, 404, { error: 'no existe' });
        if (req.method === 'PUT' || req.method === 'PATCH') {
          const data = await leerCuerpo(req), previo = col[id];
          col[id] = { data: req.method === 'PATCH' && previo ? { ...previo.data, ...data } : data, version: previo ? previo.version + 1 : 1, updatedAt: new Date().toISOString() };
          guardar(app, coleccion, col); avisar(app, coleccion);
          return enviar(res, 200, { ok: true, version: col[id].version });
        }
        if (req.method === 'DELETE') { delete col[id]; guardar(app, coleccion, col); avisar(app, coleccion); return enviar(res, 200, { ok: true }); }
      }
    }
    enviar(res, 404, 'No encontrado', 'text/plain; charset=utf-8');
  } catch (e) {
    console.error(e);
    enviar(res, 500, { error: String(e.message || e) });
  }
});

const salir = () => { escribirTodo(); process.exit(0); };
process.on('SIGINT', salir); process.on('SIGTERM', salir);
servidor.listen(PUERTO, HOST, () => {
  console.log(`\nServidor local en http://localhost:${PUERTO}`);
  console.log(`  Aplicaciones: ${apps().join(', ') || '(ninguna: ejecuta npm run construir)'}`);
  console.log(`  Interpretación con Claude: ${CLAVE ? 'activa (' + MODELO + ')' : 'NO configurada (falta ANTHROPIC_API_KEY en .env); la captura seguirá con una pregunta a la vez'}`);
  console.log(`  Datos en ${path.relative(process.cwd(), DATOS) || DATOS}\n`);
});

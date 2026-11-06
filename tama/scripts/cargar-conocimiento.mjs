#!/usr/bin/env node
/* Carga de conocimiento documental a la aplicación principal (localhost).
 *
 * Lee un archivo de carga curado (por defecto datos-de-apoyo/involve-productos/carga.json) y lo escribe
 * en el servidor local con la misma API que usa la app (/api/<app>/db). Sigue el patrón de la importación
 * de CSV: un nodo IMP como registro de origen; productos (PRD), variables nuevas (catalog), observaciones
 * (obs con origen y nota), preguntas abiertas (PRE), hallazgos (HAL) y sugerencias (SUG).
 *
 * Reglas:
 *  - Cada dato apunta a una nota concreta: {ruta, linea, cita}. Antes de escribir se comprueba que la cita
 *    aparece en la nota (±4 líneas). Si una sola cita falla, no se escribe nada.
 *  - Los IDs se reservan como mintId: contador counters/<PREFIJO> con lease (acquire) y dígito Luhn.
 *  - Idempotente: el nodo IMP guarda qué clave se cargó con qué ID; si se corre otra vez, lo ya cargado se salta.
 *  - Nunca borra. Antes de la primera escritura respalda datos-locales/<app>.
 *
 * Uso:
 *   node scripts/cargar-conocimiento.mjs --simular                 # valida todo y dice qué escribiría
 *   node scripts/cargar-conocimiento.mjs --lote=base               # origen, productos y variables nuevas
 *   node scripts/cargar-conocimiento.mjs --lote=obs:connect,obs:rh # observaciones de esos grupos
 *   node scripts/cargar-conocimiento.mjs --lote=preguntas,hallazgos
 *   node scripts/cargar-conocimiento.mjs --lote=todo
 * Opciones: --carga=<ruta> --url=http://localhost:3000 --app=principal
 * Requiere el servidor local corriendo (npm run dev). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const SIMULAR = process.argv.includes('--simular');
const URL_BASE = arg('url', 'http://localhost:3000');
const APP = arg('app', 'principal');
const CARGA = path.resolve(RAIZ, arg('carga', 'datos-de-apoyo/involve-productos/carga.json'));
const LOTES = new Set(arg('lote', SIMULAR ? 'todo' : '').split(',').filter(Boolean));
const quiere = (l) => LOTES.has('todo') || LOTES.has(l) || (l.startsWith('obs:') && LOTES.has('obs'));
const POR = process.env.USUARIO_ID || 'local';

/* ---------- utilidades de IDs (mismas reglas que 00_base_captura_clasica.js) ---------- */
function luhn(s) { let sum = 0, dbl = true; for (let i = s.length - 1; i >= 0; i--) { let d = +s[i]; if (dbl) { d *= 2; if (d > 9) d -= 9; } sum += d; dbl = !dbl; } return (10 - (sum % 10)) % 10; }
const fmtId = (p, n, w, noCheck) => { const num = String(n).padStart(w, '0'); return noCheck ? `${p}-${num}` : `${p}-${num}-${luhn(String(n))}`; };
const nowIso = () => new Date().toISOString();
const isoD = (d) => d.toISOString().slice(0, 10);
const trunc = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));

/* ---------- API del servidor local ---------- */
async function api(metodo, ruta, cuerpo) {
  const r = await fetch(`${URL_BASE}/api/${APP}/db/${ruta}`, { method: metodo, headers: { 'content-type': 'application/json' }, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  if (metodo === 'GET' && r.status === 404) return null;
  if (!r.ok) throw new Error(`${metodo} ${ruta}: ${r.status}`);
  return r.json();
}
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
async function mintId(prefijo, ancho, opt = {}) {
  const base = opt.base || 0, holder = 'carga-' + process.pid;
  for (let i = 0; i < 10; i++) {
    const l = await api('POST', `counters/${prefijo}/acquire`, { holder, ttlMs: 2000 });
    if (l.acquired) {
      const snap = await api('GET', `counters/${prefijo}`);
      let n = (snap && typeof snap.data.n === 'number' ? snap.data.n : base) + 1;
      if (opt.jump) n = opt.jump(n);
      await api('PUT', `counters/${prefijo}`, { n });
      return fmtId(prefijo, n, ancho, opt.noCheck);
    }
    await sleep(500);
  }
  throw new Error('No se pudo reservar el ID ' + prefijo);
}
const VARJUMP = (n) => (n >= 201 && n < 1001 ? 1001 : n);

/* ---------- validación de referencias ---------- */
const normal = (s) => String(s).normalize('NFC').toLowerCase().replace(/[«»"“”*`]/g, '').replace(/\s+/g, ' ').trim();
const cacheNotas = new Map();
function lineasDe(ruta) {
  if (!cacheNotas.has(ruta)) {
    const f = path.join(RAIZ, ruta);
    cacheNotas.set(ruta, fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split(/\r?\n/) : null);
  }
  return cacheNotas.get(ruta);
}
function validarRef(ref, donde) {
  if (!ref || !ref.ruta || !ref.linea || !ref.cita) return `${donde}: referencia incompleta (ruta, linea y cita son obligatorias)`;
  const ls = lineasDe(ref.ruta);
  if (!ls) return `${donde}: no existe la nota ${ref.ruta}`;
  const a = Math.max(0, ref.linea - 5), b = Math.min(ls.length, ref.linea + 4);
  const ventana = normal(ls.slice(a, b).join(' '));
  return ventana.includes(normal(ref.cita)) ? null : `${donde}: la cita «${ref.cita}» no aparece cerca de ${ref.ruta}:${ref.linea}`;
}
const refTexto = (r) => `${r.ruta.replace(/^conocimiento\//, '')} l.${r.linea}: «${r.cita}»`;

/* ---------- carga ---------- */
const C = JSON.parse(fs.readFileSync(CARGA, 'utf8'));
const errores = [];
const TIPOS_OK = { n: (v) => typeof v === 'number' && isFinite(v), p: (v) => typeof v === 'number' && isFinite(v), e: (v) => Number.isInteger(v) && v >= 1 && v <= 5, t: (v) => typeof v === 'string' && v.trim().length > 0, sn: (v) => v === 'Sí' || v === 'No', c: (v) => typeof v === 'string' };
const NIVEL_TIPO = { E: 'EMP', P: 'PRD', C: 'CLI' };
const varsNuevas = new Map(C.variables.map((v) => [v.clave, v]));
const prods = new Map(C.productos.map((p) => [p.clave, p]));

C.productos.forEach((p) => { const e = validarRef(p.ref, 'producto ' + p.clave); if (e) errores.push(e); });
C.observaciones.forEach((o) => {
  const d = `obs ${o.clave}`;
  (o.refs || [o.ref]).forEach((r) => { const e = validarRef(r, d); if (e) errores.push(e); });
  if (!/^\d{4}-\d{2}$/.test(o.periodo || '')) errores.push(`${d}: periodo debe ser AAAA-MM`);
  if (!['Alta', 'Media', 'Baja'].includes(o.confianza)) errores.push(`${d}: confianza debe ser Alta, Media o Baja`);
  if (o.nodo.startsWith('prd:') && !prods.has(o.nodo.slice(4))) errores.push(`${d}: producto desconocido ${o.nodo}`);
  if (o.variable.startsWith('nueva:')) {
    const v = varsNuevas.get(o.variable.slice(6));
    if (!v) errores.push(`${d}: variable nueva desconocida ${o.variable}`);
    else {
      if (!TIPOS_OK[v.tipo](o.valor)) errores.push(`${d}: el valor no corresponde al tipo ${v.tipo}`);
      if (v.tipo === 'c' && !v.opts.includes(o.valor)) errores.push(`${d}: «${o.valor}» no es una opción de ${v.nombre}`);
      if ((o.nodo.startsWith('prd:') ? 'P' : 'E') !== v.nivel) errores.push(`${d}: nivel de la variable (${v.nivel}) no corresponde al nodo`);
    }
  } else if (!/^VAR-\d{3,4}$/.test(o.variable)) errores.push(`${d}: variable con formato no válido`);
});
const clavesObs = new Set(C.observaciones.map((o) => o.clave));
if (clavesObs.size !== C.observaciones.length) errores.push('Hay claves de observación repetidas');
const pares = new Set();
C.observaciones.forEach((o) => { const k = o.nodo + '|' + o.variable; if (pares.has(k)) errores.push(`obs ${o.clave}: ya hay otra observación para ${k}; registra la contradicción como pregunta abierta`); pares.add(k); });
C.preguntas.forEach((q) => (q.refs || []).forEach((r) => { const e = validarRef(r, 'pregunta ' + q.clave); if (e) errores.push(e); }));
C.hallazgos.forEach((h) => (h.obs || []).forEach((k) => { if (!clavesObs.has(k)) errores.push(`hallazgo ${h.clave}: no existe la observación ${k}`); }));

if (errores.length) { console.error('No se escribió nada. Problemas en la carga:\n- ' + errores.join('\n- ')); process.exit(1); }
const grupos = [...new Set(C.observaciones.map((o) => o.grupo))];
console.log(`Carga válida: ${C.productos.length} productos, ${C.variables.length} variables nuevas, ${C.observaciones.length} observaciones (${grupos.join(', ')}), ${C.preguntas.length} preguntas, ${C.hallazgos.length} hallazgos. Todas las citas se encontraron en sus notas.`);
if (SIMULAR) process.exit(0);
if (!LOTES.size) { console.error('Indica --lote=base | obs:<grupo> | preguntas | hallazgos | todo, o usa --simular.'); process.exit(1); }

/* ---------- respaldo ---------- */
const datosApp = path.join(RAIZ, 'datos-locales', APP);
if (fs.existsSync(datosApp)) {
  const dest = path.join(process.env.RESPALDOS_DIR || path.join(os.homedir(), 'tama-respaldos'), `datos-${APP}-${nowIso().replace(/[:.]/g, '-')}`);
  fs.cpSync(datosApp, dest, { recursive: true });
  console.log('Respaldo en ' + path.relative(RAIZ, dest));
}

/* ---------- registro de origen (IMP) ---------- */
const nodos = (await api('GET', 'nodes')).docs.map((d) => d.data);
let imp = nodos.find((n) => n.tipo === 'IMP' && n.clave === C.fuente.clave);
const emp = C.fuente.empresa;
if (!nodos.find((n) => n.id === emp)) throw new Error('No existe la empresa ' + emp);
async function guardarImp() { await api('PUT', 'nodes/' + imp.id, imp); }
if (!imp) {
  if (!quiere('base')) throw new Error('Primero corre --lote=base (crea el registro de origen).');
  const id = await mintId('IMP', 4);
  imp = { id, tipo: 'IMP', clave: C.fuente.clave, nombre: C.fuente.nombre, padre: emp, prd: null, archivo: C.fuente.ruta, forma: 'documento', resumen: C.fuente.resumen, claude: false, periodo: C.fuente.periodo,
    mapa: { productos: {}, variables: {}, obs: {}, preguntas: {}, hallazgos: {}, sugerencias: {} }, nuevas: [], obs: [], creado: nowIso(), por: POR };
  await guardarImp();
  console.log(`Registro de origen ${id}`);
}
const M = imp.mapa;
const idNodo = (ref) => (ref && ref.startsWith('prd:') ? M.productos[ref.slice(4)] : ref);
const idVar = (ref) => (ref && ref.startsWith('nueva:') ? M.variables[ref.slice(6)] : ref);

/* ---------- lote base: productos y variables nuevas ---------- */
if (quiere('base')) {
  for (const p of C.productos) {
    if (M.productos[p.clave]) continue;
    const id = await mintId('PRD', 4);
    await api('PUT', 'nodes/' + id, { id, tipo: 'PRD', nombre: p.nombre, padre: emp, estado: 'activo', alias: p.alias || [], etapa: p.etapa, etapa_evidencia: `${p.etapa_evidencia} (${refTexto(p.ref)})`, descripcion: p.descripcion || '', origen: imp.id, creado: nowIso(), por: POR });
    M.productos[p.clave] = id; await guardarImp();
    console.log(`  ${id}  producto ${p.nombre} · ${p.etapa}`);
  }
  for (const v of C.variables) {
    if (M.variables[v.clave]) continue;
    const id = await mintId('VAR', 3, { noCheck: true, base: 60, jump: VARJUMP });
    await api('PUT', 'catalog/' + id, { id, dim: v.dim, nombre: v.nombre, nivel: v.nivel, fuente: v.fuente || 'I', tipo: v.tipo, q: v.q, guia: v.guia, hint: 'Propuesta desde ' + C.fuente.nombre, opts: v.opts || null, emp: v.emp || null, origen: imp.id, creado: nowIso(), por: POR });
    M.variables[v.clave] = id; imp.nuevas.push(id); await guardarImp();
    console.log(`  ${id}  variable ${v.nombre} (${v.nivel}, ${v.tipo})`);
  }
}

/* ---------- observaciones por grupo ---------- */
const catvBase = C.fuente.catalogo_base;
for (const g of grupos) {
  if (!quiere('obs:' + g)) continue;
  let n = 0;
  for (const o of C.observaciones.filter((x) => x.grupo === g)) {
    if (M.obs[o.clave]) continue;
    const nodo = idNodo(o.nodo), variable = idVar(o.variable);
    if (!nodo || !variable) throw new Error(`obs ${o.clave}: falta cargar primero el lote base`);
    const id = await mintId('OBS', 6);
    const refs = o.refs || [o.ref];
    await api('PUT', 'obs/' + id, { id, nodo, variable, valor: o.valor, no_aplica: false, fuente: 'Interna', confianza: o.confianza, periodo: o.periodo,
      nota: `${C.fuente.nombre} · ${refs.map(refTexto).join(' · ')}${o.nota ? ' · ' + o.nota : ''}`, ref: refs.map((r) => ({ ruta: r.ruta, linea: r.linea })),
      origen: imp.id, captura: 'documento', capturado: nowIso(), por: POR, catv: catvBase + Object.keys(M.variables).length, vver: 1 });
    M.obs[o.clave] = id; imp.obs.push(id); n++;
    if (n % 10 === 0) await guardarImp();
  }
  await guardarImp();
  console.log(`  obs:${g}: ${n} observaciones nuevas`);
}

/* ---------- preguntas abiertas (contradicciones y vacíos) ---------- */
if (quiere('preguntas')) {
  let n = 0;
  for (const q of C.preguntas) {
    if (M.preguntas[q.clave]) continue;
    const id = await mintId('PRE', 4);
    const prd = q.nodo && q.nodo.startsWith('prd:') ? idNodo(q.nodo) : null;
    const texto = q.texto + (q.refs && q.refs.length ? ' Fuentes: ' + q.refs.map(refTexto).join(' · ') : '');
    await api('PUT', 'nodes/' + id, { id, tipo: 'PRE', nombre: trunc(q.texto, 70), padre: emp, prd, texto, variable: idVar(q.variable) || null, imp: imp.id, clase: q.clase || 'contradicción', estado: 'abierta', creado: nowIso(), por: POR });
    M.preguntas[q.clave] = id; n++;
  }
  await guardarImp();
  console.log(`  preguntas: ${n} nuevas`);
}

/* ---------- hallazgos y sugerencias ---------- */
if (quiere('hallazgos')) {
  const catalogo = (await api('GET', 'catalog')).docs.map((d) => d.data);
  for (const h of C.hallazgos) {
    if (M.hallazgos[h.clave]) continue;
    const prd = h.nodo && h.nodo.startsWith('prd:') ? idNodo(h.nodo) : null;
    const obs = h.obs.map((k) => M.obs[k]).filter(Boolean);
    if (obs.length !== h.obs.length) throw new Error(`hallazgo ${h.clave}: faltan observaciones por cargar`);
    const hid = await mintId('HAL', 4);
    await api('PUT', 'nodes/' + hid, { id: hid, tipo: 'HAL', nombre: trunc(h.hallazgo, 70), padre: emp, prd, hallazgo: h.hallazgo, insight: h.insight, implicacion: h.implicacion, dims: h.dims, sats: h.sats, obs, origen: 'documento', imp: imp.id, estado: 'abierto', creado: nowIso(), por: POR });
    M.hallazgos[h.clave] = hid;
    const s = h.sugerencia, kv = idVar(s.kpiVar) || null, kn = idNodo(s.kpiNodo) || null;
    const v = kv && catalogo.find((x) => x.id === kv);
    const sid = await mintId('SUG', 4), ahora = nowIso(), d = new Date(); d.setDate(d.getDate() + s.dias);
    await api('PUT', 'nodes/' + sid, { id: sid, tipo: 'SUG', nombre: trunc(s.titulo, 70), padre: hid, clase: 'sugerencia', accion: s.accion, porque: s.porque, dimension: v ? v.dim : (h.dims[0] || null), responsable: s.responsable, plazo: s.plazo, vence: isoD(d),
      kpi: s.kpi_texto, kpiVar: kv, kpiNodo: kv ? kn : null, direccion: s.direccion || 'subir', meta: s.meta ?? null, base: null, impacto: s.impacto, esfuerzo: s.esfuerzo, limites: s.limites, origen: { tipo: 'hallazgo', senal: 'documento:' + h.clave }, obs, estado: 'propuesta', creado: ahora, por: POR });
    M.sugerencias[h.clave] = sid; await guardarImp();
    console.log(`  ${hid} hallazgo → ${sid} sugerencia · ${trunc(h.hallazgo, 60)}`);
  }
}
await guardarImp();
console.log('Listo.');

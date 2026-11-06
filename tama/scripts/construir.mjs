#!/usr/bin/env node
/* Ensambla los HTML autosuficientes a partir de src/.
 *   node scripts/construir.mjs                 construye todo (principal + una captura por empresa)
 *   node scripts/construir.mjs principal       solo el proyecto principal
 *   node scripts/construir.mjs captura involve solo la captura de una empresa (por su "slug")
 * La salida queda en dist/ y es exactamente lo que se publica como artefacto.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (ruta) => fs.readFileSync(path.join(RAIZ, ruta), 'utf8');
const cfg = JSON.parse(leer('src/config/variantes.json'));
const manifiesto = JSON.parse(leer('src/js/manifiesto.json'));

const estilos = () => leer('src/styles/tokens-genesis-metria.css') + '\n' + leer('src/styles/genesis.css');

/* El orden de los módulos está en src/js/manifiesto.json.
 * Primero el base clásico, luego los módulos unidos con un salto de línea, y al final el arranque. */
function script(conCaptura) {
  const [base, ...resto] = manifiesto.orden;
  const arranque = resto.pop();
  const modulos = resto.map((f) => leer('src/js/' + f)).join('\n');
  let s = leer('src/js/' + base) + modulos + '\n' + leer('src/js/' + arranque);
  if (conCaptura) s += '\n' + leer('src/js/' + manifiesto.variante_captura);
  return s;
}

function navegacion(v) {
  let nav = '';
  for (const g of v.grupos) {
    nav += `    <div class="navlabel">${g.nombre}</div>\n`;
    for (const [tab, texto, icono] of g.items) {
      const sel = tab === v.seleccionada ? 'true' : 'false';
      nav += `    <button class="tab" data-tab="${tab}" aria-selected="${sel}"><svg viewBox="0 0 24 24" aria-hidden="true">${cfg.iconos[icono]}</svg>${texto}</button>\n`;
    }
  }
  return nav;
}

function construir(v, empresa) {
  const reemplazos = (t) => (empresa ? t.replaceAll('{nombre}', empresa.nombre).replaceAll('{slug}', empresa.slug) : t);
  let html = leer('src/template/index.html');
  const datos = {
    TITULO: reemplazos(v.titulo),
    ESTILOS: estilos(),
    CLASE_BODY: v.claseBody,
    MARCA: reemplazos(v.marca),
    SUBMARCA: reemplazos(v.submarca),
    NAV: navegacion(v),
    VERSION: v.version,
    CRUMB: v.crumb,
    VISTAS_EXTRA: v.vistasExtra ? leer('src/template/vista_pendientes_con_el_equipo.html') : '',
    PRE: empresa ? `<script>window.CAPTURA_MODE={"emp": ${JSON.stringify(empresa.id)}, "nombre": ${JSON.stringify(empresa.nombre)}};</script>\n` : '',
    SCRIPT: script(v.scriptExtra),
  };
  /* Se sustituye con función para que "$" en el código no se interprete como patrón. */
  for (const [k, val] of Object.entries(datos)) html = html.replace('{{' + k + '}}', () => val);
  return html;
}

const [, , cual, slug] = process.argv;
const salida = (nombre, html) => {
  fs.mkdirSync(path.join(RAIZ, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(RAIZ, 'dist', nombre), html);
  console.log(`  dist/${nombre}  (${(html.length / 1024).toFixed(0)} KB)`);
};
const hacerPrincipal = () => salida(cfg.principal.archivo, construir(cfg.principal));
const hacerCaptura = (e) => salida(cfg.captura.archivo.replace('{slug}', e.slug), construir(cfg.captura, e));

console.log('Construyendo…');
if (!cual || cual === 'todo') {
  hacerPrincipal();
  cfg.empresas.forEach(hacerCaptura);
} else if (cual === 'principal') {
  hacerPrincipal();
} else if (cual === 'captura') {
  const empresas = slug ? cfg.empresas.filter((e) => e.slug === slug) : cfg.empresas;
  if (!empresas.length) { console.error('No existe esa empresa en src/config/variantes.json:', slug); process.exit(1); }
  empresas.forEach(hacerCaptura);
} else {
  console.error('Uso: node scripts/construir.mjs [todo|principal|captura [slug]]');
  process.exit(1);
}

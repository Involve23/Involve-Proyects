#!/usr/bin/env node
/* Revisiones rápidas que no necesitan navegador:
 *  1. todos los módulos del manifiesto existen y nada sobra en src/js
 *  2. la plantilla no deja marcadores {{…}} sin sustituir
 *  3. el script de cada variante tiene sintaxis válida (node --check) */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let fallos = 0;
const falla = (msg) => { console.error('FALLA  ' + msg); fallos++; };
const ok = (msg) => console.log('OK     ' + msg);

const manifiesto = JSON.parse(fs.readFileSync(path.join(RAIZ, 'src/js/manifiesto.json'), 'utf8'));
const esperados = new Set([...manifiesto.orden, manifiesto.variante_captura]);
const existentes = fs.readdirSync(path.join(RAIZ, 'src/js')).filter((f) => f.endsWith('.js'));
const faltan = [...esperados].filter((f) => !existentes.includes(f));
const sobran = existentes.filter((f) => !esperados.has(f));
faltan.length ? falla('Faltan módulos del manifiesto: ' + faltan.join(', ')) : ok('todos los módulos del manifiesto existen');
sobran.length ? falla('Módulos que no están en el manifiesto: ' + sobran.join(', ')) : ok('no hay módulos huérfanos');

execFileSync('node', [path.join(RAIZ, 'scripts/construir.mjs')], { stdio: 'ignore' });
const dist = path.join(RAIZ, 'dist');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tama-verificar-'));
for (const f of fs.readdirSync(dist).filter((x) => x.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(dist, f), 'utf8');
  const sinSustituir = html.match(/\{\{[A-Z_]+\}\}/g);
  sinSustituir ? falla(`${f}: marcadores sin sustituir ${[...new Set(sinSustituir)].join(', ')}`) : ok(`${f}: plantilla completa`);
  const i = html.lastIndexOf('<script>\n') + 9, j = html.lastIndexOf('\n</script>');
  const js = path.join(tmp, f.replace('.html', '.js'));
  fs.writeFileSync(js, html.slice(i, j));
  const r = spawnSync('node', ['--check', js], { encoding: 'utf8' });
  r.status === 0 ? ok(`${f}: sintaxis del script`) : falla(`${f}: ${r.stderr.split('\n').slice(0, 3).join(' ')}`);
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(fallos ? `\n${fallos} problema(s).` : '\nTodo en orden.');
process.exit(fallos ? 1 : 0);

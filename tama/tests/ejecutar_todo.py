"""Ejecuta todas las pruebas de navegador y resume el resultado.
Uso:  python3 tests/ejecutar_todo.py [--sin-construir]
Requiere:  pip install playwright   y   playwright install chromium
Una prueba falla si termina con error, si lanza una excepción de Python o si la página reporta un error de JavaScript."""
import os, subprocess, sys, time

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
PRUEBAS = [
    ('importacion_csv_privacidad', []), ('motor_estadistico', []), ('analisis_y_documento_word', []), ('sugerencias', []),
    ('completar_ficha', []), ('grafo_estructura_cliente', []), ('segmentos_de_cliente', []), ('backoffice', []),
    ('ruta_y_equipo', []), ('conversacion_por_bloques', []), ('captura_ceo', []), ('auditoria_de_variables', []),
    ('capturas_de_pantalla', ['1440', '900', 'humo']), ('servidor_local', []),
]
if '--sin-construir' not in sys.argv:
    print('Construyendo dist/ …')
    subprocess.run(['node', os.path.join(RAIZ, 'scripts', 'construir.mjs')], cwd=RAIZ, check=True, stdout=subprocess.DEVNULL)
resultados = []
for nombre, args in PRUEBAS:
    t0 = time.time()
    try:
        r = subprocess.run([sys.executable, os.path.join(AQUI, nombre + '.py'), *args], capture_output=True, text=True, timeout=300)
        salida = r.stdout + r.stderr
        mala = r.returncode != 0 or 'Traceback' in salida or "('pageerror'" in salida
        if nombre == 'auditoria_de_variables' and ('"pend": []' not in salida or '"dups": 0' not in salida):
            mala = True
    except subprocess.TimeoutExpired:
        salida, mala = 'Tiempo de espera agotado', True
    resultados.append((nombre, not mala, time.time() - t0, salida))
    print(('OK    ' if not mala else 'FALLA '), nombre.ljust(30), f'{time.time() - t0:5.1f} s')
fallidas = [r for r in resultados if not r[1]]
for nombre, _, _, salida in fallidas:
    print('\n--- ' + nombre + ' (últimas líneas) ---')
    print('\n'.join(salida.strip().split('\n')[-12:]))
print(f"\n{len(resultados) - len(fallidas)} de {len(resultados)} pruebas pasaron.")
sys.exit(1 if fallidas else 0)

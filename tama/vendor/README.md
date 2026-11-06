Copias locales de las dos librerías que la aplicación carga desde un CDN, para que el servidor local funcione sin internet y para las pruebas.

- `d3.min.js` — d3 7.9.0 (BSD-3-Clause)
- `docx.umd.js` — docx 8.5.0 (MIT)

Los HTML publicados siguen usando el CDN (cdn.jsdelivr.net) con versión fija; el servidor local cambia esas URLs por estas copias al servirlos.

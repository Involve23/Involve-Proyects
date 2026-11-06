/* ===================== Estructura de pantalla (Genesis 2.0) ===================== */
const TAB_LBL={universe:'Universo',capture:'Capturar',data:'Base de datos',motor:'Motor',analisis:'Análisis',sugerencias:'Sugerencias',backoffice:'Backoffice',how:'Cómo funciona'};
function shellSync(){
  const c=document.getElementById('crumb-sec');if(c) c.textContent=TAB_LBL[S.tab]||'';
  document.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-current',b.dataset.tab===S.tab?'page':'false'));
  document.body.classList.remove('nav-open');
  const bp=document.getElementById('bo-panel');if(bp&&S.tab!=='backoffice'){bp.hidden=true;}
  else if(typeof renderBackoffice==='function'&&S.tab==='backoffice') renderBackoffice();
  document.body.classList.toggle('bo-open',S.tab==='backoffice'&&!!BO.sel&&BO.sub==='matriz');
}
(function(){
  const mb=document.getElementById('menubtn'),sc=document.getElementById('scrim');
  if(mb) mb.addEventListener('click',()=>{const o=document.body.classList.toggle('nav-open');mb.setAttribute('aria-expanded',String(o));});
  if(sc) sc.addEventListener('click',()=>document.body.classList.remove('nav-open'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape') document.body.classList.remove('nav-open');});
  shellSync();
})();

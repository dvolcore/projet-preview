(function(factory){if(typeof define==='function'&&typeof Espo!=='undefined')define('custom:lib/ambient-scenes',[],factory);else{const api=factory();window.ProJetAmbient=api;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>api.mount(document),{once:true});else api.mount(document)}})(function(){
 'use strict';const mounted=new WeakMap();const allowed=new Set(['currents','sheen','particles','grid','orbits']);
 function mount(root){if(!root)return()=>{};const cleaners=[];root.querySelectorAll('[data-pj-ambient]').forEach(host=>{
  if(mounted.has(host)||!allowed.has(host.dataset.pjAmbient))return;
  const layer=document.createElement('div');layer.className='pj-ambient-layer';layer.setAttribute('aria-hidden','true');for(let i=0;i<3;i++){const span=document.createElement('span');layer.append(span)}
  host.classList.add('pj-ambient-host');const positioned=getComputedStyle(host).position==='static';if(positioned)host.classList.add('pj-ambient-positioned');host.prepend(layer);
  const changes=new MutationObserver(()=>{if(host.isConnected&&layer.parentElement!==host)host.prepend(layer)});changes.observe(host,{childList:true});
  const observer=new IntersectionObserver(entries=>host.classList.toggle('pj-ambient-visible',entries[0].isIntersecting),{rootMargin:'40px'});observer.observe(host);
  let frame=0,pointX=0,pointY=0;const point=event=>{pointX=event.clientX;pointY=event.clientY;if(frame)return;frame=requestAnimationFrame(()=>{frame=0;if(document.hidden||document.documentElement.classList.contains('pj-fx-off')||matchMedia('(prefers-reduced-motion:reduce)').matches)return;const b=host.getBoundingClientRect();if(!b.width||!b.height)return;host.style.setProperty('--pj-focus-x',Math.round((pointX-b.left)/b.width*100)+'%');host.style.setProperty('--pj-focus-y',Math.round((pointY-b.top)/b.height*100)+'%')})};
  host.addEventListener('pointermove',point,{passive:true});const cleanup=()=>{cancelAnimationFrame(frame);observer.disconnect();changes.disconnect();host.removeEventListener('pointermove',point);layer.remove();host.classList.remove('pj-ambient-host','pj-ambient-visible');if(positioned)host.classList.remove('pj-ambient-positioned');mounted.delete(host)};mounted.set(host,cleanup);cleaners.push(cleanup);
 });return()=>cleaners.forEach(fn=>fn())}
 document.documentElement.classList.toggle('pj-page-hidden',document.hidden);
 document.addEventListener('visibilitychange',()=>document.documentElement.classList.toggle('pj-page-hidden',document.hidden));return{mount};
});

(function(factory){
 if(typeof define==='function'&&typeof Espo!=='undefined')define('custom:lib/cinema-controls',[],factory);
 else{const api=factory();window.ProJetCinema=api;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>api.mount(document),{once:true});else api.mount(document);}
})(function(){
 'use strict';
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 let motion=!preference.matches,sound=false,audio,lastCue=0;
 const roots=new Map();
 function cue(kind='tap'){
  if(!sound||!audio||audio.state!=='running'||document.hidden||performance.now()-lastCue<140)return;
  lastCue=performance.now();const now=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();
  const settings={tap:[410,610,.07],success:[560,900,.18],blast:[180,75,.35]};const [from,to,duration]=settings[kind]||settings.tap;
  osc.type=kind==='blast'?'triangle':'sine';osc.frequency.setValueAtTime(from,now);osc.frequency.exponentialRampToValueAtTime(to,now+duration);
  gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(kind==='blast'?.035:.025,now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  osc.connect(gain);gain.connect(audio.destination);osc.start(now);osc.stop(now+duration+.015);osc.onended=()=>{osc.disconnect();gain.disconnect()};
  if(kind==='blast'){
   const buffer=audio.createBuffer(1,Math.floor(audio.sampleRate*.4),audio.sampleRate),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
   const noise=audio.createBufferSource(),filter=audio.createBiquadFilter(),level=audio.createGain();noise.buffer=buffer;filter.type='bandpass';filter.frequency.setValueAtTime(1700,now);filter.frequency.exponentialRampToValueAtTime(380,now+.35);filter.Q.value=.6;level.gain.setValueAtTime(.0001,now);level.gain.linearRampToValueAtTime(.045,now+.05);level.gain.exponentialRampToValueAtTime(.0001,now+.38);noise.connect(filter);filter.connect(level);level.connect(audio.destination);noise.start(now);noise.onended=()=>{noise.disconnect();filter.disconnect();level.disconnect()};
  }
 }
 function update(){
  document.documentElement.classList.toggle('pj-fx-off',!motion);
  for(const [root,entry] of roots){if(!root.isConnected)continue;entry.motion.textContent=motion?'Motion on':'Motion off';entry.motion.setAttribute('aria-pressed',String(motion));entry.sound.textContent=sound?'Sound on':'Sound off';entry.sound.setAttribute('aria-pressed',String(sound));}
 }
 preference.addEventListener('change',()=>{motion=!preference.matches;update();window.dispatchEvent(new CustomEvent('projet:interface-motion',{detail:{enabled:motion}}))});
 function mount(root){
  if(!root)return()=>{};const owned=[];
  root.querySelectorAll('[data-pj-cinema-controls]').forEach(slot=>{
   if(roots.has(slot))return;
   const m=document.createElement('button'),s=document.createElement('button');m.type=s.type='button';m.className=s.className='pj-cinema-control';m.setAttribute('aria-label','Toggle interface motion');s.setAttribute('aria-label','Toggle sound effects');
   const mt=()=>{motion=!motion;update();window.dispatchEvent(new CustomEvent('projet:interface-motion',{detail:{enabled:motion}}));cue('tap')};
   const st=async()=>{sound=!sound;if(sound){try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();await audio.resume()}catch(_){sound=false}}update();cue('success')};
   m.addEventListener('click',mt);s.addEventListener('click',st);slot.replaceChildren(m,s);roots.set(slot,{motion:m,sound:s});owned.push(()=>{m.removeEventListener('click',mt);s.removeEventListener('click',st);roots.delete(slot)});
  });update();return()=>owned.forEach(fn=>fn());
 }
 const api={mount,cue,get motionEnabled(){return motion},get soundEnabled(){return sound}};window.ProJetCinema=api;update();return api;
});

/* Manual story selection. All original reviews remain readable without JS. */
(() => {
 'use strict';
 const section = document.querySelector('.customer-stories');
 if (!section) return;
 const grid = section.querySelector('.stories-grid');
 const stories = [...grid.querySelectorAll('.customer-story')];
 if (stories.length < 4) return;
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
 const controls = document.createElement('div');
 controls.className = 'stories-controls';
 controls.innerHTML = '<p class="stories-status" role="status" aria-live="polite"></p><div class="stories-buttons"><button type="button" aria-label="Previous customer story">←</button><button type="button" aria-label="Next customer story">→</button></div>';
 grid.before(controls);
 const status = controls.querySelector('.stories-status');
 let current = 0;
 function show(index, animate) {
  current = (index + stories.length) % stories.length;
  // Reserve the outgoing height before reordering to prevent scroll jumps.
  if (animate) grid.style.minHeight = `${grid.getBoundingClientRect().height}px`;
  for (let offset = 0; offset < stories.length; offset++) {
   const story = stories[(current + offset) % stories.length];
   story.hidden = offset > 2;
   story.dataset.storySlot = String(offset);
   grid.appendChild(story);
  }
  status.innerHTML = `<strong>${String(current + 1).padStart(2, '0')}</strong> / ${String(stories.length).padStart(2, '0')} customer stories`;
  if (animate && !reduced.matches && typeof grid.animate === 'function') {
   grid.animate([{opacity:0.55,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'ease-out'});
  }
 }
 controls.querySelector('[aria-label="Previous customer story"]').addEventListener('click',()=>show(current-1,true));
 controls.querySelector('[aria-label="Next customer story"]').addEventListener('click',()=>show(current+1,true));
 show(0,false);
 // CSS determines the new height at each breakpoint rather than preserving a stale one.
 window.addEventListener('resize',()=>{grid.style.minHeight='';},{passive:true});
})();

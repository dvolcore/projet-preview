/* Run with PLAYWRIGHT_MODULE and CHROMIUM_PATH pointing to an installed runtime. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try{
  const p=await b.newPage({viewport:{width:1440,height:900}});
  await p.goto(process.env.SITE_URL||'http://127.0.0.1:8873/projet-preview/',{waitUntil:'domcontentloaded'});
  await p.locator('html:not(.no-js)').waitFor();await p.addStyleTag({content:'html { overflow-anchor: none; }'});await p.evaluate(()=>document.fonts.ready);
  await p.waitForTimeout(400);
  const start=await p.locator('.line-act').evaluate(e=>e.getBoundingClientRect().top+scrollY);
  await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),start+150);await p.waitForTimeout(100);
  await p.evaluate(()=>ScrollTrigger.refresh());await p.waitForTimeout(100);
  const pinError=await p.evaluate(()=>{const a=document.querySelector('.line-act'),t=ScrollTrigger.getAll().find(t=>t.trigger===a);return Math.abs(t.start-(a.getBoundingClientRect().top+scrollY));});
  assert(pinError<2,'refresh while scrolled must use document coordinates, not the current viewport offset');
  // Model late layout growth above an already pinned scene (e.g. responsive reflow).
  const beforeRefresh=await p.evaluate(()=>{
   const act=document.querySelector('.line-act');act.previousElementSibling.style.paddingBottom='1200px';
   const edge=act.getBoundingClientRect().top;
   const leaked=document.elementsFromPoint(160,180).some(e=>act.contains(e));
   return {edge,leaked};
  });
  assert(beforeRefresh.edge>180,'fixture must move the pipe section below the sample point');
  assert.equal(beforeRefresh.leaked,false,'pinned pipe content must not paint over the preceding section');
  await p.waitForTimeout(350);
  const alignment=await p.evaluate(()=>{const a=document.querySelector('.line-act'),s=a.querySelector('.line-act__stage');return {a:a.getBoundingClientRect().top,s:s.getBoundingClientRect().top,bg:getComputedStyle(s).backgroundColor}});
  assert(Math.abs(alignment.a-alignment.s)<2,'pin measurements must refresh after preceding layout changes');
  assert.notEqual(alignment.bg,'rgba(0, 0, 0, 0)','scene must carry its own opaque background');
  await p.evaluate(()=>document.querySelector('.line-act').previousElementSibling.style.paddingBottom='');await p.waitForTimeout(350);
  for(const width of [1440,700,390,1440]){
   await p.setViewportSize({width,height:900});await p.waitForTimeout(400);
   const range=await p.evaluate(()=>{const a=document.querySelector('.line-act'),t=ScrollTrigger.getAll().find(t=>t.trigger===a);return {start:t.start,end:t.end}});
   for(const y of [range.start-250,range.start+30,range.end-1,range.end+400,range.start-250]){
    await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await p.waitForTimeout(100);
    const leak=await p.evaluate(()=>{const a=document.querySelector('.line-act'),r=a.getBoundingClientRect();return [130,300,650].some(y=> (y<r.top||y>r.bottom)&&document.elementsFromPoint(160,y).some(e=>a.contains(e)));});
    assert.equal(leak,false,`scene escaped at width ${width}, scroll ${y}`);
   }
   await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),range.end);await p.waitForTimeout(150);
   assert.equal(await p.locator('#verified').evaluate(e=>e.style.opacity),'1');
   if(process.env.SCREENSHOT_DIR && (width===1440||width===390)) await p.screenshot({path:`${process.env.SCREENSHOT_DIR}/scroll-fixed-${width}.png`});
  }
  console.log('PASS: section clipping, dynamic reflow, forward/reverse scroll, four viewport transitions and final animation state.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

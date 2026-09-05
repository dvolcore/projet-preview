const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});try{
 for(const reduced of [false,true]){
  const page=await browser.newPage({reducedMotion:reduced?'reduce':'no-preference'});
  await page.goto(process.env.SITE_URL||'http://127.0.0.1:8873/projet-preview/',{waitUntil:'domcontentloaded'});
  const frame=page.locator('[data-brand-motion]');await frame.scrollIntoViewIfNeeded();
  const video=frame.locator('video');const button=frame.locator('[data-motion-toggle]');
  if(reduced){assert.equal(await video.getAttribute('src'),null);assert.equal(await video.evaluate(v=>v.paused),true)}
  else{
   await page.waitForFunction(()=>document.querySelector('[data-brand-motion] video').currentTime>.2);
   await button.click();await page.waitForFunction(()=>document.querySelector('[data-brand-motion] video').paused);
   await button.click();await page.waitForFunction(()=>!document.querySelector('[data-brand-motion] video').paused);
   await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForFunction(()=>document.querySelector('[data-brand-motion] video').paused);
   await frame.scrollIntoViewIfNeeded();await page.waitForFunction(()=>!document.querySelector('[data-brand-motion] video').paused);
   await video.evaluate(v=>{v.playbackRate=8});
   await page.waitForFunction(()=>document.querySelector('[data-brand-motion] video').ended);
   assert.equal(await button.textContent(),'Replay animation');
   const end=await video.evaluate(v=>v.currentTime);
   await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await frame.scrollIntoViewIfNeeded();
   await page.emulateMedia({reducedMotion:'reduce'});await page.emulateMedia({reducedMotion:'no-preference'});
   assert.equal(await video.evaluate(v=>v.paused),true);assert.equal(await video.evaluate(v=>v.currentTime),end);
   await button.click();await page.waitForFunction(()=>{const v=document.querySelector('[data-brand-motion] video');return !v.paused&&!v.ended&&v.currentTime<5});
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('[data-brand-motion] video').paused);
  }
  await page.close();
 }
 console.log('PASS: play once, hold at end, explicit replay, no restart on scrolling/preferences, pause/resume and reduced-motion still.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});

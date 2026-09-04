const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try{
  for(const width of [320,390,768,1440]){
   const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(process.env.SITE_URL||'http://127.0.0.1:8873/projet-preview/',{waitUntil:'domcontentloaded'});
   await page.locator('.price-motion-toggle').waitFor({state:'attached'});
   const band=page.locator('.price-band--luxe'),cards=band.locator('.price-card');
   await cards.first().scrollIntoViewIfNeeded();await page.waitForTimeout(250);
   assert.equal(await band.locator('.price-band__silk').count(),0);
   const prices=await band.locator('.price-card__figure').allTextContents();assert.deepEqual(prices,['$450–$800','$150–$300']);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   const boxes=await cards.evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return{top:r.top,height:r.height,left:r.left,right:r.right}}));
   if(width>760){assert(Math.abs(boxes[0].top-boxes[1].top)<2);assert(Math.abs(boxes[0].height-boxes[1].height)<2);}
   const toggle=band.locator('.price-motion-toggle');await toggle.click();assert.equal(await toggle.getAttribute('aria-pressed'),'true');
   assert.equal(await band.evaluate(e=>getComputedStyle(e,'::before').animationPlayState),'paused');
   await toggle.click();assert.equal(await toggle.getAttribute('aria-pressed'),'false');
   await cards.first().hover();assert.equal(await cards.first().evaluate(e=>getComputedStyle(e).transform),'none');
   assert.deepEqual(await band.locator('.price-card__figure').allTextContents(),prices);
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(50);
   assert.equal(await toggle.isVisible(),false);assert.equal(await band.evaluate(e=>getComputedStyle(e,'::before').animationName),'none');
   await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(50);
   assert.equal(await toggle.isVisible(),true);
   await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForFunction(()=>scrollY===0&&!document.querySelector('.price-band--luxe').classList.contains('is-visible'));
   assert.equal(await band.evaluate(e=>getComputedStyle(e,'::before').animationPlayState),'paused');
   assert.deepEqual(errors,[]);await page.close();
  }
  const page=await browser.newPage({javaScriptEnabled:false});await page.goto(process.env.SITE_URL||'http://127.0.0.1:8873/projet-preview/',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('.price-motion-toggle').count(),0);assert.equal(await page.locator('.price-card__facts').count(),2);await page.close();
  console.log('PASS: four pricing widths, aligned cards, stable prices, pause/resume, reduced-motion changes, no tilt, offscreen pause, no-JS and console checks.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});

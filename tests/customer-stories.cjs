const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});try{
 for(const width of [320,390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.SITE_URL||'http://127.0.0.1:8873/projet-preview/',{waitUntil:'domcontentloaded'});
  const section=page.locator('.customer-stories');await section.locator('.stories-controls').waitFor();await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await section.locator('.customer-story:visible').count(),3);
  const expected=['David Heyburn, April 2026','Tara Odom, May 2026','Alexis McDaniel, April 2026','Sadie Davis, June 2026','Dylan Stoetzer, June 2026'];
  const quotes=await section.locator('.customer-story blockquote').allTextContents();
  const next=section.getByRole('button',{name:'Next customer story'});
  for(let i=0;i<5;i++){
   assert.equal(await section.locator('[data-story-slot="0"] cite').textContent(),expected[i]);
   const feature=section.locator('[data-story-slot="0"]');
   const pull=(await feature.locator('.customer-story__pull').textContent()).slice(1,-1);
   assert((await feature.locator('blockquote').textContent()).includes(pull),'pull quote must be an exact excerpt');
   await next.click();assert.equal(await next.evaluate(e=>e===document.activeElement),true);
  }
  assert.equal(await section.locator('[data-story-slot="0"] cite').textContent(),expected[0]);
  await section.getByRole('button',{name:'Previous customer story'}).click();
  assert.equal(await section.locator('[data-story-slot="0"] cite').textContent(),expected[4]);
  assert.deepEqual((await section.locator('.customer-story blockquote').allTextContents()).sort(),quotes.sort());
  assert.equal(await section.locator('.stories-grid').evaluate(e=>e.getAnimations().length),0);
  await page.emulateMedia({reducedMotion:'no-preference'});await next.click();
  await page.setViewportSize({width:width===1440?390:1440,height:900});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);await page.close();
 }
 const page=await browser.newPage({javaScriptEnabled:false});await page.goto(process.env.SITE_URL||'http://127.0.0.1:8873/projet-preview/',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('.customer-story:visible').count(),5);assert.equal(await page.locator('.stories-controls').count(),0);await page.close();
 console.log('PASS: four widths, all five original stories, exact excerpts, next/previous/wraparound, focus, reduced motion, resize, no-JS and console checks.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});

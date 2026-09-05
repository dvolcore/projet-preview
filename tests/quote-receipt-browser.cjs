const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
 const browser = await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try {
  for (const scenario of ['bare-ok','valid','network-failure']) {
   const page=await browser.newPage({reducedMotion:'reduce'}); let posts=0;
   await page.route('https://projet.test/**', async route => {
    const req=route.request();const url=new URL(req.url());
    if(req.method()==='POST') {
     posts++;assert.match(req.headers()['content-type'],/application\/x-www-form-urlencoded/);
     const fields=new URLSearchParams(req.postData());assert.ok(fields.get('request_id'));
     if(scenario==='network-failure')return route.abort();
     return route.fulfill({contentType:'application/json',body:JSON.stringify(scenario==='bare-ok'?{ok:true}:{schema_version:1,request_id:fields.get('request_id'),state:'routing_pending',accepted_at:new Date().toISOString()})});
    }
    const relative=decodeURIComponent(url.pathname).replace(/^\/projet-preview\//,'').replace(/^\//,'');
    const file=path.resolve(__dirname,'..',relative.endsWith('/')?relative+'index.html':relative);
    if(!file.startsWith(path.resolve(__dirname,'..')+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
    const ext=path.extname(file);return route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html','.js':'application/javascript','.css':'text/css'})[ext]||'application/octet-stream'});
   });
   await page.goto('https://projet.test/projet-preview/request-quote/',{waitUntil:'domcontentloaded'});
   await page.locator('#q-phone').fill('2025550123');await page.locator('#q-name').fill('Receipt Test');await page.locator('#q-message').fill('Controlled fixture, no business delivery.');
   await page.locator('button[type=submit]').click();
   await page.locator(scenario==='valid'?'.form__status.is-ok':'.form__status.is-err').waitFor();
   assert.equal(posts,1);
   if(scenario==='valid') {
    assert.equal(await page.locator('#q-name').inputValue(),'');
    assert.match(await page.locator('.form__status').innerText(),/appointment has not been confirmed/);
   } else {
    assert.equal(await page.locator('#q-name').inputValue(),'Receipt Test');
    assert.equal(await page.locator('button[type=submit]').isDisabled(),true);
    assert.match(await page.locator('.form__status').innerText(),/may have been received/);
   }
   await page.close();
  }
  console.log('PASS: bare success rejected; valid durable receipt accepted; ambiguous delivery preserves fields and prevents repeated submission. All requests intercepted.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

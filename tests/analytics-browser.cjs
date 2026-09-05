const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});try{
 const page=await b.newPage({reducedMotion:'reduce'});let posts=0;const analyticsRequests=[];
 page.on('request',r=>{if(r.method()==='POST')posts++;if(/google-analytics|googletagmanager|analytics\.google/.test(r.url()))analyticsRequests.push(r.url());});
 await page.addInitScript(()=>{window.__analyticsCalls=[];window.gtag=(...args)=>window.__analyticsCalls.push(args);});
 await page.goto((process.env.SITE_URL||'http://127.0.0.1:8873/projet-preview/')+'request-quote/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.ProJetAnalytics);
 await page.evaluate(()=>{window.__drafts=[];document.addEventListener('projet:quote-email-draft-prepared',e=>window.__drafts.push(e.detail));window.ProJetQuote.buildQuoteMailto=()=>'#mock-draft';});
 await page.locator('#q-phone').fill('2025550123');await page.locator('#q-name').fill('Browser Test');await page.locator('#q-message').fill('Controlled test with no business transmission.');
 await page.locator('button[type=submit]').click();await page.locator('.form__status.is-note').waitFor();
 assert.deepEqual(await page.evaluate(()=>window.__drafts),[null]);
 assert.deepEqual(await page.evaluate(()=>window.__analyticsCalls),[]);
 assert.deepEqual(analyticsRequests,[]);assert.equal(posts,0);
 console.log('PASS: loaded default-off analytics, no provider requests, no POST, and a draft-only event with no customer payload.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});

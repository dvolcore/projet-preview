const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeEvent, createTracker } = require('../js/analytics-events.js');

test('only bounded intent events and finite metadata can leave the browser', () => {
 const event = sanitizeEvent('service_click', { service:'hydro-jetting', surface:'header', email:'person@example.com', phone:'2025550123', message:'private', url:'/?email=secret', campaign:'unknown' });
 assert.deepEqual(event, { service:'hydro-jetting', surface:'header' });
 for (const name of ['lead_created','booking_confirmed','payment_received','quote_submit_success','arbitrary']) assert.equal(sanitizeEvent(name, {}), null);
 assert.deepEqual(sanitizeEvent('call_click', {surface:'person@example.com',service:'private-address'}), {});
});

test('analytics defaults off and requires consent, an approved origin and valid destination', () => {
 const sent=[]; const win={location:{origin:'https://example.com',pathname:'/request-quote/',search:'?email=secret',hash:'#private'},gtag:(...args)=>sent.push(args)};
 const track=createTracker(win);
 assert.equal(track('call_click',{surface:'header'}),false);
 win.PROJET_ANALYTICS={enabled:true,consent:'denied',measurementId:'G-ABC123',allowedOrigin:'https://example.com'};
 assert.equal(track('call_click',{}),false);
 win.PROJET_ANALYTICS.consent='granted';win.PROJET_ANALYTICS.allowedOrigin='https://other.example';
 assert.equal(track('call_click',{}),false);
 win.PROJET_ANALYTICS.allowedOrigin='https://example.com';win.PROJET_ANALYTICS.measurementId='bad';
 assert.equal(track('call_click',{}),false);
 assert.equal(sent.length,0);
});

test('approved events discard queries, fragments, referrers and unrecognized routes', () => {
 const sent=[];const win={location:{origin:'https://example.com',pathname:'/request-quote/',search:'?email=secret',hash:'#private'},gtag:(...args)=>sent.push(args),PROJET_ANALYTICS:{enabled:true,consent:'granted',measurementId:'G-ABC123',allowedOrigin:'https://example.com'}};
 const track=createTracker(win);
 assert.equal(track('quote_email_draft_prepared',{surface:'quote_form',email:'private'}),true);
 assert.deepEqual(sent[0],['event','quote_email_draft_prepared',{surface:'quote_form',send_to:'G-ABC123',page_location:'https://example.com/request-quote/',page_referrer:''}]);
 win.location.pathname='/customer/private-address';track('call_click',{});
 assert.equal(sent[1][2].page_location,'https://example.com/');
 assert.equal(JSON.stringify(sent).includes('secret'),false);
});

test('provider failure cannot break the customer journey', () => {
 const win={location:{origin:'https://example.com',pathname:'/'},PROJET_ANALYTICS:{enabled:true,consent:'granted',measurementId:'G-ABC123',allowedOrigin:'https://example.com'},gtag:()=>{throw new Error('offline')}};
 assert.equal(createTracker(win)('call_click',{}),false);
});

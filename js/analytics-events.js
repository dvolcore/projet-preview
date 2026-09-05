/* Intent-only analytics. No provider is loaded, queued or enabled by this file. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) { root.ProJetAnalytics = api; api.init(root); }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const events = new Set(['call_click', 'text_click', 'quote_start', 'quote_email_draft_prepared', 'service_click', 'service_page_view', 'service_area_click']);
  const services = new Set(['hydro-jetting', 'camera-inspection', 'drain-clearing', 'emergency-drain-service', 'commercial']);
  const surfaces = new Set(['header', 'hero', 'footer', 'sticky_contact', 'quote_form', 'content']);
  const routes = new Set(['/', '/hydro-jetting/', '/camera-inspection/', '/drain-clearing/', '/emergency-drain-service/', '/commercial/', '/about/', '/reviews/', '/faq/', '/request-quote/', '/contact/', '/privacy/', '/accessibility/']);
  const bound = new WeakSet();

  function sanitizeEvent(name, detail) {
    if (!events.has(name)) return null;
    const safe = {};
    if (detail && surfaces.has(detail.surface)) safe.surface = detail.surface;
    if (detail && services.has(detail.service)) safe.service = detail.service;
    return safe;
  }

  function createTracker(win) {
    return function track(name, detail) {
      const params = sanitizeEvent(name, detail);
      const config = win.PROJET_ANALYTICS || {};
      if (!params || config.enabled !== true || config.consent !== 'granted' || typeof win.gtag !== 'function') return false;
      if (!/^G-[A-Z0-9]{4,15}$/.test(config.measurementId || '')) return false;
      if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(config.allowedOrigin || '') || config.allowedOrigin !== win.location.origin) return false;
      const base = /^\/(?:[a-z0-9_-]+\/)*$/i.test(config.basePath || '') ? config.basePath : '/';
      let path = String(win.location.pathname || '/').replace(/index\.html$/, '');
      if (base !== '/' && path.startsWith(base)) path = '/' + path.slice(base.length);
      if (!routes.has(path)) path = '/';
      try {
        win.gtag('event', name, { ...params, send_to: config.measurementId, page_location: config.allowedOrigin + base + path.slice(1), page_referrer: '' });
        return true;
      } catch (_) { return false; }
    };
  }

  function init(win) {
    const doc = win.document;
    if (!doc || bound.has(doc)) return;
    bound.add(doc);
    const track = createTracker(win);
    const started = new WeakSet();
    const surface = element => {
      if (element.closest('.site-header')) return 'header';
      if (element.closest('.callbar')) return 'sticky_contact';
      if (element.closest('.site-footer')) return 'footer';
      if (element.closest('form[data-quote]')) return 'quote_form';
      if (element.closest('.hero,.page-hero')) return 'hero';
      return 'content';
    };
    doc.addEventListener('click', event => {
      const link = event.target.closest?.('a[href]');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      const detail = { surface: surface(link) };
      if (/^tel:/i.test(href)) track('call_click', detail);
      else if (/^sms:/i.test(href)) track('text_click', detail);
      else {
        let url;
        try { url = new URL(href, win.location.href); } catch (_) { return; }
        if (url.origin !== win.location.origin) return;
        const service = url.pathname.replace(/\/$/, '').split('/').pop();
        if (services.has(service)) track('service_click', { ...detail, service });
        else if (['#service-area', '#area-title'].includes(url.hash)) track('service_area_click', detail);
      }
    });
    doc.addEventListener('focusin', event => {
      const form = event.target.closest?.('form[data-quote]');
      if (!form || started.has(form)) return;
      started.add(form);
      track('quote_start', { surface: 'quote_form' });
    });
    doc.addEventListener('projet:quote-email-draft-prepared', () => track('quote_email_draft_prepared', { surface: 'quote_form' }));
    const service = doc.querySelector('[data-ga-service]')?.getAttribute('data-ga-service');
    if (services.has(service)) track('service_page_view', { service, surface: 'content' });
  }
  return { sanitizeEvent, createTracker, init };
});

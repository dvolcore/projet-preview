/**
 * Pro Jet GA4 event bindings. NOT loaded by default.
 * See docs/MEASUREMENT_SETUP.md for how to enable this file and the GA4 snippet.
 *
 * Every binding checks for window.gtag before doing anything, so this file
 * is safe to load even if GA4 has not been installed yet: it will simply
 * do nothing until the gtag snippet in <head> is uncommented.
 *
 * Events sent, matching docs/MEASUREMENT_SETUP.md:
 *   call_click                       - any tel: link
 *   text_click                       - any sms: link
 *   quote_start                      - first interaction with the quote form
 *   quote_submit_success              - quote form submitted successfully
 *   service_page_view                - a service page (hydro-jetting, camera-inspection, drain-clearing)
 *   directions_or_service_area_click - a link to Google Maps directions or the service-area section
 */
(function () {
  if (typeof window.gtag !== "function") return;

  function track(name, params) {
    window.gtag("event", name, params || {});
  }

  // call_click: any tel: link, anywhere on the page (header phone, hero CTA, callbar, footer)
  document.querySelectorAll('a[href^="tel:"]').forEach(function (el) {
    el.addEventListener("click", function () {
      track("call_click", { link_location: el.closest("[class]")?.className || "unknown" });
    });
  });

  // text_click: any sms: link
  document.querySelectorAll('a[href^="sms:"]').forEach(function (el) {
    el.addEventListener("click", function () {
      track("text_click", { link_location: el.closest("[class]")?.className || "unknown" });
    });
  });

  // quote_start: first focus/input inside the quote form, fires once per page load
  var quoteForm = document.querySelector("form[data-quote]");
  if (quoteForm) {
    var started = false;
    quoteForm.addEventListener(
      "focusin",
      function () {
        if (started) return;
        started = true;
        track("quote_start", {});
      },
      { once: false }
    );

    // quote_submit_success: fires after the existing form handler confirms success.
    // site.js sets status.className = "form__status is-ok" on success; watch for that.
    var status = quoteForm.querySelector(".form__status");
    if (status && window.MutationObserver) {
      new MutationObserver(function () {
        if (status.classList.contains("is-ok")) {
          track("quote_submit_success", {});
        }
      }).observe(status, { attributes: true, attributeFilter: ["class"] });
    }
  }

  // service_page_view: opt-in via data-ga-service="hydro-jetting" on <body> or <main>
  // Add this attribute to the three service pages if you want a distinct event
  // beyond the automatic GA4 page_view.
  var serviceEl = document.querySelector("[data-ga-service]");
  if (serviceEl) {
    track("service_page_view", { service: serviceEl.getAttribute("data-ga-service") });
  }

  // directions_or_service_area_click: any Google Maps link, or any element
  // marked data-ga-directions (for example a "Service Area" nav link)
  document
    .querySelectorAll('a[href*="google.com/maps"], a[data-ga-directions]')
    .forEach(function (el) {
      el.addEventListener("click", function () {
        track("directions_or_service_area_click", {
          link_location: el.closest("[class]")?.className || "unknown",
        });
      });
    });
})();

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ProJetQuote = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const BUSINESS_EMAIL = "projetllckc@gmail.com";
  const BUSINESS_PHONE_DISPLAY = "(816) 506-6243";
  const BUSINESS_PHONE_TEL = "+18165066243";

  function isPreviewEnv(loc) {
    if (!loc) return false;
    const protocol = String(loc.protocol || "");
    const hostname = String(loc.hostname || "").toLowerCase();
    if (protocol === "file:") return true;
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    return hostname.endsWith(".github.io");
  }

  function normalizePhone(value) {
    let digits = String(value || "").replace(/\D/g, "");
    if (digits.length === 11 && digits.charAt(0) === "1") digits = digits.slice(1);
    return digits;
  }

  function normalizeFieldValue(value) {
    return String(value || "").trim();
  }

  function validateQuote(fields) {
    const name = normalizeFieldValue(fields && fields.name);
    const email = normalizeFieldValue(fields && fields.email);
    const zip = normalizeFieldValue(fields && fields.zip);
    const message = normalizeFieldValue(fields && fields.message);
    const phone = normalizePhone(fields && fields.phone);
    const invalid = {
      phone: phone.length !== 10,
      name: name.length < 2,
      email: email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      zip: zip.length > 0 && !/^\d{5}$/.test(zip),
      message: message.length < 10
    };
    return {
      ok: !Object.values(invalid).some(Boolean),
      invalid,
      normalized: { phone, name, email, zip, message }
    };
  }

  function buildQuoteMailto(fields) {
    const normalizedPhone = normalizePhone(fields && fields.phone);
    const bodyLines = [
      "Quote request",
      "",
      "Name: " + normalizeFieldValue(fields && fields.name),
      "Phone: " + normalizedPhone,
      "Email: " + normalizeFieldValue(fields && fields.email),
      "ZIP code: " + normalizeFieldValue(fields && fields.zip),
      "Service requested: " + normalizeFieldValue(fields && fields.service),
      "Urgency: " + normalizeFieldValue(fields && fields.urgency),
      "Preferred contact: " + normalizeFieldValue(fields && fields.contact_pref),
      "",
      "Job details:",
      normalizeFieldValue(fields && fields.message)
    ].filter(function (line, index, arr) {
      if (index <= 1 || line.indexOf(": ") === -1) return true;
      return !line.endsWith(": ");
    });
    const subjectBase = normalizeFieldValue(fields && fields.name) || "Website visitor";
    return "mailto:" + BUSINESS_EMAIL
      + "?subject=" + encodeURIComponent("Quote request - " + subjectBase)
      + "&body=" + encodeURIComponent(bodyLines.join("\n"));
  }

  return {
    BUSINESS_EMAIL: BUSINESS_EMAIL,
    BUSINESS_PHONE_DISPLAY: BUSINESS_PHONE_DISPLAY,
    BUSINESS_PHONE_TEL: BUSINESS_PHONE_TEL,
    buildQuoteMailto: buildQuoteMailto,
    isPreviewEnv: isPreviewEnv,
    normalizePhone: normalizePhone,
    validateQuote: validateQuote
  };
});

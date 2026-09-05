const test = require("node:test");
const assert = require("node:assert/strict");

const quote = require("../js/quote-preview.js");

test("preview detection only flips for preview hosts", () => {
  assert.equal(quote.isPreviewEnv({ protocol: "http:", hostname: "dvolcore.github.io" }), true);
  assert.equal(quote.isPreviewEnv({ protocol: "http:", hostname: "localhost" }), true);
  assert.equal(quote.isPreviewEnv({ protocol: "file:", hostname: "" }), true);
  assert.equal(quote.isPreviewEnv({ protocol: "https:", hostname: "projet.midmissouri.us" }), false);
});

test("phone normalization strips punctuation and a leading country code", () => {
  assert.equal(quote.normalizePhone("(816) 506-6243"), "8165066243");
  assert.equal(quote.normalizePhone("+1 816 506 6243"), "8165066243");
});

test("validation matches the quote form rules", () => {
  const valid = quote.validateQuote({
    name: "Alex Smith",
    email: "",
    phone: "(816) 506-6243",
    zip: "64029",
    message: "Kitchen line backing up near the sink."
  });
  assert.equal(valid.ok, true);
  assert.deepEqual(valid.invalid, {
    phone: false,
    name: false,
    email: false,
    zip: false,
    message: false
  });

  const invalid = quote.validateQuote({
    name: "A",
    email: "bad",
    phone: "",
    zip: "12",
    message: "short"
  });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.invalid.phone, true);
  assert.equal(invalid.invalid.name, true);
  assert.equal(invalid.invalid.email, true);
  assert.equal(invalid.invalid.zip, true);
  assert.equal(invalid.invalid.message, true);
});

test("mailto builder keeps optional blanks out of the draft", () => {
  const mailto = quote.buildQuoteMailto({
    name: "Alex Smith",
    email: "",
    phone: "(816) 506-6243",
    zip: "64029",
    service: "Hydro Jetting",
    urgency: "Soon",
    contact_pref: "Text",
    message: "Kitchen line backing up near the sink."
  });

  assert.match(mailto, /^mailto:projetllckc@gmail\.com\?/);
  assert.match(mailto, /Phone%3A%208165066243/);
  assert.doesNotMatch(mailto, /Email%3A%20&/);
  assert.match(mailto, /Job%20details%3A/);
});


test("receipt requires durable evidence for this exact request", () => {
  const id = "9fdbfb22-f79c-4bd1-a584-858e29c26b3f";
  const receipt = { schema_version: 1, request_id: id, state: "routing_pending", accepted_at: "2026-09-05T01:00:00Z" };
  assert.equal(quote.validateReceipt(receipt, id), true);
  for (const state of ["received", "routed", "owner_acknowledged"]) {
    assert.equal(quote.validateReceipt({ ...receipt, state }, id), true);
  }
  for (const invalid of [null, {ok:true}, {}, {...receipt, request_id:"other"}, {...receipt, state:"booked"}, {...receipt, accepted_at:"bad"}, {...receipt, accepted_at:"2026-02-30T01:00:00Z"}, {...receipt, schema_version:2}]) {
    assert.equal(quote.validateReceipt(invalid, id), false);
  }
});

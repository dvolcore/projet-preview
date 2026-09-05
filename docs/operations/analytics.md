# Analytics: installed instrumentation, activation pending

`js/analytics-events.js` is a local, provider-neutral intent collector. It loads no external provider, uses no storage and sends nothing by default. It is not CRM attribution or revenue tracking.

Allowed events: `call_click`, `text_click`, `quote_start`, `quote_email_draft_prepared`, `service_click`, `service_page_view`, `service_area_click`. Only allowlisted service IDs and location categories (header, hero, footer, sticky contact, form, content) are accepted. Names, phone numbers, email, addresses, free text, unrestricted referrers and query/hash values are not transmitted. Unknown page paths reduce to the approved site root.

The browser cannot report `lead_created`, `booking_confirmed`, `payment_received` or a trusted quote submission. A mailto draft is an intent, not delivery. Backend/provider reconciliation must own those conversions; agree the receipt contract with the CRM agent.

## Activation

The marketing owner must approve the analytics account/measurement ID, final origin, consent behavior and privacy notice. Configure the public `window.PROJET_ANALYTICS` object before the local script runs:

```js
window.PROJET_ANALYTICS = {
  enabled: false,
  consent: 'unknown',
  measurementId: null,
  allowedOrigin: null,
  basePath: '/'
};
```

No credentials belong here. When approved, `enabled: true`, `consent: 'granted'`, a valid measurement ID and exact matching HTTPS origin are all required, as is an explicitly loaded provider `gtag` function. No configuration is enabled in the shipped page. Consent changes must update the setting; denied/unknown events are dropped, not queued for replay.

The eventual provider installation must also suppress automatic page views and enhanced measurements until consent and URL redaction are configured. Our event collector explicitly strips query strings and referrers, but it cannot control another script sending raw URLs. Do not simply uncomment an old GA snippet. Verify provider requests in a controlled browser before activation.

Campaign attribution still needs an approved non-personal campaign registry and the CRM mapping. Never use customer names, contacts or addresses in campaign tags. Map allowed commercial/search/referral IDs through the private lead-to-job journey, then reconcile qualified leads, bookings and paid jobs against the authoritative provider.

Checks: `node --test tests/analytics-events.test.cjs`. Browser tests must prove zero outbound analytics with defaults, valid consent gating, safe metadata and an email-draft intent distinct from a real lead receipt.

Primary guidance: [Google PII restrictions](https://support.google.com/analytics/answer/6366371?hl=en), [campaign URL guidance](https://support.google.com/analytics/answer/10917952?hl=en).

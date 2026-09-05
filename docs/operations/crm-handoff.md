# CRM integration handoff contract — version 1

This is an interface and acceptance contract, not an implemented connector. The existing CRM agent retains provider integration ownership. Share a redacted capability summary; transmit credentials only through the designated secure channel.

## Required handoff

Named platform and integration owner; sandbox/production distinction; account ownership and available plan capabilities; browser-safe public intake URL versus authenticated server endpoint; provider-native webhook signature validation; status/health interface; field mappings; contact/consent source of truth; deployment/rollback owner. Identify unsupported capabilities explicitly. Do not choose a new vendor just to match this document.

Use stable `lead_id`, `customer_id`, `property_id`, `job_id`, `estimate_id`, `invoice_id`, `payment_id`. Private systems hold names, contact channels, addresses and notes. Browser analytics must never receive those values or unrestricted free text, URLs or query strings. Preserve allowed campaign/source identifiers through the private job journey.

## Lead acceptance receipt

Typed server response contract (names may map to provider-native equivalents):

| Field | Type / requirement |
|---|---|
| schema_version | integer 1 |
| request_id | opaque string; stable across retry |
| lead_id | opaque string after durable persistence only |
| state | enum `accepted`, `pending_assignment`, `rejected` |
| assigned_owner_id | opaque string for assigned lead; null while assignment pending |
| accepted_at | UTC timestamp after successful persistence |
| duplicate | boolean indicating replay of the original accepted request |
| next_action | enum `await_contact`, `human_escalation`, `retry_later` |

Return confirmation only after durable acceptance. Assignment pending must create an owned escalation task. A draft email, validation success, network 200 without persistence, or booking request is not a booked job. Rejection/timeout must retain the honest fallback and never show a success claim.

## Events and state ownership

All private integration events: `event_id` (unique), `event_type` (allowlisted), `occurred_at` (UTC), `environment`, `aggregate_type`, `aggregate_id`, `aggregate_version` (monotonic integer), `correlation_id`, `producer`, `schema_version`. Webhook signatures are checked server-side. Never expose signing keys. Provider IDs and signature contents stay private.

Lead: received → validated → persisted → assigned → contacted → qualified / disqualified. Appointment: requested → capacity_checked → confirmed → completed / cancelled / rescheduled. Job: scheduled → dispatched → on_site → work_authorized → completed → report_approved. Finance: estimate_draft → customer_approved_version → invoice_issued → payment_pending → settled / failed / partially_refunded / refunded. These are independent state machines: job completion is not settlement, and a provider authorization is not cleared cash.

CRM owns customer/property/job truth; dispatcher/calendar owns capacity and appointment confirmation; owner-approved price book owns estimates; payment provider plus accounting reconciliation owns paid state; technician owns diagnosis/work completion/report approval. Website renders approved states without manufacturing them.

## Reliability and control

Persist idempotency key and result before acknowledging; repeated request IDs return the original receipt. Deduplicate event IDs at each consumer. Reject stale aggregate versions; reconcile out-of-order events against authoritative current state. No last-write-wins payment or consent logic. Use a transactional outbox or equivalent provider-supported durable delivery.

Retry transient failures with bounded exponential backoff/jitter and a documented maximum. Validation/authentication failures require repair, not infinite retry. Retry exhaustion, owner-assignment failure, signature failures and reconciliation mismatches go to a durable failure queue with accountable operator, age, reason and next action. Alerts contain no customer details; link to restricted records. Replay with original idempotency keys after correction. Do not replay opt-outs or duplicate customer communications.

Capacity checks include crew/equipment, travel zones, service duration, buffers, working hours, emergency reserve and timezone. Atomic reservation prevents concurrent double booking. Unknown capacity produces a request for human confirmation. Cancellation/reschedule must release/update capacity once.

Private customer portal enforces per-customer/per-property access and revoked sharing. Hosted payment flow owns card handling; website never stores card data. Media retains original footage plus technician-approved findings and retention policy.

## Controlled acceptance evidence

Record environment, date, named reviewer, request/event IDs, expected and actual outcomes and redacted receipts. Prove: successful lead assigned once; duplicate and interrupted submit; provider timeout after persistence; spam/rate controls; exhausted retries and human fallback; simultaneous slot requests and daylight transition; estimate version approval; duplicate/out-of-order payment events; payment failure/refund/reconciliation; wrong-user portal rejection; revoked link; consent withdrawal and prompt injection; end-to-end lead → paid job → approved report.

Use sandbox and designated controlled recipients first. No real customer outreach, recording, money movement, vendor purchase or production activation is authorized merely by this handoff. Obtain specific recipients, commitments and activation scope from the owner. The readiness checker records evidence completeness, not test authenticity.

Rollback: disable automation consumers and booking promises, retain durable intake when healthy, route to assigned human, preserve queues/records, restore last known good adapter/config, reconcile before replay. Never delete CRM history as website cleanup.

## Received implementation handoff — 2026-09-04

The owner supplied the existing local adapter handoff. EspoCRM is the existing lead store and Chatwoot the contact/conversation platform. The adapter accepts name, phone, email, service, urgency, zip, contact_pref and message; its current response contains ok, correlation_id, espo_id and chatwoot_contact_id. Reuse this implementation; a contact is not an inbox conversation, notification or booking.

Fresh read-only checks confirmed the local services respond and the previously created synthetic lead/contact remain accessible. No new lead was submitted and no communication was sent. Private locations and evidence remain outside this public repository.

The deployed website is static GitHub Pages; its preview form still opens an email draft. The supplied adapter is local-only, with no identified hosted production endpoint. Idempotency, partial-failure reconciliation, scoped credentials, abuse controls and owner acknowledgment remain required before public activation. The existing agent retains backend ownership.

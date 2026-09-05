# Current operational checklist

As of 2026-09-05 UTC. This is the single current operational backlog. Roles are not assigned people. No external connection is represented as verified. Dependencies and acceptance tests are in each row; follow prerequisite order instead of activating everything at once.

Local implementation verified: SEO builder/auditor (29 fixture tests), readiness checker (10 fixture tests), intent analytics (4 privacy/gating tests plus browser check), existing quote tests (4), current website regressions, retired preview redirects, removal of unused assets and stale AI-readable claims. A generated preview package passes its SEO audit. Repository CI is prepared as an inactive template; GitHub rejected installation because the current connection lacks workflow permission. No external business integration is activated by these deliveries.

## Activation boundaries

P0: reconcile facts/domain and receive CRM handoff, validate durable intake and staffed response, prepare SEO/migration and privacy/rollback. P1: controlled sandbox workflow → owner-approved production pilot. P2: AI/follow-up and acquisition scale only after capacity and financial truth are proven. Public account changes, live messages, bookings, payments and subscriptions require designated owner/configuration and explicit activation scope. A fixture is not production evidence.

| ID / priority | Work / accountable role to assign | Prerequisite / exact acceptance evidence | Status |
|---|---|---|---|
| F01 P0 | Approved fact register — owner | Legal/trading name, public contact/service area, hours/emergency promises, authoritative prices, warranties and permitted claims approved with date. Reconcile $350–600 vs $450–800 everywhere, including legacy FAQ. | BLOCKED — external evidence/owner needed |
| F02 P0 | Final domain and hosting — owner + deployer | Domain/DNS access through secure channel; deployment target, HTTPS and rollback approved; canonical/indexation tests pass. Keep staged build non-indexable. | BLOCKED — external evidence/owner needed |
| F03 P0 | CRM handoff — CRM agent + integration owner | Named provider, sandbox/production boundaries, capability map and redacted test receipts; no browser secrets. Establish customer/property/job/source IDs. | BLOCKED — external evidence/owner needed |
| F04 P0 | Durable lead intake — CRM agent | Controlled submit persists once, assigned owner, visible acknowledgment only after acceptance, stable ID, duplicate submit/network retry tests, dead-letter/failure alert and fallback proof. Spam/rate controls and server validation. | BLOCKED — external evidence/owner needed |
| F05 P0 | Contact ownership — owner + dispatcher | Staffed responder, response/escalation targets, after-hours and urgent fallback, coverage/capacity limitations. Test human takeover and unanswered fallback. | BLOCKED — external evidence/owner needed |
| F06 P0 | Phone/SMS integration — telephony owner | Current number/provider ownership, porting necessity, missed-call/call-routing test, messaging registration/consent and opt-out handling verified with provider. No outbound campaign activated here. | BLOCKED — external evidence/owner needed |
| S01 P0 | SEO deployment builder/audit — website engineer | Per-page approved origin/canonical, valid internal URLs, correct indexable sitemap, preview exclusion, real 404 behavior, robots and social metadata; output does not mutate source. | BUILT/LOCAL-TESTED — final origin, price checks and deployment verification pending |
| S02 P0 | Legacy migration — deployer | Old-to-new URL inventory, one-hop permanent redirects on controllable legacy host, no redirect loops, preserve valuable pages/backlinks; owner confirms retirement plan. | BLOCKED — external evidence/owner needed |
| S03 P1 | Search Console/GBP/Bing — owner + SEO operator | Verified accounts and matching business facts; submitted sitemap, indexing inspection, correct primary category/service areas/hours, website link. Do not invent storefronts or expose private residential address. | BLOCKED — external evidence/owner needed |
| S04 P1 | Search content/proof — owner + content operator | Service-intent pages with authentic job evidence, technician-approved facts, internal links, accurate image descriptions; source-backed testimonials. No fabricated locality doorway pages or self-serving rating markup. | BLOCKED — external evidence/owner needed |
| S05 P1 | Local ranking baseline — SEO operator | Timestamped service-query/location sample across actual service area, Maps separate from organic; Search Console/call/qualified-lead baseline. No unsupported top-1% claims. | BLOCKED — external evidence/owner needed |
| S06 P1 | Performance/accessibility — website engineer | Existing browser regressions plus keyboard/form/contrast/mobile and optimized media; controlled lab record; field metrics when enough real data exists. Fix measured problems, preserve cinematic identity. | BROWSER REGRESSIONS PASS — measured performance/accessibility audit and field data remain |
| O01 P1 | Dispatch/calendar — dispatcher + CRM agent | Crew/equipment/service durations, travel radius, buffers, emergency capacity and working hours; concurrency tests prevent double booking. Requests cannot claim confirmation. | BLOCKED — external evidence/owner needed |
| O02 P1 | Approved estimating — owner + CRM agent | Price book, diagnostic/repair exclusions, taxes/fees and approval limits; estimates tied to job and versioned customer approval, no AI binding quote. | BLOCKED — external evidence/owner needed |
| O03 P1 | Invoice/payment/accounting — finance owner | Current providers/account mappings, hosted secure payment flow; sandbox payment/refund/failure/reconciliation and duplicate-webhook tests; no card data stored by website. | BLOCKED — external evidence/owner needed |
| O04 P1 | Job/report/portal — technician lead + CRM agent | Permissioned property/job records, original footage storage, technician-approved findings, correct customer-only access, expiring/revocable sharing and invoice/history continuity. | BLOCKED — external evidence/owner needed |
| O05 P1 | Privacy/security/continuity — owner + platform operator | Data inventory, notices matching actual providers, retention/deletion/access controls, MFA/least privilege, backup and restore, credential rotation, audit trails and incident owner. Appropriate professional review of consent/recording requirements. | BLOCKED — external evidence/owner needed |
| A01 P1 | Analytics/source attribution — website engineer + marketing owner | Safe event semantics, approved consent/provider IDs, campaign retention rules, deduped CRM conversion reconciliation; clicks/drafts separate from persisted leads and paid jobs. | INTENT COLLECTOR BUILT/TESTED, DEFAULT OFF — provider, consent, campaign mapping and CRM reconciliation pending |
| A02 P2 | AI receptionist — owner + CRM agent | Approved knowledge, approved disclosure/escalation policy, coverage/capacity tools, outage fallback, adversarial test cases, private-data boundary; controlled pilot before public activation. | BLOCKED — external evidence/owner needed |
| A03 P2 | AI dispatch/report assistance — technician lead | Missing-field detection and drafts from real records; reviewed reports retain source media. No autonomous diagnosis or repair authorization. | BLOCKED — external evidence/owner needed |
| A04 P2 | Follow-up/maintenance/reviews — owner + marketing operator | State-driven eligibility, consent/preferences, quiet hours, opt-outs, frequency caps, cancellation on response, idempotency; unbiased review requests. Approve templates and controlled test recipients before activation. | BLOCKED — external evidence/owner needed |
| A05 P2 | Owner dashboard — finance/operations owner | Qualified lead → booking → completed/paid job → gross margin, missed inquiries, latency, failure queue and repeat revenue; reconciles to source systems. | BLOCKED — external evidence/owner needed |
| R01 P0→P2 | Monitoring/runbooks — platform operator | Owned alert destination, synthetic endpoint tests without customer submissions, error budget/thresholds, escalation and rollback drill. A written workflow is not a running monitor. | BLOCKED — external evidence/owner needed |
| R02 P2 | Advertising/scale — owner | Prove operating chain and capacity before increasing spend; dedicated campaign URLs, conversion reconciliation and approved acquisition targets. | BLOCKED — external evidence/owner needed |

## Evidence gate mapping

Release: facts F01; domain F02; seo S01/live S06; migration S02; crm F03; intake F04; response_owner F05; privacy O05; rollback R01.
Business adds: telephony F06; dispatch O01; estimates O02; payments O03; reports O04; continuity O05/R01; analytics A01/A05; ai A02/A03; follow_up A04; end_to_end full accepted lead → assigned owner → confirmed slot → authorized job → settled invoice → approved report → eligible follow-up, including failure/escalation evidence. Every gate needs private dated acceptance records and a real owner. Unsupported/not-used workflows require a documented approved scope decision; do not forge a pass or delete a mandatory gate.

## Cleanup and contamination prevention

Parent owns removal of demonstrably superseded CSS/JS, preview/lab routes, unused media and obsolete local comparison/audit outputs. Confirm zero live references and baseline regressions first; preserve used shared files and current service routes. Recover deleted tracked artifacts from Git history. Keep actual configuration/receipts outside the public repo and publication allowlist. Never delete synced project sources, CRM records, consent evidence, customer media or an active integration owned by another agent. Preserve important legacy URLs with controlled redirects, not silent deletion.

## Completion evidence

Validator: `python3 -m unittest discover -s scripts -p test_check_readiness.py -v` — ten tests passed. Default example returns exit 1 (blocked). Fixture success explicitly reports `independently_verified: false`. Integrated application/SEO checks are reported separately by the parent. External acceptance tests have not been executed here.

## Additional business blind spots

| ID / priority | Work / accountable role | Prerequisite / acceptance | Status |
|---|---|---|---|
| F07 P1 | Business email and deliverability — owner + mail administrator | Confirm existing mail provider; domain-based inboxes/forwarding, SPF/DKIM/DMARC and sender alignment; test quote/receipt delivery, reply routing and unattended-inbox alerts. | NEEDS OWNER/ACCESS |
| O06 P1 | Service policy and capacity — owner + dispatcher | Approved emergency coverage, diagnostic/travel/after-hours charges, cancellation/no-show rules, warranties, disputes and refund approval limits; staff training and backups. | NEEDS OWNER DECISIONS |
| O07 P2 | Commercial vendor readiness — owner + finance | Approved insurance/license evidence and private vendor onboarding packet; procurement contacts, recurring billing and property-level service agreements. Keep sensitive tax/customer documents private. | NEEDS OWNER/ACCESS |
| S07 P1 | Media and claims approval — owner + technician lead | Permission for customer footage/testimonials; clearly distinguish illustrations from real job evidence; substantiate published licenses, guarantees and operating claims. | NEEDS OWNER EVIDENCE |
| A06 P2 | Commercials and campaign routing — marketing owner | Final destination/approved source IDs, current QR assets, dedicated campaign landing links, phone-source mapping and collected-job reconciliation. Retired QR files are not current campaign assets. | NEEDS DOMAIN/MARKETING ACCESS |

## Cleanup completed in this build

- Abandoned home.css/home.js, old price-card JavaScript and hidden truck/compact-process branches removed.
- Unreferenced generated assets removed after source-reference inspection; current customer-facing media and shared FAQ dependencies retained.
- Old preview/lab content replaced with noindex redirects to the current site.
- Stale numeric prices and unsupported verified-review wording removed from llms.txt.
- Obsolete local comparison pages, patch scripts and old outputs removed; one current website tab retained. Current research, tests and relevant evidence kept.
- Private configurations and receipts must remain outside this public repo; generated site uses an explicit publication allowlist.

## Immediate critical path

1. Receive owner answers and the existing CRM agent’s handoff.
2. Reconcile approved domain/prices, then generate the final candidate.
3. Wire one real provider-native intake path and prove a controlled lead, ownership, failure recovery and acknowledgment.
4. Verify phone escalation and booking capacity; then add payments/reporting and follow-up in prerequisite order.
5. Activate analytics and search accounts with approved configuration; benchmark real results before scaling advertising.

- **R03 / GitHub validation automation:** grant workflow permission through an authorized GitHub connection, install docs/operations/ci-workflow.yml under .github/workflows/, then verify its first hosted run. Current status: BUILT/REVIEWED, NOT ACTIVE.

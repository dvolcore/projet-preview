# Operations control documents

Current status: **release and full business operation are blocked pending private evidence and assigned operators.** Local tooling does not connect any account. No messaging, booking, payments, AI receptionist or monitor is activated by these files.

Start with [the current checklist](checklist.md), [owner decisions](owner-decisions.md), [CRM handoff](crm-handoff.md), and [runbooks](runbooks.md). These replace prior operational audit recommendations as the actionable backlog; they do not overwrite authoritative business records.

## Three separate results

- `seo_valid`: generated website passes the SEO tool's specified offline checks.
- Release evidence: approved facts/domain/SEO/migration, durable lead capture, response ownership, privacy and rollback have dated production records.
- Business evidence: release requirements plus telephony, dispatch, estimates, payments, reports, continuity, attribution, bounded AI, follow-up and end-to-end workflow records.

None is a ranking percentile. The readiness CLI only checks **self-reported evidence metadata and local reference existence**, not authenticity or real external outcomes. Exit 0 means the selected evidence requirements are satisfied. Independent live verification is still required before describing the business as operational.

## Offline readiness CLI

Copy `config/operations.example.json` to a private directory outside this public repository. Keep actual owner identifiers, configurations, consent records, receipts and account details there. Never add secrets, customer data or receipt files to the public site.

```
python3 scripts/check_readiness.py --config /private/location/operations.json --scope release --format json
python3 scripts/check_readiness.py --config /private/location/operations.json --scope business --format json
python3 -m unittest discover -s scripts -p test_check_readiness.py -v
```

Exit 0: evidence recorded, not independently verified. Exit 1: blocked. Exit 2: invalid configuration. Default configuration is intentionally blocked. There is no `ready` override.

Schema version 1 accepts only `schema_version`, `environment`, and `gates`. Environment is `local`, `sandbox`, or `production`. Each documented gate has exactly: `status`, `owner`, `environment`, `outcome`, `timestamp`, `evidence_ref`. Status is `unknown`, `blocked`, or `evidence-recorded`. A recorded gate requires an assigned internal owner identifier, outcome `passed`, a UTC timestamp ending `Z` no more than 30 days old and not in the future, matching environment, and a nonempty private local file reference outside the repository. Relative references resolve beside the configuration. URLs are rejected; nothing is fetched. Revalidate after changes even inside 30 days. Local/sandbox evidence cannot satisfy production readiness.

The JSON report omits owner identifiers, file paths and receipt contents. Shape validation is not a secret scanner; store sensitive information only in the approved private system, even in allowed string fields. The tool accepts a syntactically plausible receipt; a responsible reviewer must examine actual outcomes and sign off outside this tool.

Tests passing proves only this validator's behavior. The same reference can cover multiple gates only if the actual independently reviewed receipt covers each acceptance criterion.

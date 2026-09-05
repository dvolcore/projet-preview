# Pro Jet — current website and operations foundation

Current reviewed website: https://dvolcore.github.io/projet-preview/.

**Website-to-business automation remains unverified; this project has not activated provider integrations.** The website currently prepares email drafts on static preview hosting. CRM delivery, phone routing, dispatch, payment, analytics accounts and the final customer-facing domain require the owner's configuration and controlled evidence.

Start with the single [current operational checklist](docs/operations/checklist.md), [owner decisions](docs/operations/owner-decisions.md), and [CRM-agent handoff](docs/operations/crm-handoff.md). They distinguish software implemented locally from connections that have not been verified.

## Source of truth and cleanup

`index.html`, service folders, `css/` and `js/` contain the current design. Retired `/preview-c/` and `/hero-lab/` URLs redirect to this version. Superseded homepage code, unreferenced assets and old design experiments have been removed; tracked history remains in Git for recovery. Do not revive old previews or copy an old price list into the active site.

The owner must confirm the authoritative price book and final domain. Until then, do not change prices based on an old page, a fixture or a configuration example. `llms.txt` contains no stale numeric price and is not a ranking guarantee.

## Local preview

From the parent directory containing the `projet-preview` checkout:

```sh
python3 -m http.server 8873 --bind 127.0.0.1
```

Open http://127.0.0.1:8873/projet-preview/. Source asset paths intentionally target the existing preview deployment.

## SEO build and audits

```sh
python3 scripts/build_seo.py --profile preview --config config/seo.example.json --output /tmp/projet-preview-audit
```

Output must be a fresh directory outside the repository. `OUTPUT/site/` is the sole publishable folder; `OUTPUT/seo-audit.json` is a separate report. The explicit allowlist excludes private configs/receipts, `.git`, `.omx`, scripts, tests, docs and experiments. Symlinks are rejected. The source is not mutated.

Generated preview pages are crawlable but non-indexable. A `production-candidate` profile can be tested only with an approved HTTPS origin/base path and public-fact approval references in a private config. It generates no deployment and does not certify business readiness. Price validation rules must be configured from the approved price book. The existing GitHub Pages site is not automatically replaced by generated output.

Final release requires the readiness evidence, real domain/redirect configuration, actual intake test and independent human verification. Do not publish the repository's private setup material or an audit report as part of the final site.

## Operational evidence

```sh
python3 scripts/check_readiness.py --config config/operations.example.json --scope business --format json
```

The example intentionally returns blocked. Real config and evidence files belong outside this public repository. Exit 0 means required evidence records are present and well-formed, not that an external system was independently verified. [Evidence boundaries and runbooks](docs/operations/README.md) explain activation and rollback.

## Analytics

Local [intent instrumentation](docs/operations/analytics.md) is installed but disabled until explicit origin, measurement ID and consent configuration. It loads no provider or tracking storage. Clicks and email drafts are not CRM leads, confirmed bookings or paid jobs.

## Verification

```sh
node --test tests/*.test.cjs
python3 -m unittest discover -s scripts -p 'test_*.py' -v
```

Browser regressions use an existing Playwright installation via `PLAYWRIGHT_MODULE` and an optional installed Chromium path via `CHROMIUM_PATH`: `tests/scroll-containment.cjs`, `tests/pricing-motion.cjs`, `tests/customer-stories.cjs`. `SITE_URL` selects a controlled target. They do not submit real customer messages or payments. The reviewed workflow template is `docs/operations/ci-workflow.yml`. Installing it under `.github/workflows/` requires a GitHub connection with workflow permission; the current token lacks that permission. Automated checks are not active yet.

Global CSS smooth scrolling stays disabled because it interferes with synchronous ScrollTrigger refresh. Run the scrolling regression before changing that behavior.

## Deployment

The current GitHub Pages source remains the root of `main`. Changes use reviewed branches and verified deployment. The filtered builder artifact is prepared for the final host, which requires owner confirmation. Roll back a code change by reverting its commit; never delete CRM/customer history as website cleanup.

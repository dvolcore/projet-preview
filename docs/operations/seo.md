# SEO release path

The source website is currently a review deployment. The final customer-facing domain and authoritative price book are still awaiting owner confirmation. Do not declare the business launched or change the legacy site merely because a generated SEO artifact passes.

## Built and tested

`python3 scripts/build_seo.py --profile preview --config config/seo.example.json --output /absolute/fresh/output`

- Generates an isolated static package using a reviewed file allowlist.
- Rewrites canonical, social and structured-data URLs plus internal asset/link paths for the chosen origin and base path.
- Generates robots/sitemap metadata. Preview pages use noindex while allowing crawling; production-candidate pages may be indexable after explicit public-fact/origin declarations.
- Keeps 404 and request-status pages out of the indexable sitemap; excludes retired experiments.
- Audits metadata, JSON-LD syntax, internal links/fragments, static assets, responsive images and stale source URLs. Configurable price checks must be filled from the owner-approved price book.
- Refuses symlinks, source/output overlap, overwrites and unlisted private/development material. Only OUTPUT/site is publishable; the audit remains outside it.

A production-candidate config uses the final HTTPS origin/base_path plus origin_approval_ref and public_facts_approval_ref. When copying an example to a private directory, set source_root explicitly to the checkout and review source_sites/forbidden_url_fragments for the final domain. These are recorded declarations, not proof of permission or fact accuracy. It can be inspected locally before CRM activation. Release and business readiness remain separate.

## Remaining launch tasks

1. Owner confirms final domain, price book, business facts and legacy-site control.
2. Generate the candidate and independently verify it in a controlled deployment. Verify real HTTP 404s, TLS and redirects; HTML parsing cannot prove server behavior.
3. Map old routes to appropriate new pages with permanent redirects on the actual legacy host. Never redirect all valuable pages blindly to the homepage.
4. Confirm consistent canonicals, public facts and prices across the site, schema, business profile and advertisements.
5. Owner/SEO operator verifies Search Console, Google Business Profile and Bing Webmaster Tools; submit the production sitemap and inspect indexing.
6. Measure service-specific search visibility by location and collect real mobile performance data. Do not promise rankings or rich results.

Service-area business addresses and profiles must reflect the real operating setup. Do not invent local offices, review ratings, license numbers or service guarantees. Do not add self-serving aggregate ratings to seek review stars.

`llms.txt` is optional reference content. Google says no special AI text files or schema are required for AI Overviews/AI Mode; accurate, accessible content and normal SEO fundamentals remain the foundation.

## Primary references

- [Robots meta tags](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
- [Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Local business structured data](https://developers.google.com/search/docs/appearance/structured-data/local-business)
- [Review markup eligibility](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)
- [AI features and websites](https://developers.google.com/search/docs/appearance/ai-features)
- [Business Profile representation](https://support.google.com/business/answer/3038177)

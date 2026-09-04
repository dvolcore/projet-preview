# Pro Jet website

Static HTML, CSS and JavaScript for Pro Jet’s Kansas City website. The published review site is https://dvolcore.github.io/projet-preview/.

## Local preview

From the directory containing this checkout (named `projet-preview`):

```sh
python3 -m http.server 8873 --bind 127.0.0.1
```

Open http://127.0.0.1:8873/projet-preview/. Asset paths intentionally include `/projet-preview/` for GitHub Pages.

## Editing

- `index.html` and `css/site.css`: cinematic homepage, branded pricing and scroll-driven pipe demonstration.
- `css/site.css`: shared styling and navigation. Header HTML is repeated across the static pages; update it consistently.
- `js/site.js`: navigation, process diagram, motion preferences and quote handling.
- `js/silk-band.js`, `js/price-band.js` and `js/surprises.js`: branded pricing and mascot motion.
- `request-quote/index.html`, `css/quote.css` and `js/quote-preview.js`: quote layout and validation.

Existing price ranges, testimonials and business contact details are preserved. Do not add claims or customer evidence without a verified source.

## Quote requests

GitHub Pages cannot execute the `/forms/quote.php` endpoint referenced by the original website. On `*.github.io`, localhost and file previews, a valid form prepares an email draft to the existing business address. The visitor must review and send it in their email app; the website does not claim delivery. Call and text links remain available. With JavaScript disabled, the page offers direct call, text and email links instead of an unavailable form.

On a server-hosted domain, the original form endpoint is used. That server and delivery path are not contained in this repository and must be verified before deploying there. No third-party form service or credentials have been introduced.

## Checks

```sh
node --check js/site.js
node --check js/home.js
node --check js/quote-preview.js
node --test tests/quote.test.cjs
```

For layout changes, check 320, 390, 768, 1024 and 1440 pixel widths; mobile menu focus and Escape; hero-film playback and the scroll-driven pipe sequence; reduced motion and JavaScript-disabled content. Test quote delivery only with a mocked request or controlled inbox, never by contacting the business unintentionally.

## Publishing and rollback

GitHub Pages deploys the root of `main`. Review changes on a branch, run the checks, then merge. Cache versions on changed CSS/JS links ensure returning visitors receive the updated presentation. Roll back by reverting the relevant commit through Git and deploying `main` again.

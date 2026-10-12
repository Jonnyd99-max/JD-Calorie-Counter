# JD Food Tracker

A mobile-first, installable personal food diary. Photograph a meal, review foods and quantities, and save sourced calories, protein, carbohydrate and fat. Samsung Health entry is manual.

## Frontend

GitHub Pages URL after deployment: https://jonnyd99-max.github.io/JD-Calorie-Counter/

The static frontend has no API keys. It uses IndexedDB to save meal photos, ingredients, exact nutrition source records, favourites and follow-up notes on the current device. Nothing uploads when saving meals. Data is browser-specific; export JSON backups regularly.

Navigation: Today, Add meal, History, Settings. Food matches and quantities have separate confirmation states. AI proposals require a user-selected nutrition source; no nutrition values come from AI. Add missed oil, sauces and drinks as separate ingredients. All quantities are edible grams. Changing preparation requires changing the matched database record.

### Install on Android

1. Open the live URL in Chrome, online, and allow the food database to finish loading.
2. Chrome menu → **Add to home screen → Install**.
3. Open **JD Food** from the home screen.
4. Use **Settings → Protect device storage**, and export backups periodically.

The manifest, 192/512 px PNG icons, maskable icon, HTTPS and service worker support Android installation. The service worker caches only app files and the public nutrition database. AI requires internet access. Updates are offered with an explicit button, warn about unsaved drafts, and never delete IndexedDB. Browser-data clearing/uninstallation may remove meals.

## Nutrition source and honest uncertainty

The included verified index comes from the official **USDA SR Legacy, April 2018 (archived July revision)** ASCII release from USDA Agricultural Research Service. It contains 7,793 foods and records the original archive SHA-256. Each food retains its NDB number, exact description, source dataset link, preparation and per-100 g nutrient values. Missing values stay null. Energy values are preserved, even when they differ from a simple 4/4/9 calculation. Documented household gram weights are retained from `WEIGHT.txt`. This is the same Standard Reference release incorporated into FoodData Central; the archive uses NDB numbers rather than FDC IDs.

`vendor/usda-foods.json.gz` contains this compact public-domain index. Builds unpack it without network access; `scripts/download-usda.py` and `scripts/vendor-data.mjs` document how to regenerate it from the official archive.

Source: https://agdatacommons.nal.usda.gov/articles/dataset/USDA_National_Nutrient_Database_for_Standard_Reference_Legacy_Release/24661818

This database covers generic US foods and preparation variants. The final SR Legacy release is not updated. UK brand formulations, recipes and serving sizes may differ. For a packaged product, use **Nutrition label**, confirm its reference and values, and specify whether the basis is 100 g or a serving. Per-serving labels require serving grams. Blank nutrients mean unavailable, not zero.

Photo identification is a suggestion. A single photograph cannot determine exact edible weight, hidden oil or ingredients. AI should leave grams blank without a usable scale/label reference. Estimated quantities require lower/upper gram bounds and an explanation. Meal ranges scale each matched record to those bounds and sum them; they cover quantity assumptions only, not identification or database uncertainty. No confidence percentages are shown.

## Private AI backend

GitHub Pages cannot securely hold an OpenAI API key. `backend/worker.js` is a Cloudflare Worker with a SQLite-backed Durable Object counter, protected by a random personal bearer token. The server stores only its SHA-256 digest. The OpenAI key stays in Worker secrets.

Protection: fail-closed configuration, exact allowed frontend origin, authentication before any paid call, JPEG magic/frame/dimension validation, streamed 2.3 MB body limit, fixed model and output budget, one analysis attempt per minute and ten per UTC day. Failed provider attempts count toward the limit. These limits persist across worker instances. Origin restrictions supplement authentication; CORS alone is not access control. Do not put your OpenAI key in frontend Settings.

Photos are resized on-device to JPEG with a longest dimension of 1280 px. Metadata is discarded by canvas re-encoding. They are sent only when **Identify** is tapped: device → your Cloudflare Worker → OpenAI Responses API. The Worker neither logs nor persists photos/prompts. Only rate-limit timestamps/counters persist. API requests use `store:false`; OpenAI abuse-monitoring retention may still apply to your account. https://developers.openai.com/api/docs/guides/your-data

### Backend provisioning

Requires a Cloudflare account with Workers/Durable Objects enabled, and an OpenAI project with API billing/model access. No USDA API account is required for offline dataset search.

1. Install Wrangler in a temporary/local tool directory and authenticate using its browser login. Use Workers Free for personal volume; do not upgrade a paid plan without approval.
2. Deploy `backend/wrangler.jsonc`: `wrangler deploy --config backend/wrangler.jsonc`. SQLite Durable Objects are included in the Worker configuration.
3. The approved ignored `.env.local` holds `OPENAI_API_KEY`. Set `WRANGLER_CLI` to Wrangler's `bin/wrangler.js` and run `node scripts/provision-backend.mjs`. It generates a random personal token locally and uploads the API key/hash through stdin. It never prints secrets.
4. Enter the resulting HTTPS `workers.dev` URL and **PERSONAL_ACCESS_TOKEN** from your local ignored file in frontend **Settings**. The access token is kept in sessionStorage, not backups. This is a backend token, not an OpenAI key. Lock analysis when finished.
5. Check **Save & test connection** before trying a photo. To revoke access, rotate the personal token/hash; to revoke provider access, revoke the OpenAI project key.

No backend is provisioned just by publishing the frontend. Manual search, labels, saved meals and backups work without it. Do not claim AI is live until authenticated production analysis has been tested.

### Costs

The public GitHub Pages frontend and offline USDA data require no paid nutrition API. Cloudflare Workers Free includes limited Workers/SQLite Durable Object usage; personal volume is intended to stay within it. OpenAI API usage is separately billed, independently of a ChatGPT subscription. Default model: `gpt-4.1-mini`, with 2500 output tokens maximum and resized image input. Set a low project budget and inspect usage. Account-level budgets/alerts should not be treated as guaranteed hard spending caps; the backend request cap is enforced per UTC day.

Current prices/limits: https://developers.openai.com/api/docs/pricing and https://developers.cloudflare.com/workers/platform/pricing/

## Development and deployment

No frontend npm dependencies. Node 22+ and Python 3.12+:

```text
node --test tests/*.test.js
node scripts/build.mjs
node scripts/serve.mjs
```

Local preview: http://127.0.0.1:5173 . The backend allows only the production origin by default; test changes to the allowed origin must not weaken production authentication.

GitHub Actions tests the app, unpacks the verified database index, builds icons/app, validates source records and deploys the `dist` artifact to Pages. In repository **Settings → Pages**, select **GitHub Actions** as the source. No backend secrets belong in the Pages workflow. Backend deployment is separate.

`public/` is the entire public app. `.env*`, `.cache/`, `node_modules/`, `dist/` and Wrangler state are ignored. Only `.env.example` is tracked. The build copies `public/` and never environment files.

## Validation

Tests cover scaling gram weights; documented measures; per-serving labels; raw/cooked selection; multiple ingredient totals; missing nutrients; explicit estimate bounds; independent match/quantity certainty; favourite reuse without mutation; backup round-trip/rejection; backend authentication, CORS, upload limits, provider request configuration and persistent rate limits. Database integrity tests run after the official data is built.

Browser QA should check real IndexedDB save/edit/delete, export/import, offline reload and service-worker update preservation. Synthetic nutrition fixtures verify arithmetic, not photo accuracy.

No representative weighed meal photos were supplied. Photo identification and portion-estimation accuracy must be assessed against actual weighed ingredients or labels; successful code tests do not establish accuracy. Final Android camera launch, file picker, home-screen installation and installed-app updates require testing on the user's phone.

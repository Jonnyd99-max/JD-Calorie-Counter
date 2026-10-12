# Validation — 12 October 2026

Live frontend: https://jonnyd99-max.github.io/JD-Calorie-Counter/

Protected backend: https://jd-food-api.jd-food-tracker.workers.dev

## Passed

- 23 automated tests: gram scaling, documented measures, per-serving labels, raw/cooked selection, ingredient sums, unavailable nutrients, explicit range calculations, independent quantity/match status, reusable favourites, backup round-trips and invalid-backup rejection; authentication, origin checks, upload-size/dimension limits, provider request configuration, durable rate limits and billing/rate-limit distinctions.
- All 7,793 official USDA records validated; traceable NDB numbers, source descriptions, archive SHA-256, per-100 g nutrient values and documented gram measures retained. Salted butter's original 717 kcal/100 g and 14.2 g tablespoon checked against the archive.
- Production GitHub Actions build and Pages deployment succeeded. Worker deployed with server-side secrets and a SQLite Durable Object limiter.
- Production backend health: no credentials → 401; personal token → 200; unrelated browser origin → 403.
- Browser: selected cooked long-grain rice, entered 200 g, confirmed food identity, saved a favourite and observed 260 kcal. Edited to 150 g and observed 195 kcal. Source record and macros retained.
- Browser: exported the real IndexedDB test entry to JSON, imported it through the app, confirmed replacement and verified restored history/favourite.
- Browser: installed a changed service worker through the app's update button and verified the 150 g/195 kcal saved entry survived.
- Browser: stopped the local HTTP server, reloaded the app from its cache, opened the saved meal and reused its ingredients offline.
- Browser: selected a PNG control image with the file picker; on-device processing displayed a JPEG review image without sending it to AI.
- Browser: confirmed deletion removed the backed-up synthetic test entry and updated history. No real user meals were used for QA.
- Live page checked at 390 × 844 pixels; no horizontal overflow. PNG/maskable icons, web manifest, scoped worker and HTTPS are deployed.
- `.env.local`, the private device-connection file and local tool state are excluded from Git. The public build contains no provider credentials.

## Still to validate

- **Successful AI identification:** a live non-food control reached the provider but returned a billing failure. A separate safe-metadata check confirmed `credit_balance_exhausted` / `insufficient_quota`. No further paid requests are being made while the user considers cost. Adding API credit is needed for the next live test.
- **Meal-photo accuracy:** no representative photos with weighed ingredients or nutrition labels were supplied. Identification and portion accuracy have not been established. Arithmetic tests and app operation do not establish photo accuracy.
- **Actual Android device:** camera capture intent, gallery selection, Chrome installation and installed-app update behaviour must be checked on the user's phone. Browser offline/update checks passed; these are not a substitute for that device check.

## Costs and controls

The current GPT-4.1 Mini standard rates are US$0.40/million input tokens and US$1.60/million output tokens. Photos are resized to a longest side of 1280 px, and each response is capped at 2500 output tokens. A conservative budgeting estimate is around US$0.006 per analysis: approximately US$0.54/month for 3/day, or US$1.80/month for 10/day over 30 days. These are estimates, not measured successful-request costs or guaranteed currency spending caps. Prices, response lengths, taxes and exchange rates can change the actual bill.

The app permits one authenticated analysis attempt per minute and ten per UTC day. Manual entry, search, local storage and backups make no AI calls. Costs from other applications using the same API organization are outside this app's limit.

GitHub Pages and the USDA public dataset have no separate subscription charge. Cloudflare Workers/SQLite Durable Objects are intended to stay on the Free plan at personal volume; no paid upgrade was performed.

OpenAI's minimum prepaid credit purchase is US$5. Auto-reload is enabled by default during initial setup: turn it off if automatic purchases are unwanted. Purchased credits expire after a year; billing enforcement can be delayed, so the balance is not an instantaneous spend cutoff.

Sources:

- https://developers.openai.com/api/docs/models/gpt-4.1-mini
- https://developers.openai.com/api/docs/guides/images-vision
- https://developers.cloudflare.com/workers/platform/pricing/
- https://help.openai.com/en/articles/8264644-setting-up-and-managing-prepaid-api-billing

Private phone-connection details are in the local ignored `PRIVATE-BACKEND-ACCESS.txt`. Keep that file private. Enter its backend token in Settings, never the OpenAI key.

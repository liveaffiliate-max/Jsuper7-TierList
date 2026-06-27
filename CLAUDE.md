# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (Next.js, Turbopack) at http://localhost:3000
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint (eslint-config-next/core-web-vitals)
npm test         # vitest run — currently covers app/lib/getTierInfo.js only
```

Test coverage is intentionally narrow: `app/lib/getTierInfo.test.js` locks down the NaN/boundary edge cases that previously caused real bugs (see CODE_REVIEW.md). No component or API route tests exist yet.

## What this app does

Jsuper7 Tier List Checker — affiliates enter their phone number to look up their monthly sales tier (Start / Speed / Super / Star), see progress toward the next tier, and view per-channel sales breakdown. Data is read live from Google Sheets; there is no database.

## Architecture

### Data source: Google Sheets, one sheet per month

`app/api/check/route.js` is the only API route currently in active use. It:
- computes a target month from `monthOffset` (0 = current month, -1 = previous, etc.)
- reads a sheet literally named `Tierlist_<MonthAbbrev>` (e.g. `Tierlist_Jan`) via the `googleapis` Sheets API, range `A:N`
- finds the row where column D (index 3) matches the submitted phone number, after normalizing both sides with `normalizePhone()` (strips non-digit characters) — the sheet can contain phone numbers with dashes/spaces, so this must stay in sync with `_normalizePhone()` in the Apps Script described below
- maps fixed column indices to fields: `fullname`(1), `nickname`(2), `phone`(3), `line`(4), `tiktok`(5), `profile`(6), `sale_uni`(7), `sale_exam`(8), `shopee`(9), `tier`(10), `total_sale`(11), `total_clip`(12)
- runs `total_sale`/`total_clip` through `parseSheetNumber()` (strips commas, defaults to `0` for empty/non-numeric cells — confirmed needed because `Tierlist_Jan`'s column M holds a status string `"ส่งแล้ว"` instead of a clip count, unlike every other month)
- if the sheet for that month doesn't exist, returns `{ found:false, noData:true }` instead of throwing
- caches each sheet's raw rows in an in-memory `Map` (`sheetCache`, 60s TTL, module-level so it survives across warm serverless invocations but not cold starts) — this is the only caching layer; if you need fresher data immediately after an admin edit, wait up to 60s or restart the dev/prod process. The "sheet doesn't exist" error is cached too, so a newly-created sheet for a future month won't be picked up until the cache entry expires.
- the `GoogleAuth`/`sheets` client is also created once at module scope (not per-request) for the same warm-instance-reuse reason

Because columns are positional, adding/reordering columns in the Google Sheet breaks this route silently (wrong field gets the wrong value) — there's no header-name lookup. Confirmed real-world instance: column K's actual header text is the placeholder `"คอลัมน์ 8"` (the row still holds the tier value correctly, but the label drifted from what a human editing the sheet would expect).

`app/api/sheet/route.js` is an older/legacy route that reads a single hardcoded sheet name (`'ลงเว็บ ยอดเดือน ก.พ.'`) rather than the per-month pattern. It's not wired into the current UI flow — `app/page.js` only calls `/api/check`.

Google credentials (`GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `SHEET_ID`) come from `.env`. The private key is stored with literal `\n` and must go through `.replace(/\\n/g, "\n")` before use (both routes do this).

### The spreadsheet also runs a Google Apps Script (`updateTier.gs`) outside this repo

The same spreadsheet has two non-`Tierlist_*` sheets that are not consumed by any code here but are written/read by an Apps Script (`updateTier.gs`) the user maintains directly in Google Sheets:
- `admin_login` — plaintext username/password rows. Leftover from the now-deleted `/api/admin/login` route; the service account credentials in `.env` can still read this sheet, so it's a live secret-exposure risk even though no code in this repo uses it anymore.
- `_sync_log` — append-only log written by the script's `_logToSheet()` on every run (e.g. `"Speed: 57 rows with clips"`). If you see writes to this sheet, they're not coming from this Next.js app.

**Why `user.tier` (sheet column K) disagrees with the client-computed tier — this is by design, not just stale data:** `updateTier.gs`'s `updateTierFromPrevMonth()` writes column K of *this* month's sheet using column L (`total_sale`) from *last* month's sheet (see its `PREV_MONTH_MAP`). So the green tier badge reflects last month's performance (the tier whose perks are active now), while `getTierInfo()` in `app/page.js` recomputes a tier from *this* month's live `total_sale` for the progress bar (i.e. "what tier you're trending toward next"). These are two intentionally different metrics, not a bug to reconcile.

There is one real cross-system bug worth knowing about: `updateTier.gs`'s `_calcTier()` uses `sales > rule.min` (strict), while `TIER_CONFIG` in `app/lib/tierConfig.js` treats `min` as inclusive (`total >= tier.min`). A member with sales landing exactly on a boundary (200000 / 50000 / 10000) gets written one tier *lower* by the script than what the client-side progress bar computes for the same number. Fixing this requires editing `updateTier.gs` in Apps Script (outside this repo) to use `>=`.

### `app/page.js` is a thin shell — `SearchBox` and `Dashboard` own their own data fetching

`app/page.js` holds exactly one piece of state (`user`) and renders either `app/components/SearchBox.js` (when `!user`) or `app/components/Dashboard.js` (when `user?.found`). Neither child component receives the other's state — each is self-contained:

- `app/components/SearchBox.js` — owns the phone input, validates it, calls `fetchTierCheck()` (from `app/lib/checkUser.js`), shows the SweetAlert flow, and lifts the result up via `onFound(data)`.
- `app/components/Dashboard.js` — owns `monthOffset`/`monthLoading`, re-calls `fetchTierCheck(user.phone, offset)` on month nav, and renders the profile card, `TierProgress`, the 3 sale cards, and `TierListDetail`. Calls `onUserChange(data)` after a successful month switch and `onLogout()` on the logout button.
- `app/lib/checkUser.js` — `fetchTierCheck(phone, monthOffset)`, the one shared `fetch("/api/check")` wrapper both components call. If you add a third place that needs to hit `/api/check`, use this instead of inlining another `fetch`.

Because both components unmount/remount on logout (conditional rendering in `page.js`, not a route change), their internal `useState` naturally resets — there's no explicit "reset phone/monthOffset" code anywhere; don't add any, it'd be redundant.

- `app/components/TierProgress.js` — renders the progress-to-next-tier card (tier labels, gradient bar, "อีก ฿X จะขึ้น Tier Y" text) from the `getTierInfo()` result. Only `info.next ? ... : ...` (two branches); there is no `variant` prop — an earlier `"panel"`/`"inline"` variant system was dead code (never invoked) and was removed.
- `app/components/TierListdetail.js` — the 4-tier requirement grid + click-to-open modal popup explaining each tier's budget/content requirement/rewards/signup form. Known pre-existing bug: the active-tier highlight never triggers, because `user.tier` from the sheet includes a trailing emoji (e.g. `"Speed⚡"`) while `ALL_TIERS` entries are plain (`"Speed"`), so `user?.tier === t` is always false.
- `app/lib/getTierInfo.js` — pure function, extracted from `page.js` specifically so it could be unit-tested (see `getTierInfo.test.js`). Takes a raw sheet value (string with commas, plain number, empty string, or garbage text) and always returns a valid `{ current, next, progress, remaining, tierData }` — never throws, never returns NaN-poisoned fields.

### Styling: Tailwind CSS v4, no inline `<style>` blocks left

All three components above (plus `page.js`) are styled with Tailwind utility classes, including arbitrary-value syntax (`w-[190px]`, `max-[420px]:px-4`, `min-[480px]:grid-cols-4`) for the many exact-pixel values inherited from the original design. `app/globals.css` registers custom animations via Tailwind v4's `@theme` block (`--animate-fade-up`, `--animate-shimmer`, `--animate-overlay-in/out`, `--animate-card-in/out`) plus their `@keyframes` — these aren't Tailwind defaults, so don't delete them even though they're not referenced by class name in the obvious place (they're consumed via `animate-fade-up` etc. in the component files).

Inline `style={{ ... }}` props still appear in a few spots — these are not leftovers, they're the cases where the value is genuinely dynamic at runtime and Tailwind's JIT scanner can't see it at build time (e.g. `background: ${TIER_CONFIG[tier].color}` in `TierProgress.js` and `TierListdetail.js`, and the `fontFamily` var on the root wrapper in each component). Don't try to convert these to className — arbitrary values must be static strings in source for Tailwind to generate the CSS.

Fonts (Prompt, Kanit, Sarabun) are loaded via `next/font/google` in `app/layout.js`, exposed as CSS variables (`--font-prompt`, `--font-kanit`, `--font-sarabun`) on `<body>`, and referenced as `var(--font-prompt)` etc. in component styles — not via `@import url(fonts.googleapis.com/...)` (that pattern was removed; if you see it reintroduced, it's a regression).

### Admin section was removed

`app/admin/page.js` (login form) and `app/admin/dashboard/page.js` (menu linking to `/admin/clips`, `/admin/all-clips`, `/admin/users`) were deleted — the API routes and pages they depended on (`/api/admin/login`, `/api/admin/clips`, `/api/clips`, `/api/upload_clip`, `/my-clip`, `/submit-clip`) had already been deleted earlier, leaving a login form with no working backend. There is currently no `/admin` route at all. The `admin_login` sheet (see above) is the credential store the deleted route presumably checked against — if an admin section gets rebuilt, that's the sheet to read.

### Analytics

`app/layout.js` wraps the app with `@vercel/analytics`'s `<Analytics />`. A `@vercel/speed-insights` integration was attempted and reverted (it failed to install due to an unrelated peer-dependency conflict from SvelteKit/Nuxt tooling present in the global npm environment) — don't re-add `@vercel/speed-insights` without confirming `npm install` succeeds first.

### Images and metadata

All `<img>` tags were converted to `next/image`'s `<Image>`. The `width`/`height` props are the *intrinsic* source file dimensions (read directly from the PNG headers, e.g. `4500×4500` for the sale-card logos), not the displayed size — displayed size is controlled by Tailwind classes (`w-20`, etc.). Don't "fix" these to match the visual size; that's not how `next/image` sizing works.

`app/layout.js`'s `metadata.metadataBase` is derived from `process.env.VERCEL_PROJECT_PRODUCTION_URL`/`VERCEL_URL` (Vercel injects these at build time) rather than a hardcoded domain — this is intentional so Open Graph image URLs resolve correctly regardless of which Vercel project/domain this gets deployed under.

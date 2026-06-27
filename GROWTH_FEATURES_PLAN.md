# Growth/Motivation Features — Plan for Higher-Effort Ideas

Context: items 1-3 (urgency countdown, inline reward preview, per-channel weak-spot badge) are
already implemented in `TierProgress.js` / `Dashboard.js`. This doc plans the three ideas that
need more than a UI tweak — each needs new data flow, not just new markup.

## 1. Trend sparkline (last 3-6 months)

**Goal:** show the user whether their sales are trending up or down, not just this month's snapshot.

**Data:** `app/api/check/route.js` already supports `monthOffset`, so historical months are
reachable one at a time — but there's no batch endpoint, and each call hits a separate
`Tierlist_<Month>` sheet.

**Plan:**
- Add a new API route `app/api/check/history/route.js` (or extend `/api/check` with a
  `months` param) that loops `monthOffset` from `0` to `-5`, reuses the existing
  `getSheetRows()` + `sheetCache` (already 60s TTL, so 6 sequential Sheets reads on a cold
  cache is the worst case — acceptable for a one-off call, not for something polled often).
- Return `[{ month, total_sale }]`, skipping months where the sheet doesn't exist or the
  phone isn't found (`noData`/not-found rows just get filtered out, not surfaced as errors).
- Client: small inline SVG sparkline component (no charting library needed for 6 points) in a
  new `app/components/SalesTrend.js`, rendered above or beside `TierProgress`.
- **Risk/cost:** every dashboard load now costs up to 6x the Sheets API calls instead of 1.
  Mitigate by lazy-loading the sparkline (fetch only when the user scrolls to it, or cache
  the history client-side per session same as the `monthCache` ref already added in
  `Dashboard.js`).

**Effort:** medium (new route + new component), no schema changes needed.

## 2. Month-over-month comparison ("+12% จากเดือนที่แล้ว")

**Goal:** lower-risk alternative to a leaderboard — compare the user against their own past
performance instead of against peers.

**Data:** needs exactly one extra data point: last month's `total_sale` for the same phone.

**Plan:**
- Cheapest version: when `Dashboard.js` mounts, silently call `fetchTierCheck(user.phone, -1)`
  in the background (no loading spinner, no `onUserChange`) and store just `total_sale` in a
  ref. Render a small delta badge next to the existing "ยอดขายเดือน..." card in the profile
  panel: `▲ +12% จากเดือนที่แล้ว` / `▼ -8%` in green/red.
- If last month's sheet doesn't exist (`noData`) or the user wasn't in it yet, just omit the
  badge — don't show a misleading 0% or error.
- This reuses 100% of existing plumbing (`fetchTierCheck`, `getSheetRows` cache) — no new API
  route required, just one extra fetch call already shaped like the month-nav fetches.

**Effort:** low-medium. Could be bundled with #1 since it's a special case of "last N months".

## 3. Leaderboard / percentile ranking

**Goal:** highest motivational ceiling, but highest risk — needs careful framing to avoid
discouraging lower-tier affiliates or causing unhealthy competition.

**Data problem:** this is the hard part. Today, `/api/check` finds *one* row matching a phone
number; a leaderboard needs *all* rows in the current month's sheet, ranked by `total_sale`.
That's a different access pattern and a privacy question (showing other affiliates' real
names/numbers is not OK).

**Plan:**
- New route `app/api/check/rank/route.js`: reuse `getSheetRows(sheetName)` (already caches the
  full sheet for 60s — this is the one feature that actually benefits from the existing
  whole-sheet cache, since everyone's percentile needs everyone's row anyway), compute
  `total_sale` for every row, sort, and return only the **requesting user's percentile/rank**
  (e.g. `{ rank: 14, totalParticipants: 87, percentile: 84 }`) — never return other users' names
  or numbers. This sidesteps the privacy issue entirely.
- UI: a single line under `TierProgress`, e.g. "คุณทำยอดได้ดีกว่า 84% ของ affiliate ในระดับเดียวกัน
  เดือนนี้" — framed as "better than X%", not an exposed ranked list, and scoped to same-tier
  peers only (comparing Start-tier against Star-tier is discouraging and not actionable).
- Open questions to resolve with the user before building: (a) should this be opt-in/opt-out
  per affiliate, (b) should it compare against same-tier peers only or everyone, (c) what
  happens with very small sheets (e.g. only 3 people at Star tier this month — percentile is
  noisy/identifying at small N).

**Effort:** medium-high — new route, new aggregation logic, and a product decision on framing
that needs sign-off before writing code (this is the one idea in this doc that needs a
conversation, not just an estimate).

## Suggested build order

1. Month-over-month comparison (#2) — cheapest, reuses everything, no new privacy surface.
2. Trend sparkline (#1) — natural extension of #2 once the "fetch N past months" pattern exists.
3. Leaderboard (#3) — do last, and only after deciding the open questions above.

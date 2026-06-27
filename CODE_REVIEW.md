# Code Review Findings

Review scope: `git diff 005c7fc..HEAD` — UI/profile-card rewrite, Vercel Analytics, and the merge that deleted several admin/clip API routes. Updated after the optimization/refactor session (caching, Tailwind migration, SearchBox/Dashboard split).

Ranked most severe first.

---

## 1. Admin login is completely broken

**File:** [app/admin/page.js:29](app/admin/page.js#L29)
**Severity:** High
**Status:** ⏸️ Not fixed — intentionally skipped (admin section deferred, not currently in use)

Admin login `fetch`-es `/api/admin/login`, but that API route was deleted in commit `10387dd`, and nothing else (no rewrite, no middleware) serves that path.

**Failure scenario:** Admin submits username/password on `/admin` → fetch hits Next.js's 404 handler → `res.json()` throws on the HTML body → caught by the surrounding try/catch → user sees the generic `"เกิดข้อผิดพลาดของระบบ"` message. Admin login is non-functional for every user, every time.

---

## 2. Empty sales cell shows "max tier reached" instead of 0% progress

**File:** `app/api/check/route.js`, `app/lib/getTierInfo.js`
**Severity:** High
**Status:** ✅ Fixed — `parseSheetNumber()` normalizes empty/non-numeric cells to `0` server-side, and `getTierInfo()` independently guards against `NaN` (defense-in-depth). Covered by unit tests in `getTierInfo.test.js`.

`total_sale: user[11] ?? 0` only guarded against `null`/`undefined`, not an empty-string sheet cell, which let `NaN` propagate into the tier calculation and falsely render "ถึง Tier สูงสุดแล้ว!" for a member with effectively zero sales.

---

## 3. Dead `variant="panel"` branch — tier-panel sidebar lost its progress bar

**File:** `app/components/TierProgress.js`
**Severity:** Medium
**Status:** ✅ Fixed — dead `isPanel`/`variant` branch removed. Decision made to keep `TierProgress` as the one standalone card below the profile section rather than re-wire it into the green sidebar (avoids visual duplication with `TierListDetail`'s tier grid).

---

## 4. Dead CSS targeting a removed `.total` element

**File:** `app/page.js`
**Severity:** Low (cleanup)
**Status:** ✅ Fixed — moot point now; `app/page.js`'s entire inline `<style>` block was removed during the Tailwind v4 migration.

---

## 5. Duplicated JSX comment

**File:** `app/page.js`
**Severity:** Low (cleanup)
**Status:** ✅ Fixed — removed; the surrounding markup was rewritten during the SearchBox/Dashboard split anyway.

---

## 6. Active-tier highlight never triggers in TierListDetail

**File:** [app/components/TierListdetail.js](app/components/TierListdetail.js)
**Severity:** Low (cosmetic)
**Status:** ✅ Fixed — added `userTierName` (strips non-letter/non-number characters from `user.tier`) and compare against that instead of the raw value, in both the tier-grid highlight and the popup's "✦ Tier ปัจจุบัน" badge. `user.tier` itself is left untouched everywhere else, since `Dashboard.js` intentionally displays it with the emoji. Verified in browser: both the grid box-shadow/border highlight and the popup badge now appear correctly for the user's actual tier.

`user.tier` comes from the Google Sheet and includes a trailing emoji (e.g. `"Speed⚡"`), but `ALL_TIERS` (and the `t` used in the `.map()`) holds plain tier names (`"Speed"`). The strict equality check `user?.tier === t` was therefore always `false`.

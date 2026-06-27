import { TIER_CONFIG } from "./tierConfig";

export function getTierInfo(totalRaw = 0) {
  // แปลง "5,665.79" → 5665.79
  let total =
    typeof totalRaw === "string"
      ? parseFloat(totalRaw.replace(/,/g, ""))
      : Number(totalRaw);

  if (isNaN(total)) total = 0;

  const tiers = Object.keys(TIER_CONFIG);
  let current = tiers[0];
  let next = null;

  for (let i = 0; i < tiers.length; i++) {
    const tierName = tiers[i];
    const tier = TIER_CONFIG[tierName];

    if (total >= tier.min && total <= tier.max) {
      current = tierName;
      next = tiers[i + 1] || null;
      break;
    }
  }

  const currentTier = TIER_CONFIG[current];
  const nextTier = next ? TIER_CONFIG[next] : null;

  let progress = 100;
  let remaining = 0;

  if (nextTier) {
    const range = nextTier.min - currentTier.min;
    progress = ((total - currentTier.min) / range) * 100;
    progress = Math.max(0, Math.min(progress, 100));
    remaining = Math.max(nextTier.min - total, 0);
  }

  return { current, next, progress, remaining, tierData: currentTier };
}

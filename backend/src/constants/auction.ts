/** Amounts stored in lakhs (₹1 Cr = 100 lakhs). */
export const AUCTION_RULES = {
  purseLakhs: 2500, // ₹25 Cr
  slotsToFill: 25,
  overseasCap: 8,
  lotDurationMs: 30_000,
  softSpendFloorRatio: 0.75,
} as const;

/**
 * IPL-style bid increments based on current bid (in lakhs).
 * Under 1 Cr: 20L, then 25L / 50L / 1 Cr bands.
 */
export const nextBidIncrement = (currentBidLakhs: number): number => {
  if (currentBidLakhs < 100) return 20;
  if (currentBidLakhs < 200) return 25;
  if (currentBidLakhs < 500) return 50;
  return 100;
};

export const nextMinimumBid = (currentBidLakhs: number): number =>
  currentBidLakhs + nextBidIncrement(currentBidLakhs);

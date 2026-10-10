// Verified market snapshot, not an automatically refreshing feed.
export const marketPrices={
 currency:'USD',source:'Monex spot prices',sourceUrl:'https://www.monex.com/liveprices/',
 date:'2026-10-08',sourceUpdated:'10/08/2026 at 10:31 AM (source display)',
 usdPerTroyOunce:{gold:4134,silver:59.20,platinum:1645},
};
export const GRAMS_PER_TROY_OUNCE=31.1034768;
export const spotPerGram=metal=>marketPrices.usdPerTroyOunce[metal]/GRAMS_PER_TROY_OUNCE;

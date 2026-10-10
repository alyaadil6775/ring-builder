import {spotPerGram} from './marketPrices.js';
// Precious-metal melt value per gram of alloy. Base alloying metals and
// supplier premiums are excluded. Refresh the dated market snapshot as needed.
const goldRates=()=>({10:spotPerGram('gold')*.417,14:spotPerGram('gold')*.585,18:spotPerGram('gold')*.750});
export const pricingPolicy={
 labor:200,mold:200,platingMicrons:2.5,
 metalRates:{
  'Yellow gold':goldRates(),
  'White gold':goldRates(),
  'Rose gold':goldRates(),
  Platinum:spotPerGram('platinum')*.95,
  'Sterling silver':spotPerGram('silver')*.925,
  'Gold-plated sterling silver':spotPerGram('silver')*.925,
 },
};

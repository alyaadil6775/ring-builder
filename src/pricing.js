import {centerStonePrice,priceAccentStones,accentPriceSource} from './stonePricing.js';
import {alloyDensity,isPlated} from './alloys.js';
import {pricingPolicy} from './pricingPolicy.js';
import {marketPrices} from './marketPrices.js';
export const defaultPricing={currency:'USD',densityGPerCm3:null,metalPerGram:null,settingMetalGrams:null,labor:200,mold:200,settingFee:null,accentFee:null,layoutFee:null,castingAllowancePct:0,taxPct:0,platingMicrons:2.5,platingFee:null};
export function priceDesign(config,measurement=null){
 const p={...defaultPricing,platingMicrons:pricingPolicy.platingMicrons};
 const rate=pricingPolicy.metalRates[config.metal];
 p.metalPerGram=rate&&typeof rate==='object'?rate[config.karat]:rate;
 const valid=n=>Number.isFinite(n)&&n>=0;
 const densityGPerCm3=alloyDensity(config);
 const modelVolumeMm3=measurement?.volumeMm3??null;
 const weightGrams=modelVolumeMm3==null||!valid(densityGPerCm3)?null:modelVolumeMm3/1000*densityGPerCm3;
 const castingWeightGrams=weightGrams==null?null:weightGrams;
 const platingVolumeMm3=isPlated(config.metal)&&measurement?.surfaceAreaMm2!=null?measurement.surfaceAreaMm2*p.platingMicrons/1000:0;
 const platingWeightGrams=platingVolumeMm3/1000*15.39;
 const lines=[];
 const accentStones=measurement?.accentStoneVolumesMm3?priceAccentStones(measurement.accentStoneVolumesMm3):null;
 if(config.band){
  lines.push({label:'Metal',amount:weightGrams!=null&&valid(p.metalPerGram)?weightGrams*p.metalPerGram:null});
  lines.push({label:'Labor',amount:pricingPolicy.labor});
  lines.push({label:'Mold',amount:pricingPolicy.mold});
  if(config.setting)lines.push({label:config.stone.source?'Center stone (database USD)':'Center stone (sample price)',amount:centerStonePrice(config)});
  if(config.accents&&config.accents!=='None'||config.layout&&config.layout!=='Solitaire')lines.push({label:accentStones?`Accent / side stones (${accentStones.count})`:'Accent / side stones',amount:accentStones?.amount??null});
 }
 const complete=lines.length>0&&lines.every(l=>l.amount!==null),subtotal=lines.reduce((sum,l)=>sum+(l.amount??0),0);
 const tax=complete?0:null,total=complete?subtotal:null;
 return {accentStones,accentPriceSource,currency:'USD',metalPerGram:p.metalPerGram,marketPrices,lines,modelVolumeMm3,platingVolumeMm3,platingWeightGrams,densityGPerCm3,weightGrams,castingWeightGrams,subtotal,tax,total,status:complete?'estimate':'quote-required',assumptions:['Generated mesh volumes are summed; overlaps may overestimate fused-CAD weight.','Labor and mold are fixed at USD 200 each. Recorded center prices are assumed USD; accent pricing is a temporary lab-grown diamond estimate. Other fees and tax are excluded.','Precious-metal melt value uses a dated spot snapshot and alloy fineness; base metals, coatings and supplier premiums are excluded.']};
}

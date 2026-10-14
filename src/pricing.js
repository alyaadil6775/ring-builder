import {referenceModel} from './referenceOptions.js';
import {isDefaultGem} from './gemstones.js';
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
 const modelVolumeMm3=referenceModel(config)?null:measurement?.volumeMm3??null;
 const weightGrams=modelVolumeMm3==null||!valid(densityGPerCm3)?null:modelVolumeMm3/1000*densityGPerCm3;
 const castingWeightGrams=weightGrams==null?null:weightGrams;
 const platingVolumeMm3=isPlated(config.metal)&&measurement?.surfaceAreaMm2!=null?measurement.surfaceAreaMm2*p.platingMicrons/1000:0;
 const platingWeightGrams=platingVolumeMm3/1000*15.39;
 const lines=[];
 const unknownAccentPrice=(config.accents&&config.accents!=='None'&&!isDefaultGem(config,'accent'))||(config.layout&&config.layout!=='Solitaire'&&!isDefaultGem(config,'side'));
 const volumes=measurement?.accentStoneVolumesMm3;
 const accentStones=volumes?(unknownAccentPrice?{count:volumes.length,carats:null,amount:null}:priceAccentStones(volumes)):null;
 const scopePrice=(scope,values)=>values==null||referenceModel(config)?null:!isDefaultGem(config,scope)?{count:values.length,carats:null,amount:null}:priceAccentStones(values);
 const shoulderStones=scopePrice('accent',measurement?.shoulderStoneVolumesMm3),sideStones=scopePrice('side',measurement?.sideStoneVolumesMm3);
 const separated=measurement?.shoulderStoneVolumesMm3!=null&&measurement?.sideStoneVolumesMm3!=null;
 const smallStoneLine=(label,priced)=>({label:label+(priced?' ('+priced.count+' stones)':''),amount:priced?.amount??null,estimated:true,source:accentPriceSource,carats:priced?.carats??null});
 if(config.band){
  lines.push({label:'Metal',amount:weightGrams!=null&&valid(p.metalPerGram)?weightGrams*p.metalPerGram:null});
  lines.push({label:'Labor',amount:pricingPolicy.labor});
  lines.push({label:'Mold',amount:pricingPolicy.mold});
  if(config.setting)lines.push({label:config.stone.databaseStone?'Center stone (recorded currency unspecified)':!isDefaultGem(config)?'Center gemstone (quote required)':config.stone.source?'Center stone (database USD)':'Center stone (sample price)',amount:centerStonePrice(config)});
  if(separated){
   if(config.accents&&config.accents!=='None')lines.push(smallStoneLine('Accent stones · estimated lab-grown pricing',shoulderStones));
   if(config.layout&&config.layout!=='Solitaire')lines.push(smallStoneLine('Side / halo stones · estimated lab-grown pricing',sideStones));
  }else if(config.accents&&config.accents!=='None'||config.layout&&config.layout!=='Solitaire')lines.push({...smallStoneLine(accentStones?'Accent / side stones ('+accentStones.count+')':'Accent / side stones',null),amount:referenceModel(config)?null:accentStones?.amount??null});
 }
 const complete=lines.length>0&&lines.every(l=>l.amount!==null),subtotal=lines.reduce((sum,l)=>sum+(l.amount??0),0);
 const tax=complete?0:null,total=complete?subtotal:null;
 return {shoulderStones,sideStones,accentStones,accentPriceSource,currency:'USD',metalPerGram:p.metalPerGram,marketPrices,lines,modelVolumeMm3,platingVolumeMm3,platingWeightGrams,densityGPerCm3,weightGrams,castingWeightGrams,subtotal,tax,total,status:complete?'estimate':'quote-required',assumptions:['Generated mesh volumes are summed; overlaps may overestimate fused-CAD weight.','Labor and mold are fixed at USD 200 each. Recorded center prices are assumed USD; accent pricing is a temporary lab-grown diamond estimate. Other fees and tax are excluded.','Precious-metal melt value uses a dated spot snapshot and alloy fineness; base metals, coatings and supplier premiums are excluded.']};
}

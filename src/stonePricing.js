// Temporary round CVD lab-grown diamond benchmark, G+/VS+, checked 2026-10-08.
export const accentPriceSource='https://trilliantdiamondsllc.com/pages/melee-lab-diamonds';
// Upper estimated carat weight / USD per carat. Model carats are approximate.
// Diamond density 3.52 g/cm³; 1 carat = 0.2 g. https://www.gia.edu/diamond
const bands=[[.0025,250],[.005,225],[.0075,200],[.03,150],[.07,165],[.15,200],[.20,210],[.25,225],[Infinity,255]];
export function priceAccentStones(volumes){
 const stones=volumes.map(volume=>{const carats=volume*.0176,rate=bands.find(([max])=>carats<=max)[1];return {carats,rate,amount:carats*rate};});
 return {count:stones.length,carats:stones.reduce((s,x)=>s+x.carats,0),amount:stones.reduce((s,x)=>s+x.amount,0)};
}
export function centerStonePrice(config){
 if(!config.setting)return null;
 const s=config.stone,value=s.source?s.sourcePrice:s.price;
 return Number.isFinite(value)&&value>=0?value:null;
}

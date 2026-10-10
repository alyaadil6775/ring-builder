// Representative alloy densities; supplier alloy specifications take precedence.
// https://www.stuller.com/metals-comparison-charts/
export const isPlated=metal=>metal==='Gold-plated sterling silver';
export const isGold=metal=>metal.endsWith('gold');
export const metalLabel=c=>isGold(c.metal)?`${c.karat}k ${c.metal}`:c.metal==='Platinum'?'Platinum 950 (cobalt alloy)':isPlated(c.metal)?'18k gold-plated sterling silver 925':'Sterling silver 925';
export function alloyDensity(c){
 if(c.metal==='Platinum')return 20.10;
 if(c.metal==='Sterling silver'||isPlated(c.metal))return 10.36;
 return {'Yellow gold':{10:11.32,14:12.84,18:15.39},'White gold':{10:10.99,14:12.57,18:14.68},'Rose gold':{10:11.52,14:13.03,18:15.02}}[c.metal]?.[c.karat]??null;
}

export function alloySpecification(c){
 return {label:metalLabel(c),fineness:isGold(c.metal)?{10:.417,14:.585,18:.750}[c.karat]:c.metal==='Platinum'?.95:.925,densityGPerCm3:alloyDensity(c),densitySource:c.metal.includes('silver')?'https://www.pwbeck.com.au/preciousmetalservices/files/pms-catalogue.pdf':'https://www.stuller.com/metals-comparison-charts/'};
}

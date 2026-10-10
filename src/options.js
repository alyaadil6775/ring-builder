export const bandStyles=['Rounded','Flat','Knife edge','Soft square','Tapered','Reverse tapered','Split shank','Twisted','Rope','Bypass','Open','Wide','Sculpted organic','Vintage'];
export const accentStyles=['None','Pave','Micro-pave','Shared prong','Channel','Bar','Bezel accents','Flush accents','Scalloped U-cut'];
export const layoutStyles=['Solitaire','Three-stone','Five-stone','Halo','Double halo','Hidden halo','Graduated'];
export const slug=s=>s.toLowerCase().replaceAll(' ','-');
export const accentCompatibleBands=['Rounded','Flat','Soft square','Wide','Reverse tapered','Vintage','Knife edge'];
export const proceduralBands=['Tapered','Split shank','Twisted','Rope','Bypass','Open','Sculpted organic'];
export const settingCompatibleBands=[...accentCompatibleBands,...proceduralBands];
export function supportedAccents(band){
 if(accentCompatibleBands.includes(band))return accentStyles;
 if(band==='Rope')return ['None','Bezel accents'];
 if(proceduralBands.includes(band))return ['None','Pave','Micro-pave','Bezel accents'];
 return ['None'];
}

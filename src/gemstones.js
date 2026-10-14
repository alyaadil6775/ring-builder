export const gemColors={
 Colorless:'#ffffff',Blue:'#234acc','Light blue':'#89d8ef',Teal:'#168e99',
 Red:'#b51639',Pink:'#f090ba',Yellow:'#f4cd43',Green:'#23965d',
 Purple:'#9651c8',Orange:'#e87b28',Champagne:'#d7b486',Black:'#161921',
};
// Representative visual presets, not a mineral-identification simulation.
export const gemTypes={
 Diamond:{ior:2.42,dispersion:1.6,colors:['Colorless','Yellow','Pink','Blue','Green','Champagne','Black']},
 Moissanite:{ior:2.65,dispersion:2,colors:['Colorless','Champagne','Green','Blue','Black']},
 'Cubic zirconia (CZ)':{ior:2.17,dispersion:1.8,colors:Object.keys(gemColors)},
 Sapphire:{ior:1.77,dispersion:.3,colors:['Blue','Pink','Yellow','Purple','Teal','Colorless']},
 Ruby:{ior:1.77,dispersion:.3,colors:['Red','Pink']},
 Emerald:{ior:1.58,dispersion:.2,colors:['Green']},
 Amethyst:{ior:1.55,dispersion:.2,colors:['Purple']},
 Aquamarine:{ior:1.58,dispersion:.2,colors:['Light blue','Teal']},
 Topaz:{ior:1.62,dispersion:.3,colors:['Light blue','Blue','Colorless','Yellow','Champagne']},
 Garnet:{ior:1.79,dispersion:.4,colors:['Red','Orange','Green','Purple']},
 Peridot:{ior:1.67,dispersion:.3,colors:['Green']},
 Spinel:{ior:1.72,dispersion:.3,colors:['Red','Pink','Purple','Blue','Black']},
};
for(const [type,ior] of Object.entries({"Tourmaline":1.64,"Zircon":1.93,"Tanzanite":1.7,"Morganite":1.58,"Tsavorite Garnet":1.74,"Spessartite Garnet":1.8,"Citrine":1.55,"Opal":1.45,"Alexandrite":1.75,"Apatite":1.64,"Rhodolite Garnet":1.76,"Demantoid Garnet":1.89,"Zoisite":1.7,"Zultanite Diaspore":1.72,"Beryl":1.58,"Kunzite":1.66,"Sunstone":1.54,"Ametrine":1.55,"Chrysoberyl":1.75}))gemTypes[type]={ior,dispersion:.3,colors:Object.keys(gemColors)};
export function gemChoice(config,scope='center'){
 return {type:config[scope+'GemType']??'Diamond',color:config[scope+'GemColor']??'Colorless'};
}
export function isDefaultGem(config,scope='center'){
 const choice=gemChoice(config,scope);return choice.type==='Diamond'&&choice.color==='Colorless';
}
export function gemLabel(config,scope='center'){
 const {type,color}=gemChoice(config,scope);return type+' / '+color;
}
export function gemValidation(config){
 const errors=[];
 for(const scope of ['center','side','accent']){
  const {type,color}=gemChoice(config,scope);
  if(!Object.hasOwn(gemTypes,type)||!gemTypes[type].colors.includes(color))errors.push('Choose a supported '+scope+' gemstone and color.');
 }
 return errors;
}

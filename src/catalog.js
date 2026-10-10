import {stullerSamples} from './stullerSamples.js';
// Legacy synthetic samples plus selected dimensioned records from the supplied database.
export const stones = [
  {id:'demo-round-1',shape:'Round',carat:1,lengthMm:6.5,widthMm:6.5,depthMm:4,price:2200},
  {id:'demo-round-2',shape:'Round',carat:2,lengthMm:8.2,widthMm:8.2,depthMm:5,price:5100},
  {id:'demo-oval',shape:'Oval',carat:1.5,lengthMm:9,widthMm:6.5,depthMm:4.2,price:3400},
  {id:'demo-emerald',shape:'Emerald',carat:1.5,lengthMm:8,widthMm:6,depthMm:4,price:3200},

  ...stullerSamples,
];
export const metals = { 'Yellow gold':'#d8b264', 'White gold':'#d5dce3', 'Rose gold':'#dca38e', 'Platinum':'#d9d9d5', 'Sterling silver':'#edf0f2', 'Gold-plated sterling silver':'#d8b264' };
export function quote(config) {
  const band = {Plain:450,Tapered:525,'Split shank':650}[config.band];
  const setting = config.setting === 'Bezel' ? 300 : 220;
  return {band,setting,stone:config.stone.price,total:band+setting+config.stone.price};
}

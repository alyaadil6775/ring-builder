export const sideStoneShapes=['Round','Oval','Emerald','Pear','Marquise','Princess','Cushion','Radiant','Asscher','Baguette','Tapered baguette','Trillion','Trapezoid','Half-moon'];
export const sideStoneLayouts=['Three-stone','Five-stone','Graduated'];
const ratios={Oval:1.4,Emerald:1.45,Pear:1.5,Marquise:1.7,Radiant:1.35,Baguette:1.8,'Tapered baguette':1.65,Trapezoid:1.2,'Half-moon':.65};
export function layoutSideStone(config,index=0){
 const shape=config.sideStoneShape??'Round';
 const width=index===0?2.7:config.layout==='Graduated'?1.65:1.9;
 return {shape,widthMm:width,lengthMm:width*(ratios[shape]??1),depthMm:width*.60};
}
export function sideStoneRotation(shape,sign=1){
 return ['Pear','Marquise','Tapered baguette','Trillion','Trapezoid','Half-moon'].includes(shape)?-sign*Math.PI/2:0;
}
export function sideStoneSpan(stone){
 return sideStoneRotation(stone.shape)?stone.lengthMm:stone.widthMm;
}

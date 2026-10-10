import {ringDimensions} from './sizing.js';
import {bandStyles,accentStyles,layoutStyles,accentCompatibleBands,settingCompatibleBands,supportedAccents} from './options.js';
import {stoneOutline} from './proceduralSetting.js';
import {offsetContour} from './proceduralLayout.js';
export const supportedShapes=['Round','Oval','Emerald','Princess','Cushion','Pear','Marquise','Radiant','Asscher','Heart'];
export function layoutFootprint(config){
 const {centerRadiusMm:r}=ringDimensions(config),stone=config.stone;
 const rotated=Number(config.orientationDeg)===90,width=rotated?stone.lengthMm:stone.widthMm;
 const layout=config.layout??'Solitaire';let reserve=Math.asin(Math.min(.95,(width/2+.4)/r))+.06;
 let sideAngles=[],haloSpan=0;
 if(['Halo','Double halo','Hidden halo'].includes(layout)){
  const offset={Halo:.85,'Double halo':1.9,'Hidden halo':stone.shape==='Heart'?.65:-.25}[layout];
  const contour=offsetContour(stoneOutline(stone.shape),stone.widthMm,stone.lengthMm,offset);
  haloSpan=Math.max(...contour.map(([x,y])=>Math.abs(rotated?y:x)))+.425;
  reserve=Math.asin(Math.min(.98,haloSpan/r))+.16;
 }
 if(['Three-stone','Five-stone','Graduated'].includes(layout)){
  const ratio=(width/2+.45+1.35+.45)/r;
  const first=Math.asin(Math.min(.999,ratio));sideAngles=[first];
  if(layout!=='Three-stone')sideAngles.push(first+2.65/(r+2.2));
  reserve=sideAngles.at(-1)+.16;
 }
 const zone=reserve<=.4?'standard':reserve<=.7?'head':reserve<=.9?'wide':'multi';
 return {reserveAngle:reserve,zone,sideAngles,haloSpan,shoulderAvailable:reserve<=1.1,layoutFits:haloSpan<r*.9&&(!sideAngles.length||sideAngles.at(-1)<1.25)};
}
export function validateDesign(c){
 const errors=[];
 if(c.ringSystem&&!['US','Circumference'].includes(c.ringSystem))errors.push('Unknown ring size system.');
 if(c.band&&!bandStyles.includes(c.band))errors.push('Unknown band profile.');
 if(c.accents&&!accentStyles.includes(c.accents))errors.push('Unknown accent style.');
 if(c.layout&&!layoutStyles.includes(c.layout))errors.push('Unknown layout.');
 if(c.setting&&!['4 prong','6 prong','Bezel'].includes(c.setting))errors.push('Unknown center holder.');
 if(![0,90].includes(Number(c.orientationDeg??0)))errors.push('Choose north/south or east/west orientation.');
 if(!Number.isFinite(c.widthMm)||c.widthMm<1.5||c.widthMm>5)errors.push('Band width must be 1.5–5 mm.');
 if(!Number.isFinite(c.thicknessMm)||c.thicknessMm<1||c.thicknessMm>2)errors.push('Band thickness must be 1–2 mm.');
 const s=c.stone;
 if(!s||!supportedShapes.includes(s.shape)||![s.widthMm,s.lengthMm,s.depthMm].every(v=>Number.isFinite(v)&&v>0)||s.widthMm>14||s.lengthMm>14||s.depthMm>6.5)errors.push('A supported stone with complete dimensions is required.');
 try{ringDimensions(c);}catch(e){errors.push(e.message);}
 const fitted=c.accents&&c.accents!=='None';
 if(c.band&&!settingCompatibleBands.includes(c.band)&&(c.setting||c.layout&&c.layout!=='Solitaire'))errors.push('This band does not have a fitted center mount.');
 if(fitted&&!supportedAccents(c.band).includes(c.accents))errors.push('This accent needs a different shoulder seat; choose a supported accent for this band.');
 if(fitted&&accentCompatibleBands.includes(c.band)){
  const native=c.band==='Wide'?4.4:['Flat','Soft square'].includes(c.band)?2.3:2.1;
  if(Math.abs(c.widthMm-native)>.001||Math.abs(c.thicknessMm-1.3)>.001)errors.push('Accented bands require their matched width and 1.3 mm thickness.');
 }
 if(!errors.length){const f=layoutFootprint(c);if(!f.layoutFits)errors.push('This layout is too wide for the selected ring size and stone orientation.');if(fitted&&!f.shoulderAvailable)errors.push('There is no clear shoulder area for accents with this layout. Choose None.');}
 return errors;
}
export function fitSelection(c){
 const next={...c};
 if(next.band&&!settingCompatibleBands.includes(next.band)){next.accents='None';next.layout=null;next.setting=null;next.showStone=false;}
 if(next.accents&&!supportedAccents(next.band).includes(next.accents))next.accents='None';
 if(next.accents&&next.accents!=='None'&&accentCompatibleBands.includes(next.band)){next.widthMm=next.band==='Wide'?4.4:['Flat','Soft square'].includes(next.band)?2.3:2.1;next.thicknessMm=1.3;}
 try{const f=layoutFootprint(next);if(!f.shoulderAvailable&&next.accents&&next.accents!=='None')next.accents='None';}catch{}
 return next;
}

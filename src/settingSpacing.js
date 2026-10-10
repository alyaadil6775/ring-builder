import {settingPlan} from './proceduralSetting.js';
import {layoutSideStone,sideStoneRotation} from './layoutStones.js';
import {ringDimensions} from './sizing.js';

// Bounds of the visible stone and upper holder, in the actual viewer axes.
export function crownBounds(plan,rotation=0,tilt=0){
 const points=[];
 for(const [x,y] of plan.outline)for(const [scale,height] of [[1,plan.girdle],[.58,plan.girdle+plan.depth*.22]]){
  points.push([x*plan.width/2*scale,-y*plan.length/2*scale,height,0]);
 }
 for(const prong of plan.prongs)for(const [x,y,height] of prong.controls.slice(1)){
  points.push([x,-y,height,plan.radius+(prong.protective?.13:0)]);
 }
 if(plan.setting==='Bezel')for(const [x,y] of plan.outline)points.push([x*plan.width*.5225,-y*plan.length*.5225,plan.girdle+.12,0]);
 const xs=points.flatMap(([x,z,height,pad])=>{
  const horizontal=x*Math.cos(rotation)+z*Math.sin(rotation);
  const projected=horizontal*Math.cos(tilt)+height*Math.sin(tilt);
  return [projected-pad,projected+pad];
 });
 return {min:Math.min(...xs),max:Math.max(...xs)};
}
export function sidePlacements(config){
 const r=ringDimensions(config).centerRadiusMm;
 const center=settingPlan(config.stone,config.setting??'4 prong',config.thicknessMm,r);
 const bounds=crownBounds(center,Number(config.orientationDeg??0)*Math.PI/180);
 const result={};
 for(const sign of [-1,1]){
  let edge=sign===1?bounds.max:-bounds.min;
  const angles=[];
  for(let index=0;index<(config.layout==='Three-stone'?1:2);index++){
   const stone=layoutSideStone(config,index),plan=settingPlan(stone,'4 prong',config.thicknessMm,r,0);
   const outward=sideStoneRotation(stone.shape,sign),gap=.18;
   const projected=angle=>{
    const b=crownBounds(plan,outward,sign*angle);
    return sign===1?{near:b.min,far:b.max}:{near:-b.max,far:-b.min};
   };
   let low=0,high=1.55;
   for(let i=0;i<32;i++){
    const mid=(low+high)/2;
    if(projected(mid).near<edge+gap)low=mid;else high=mid;
   }
   const angle=high,b=projected(angle);
   angles.push(angle);edge=b.far;
  }
  result[sign]=angles;
 }
 return result;
}

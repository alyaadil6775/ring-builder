import test from 'node:test';
import assert from 'node:assert/strict';
import {initialConfig} from '../src/designStorage.js';
import {stones} from '../src/catalog.js';
import {sideStoneShapes,sideStoneLayouts,layoutSideStone,sideStoneRotation} from '../src/layoutStones.js';
import {layoutFootprint} from '../src/designRules.js';
import {settingPlan} from '../src/proceduralSetting.js';
import {ringDimensions} from '../src/sizing.js';
import {crownBounds} from '../src/settingSpacing.js';
test('every side shape and center holder has a consistent close crown clearance at all ring sizes',()=>{
 const centers=[...new Map(stones.map(s=>[s.shape,s])).values()];
 for(const stone of centers)for(const sideStoneShape of sideStoneShapes)for(const setting of ['4 prong','6 prong','Bezel'])for(const ringSize of [3,7,13])for(const orientationDeg of [0,90])for(const layout of sideStoneLayouts){
  const c={...initialConfig(),band:'Rounded',accents:'None',stone,sideStoneShape,setting,ringSize,orientationDeg,layout};
  const r=ringDimensions(c).centerRadiusMm,f=layoutFootprint(c);
  const center=crownBounds(settingPlan(stone,setting,c.thicknessMm,r),orientationDeg*Math.PI/180);
  for(const sign of [-1,1]){
   let edge=sign===1?center.max:-center.min;
   for(const [index,angle] of f.sideAnglesBySign[sign].entries()){
    if(angle>=1.25)break; // Unsupported layouts remain disabled by fit validation.
    const side=layoutSideStone(c,index);
    const b=crownBounds(settingPlan(side,'4 prong',c.thicknessMm,r,0),sideStoneRotation(side.shape,sign),sign*angle);
    const gap=(sign===1?b.min:-b.max)-edge;
    assert.ok(Math.abs(gap-.18)<1e-6,[stone.shape,sideStoneShape,setting,ringSize,orientationDeg,layout,sign,gap].join(' '));
    edge=sign===1?b.max:-b.min;
   }
  }
 }
});
test('raised round settings no longer inherit the excessive band-radius gap',()=>{
 const c={...initialConfig(),band:'Rounded',layout:'Three-stone',setting:'4 prong'},r=ringDimensions(c).centerRadiusMm;
 const old=Math.asin((c.stone.widthMm/2+.45+1.35+.45)/r);
 assert.ok(layoutFootprint(c).sideAngles[0]<old-.08);
});

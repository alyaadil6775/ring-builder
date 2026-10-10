import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {sideStoneShapes,sideStoneLayouts,layoutSideStone} from '../src/layoutStones.js';
import {initialConfig,encodeDesign,decodeDesign,serializeDesign,restoreDesign} from '../src/designStorage.js';
import {layoutFootprint,validateDesign} from '../src/designRules.js';
import {settingPlan} from '../src/proceduralSetting.js';
import {createLayout} from '../src/proceduralLayout.js';
import {ringDimensions} from '../src/sizing.js';
const config=()=>({...initialConfig(),band:'Rounded',accents:'None',layout:'Three-stone',setting:'4 prong'});
test('side shapes persist in shares, old designs default to round, unknown shapes reject',()=>{
 for(const shape of sideStoneShapes)assert.equal(decodeDesign(encodeDesign({...config(),sideStoneShape:shape})).sideStoneShape,shape);
 const old=serializeDesign(config());delete old.config.sideStoneShape;
 assert.equal(restoreDesign(old).sideStoneShape,'Round');
 old.config.sideStoneShape='Invalid';assert.throws(()=>restoreDesign(old));
});
test('every side shape has finite fitted geometry and mirrored matched pairs',()=>{
 for(const layout of sideStoneLayouts)for(const shape of sideStoneShapes){
  const c={...config(),layout,sideStoneShape:shape};
  assert.deepEqual(validateDesign(c),[],layout+' '+shape);
  const footprint=layoutFootprint(c),r=ringDimensions(c).centerRadiusMm;
  const group=createLayout({config:c,plan:settingPlan(c.stone,c.setting,c.thicknessMm,r),footprint});
  const gems=[];group.traverse(o=>{if(o.isMesh){assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));if(o.userData.sideStone)gems.push(o);}});
  assert.equal(gems.length,layout==='Three-stone'?2:4);
  for(const index of [0,...(gems.length===4?[1]:[])]){
   const pair=gems.filter(o=>o.userData.sideStone.index===index);
   assert.equal(pair[0].userData.sideStone.shape,shape);
   assert.ok(Math.abs(pair[0].rotation.y+pair[1].rotation.y)<1e-9);
   const a=pair[0].getWorldPosition(new THREE.Vector3()),b=pair[1].getWorldPosition(new THREE.Vector3());
   assert.ok(Math.abs(a.x+b.x)<1e-6);assert.ok(Math.abs(a.y-b.y)<1e-6);
  }
  if(layout!=='Three-stone')assert.ok(layoutSideStone(c,1).widthMm<layoutSideStone(c).widthMm);
  group.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
 }
});
test('elongated outward-facing side stones reserve more space than round stones',()=>{
 const c=config(),round=layoutFootprint(c),pear=layoutFootprint({...c,sideStoneShape:'Pear'});
 assert.ok(pear.sideAngles[0]>round.sideAngles[0]);
 assert.ok(pear.reserveAngle>round.reserveAngle);
});

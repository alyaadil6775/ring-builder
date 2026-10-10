import {pricingPolicy} from '../src/pricingPolicy.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {measureMetal} from '../src/metalVolume.js';
import {priceDesign} from '../src/pricing.js';
import {initialConfig,serializeDesign,restoreDesign} from '../src/designStorage.js';
import {createPlainBand} from '../src/plainBand.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
test('oppositely wound shells do not cancel when combined in one metal mesh',()=>{
 const a=new THREE.BoxGeometry(2,2,2).toNonIndexed(),b=a.clone().translate(5,0,0),p=b.attributes.position;
 for(let i=0;i<p.count;i+=3){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);p.setXYZ(i,p.getX(i+1),p.getY(i+1),p.getZ(i+1));p.setXYZ(i+1,x,y,z);}
 const mesh=new THREE.Mesh(mergeGeometries([a,b]),new THREE.MeshBasicMaterial({name:'Metal'}));
 assert.ok(Math.abs(measureMetal(mesh).volumeMm3-16)<1e-8);
});
test('generated rounded ring volume agrees with its analytic elliptical torus',()=>{
 const config={...initialConfig(),band:'Rounded'},r=(17.3+config.thicknessMm)/2;
 const expected=2*Math.PI*r*Math.PI*config.widthMm*config.thicknessMm/4;
 assert.ok(Math.abs(measureMetal(createPlainBand({config})).volumeMm3/expected-1)<.01);
});
test('metal volume uses world scale and excludes gemstones',()=>{
 const group=new THREE.Group();
 const metal=new THREE.Mesh(new THREE.BoxGeometry(2,3,4),new THREE.MeshBasicMaterial({name:'Metal'}));metal.scale.set(2,1,1);metal.position.set(20,-10,5);group.add(metal);
 group.add(new THREE.Mesh(new THREE.BoxGeometry(10,10,10),new THREE.MeshBasicMaterial({name:'Gem'})));
 assert.ok(Math.abs(measureMetal(group).volumeMm3-48)<1e-8);
 assert.ok(Math.abs(measureMetal(group).surfaceAreaMm2-80)<1e-8);
});
test('gold-plated silver uses a silver core, separate gold coating without charging excluded fees',()=>{
 const config={...initialConfig(),band:'Rounded',metal:'Gold-plated sterling silver'};
 config.pricing={...config.pricing,metalPerGram:1,platingMicrons:2.5,platingFee:25};
 assert.equal(restoreDesign(serializeDesign(config)).metal,config.metal);
 const q=priceDesign(config,{volumeMm3:1000,surfaceAreaMm2:1000});
 assert.equal(q.weightGrams,10.36);assert.equal(q.platingVolumeMm3,2.5);
 assert.ok(Math.abs(q.platingWeightGrams-.038475)<1e-8);
 assert.deepEqual(q.lines.map(l=>l.label),['Metal','Labor','Mold']);
 assert.ok(q.lines[0].amount>0);assert.equal(q.lines[1].amount,200);assert.equal(q.lines[2].amount,200);
});
test('alloy choices round-trip and measured weight drives metal pricing',()=>{
 for(const metal of ['Platinum','Sterling silver']){
  const config={...initialConfig(),band:'Rounded',metal};
  assert.equal(restoreDesign(serializeDesign(config)).metal,metal);
  config.pricing={...config.pricing,metalPerGram:10,castingAllowancePct:20};
  const q=priceDesign(config,{volumeMm3:1000});
  assert.equal(q.weightGrams,metal==='Platinum'?20.10:10.36);
  assert.notEqual(q.lines[0].amount,q.weightGrams*10,'customer-entered rate is ignored');
  const original=pricingPolicy.metalRates[metal];pricingPolicy.metalRates[metal]=10;
  try{assert.ok(Math.abs(priceDesign(config,{volumeMm3:1000}).total-(q.weightGrams*10+400))<1e-8);}finally{pricingPolicy.metalRates[metal]=original;}
  assert.equal(priceDesign(config).weightGrams,null,'no stale formula when geometry is unavailable');
 }
});

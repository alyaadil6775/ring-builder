import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stones} from '../src/catalog.js';
import {assemblyParts} from '../src/assembly.js';
import {settingPlan,createSetting,stoneOutline} from '../src/proceduralSetting.js';
import * as THREE from 'three';
test('every database sample has a dimensioned stone and dynamically constructed holder',()=>{
 const samples=stones.filter(s=>s.source);assert.equal(samples.length,10);
 for(const stone of samples){
  assert.ok(stone.sourceId&&stone.sourceMeasurements);assert.equal(stone.price,0);
  assert.ok(fs.existsSync(new URL('../public/models/'+stone.id+'-stone.glb',import.meta.url)));
  for(const setting of ['4 prong','6 prong','Bezel']){
   const parts=assemblyParts({band:'Rounded',widthMm:2.1,thicknessMm:1.3,layout:'Solitaire',accents:'None',stone,setting,showStone:true});
   const holder=parts.find(p=>p.id==='setting');assert.equal(holder.procedural,'setting');assert.equal(holder.path,undefined);
   const plan=holder.plan;assert.ok(plan.bottom>=9.8+.84);assert.ok(plan.root<plan.bottom);
   assert.equal(parts.at(-1).heightOffset,plan.girdle-12.8);
   const group=createSetting(plan),bounds=new THREE.Box3().setFromObject(group);
   assert.ok(!bounds.isEmpty());group.traverse(o=>{if(o.isMesh){assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));o.geometry.dispose();o.material.dispose();}});
   assert.ok(plan.spokes.every(s=>s[0][2]===plan.stem[1][2]&&s[1][2]===plan.galleryHeight));
  }
 }
});
test('dimensions affect span, support height and prong thickness independently',()=>{
 const a=settingPlan({shape:'Oval',widthMm:5,lengthMm:7,depthMm:3}),b=settingPlan({shape:'Oval',widthMm:7,lengthMm:11,depthMm:5});
 assert.ok(b.girdle>a.girdle);assert.ok(b.radius>a.radius);
 assert.ok(Math.max(...b.prongs.map(p=>Math.abs(p.controls[0][1])))>Math.max(...a.prongs.map(p=>Math.abs(p.controls[0][1]))));
 assert.throws(()=>settingPlan({shape:'Round',widthMm:0,lengthMm:6,depthMm:4}));
});
test('pointed stones receive protection and outlines retain shape differences',()=>{
 for(const shape of ['Pear','Marquise','Heart','Princess'])assert.ok(settingPlan({shape,widthMm:6,lengthMm:8,depthMm:4}).prongs.some(p=>p.protective));
 assert.notDeepEqual(stoneOutline('Pear'),stoneOutline('Oval'));
 assert.notDeepEqual(stoneOutline('Cushion'),stoneOutline('Round'));
});

test('six-prong holders have distinct bearing locations on every outline',()=>{
 for(const shape of ['Round','Oval','Emerald','Princess','Cushion','Pear','Marquise','Radiant','Asscher','Heart']){
  const plan=settingPlan({shape,widthMm:6,lengthMm:8,depthMm:4},'6 prong');
  const locations=new Set(plan.prongs.map(p=>p.point.map(v=>v.toFixed(5)).join(',')));
  assert.equal(locations.size,plan.prongs.length,shape);
 }
});

test('database stone mesh bounds match the recorded physical dimensions',()=>{
 for(const stone of stones.filter(s=>s.source)){
  const raw=fs.readFileSync(new URL('../public/models/'+stone.id+'-stone.glb',import.meta.url));
  const gltf=JSON.parse(raw.toString('utf8',20,20+raw.readUInt32LE(12)));
  const bounds=gltf.accessors[gltf.meshes[0].primitives[0].attributes.POSITION];
  const dimensions=bounds.max.map((v,i)=>v-bounds.min[i]);
  for(const [actual,expected] of [[dimensions[0],stone.widthMm],[dimensions[1],stone.depthMm],[dimensions[2],stone.lengthMm]])assert.ok(Math.abs(actual-expected)<.001,stone.shape+' model dimensions');
 }
});

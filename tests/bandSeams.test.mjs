import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {smoothBandSeams} from '../src/bandNormals.js';
import {createBand} from '../src/proceduralBand.js';
import {accentCompatibleBands,accentStyles,proceduralBands,slug} from '../src/options.js';
import {initialConfig} from '../src/designStorage.js';
const loader=new GLTFLoader();
async function load(path){return (await loader.parseAsync(Uint8Array.from(fs.readFileSync(new URL('../public/models/'+path,import.meta.url))).buffer,'')).scene;}
function dispose(group){group.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
test('every exported plain and fitted profile removes internal top caps without erasing seats',async()=>{
 let removed=0;
 for(const band of accentCompatibleBands)for(const accent of [null,...accentStyles.filter(a=>a!=='None')]){
  const path=accent?'components/fitted/'+slug(band)+'-'+slug(accent)+'.glb':'components/bands-'+slug(band)+'.glb';
  const group=await load(path);
  group.traverse(o=>{if(!o.isMesh)return;
   const count=o.geometry.index?.count??o.geometry.attributes.position.count;
   const n=smoothBandSeams(o.geometry);removed+=n;
   assert.equal(o.geometry.index.count,count-n*3);
   assert.ok(o.geometry.attributes.normal.array.every(Number.isFinite));
   assert.equal(smoothBandSeams(o.geometry),0,'cap removal must be stable: '+path);
   if(o.name==='Band'&&!accent){
    const p=o.geometry.attributes.position,norm=o.geometry.attributes.normal;
    for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i))<1e-5&&p.getY(i)>9&&Math.abs(p.getZ(i))<1e-5){
     assert.ok(norm.getY(i)>.99,'outer crown must shade radially: '+band);
     assert.ok(Math.abs(norm.getX(i))<.01,'no tangential smear: '+band);
    }
   }
  });dispose(group);
 }
 assert.ok(removed>100,'exercise actual exported cap defects');
});
test('closed procedural sweeps have no internal caps and open ends stay sealed',()=>{
 for(const band of proceduralBands){
  const config={...initialConfig(),band};
  const group=createBand({config}),geometry=group.children[0].geometry;
  const p=geometry.attributes.position;
  assert.ok(p.array.every(Number.isFinite));
  // Re-welding a healthy band should find no embedded cross-section caps.
  assert.equal(smoothBandSeams(geometry),0,band);
  if(['Open','Bypass'].includes(band)){
   // Each endpoint still has a filled cross-section after cleaning.
   const idx=geometry.index.array;
   let caps=0;
   for(let k=0;k<idx.length;k+=3){
    const ids=Array.from(idx.slice(k,k+3)),first=ids[0];
    const radius=Math.hypot(p.getX(first),p.getY(first)),tx=-p.getY(first)/radius,ty=p.getX(first)/radius;
    if(ids.every(i=>Math.abs(p.getX(i)*tx+p.getY(i)*ty)<1e-4))caps++;
   }
   assert.ok(caps>=60,band+' must keep both 32-vertex end caps');
  }
  dispose(group);
 }
});

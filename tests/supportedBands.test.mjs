import test from 'node:test';
import assert from 'node:assert/strict';
import {initialConfig} from '../src/designStorage.js';
import {assemblyParts} from '../src/assembly.js';
import {proceduralBands,supportedAccents} from '../src/options.js';
import {validateDesign,fitSelection,layoutFootprint} from '../src/designRules.js';
import {settingPlan} from '../src/proceduralSetting.js';
import {ringDimensions} from '../src/sizing.js';
import {createBand,bandAnchors,bandRails} from '../src/proceduralBand.js';
import {createBandAccents} from '../src/proceduralAccents.js';
const config=(band,ringSize=7)=>({...initialConfig(),band,ringSize,accents:'None',layout:'Solitaire',setting:'4 prong',showStone:true});
const dispose=g=>g.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
test('all seven formerly preview-only bands retain a fitted holder',()=>{
 for(const band of proceduralBands){const c=fitSelection(config(band));assert.equal(c.setting,'4 prong');assert.deepEqual(validateDesign(c),[]);const parts=assemblyParts(c);assert.equal(parts[0].procedural,'band');assert.ok(parts.some(p=>p.id==='setting'));}
});
test('split shoulders anchor both rails; open and bypass mounts bridge both ends',()=>{
 assert.equal(bandRails(config('Split shank'),Math.PI).length,1,'lower split shank is one solid band');
 assert.equal(bandRails(config('Split shank'),0).length,2,'upper split shoulders retain two rails');
 for(const band of ['Split shank','Open','Bypass'])for(const ringSize of [3,7,13]){
  const c=config(band,ringSize),plan=settingPlan(c.stone,c.setting,c.thicknessMm,ringDimensions(c).centerRadiusMm),g=createBand({config:c,plan,footprint:layoutFootprint(c)});
  const contacts=g.userData.contacts;assert.equal(contacts.length,2);
  for(const contact of contacts){assert.ok(bandAnchors(c,contact.angle).some(v=>v.distanceTo({x:contact.anchor[0],y:contact.anchor[1],z:contact.anchor[2]})<1e-8));assert.ok(contact.target[1]+contact.radius<plan.bottom);}
  assert.ok(Math.abs(contacts[0].anchor[2]-contacts[1].anchor[2])>.1||contacts[0].anchor[0]*contacts[1].anchor[0]<0);dispose(g);
 }
});
test('supported shoulder pods are finite, backed and independently dimensioned',()=>{
 for(const band of proceduralBands)for(const accents of supportedAccents(band).filter(a=>a!=='None')){
  const c={...config(band),accents},g=createBandAccents({config:c,footprint:layoutFootprint(c)});assert.ok(g.userData.contacts.length>0,band+'/'+accents);
  for(const seat of g.userData.contacts){assert.ok(seat.stoneWidth<=.78);assert.ok(seat.floor<0);}
  g.traverse(o=>{if(o.isMesh)assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));});dispose(g);
 }
 assert.ok(validateDesign({...config('Split shank'),accents:'Channel'}).some(e=>e.includes('different shoulder seat')));
});

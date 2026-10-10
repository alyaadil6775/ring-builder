import test from 'node:test';
import assert from 'node:assert/strict';
import {initialConfig} from '../src/designStorage.js';
import {assemblyParts} from '../src/assembly.js';
import {createBandAccents} from '../src/proceduralAccents.js';
import {createLayout} from '../src/proceduralLayout.js';
import {measureMetal} from '../src/metalVolume.js';
import {priceAccentStones} from '../src/stonePricing.js';
import {priceDesign} from '../src/pricing.js';
import {stones} from '../src/catalog.js';
test('procedural accent count matches the actual placed seats',()=>{
 const c={...initialConfig(),band:'Split shank',accents:'Pave',layout:'Solitaire',setting:'4 prong'};
 const part=assemblyParts(c).find(p=>p.id==='accents'),group=createBandAccents(part);
 const measured=measureMetal(group,true),priced=priceAccentStones(measured.stoneVolumesMm3);
 assert.equal(priced.count,group.userData.contacts.length);assert.ok(priced.count>0);assert.ok(priced.amount>0);
});
test('halo stones are counted separately from their metal supports',()=>{
 const c={...initialConfig(),band:'Rounded',accents:'None',layout:'Halo',setting:'4 prong'};
 const group=createLayout(assemblyParts(c).find(p=>p.id==='layout'));
 let expected=0;group.traverse(o=>{if(o.isMesh&&o.material.name==='Gem')expected++;});
 const volumes=measureMetal(group,true).stoneVolumesMm3;assert.equal(volumes.length,expected);assert.ok(expected>0);
});
test('stone totals include recorded USD price and accent quantities; hiding center changes no price',()=>{
 const c={...initialConfig(),band:'Rounded',accents:'Pave',layout:'Solitaire',setting:'4 prong',stone:stones.find(s=>s.source),showStone:true};
 const measured={volumeMm3:200,accentStoneVolumesMm3:[.005/.0176,.005/.0176]};
 const q=priceDesign(c,measured),accent=q.lines.find(l=>l.label.startsWith('Accent'));
 assert.ok(Math.abs(accent.amount-2.25)<1e-8);assert.equal(q.accentStones.count,2);
 assert.equal(q.lines.find(l=>l.label==='Center stone (database USD)').amount,c.stone.sourcePrice);
 assert.equal(q.total,priceDesign({...c,showStone:false},measured).total);
 assert.equal(priceDesign(c,{volumeMm3:200}).total,null,'unmeasured accents must not silently cost zero');
});

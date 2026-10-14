import test from 'node:test';
import assert from 'node:assert/strict';
import {databaseStones,databaseStoneById} from '../src/databaseStones.js';
import {initialConfig,serializeDesign,restoreDesign} from '../src/designStorage.js';
import {validateDesign} from '../src/designRules.js';
import {assemblyParts} from '../src/assembly.js';
import {createStone} from '../src/proceduralLayout.js';
import {gemValidation} from '../src/gemstones.js';
import {centerStonePrice} from '../src/stonePricing.js';
const config=s=>({...initialConfig(),band:'Rounded',setting:'4 prong',accents:'None',layout:'Solitaire',stone:s,showStone:true,centerGemType:s.renderType,centerGemColor:s.renderColor});
test('copied database contains priced stones with valid material presets',()=>{
 assert.equal(databaseStones.length,10432);assert.equal(databaseStoneById.size,10432);
 for(const s of databaseStones){assert.ok(s.price>0);assert.ok(s.pricePerCarat>0);assert.deepEqual(gemValidation(config(s)),[]);}
});
test('database selection restores identity and renders procedural geometry for every supported shape',()=>{
 const seen=new Set();
 for(const s of databaseStones){const c=config(s);if(validateDesign(c).length||seen.has(s.shape))continue;seen.add(s.shape);
  assert.equal(restoreDesign(serializeDesign(c)).stone.sourceId,s.sourceId);
  const part=assemblyParts(c).find(p=>p.id==='stone');assert.equal(part.procedural,'stone');assert.equal(part.heightOffset,0);
  const mesh=createStone(s,part.girdle);assert.ok([...mesh.geometry.attributes.position.array].every(Number.isFinite));mesh.geometry.dispose();mesh.material.dispose();
  assert.equal(centerStonePrice(c),null,'unspecified currency must not become a USD estimate');
 }
 assert.equal(seen.size,15);
});

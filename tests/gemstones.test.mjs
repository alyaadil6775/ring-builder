import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {gemTypes,gemColors,gemValidation} from '../src/gemstones.js';
import {createGemMaterial} from '../src/gemAppearance.js';
import {initialConfig,encodeDesign,decodeDesign,serializeDesign,restoreDesign} from '../src/designStorage.js';
import {priceDesign} from '../src/pricing.js';
import {designSpecification,specificationHTML} from '../src/designExport.js';
const complete=()=>({...initialConfig(),band:'Rounded',accents:'None',layout:'Solitaire',setting:'4 prong',showStone:true});
test('all gemstone and color combinations render with finite, type-specific materials and persist',()=>{
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(2));
 for(const [type,preset] of Object.entries(gemTypes))for(const color of preset.colors){
  const config={...complete(),centerGemType:type,centerGemColor:color,sideGemType:type,sideGemColor:color,accentGemType:type,accentGemColor:color};
  assert.deepEqual(gemValidation(config),[]);
  const restored=decodeDesign(encodeDesign(config));
  for(const scope of ['center','side','accent']){
   assert.equal(restored[scope+'GemType'],type);assert.equal(restored[scope+'GemColor'],color);
  }
  const material=createGemMaterial(mesh,{type,color});
  assert.equal(material.ior,preset.ior);assert.equal(material.color.getHexString(),new THREE.Color(gemColors[color]).getHexString());
  assert.ok(Number.isFinite(material.thickness)&&material.thickness>0);
  assert.equal(material.transmission,color==='Black'?0:color==='Colorless'?.92:.88);material.dispose();
 }
 mesh.geometry.dispose();mesh.material.dispose();
});
test('legacy designs restore default diamonds; malformed gemstone selections reject',()=>{
 const payload=serializeDesign(complete());
 for(const key of Object.keys(payload.config))if(key.includes('Gem'))delete payload.config[key];
 assert.equal(restoreDesign(payload).centerGemType,'Diamond');assert.equal(restoreDesign(payload).sideGemColor,'Colorless');
 payload.config.centerGemType='Unknown';assert.throws(()=>restoreDesign(payload));
 payload.config.centerGemType='Ruby';payload.config.centerGemColor='Blue';assert.throws(()=>restoreDesign(payload));
});
test('CZ and colored stones never inherit diamond prices, weight, or certification',()=>{
 const c=complete(),measurement={volumeMm3:200,accentStoneVolumesMm3:[1,1]};
 assert.ok(priceDesign(c,measurement).total>0);
 const cz={...c,centerGemType:'Cubic zirconia (CZ)',centerGemColor:'Colorless'};
 assert.equal(priceDesign(cz,measurement).total,null);
 assert.equal(priceDesign(cz,measurement).lines.find(l=>l.label.startsWith('Center')).amount,null);
 const spec=designSpecification(cz);assert.equal(spec.stone.type,'Cubic zirconia (CZ)');assert.equal(spec.stone.carat,undefined);assert.equal(spec.stone.sourcePrice,undefined);assert.equal(spec.stone.certification,undefined);
 assert.ok(specificationHTML(cz).includes('Cubic zirconia (CZ)'));
 const sides={...c,layout:'Three-stone',sideGemType:'Sapphire',sideGemColor:'Blue'};
 assert.equal(priceDesign(sides,measurement).total,null);assert.equal(priceDesign(sides,measurement).accentStones.carats,null);
 const accents={...c,accents:'Pave',accentGemType:'Cubic zirconia (CZ)'};
 assert.equal(priceDesign(accents,measurement).accentStones.amount,null);
 assert.ok(priceDesign({...sides,layout:'Solitaire'},measurement).total>0,'inactive side choice must not remove center price');
});

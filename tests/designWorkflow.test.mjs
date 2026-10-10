import test from 'node:test';
import assert from 'node:assert/strict';
import {initialConfig,serializeDesign,restoreDesign,encodeDesign,decodeDesign,readInitial,saveNamed,readSaved} from '../src/designStorage.js';
import {ringDimensions} from '../src/sizing.js';
import {validateDesign,layoutFootprint} from '../src/designRules.js';
import {stones} from '../src/catalog.js';
import {settingPlan} from '../src/proceduralSetting.js';
import {createLayout} from '../src/proceduralLayout.js';
import {priceDesign} from '../src/pricing.js';
import {designSpecification,specificationHTML} from '../src/designExport.js';
import * as THREE from 'three';
import {resizeMesh} from '../src/resizeGeometry.js';
const complete=()=>({...initialConfig(),band:'Rounded',accents:'None',layout:'Solitaire',setting:'4 prong',showStone:true});
test('resizing translates shoulder stones without stretching their dimensions',()=>{
 for(const delta of [-1.45,0.15,2.6]){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(.85,.5,.85));mesh.position.set(5,8,0);mesh.updateMatrixWorld(true);
  resizeMesh(mesh,delta,1,true);const size=mesh.geometry.boundingBox.getSize(new THREE.Vector3());
  assert.ok(Math.abs(size.x-.85)<1e-5);assert.ok(Math.abs(size.y-.5)<1e-5);assert.ok(Math.abs(size.z-.85)<1e-5);
  mesh.geometry.dispose();mesh.material.dispose();
 }
});
test('nominal minimum/middle/maximum sizing and circumference agree',()=>{
 for(const [size,diameter] of [[3,14.1],[7,17.3],[13,22.2]]){
  const c={...complete(),ringSize:size},d=ringDimensions(c);
  assert.equal(d.innerDiameterMm,diameter);
  assert.ok(Math.abs(ringDimensions({...c,ringSystem:'Circumference',ringSize:diameter*Math.PI}).innerDiameterMm-diameter)<1e-9);
  const p=settingPlan(c.stone,c.setting,c.thicknessMm,d.centerRadiusMm);
  assert.equal(p.stem[0][2],d.centerRadiusMm);
 }
 assert.throws(()=>ringDimensions({...complete(),ringSize:2}));
});
test('invalid combinations and untrusted catalog references are rejected',()=>{
 assert.ok(validateDesign({...complete(),band:'Unknown profile'}).length);
 const data=serializeDesign(complete());data.config.stoneId='../../untrusted';
 assert.throws(()=>restoreDesign(data));
 assert.throws(()=>decodeDesign('bad input'));
 assert.ok(validateDesign({...complete(),widthMm:NaN}).length);
});
test('shape-aware layouts produce finite geometry for every supported sample',()=>{
 let count=0;
 for(const stone of stones.filter(s=>s.source))for(const ringSize of [7])for(const orientationDeg of [0,90])for(const layout of ['Halo','Double halo','Hidden halo','Three-stone','Five-stone','Graduated']){
  const config={...complete(),stone,ringSize,orientationDeg,layout};
  if(validateDesign(config).length)continue;
  const plan=settingPlan(stone,config.setting,config.thicknessMm,ringDimensions(config).centerRadiusMm);
  const group=createLayout({config,plan,footprint:layoutFootprint(config)});
  let vertices=0;group.traverse(o=>{if(o.isMesh){const a=o.geometry.attributes.position.array;assert.ok(a.every(Number.isFinite));vertices+=a.length;o.geometry.dispose();o.material.dispose();}});
  assert.ok(vertices>0);count++;
 }
 assert.ok(count>=100);
});
test('Unicode shares and saved designs round-trip; malformed drafts recover',()=>{
 const c={...complete(),notes:'Ring for Zoë ♥'};assert.equal(decodeDesign(encodeDesign(c)).notes,c.notes);
 const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 saveNamed(storage,c,'Sample','sample-id');assert.equal(restoreDesign(readSaved(storage)[0].design).stone.id,c.stone.id);
 assert.equal(readInitial({getItem:()=>'{broken'},'http://localhost/').config.band,null);
});
test('customer pricing overrides cannot change fixed business fees or add excluded costs',()=>{
 const c=complete();c.pricing={...c.pricing,metalPerGram:1,labor:0,mold:0,densityGPerCm3:999,taxPct:50,settingFee:900};
 const q=priceDesign(c,{volumeMm3:200});
 assert.deepEqual(q.lines.map(l=>l.label),['Metal','Labor','Mold','Center stone (sample price)']);
 assert.equal(q.lines[1].amount,200);assert.equal(q.lines[2].amount,200);assert.ok(q.total>400);
 assert.notEqual(q.densityGPerCm3,999);
 assert.deepEqual(q,priceDesign({...c,showStone:false,stonePriceCurrency:'EUR'},{volumeMm3:200}));
});
test('handoff preserves source identity and escapes user notes',()=>{
 const c={...complete(),stone:stones.find(s=>s.source),notes:'<script>alert(1)</script>'};
 const spec=designSpecification(c);assert.equal(spec.units,'millimeters');assert.equal(spec.stone.sourceId,c.stone.sourceId);
 assert.match(spec.productionStatus,/CAD/);assert.equal(restoreDesign(spec).stone.id,c.stone.id);
 const html=specificationHTML(c);assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));
});

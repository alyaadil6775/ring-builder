import {fitSelection} from '../src/designRules.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assemblyParts,accentZone,accentCompatibleBands,accentStyles,slug} from '../src/assembly.js';
import {isGemMaterial} from '../src/materials.js';
const root=new URL('../public/models/',import.meta.url);
const config={band:'Rounded',widthMm:2.1,thicknessMm:1.3,accents:null,layout:null,setting:null,showStone:false,stone:{id:'demo-round-1',shape:'Round',widthMm:6.5,lengthMm:6.5,depthMm:4}};
function glb(path){const raw=fs.readFileSync(new URL(path,root));assert.equal(raw.toString('ascii',0,4),'glTF');assert.equal(raw.readUInt32LE(8),raw.length);return JSON.parse(raw.toString('utf8',20,20+raw.readUInt32LE(12)));}
test('assembly begins empty and only adds selected components',()=>{
 assert.deepEqual(assemblyParts({...config,band:null}),[]);
 assert.deepEqual(assemblyParts(config).map(p=>p.id),['band']);
 assert.deepEqual(assemblyParts({...config,accents:'None',layout:'Solitaire'}).map(p=>p.id),['band']);
 assert.deepEqual(assemblyParts({...config,setting:'4 prong'}).map(p=>p.id),['band','setting']);
 assert.deepEqual(assemblyParts({...config,setting:'4 prong',showStone:true}).map(p=>p.id),['band','setting','stone']);
});
test('every supported accent/profile pair has a recessed metal-only band',()=>{
 for(const band of accentCompatibleBands)for(const accents of accentStyles.filter(a=>a!=='None')){
  const parts=assemblyParts(fitSelection({...config,band,accents}));
  assert.equal(parts[0].widthScale,1);assert.equal(parts[0].thickness,1);
  const data=glb(parts[0].path+'.glb');assert.ok(data.meshes.length);assert.ok(data.materials.every(m=>!isGemMaterial(m.name)));
  glb(parts[1].path+'.glb');
 }
 const before=glb('components/bands-rounded.glb');const after=glb('components/fitted/rounded-pave.glb');
 const count=d=>d.meshes.reduce((n,m)=>n+m.primitives.reduce((s,p)=>s+d.accessors[p.attributes.POSITION].count,0),0);
 assert.ok(count(after)>count(before),'seat cuts add real band topology');
});
test('all exported accent stones retain gem materials including Blender suffixes',()=>{
 assert.equal(isGemMaterial('Gem.012'),true);assert.equal(isGemMaterial('Metal'),false);
 for(const accents of accentStyles.filter(a=>a!=='None')){
  const data=glb('components/accents-'+slug(accents)+'.glb');
  assert.ok(data.materials.some(m=>isGemMaterial(m.name)),accents+' must contain gemstones');
  assert.ok(data.nodes.every(n=>!n.name?.startsWith('Band')),accents+' must remain an independent overlay');
 }
});

test('head clearance changes both accent placement and its recessed seats',()=>{
 for(const [layout,zone] of [['Halo','head'],['Hidden halo','head'],['Double halo','wide'],['Three-stone','wide'],['Five-stone','multi'],['Graduated','multi']]){
  assert.equal(accentZone({...config,layout}),zone);
  for(const band of accentCompatibleBands)for(const accents of accentStyles.filter(a=>a!=='None')){
   const parts=assemblyParts(fitSelection({...config,band,accents,layout}));
   assert.ok(parts[0].path.endsWith('-'+zone));assert.ok(parts[1].path.endsWith('-'+zone));
   glb(parts[0].path+'.glb');glb(parts[1].path+'.glb');
  }
 }
 assert.equal(accentZone({...config,layout:'Solitaire',stone:{widthMm:8.2}}),'head');
});

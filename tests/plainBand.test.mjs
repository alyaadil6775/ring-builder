import test from 'node:test';
import assert from 'node:assert/strict';
import {assemblyParts} from '../src/assembly.js';
import {createPlainBand} from '../src/plainBand.js';
import {ringDimensions} from '../src/sizing.js';
import {initialConfig} from '../src/designStorage.js';

test('plain rounded band has a continuous wrap and correct gauge at each size',()=>{
 for(const ringSize of [3,7,13]){
  const config={...initialConfig(),band:'Rounded',ringSize,ringSystem:'US',widthMm:3.4,thicknessMm:1.6,accents:'None',layout:null,setting:null};
  const [part]=assemblyParts(config);assert.equal(part.procedural,'plainBand');assert.equal(part.radiusDelta,undefined);
  const mesh=createPlainBand(part).children[0],p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal;
  let inner=Infinity,outer=0,zMin=Infinity,zMax=-Infinity;
  for(let i=0;i<p.count;i++){const radius=Math.hypot(p.getX(i),p.getY(i));inner=Math.min(inner,radius);outer=Math.max(outer,radius);zMin=Math.min(zMin,p.getZ(i));zMax=Math.max(zMax,p.getZ(i));}
  assert.ok(Math.abs(inner*2-ringDimensions(config).innerDiameterMm)<1e-5);
  assert.ok(Math.abs(outer-inner-config.thicknessMm)<1e-5);assert.ok(Math.abs(zMax-zMin-config.widthMm)<1e-5);
  for(let j=0;j<=32;j++)for(const attr of [p,n])for(const axis of ['getX','getY','getZ'])assert.ok(Math.abs(attr[axis](j*257)-attr[axis](j*257+256))<1e-5,'wrap positions and normals must match');
  mesh.geometry.dispose();mesh.material.dispose();
 }
});

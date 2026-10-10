import * as THREE from 'three';
import {gemTypes,gemColors} from './gemstones.js';

export function createGemMaterial(mesh,choice={type:'Diamond',color:'Colorless'}){
 const preset=gemTypes[choice.type],tint=gemColors[choice.color],colored=choice.color!=='Colorless',opaque=choice.color==='Black';
 mesh.geometry.computeBoundingBox();
 const size=mesh.geometry.boundingBox.getSize(new THREE.Vector3()).multiply(mesh.scale);
 return new THREE.MeshPhysicalMaterial({
  name:'Gem',color:tint,metalness:0,roughness:opaque?.10:.003,
  transmission:opaque?0:.88,ior:preset.ior,dispersion:preset.dispersion,
  thickness:Math.max(.15,Math.min(size.x,size.y,size.z)),
  attenuationColor:tint,attenuationDistance:colored?Math.max(.4,Math.min(size.x,size.y,size.z)*1.5):Infinity,
  envMapIntensity:2.8,flatShading:true,
  specularIntensity:1,clearcoat:1,clearcoatRoughness:.003,
 });
}

// High-dynamic-range studio panels provide bright and dark shapes for each
// facet to reflect. The visible background stays independent of this map.
export function createJewelryEnvironment(renderer){
 const width=1024,height=512,data=new Float32Array(width*height*4);
 const panels=[
  [.16,.25,.055,.20,7,[1,.97,.91]],
  [.48,.24,.10,.055,9,[1,1,1]],
  [.72,.43,.028,.25,6,[.90,.96,1]],
  [.91,.22,.055,.07,10,[1,1,1]],
  [.36,.67,.035,.08,4,[1,.96,.90]],
  // Small jewelry spotlights produce brief facet flashes as the view rotates.
  [.08,.38,.009,.014,28,[1,1,1]],
  [.25,.48,.012,.018,24,[.88,.95,1]],
  [.40,.15,.010,.015,32,[1,.96,.88]],
  [.58,.38,.008,.013,30,[1,1,1]],
  [.67,.70,.011,.016,24,[1,.94,.85]],
  [.81,.18,.009,.014,32,[.90,.96,1]],
  [.95,.59,.010,.016,28,[1,1,1]],
 ];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=x/width,v=y/height,index=(y*width+x)*4;
  let color=[.10,.10,.10];
  for(const [cx,cy,rx,ry,power,tint] of panels){
   const dx=Math.min(Math.abs(u-cx),1-Math.abs(u-cx))/rx,dy=Math.abs(v-cy)/ry;
   const intensity=power*Math.exp(-Math.pow(dx,8)-Math.pow(dy,8));
   color=color.map((c,i)=>c+intensity*tint[i]);
  }
  data.set([...color,1],index);
 }
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat,THREE.FloatType);
 texture.mapping=THREE.EquirectangularReflectionMapping;texture.needsUpdate=true;
 const generator=new THREE.PMREMGenerator(renderer),target=generator.fromEquirectangular(texture);
 texture.dispose();generator.dispose();return target;
}

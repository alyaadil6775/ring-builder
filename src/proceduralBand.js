import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {ringDimensions} from './sizing.js';
export const bandGap=c=>['Open','Bypass'].includes(c.band)?.30:0;
export function bandRails(c,angle){
 const r=ringDimensions(c).centerRadiusMm,w=c.widthMm,t=c.thicknessMm,top=Math.max(0,Math.cos(angle))**4;
 const point=(radius,z,radialHalf=t/2,axialHalf=w/2)=>({center:new THREE.Vector3(radius*Math.sin(angle),radius*Math.cos(angle),z),radialHalf,axialHalf});
 if(c.band==='Split shank'){
  const signed=Math.atan2(Math.sin(angle),Math.cos(angle));
  if(Math.abs(signed)>1.300001)return [point(r,0)];
  return [-1,1].map(sign=>point(r,sign*(w*.25+1.1*top),t*(.38+.12*top),w*.24));
 }
 if(['Twisted','Rope'].includes(c.band)){
  const frequency=c.band==='Rope'?12:3,amplitude=t*.30,base=r-t*.12+amplitude;
  return [-1,1].map(sign=>point(base+sign*amplitude*Math.sin(angle*frequency),sign*w*.30*Math.cos(angle*frequency),t*.38,w*.24));
 }
 if(c.band==='Sculpted organic')return [point(r+.22*(1+Math.sin(angle*5)),.20*Math.sin(angle*3),t/2,w/2*(1+.12*Math.sin(angle*4)))];
 if(c.band==='Bypass')return [point(r+.15*(1+Math.sin(angle)),.85*Math.sin(angle)+Math.sign(Math.sin(angle))*1.15*top)];
 return [point(r,0,t/2,w/2*(c.band==='Tapered'?1-.48*top:1))];
}
export function bandAnchors(c,angle){
 const gap=bandGap(c);if(gap&&Math.abs(angle)<gap)angle=(angle<0?-1:1)*gap;
 return bandRails(c,angle).map(p=>p.center);
}
export function metalLink(a,b,radius,material){
 const delta=b.clone().sub(a),length=delta.length();if(length<1e-6)return null;
 const g=new THREE.CylinderGeometry(radius,radius,length,12),m=new THREE.Mesh(g,material);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;
}
export function mergeMetal(group,material){
 group.updateMatrixWorld(true);const meshes=[];group.traverse(o=>{if(o.isMesh&&o.material.name==='Metal')meshes.push(o);});
 if(!meshes.length)return;
 const pieces=meshes.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);g.deleteAttribute('uv');return g;});
 const geometry=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());meshes.forEach(o=>{o.parent.remove(o);o.geometry.dispose();if(o.material!==material)o.material.dispose();});
 const mesh=new THREE.Mesh(geometry,material);mesh.name='Connected '+group.name+' metal';group.add(mesh);
}
export function createBand({config:c,plan,footprint}){
 const group=new THREE.Group(),material=new THREE.MeshStandardMaterial({name:'Metal'}),gap=bandGap(c),N=192,M=16,r=ringDimensions(c).centerRadiusMm;
 group.name=c.band+' fitted band';const contacts=[];
 const definitions=c.band==='Split shank'?[{start:1.12,span:Math.PI*2-2.24,body:true},{start:-1.3,span:2.6,rail:0},{start:-1.3,span:2.6,rail:1}]:bandRails(c,Math.PI).map((_,rail)=>({start:gap,span:Math.PI*2-gap*2,rail}));
 for(const definition of definitions){
  const vertices=[],indices=[];
  for(let i=0;i<=N;i++){
   const a=definition.start+definition.span*i/N,p=definition.body?{center:new THREE.Vector3(r*Math.sin(a),r*Math.cos(a),0),radialHalf:c.thicknessMm/2,axialHalf:c.widthMm/2}:bandRails(c,a)[definition.rail],normal=new THREE.Vector3(Math.sin(a),Math.cos(a),0);
   for(let j=0;j<M;j++){const b=j*Math.PI*2/M;vertices.push(...p.center.clone().addScaledVector(normal,p.radialHalf*Math.cos(b)).add(new THREE.Vector3(0,0,p.axialHalf*Math.sin(b))).toArray());}
  }
  for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*M+j,b=i*M+(j+1)%M;indices.push(a,b,a+M,b,b+M,a+M);}
  for(const [base,reverse] of [[0,true],[N*M,false]])for(let j=1;j<M-1;j++)indices.push(base,base+(reverse?j+1:j),base+(reverse?j:j+1));
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();group.add(new THREE.Mesh(geometry,material));
 }
 function linkFromRails(angle,target,label){
  for(const anchor of bandAnchors(c,angle)){
   const radius=Math.min(.32,c.thicknessMm*.28),mesh=metalLink(anchor,target,radius,material);if(mesh)group.add(mesh);
   const sphere=new THREE.Mesh(new THREE.SphereGeometry(radius,12,8),material);sphere.position.copy(target);group.add(sphere);
   contacts.push({label,angle,anchor:anchor.toArray(),target:target.toArray(),radius});
  }
 }
 if(c.setting){
  const target=new THREE.Vector3(0,plan.root,0);
  if(gap){linkFromRails(-gap,target,'Center left shoulder');linkFromRails(gap,target,'Center right shoulder');}
  else linkFromRails(0,target,'Center gallery');
 }
 // Satellite stems use the common radius; bridge every actual rail into that root.
 if(['Three-stone','Five-stone','Graduated'].includes(c.layout))for(const sign of [-1,1])for(const angle of footprint.sideAngles){const a=sign*angle;linkFromRails(a,new THREE.Vector3(r*Math.sin(a),r*Math.cos(a),0),'Side basket');}
 mergeMetal(group,material);group.userData.contacts=contacts;return group;
}

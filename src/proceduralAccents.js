import * as THREE from 'three';
import {createStone} from './proceduralLayout.js';
import {bandRails,metalLink,mergeMetal} from './proceduralBand.js';
export function createBandAccents({config:c,footprint}){
 const group=new THREE.Group(),material=new THREE.MeshStandardMaterial({name:'Metal'}),centers=[],contacts=[];
 group.name=c.band+' '+c.accents+' shoulder seats';
 const limit=1.35,first=Math.max(.45,footprint.reserveAngle+.18);
 for(const sign of [-1,1])for(let angle=first;angle<=limit;angle+=.16){
  const a=sign*angle,rails=bandRails(c,a),normal=new THREE.Vector3(Math.sin(a),Math.cos(a),0);
  for(const rail of rails){
   const width=Math.min(c.accents==='Micro-pave'?.60:.78,rail.axialHalf*1.4),depth=width*.52;
   if(width<.42)continue;
   const center=rail.center.clone().addScaledVector(normal,rail.radialHalf+.14+depth*.78);
   if(rails.some(other=>other!==rail&&other.center.distanceTo(center)<Math.max(other.radialHalf,other.axialHalf)+width*.6+.12))continue;
   if(centers.some(p=>p.distanceTo(center)<width+.28))continue;centers.push(center);
   const local=new THREE.Group();local.position.copy(center);local.rotation.z=-a;
   local.add(createStone({shape:'Round',widthMm:width,lengthMm:width,depthMm:depth},0));
   const floor=-depth*.78-.045;
   // A closed floor and supporting stem keep the band opaque beneath every stone.
   const seat=new THREE.Mesh(new THREE.CylinderGeometry(width*.44,width*.38,.10,20),material);seat.position.y=floor-.035;local.add(seat);
   const stemStart=new THREE.Vector3(0,-(rail.radialHalf+.14+depth*.78),0),stemEnd=new THREE.Vector3(0,floor-.06,0);
   local.add(metalLink(stemStart,stemEnd,Math.max(.13,width*.22),material));
   if(c.accents==='Bezel accents'){
    const outer=width/2+.075,inner=width/2-.02,vertices=[],indices=[],N=32;
    for(let i=0;i<N;i++){const b=i*Math.PI*2/N;for(const [radius,y] of [[outer,floor],[outer,.045],[inner,.045],[inner,floor]])vertices.push(radius*Math.cos(b),y,radius*Math.sin(b));}
    for(let i=0;i<N;i++)for(let j=0;j<4;j++){const x=i*4+j,y=(i+1)%N*4+j,z=(i+1)%N*4+(j+1)%4,w=i*4+(j+1)%4;indices.push(x,y,z,x,z,w);}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();local.add(new THREE.Mesh(geometry,material));
   }else for(const sx of [-1,1])for(const sz of [-1,1]){
    const x=sx*width*.34,z=sz*width*.34,tip=new THREE.Vector3(x*.94,.045,z*.94);
    local.add(metalLink(new THREE.Vector3(x,floor,z),tip,.06,material));const bead=new THREE.Mesh(new THREE.SphereGeometry(.065,10,8),material);bead.position.copy(tip);local.add(bead);
   }
   group.add(local);contacts.push({angle:a,anchor:rail.center.toArray(),stoneWidth:width,floor,center:center.toArray()});
  }
 }
 mergeMetal(group,material);group.userData.contacts=contacts;return group;
}

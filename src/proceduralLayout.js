import {layoutSideStone,sideStoneRotation} from './layoutStones.js';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {settingPlan,createSetting,stoneOutline} from './proceduralSetting.js';
import {ringDimensions} from './sizing.js';
import {bandAnchors} from './proceduralBand.js';
import {proceduralBands} from './options.js';
const vec=(x,y,z)=>new THREE.Vector3(x,z,-y);
export function offsetContour(outline,width,length,offset){
 let points=outline.map(([x,y])=>new THREE.Vector2(x*width/2,y*length/2));
 if(THREE.ShapeUtils.area(points)<0)points=points.reverse();
 return points.map((p,i)=>{
  const incoming=p.clone().sub(points[(i+points.length-1)%points.length]).normalize(),outgoing=points[(i+1)%points.length].clone().sub(p).normalize();
  const a=new THREE.Vector2(incoming.y,-incoming.x),b=new THREE.Vector2(outgoing.y,-outgoing.x),normal=a.clone().add(b).normalize();
  const distance=offset/Math.max(.5,normal.dot(a));return p.clone().addScaledVector(normal,distance).toArray();
 });
}
export function createStone(stone,girdle){
 let outline=stoneOutline(stone.shape);if(THREE.ShapeUtils.area(outline.map(p=>new THREE.Vector2(...p)))<0)outline=[...outline].reverse();
 const n=outline.length,w=stone.widthMm/2,l=stone.lengthMm/2,d=stone.depthMm,vertices=[],indices=[];
 const rings=[[.04,girdle-d*.78],[.52,girdle-d*.46],[.98,girdle-.08],[1,girdle],[.58,girdle+d*.22]];
 for(const [scale,height] of rings)for(const [x,y] of outline)vertices.push(...vec(x*w*scale,y*l*scale,height).toArray());
 for(let k=0;k<4;k++)for(let i=0;i<n;i++){const a=k*n+i,b=k*n+(i+1)%n;indices.push(a,b,a+n,b,b+n,a+n);}
 const triangles=THREE.ShapeUtils.triangulateShape(outline.map(p=>new THREE.Vector2(...p)),[]);
 for(const tri of triangles){const [a,b,c]=tri;indices.push(c,b,a,4*n+a,4*n+b,4*n+c);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);
 const flat=geometry.toNonIndexed();geometry.dispose();flat.computeVertexNormals();
 return new THREE.Mesh(flat,new THREE.MeshPhysicalMaterial({name:'Gem',color:'#f1f8ff',transmission:1,ior:2.42,roughness:.02}));
}
export function createLayout({config,plan,footprint}){
 const group=new THREE.Group(),metal=new THREE.MeshStandardMaterial({name:'Metal'}),r=ringDimensions(config).centerRadiusMm;
 group.name='Fitted '+config.layout;
 function line(a,b,radius=.15){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);if(delta.length()<1e-5)return;const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,delta.length(),12),metal);mesh.position.copy(start.add(end).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());group.add(mesh);}
 function bead(p,radius){const mesh=new THREE.Mesh(new THREE.SphereGeometry(radius,10,8),metal);mesh.position.set(...p);group.add(mesh);}
 function loop(points,radius){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),true,'centripetal');group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(64,points.length*3),radius,10,true),metal));}
 const angle=Number(config.orientationDeg??0)*Math.PI/180;
 function halo(offset,height){
  const path=offsetContour(plan.outline,plan.width,plan.length,offset).map(([px,py])=>[px*Math.cos(angle)-py*Math.sin(angle),px*Math.sin(angle)+py*Math.cos(angle)]);
  const distances=path.map((p,i)=>Math.hypot(p[0]-path[(i+1)%path.length][0],p[1]-path[(i+1)%path.length][1])),length=distances.reduce((a,b)=>a+b,0),count=Math.max(8,Math.floor(length/1.00));
  loop(path.map(([x,y])=>[x,height-.5,-y]),.15);
  const placed=[];
  for(let k=0;k<count;k++){
   let distance=k*length/count,index=0;while(distance>distances[index]&&index<path.length-1)distance-=distances[index++];
   const t=distance/distances[index],a=path[index],b=path[(index+1)%path.length],x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;
   const localX=x*Math.cos(angle)+y*Math.sin(angle),localY=-x*Math.sin(angle)+y*Math.cos(angle);
   // Leave the heart cleft open: tiny stones here collide with the lobes or holder.
   if(config.stone.shape==='Heart'&&Math.abs(localX)<plan.width*.22&&localY>0)continue;
   if(placed.some(p=>Math.hypot(x-p[0],y-p[1])<.95))continue;placed.push([x,y]);
   const stone=createStone({shape:'Round',widthMm:.85,lengthMm:.85,depthMm:.5},height);stone.position.set(x,0,-y);group.add(stone);
   loop(Array.from({length:16},(_,i)=>[x+.3*Math.cos(i*Math.PI/8),height-.38,-y+.3*Math.sin(i*Math.PI/8)]),.075);
   for(const sx of [-1,1])for(const sy of [-1,1]){line([x+sx*.25,height-.38,-y+sy*.25],[x+sx*.34,height+.02,-y+sy*.34],.065);line([x+sx*.34,height+.02,-y+sy*.34],[x+sx*.28,height+.065,-y+sy*.28],.065);bead([x+sx*.28,height+.065,-y+sy*.28],.07);}
  }
  // Select actual contour points, not an assumed circular radius, for the posts.
  for(const sign of [-1,1]){
   const anchor=path.reduce((best,p)=>sign*p[0]>sign*best[0]?p:best,path[0]);
   const baseX=Math.max(-r*.8,Math.min(r*.8,anchor[0])),baseY=Math.sqrt(r*r-baseX*baseX);
   const roots=proceduralBands.includes(config.band)?bandAnchors(config,Math.asin(baseX/r)).map(p=>p.toArray()):[[baseX,baseY,0]];
   for(const root of roots)line(root,[anchor[0],height-.5,-anchor[1]],.28);
  }
 }
 if(['Halo','Double halo'].includes(config.layout)){halo(.85,plan.girdle-.25);if(config.layout==='Double halo')halo(1.9,plan.girdle-.32);}
 if(config.layout==='Hidden halo')halo(config.stone.shape==='Heart'?.65:-.25,plan.bottom+.6);
 if(['Three-stone','Five-stone','Graduated'].includes(config.layout))for(const sign of [-1,1])for(const [index,angle] of (footprint.sideAnglesBySign?.[sign]??footprint.sideAngles).entries()){
  const stone=layoutSideStone(config,index);
  const side=settingPlan(stone,'4 prong',config.thicknessMm,r,0),satellite=new THREE.Group();satellite.position.set(r*Math.sin(sign*angle),r*Math.cos(angle),0);satellite.rotation.z=-sign*angle;
  const head=createSetting(side);head.rotation.y=sideStoneRotation(stone.shape,sign);head.position.y=-r;satellite.add(head);const gem=createStone(stone,side.girdle);gem.rotation.y=sideStoneRotation(stone.shape,sign);gem.position.y=-r;gem.userData.sideStone={...stone,index,sign};satellite.add(gem);group.add(satellite);
 }
 // Merge only visual metal; this is not a CAD boolean union.
 group.updateMatrixWorld(true);const meshes=[];group.traverse(o=>{if(o.isMesh&&o.material.name==='Metal')meshes.push(o);});
 if(meshes.length){const pieces=meshes.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);g.deleteAttribute('uv');return g;});const merged=mergeGeometries(pieces,false);for(const g of pieces)g.dispose();for(const o of meshes){o.parent.remove(o);o.geometry.dispose();if(o.material!==metal)o.material.dispose();}group.add(new THREE.Mesh(merged,metal));}
 group.userData.footprint=footprint;return group;
}

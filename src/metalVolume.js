import {Vector3} from 'three';
import {isGemMaterial} from './materials.js';

// Signed tetrahedra integrate each metal surface in world millimeters.
// Intersecting components are summed, not boolean-unioned.
export function measureMetal(root,gemstones=false){
 root.updateMatrixWorld(true);let volumeMm3=0,surfaceAreaMm2=0;const stoneVolumesMm3=[];
 const a=new Vector3(),b=new Vector3(),c=new Vector3(),cross=new Vector3();
 root.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  const g=mesh.geometry,p=g.attributes.position,index=g.index;
  const vertices=new Map(),parents=[],faces=[];
  const vertexId=v=>{const key=[v.x,v.y,v.z].map(n=>Math.round(n*1e5)).join(',');if(!vertices.has(key)){vertices.set(key,parents.length);parents.push(parents.length);}return vertices.get(key);};
  const find=i=>{while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i];}return i;};
  const join=(i,j)=>{i=find(i);j=find(j);if(i!==j)parents[j]=i;};
  const groups=g.groups.length?g.groups:[{start:0,count:index?.count??p.count,materialIndex:0}];
  for(const group of groups){
   const material=Array.isArray(mesh.material)?materials[group.materialIndex??0]:mesh.material;
   if(!material||isGemMaterial(material.name??'')!==gemstones)continue;
   for(let i=group.start;i<group.start+group.count;i+=3){
    a.fromBufferAttribute(p,index?index.getX(i):i).applyMatrix4(mesh.matrixWorld);
    b.fromBufferAttribute(p,index?index.getX(i+1):i+1).applyMatrix4(mesh.matrixWorld);
    c.fromBufferAttribute(p,index?index.getX(i+2):i+2).applyMatrix4(mesh.matrixWorld);
    surfaceAreaMm2+=cross.crossVectors(b.clone().sub(a),c.clone().sub(a)).length()/2;
    const ids=[vertexId(a),vertexId(b),vertexId(c)];join(ids[0],ids[1]);join(ids[0],ids[2]);
    faces.push([ids[0],a.dot(cross.crossVectors(b,c))/6]);
   }
  }
  const shells=new Map();for(const [id,volume] of faces){const shell=find(id);shells.set(shell,(shells.get(shell)??0)+volume);}
  for(const volume of shells.values()){volumeMm3+=Math.abs(volume);if(gemstones&&Math.abs(volume)>1e-8)stoneVolumesMm3.push(Math.abs(volume));}
 });
 return {volumeMm3,surfaceAreaMm2,...(gemstones?{stoneVolumesMm3}:{})};
}

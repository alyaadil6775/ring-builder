import {BufferGeometry} from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

// Remove cross-section caps embedded in a closed sweep. True open ends have
// surface neighbours on only one side of their radial plane and are retained.
export function removeInternalBandCaps(geometry){
 const p=geometry.attributes.position,indices=geometry.index.array;
 const neighbours=Array.from({length:p.count},()=>new Set());
 for(let k=0;k<indices.length;k+=3){
  const face=Array.from(indices.slice(k,k+3));
  for(const a of face)for(const b of face)if(a!==b)neighbours[a].add(b);
 }
 const kept=[];let removed=0;
 for(let k=0;k<indices.length;k+=3){
  const face=Array.from(indices.slice(k,k+3)),a=face[0],radius=Math.hypot(p.getX(a),p.getY(a));
  const tx=-p.getY(a)/radius,ty=p.getX(a)/radius;
  const radialFace=radius>1&&face.every(i=>Math.abs(p.getX(i)*tx+p.getY(i)*ty)<1e-4);
  let positive=false,negative=false;
  if(radialFace)for(const i of face)for(const j of neighbours[i]){
   const d=(p.getX(j)-p.getX(i))*tx+(p.getY(j)-p.getY(i))*ty;
   if(d>1e-4)positive=true;if(d< -1e-4)negative=true;
  }
  if(radialFace&&positive&&negative)removed++;else kept.push(...face);
 }
 geometry.setIndex(kept);return removed;
}

// Calculate wrap normals from the cleaned, welded surface rather than
// averaging the normals of exported splits or embedded cap triangles.
export function smoothBandSeams(geometry){
 const copy=new BufferGeometry();copy.setAttribute('position',geometry.attributes.position.clone());
 if(geometry.index)copy.setIndex(geometry.index.clone());
 const welded=mergeVertices(copy,1e-4);
 const removed=removeInternalBandCaps(welded);
 welded.computeVertexNormals();
 geometry.dispose();geometry.copy(welded);copy.dispose();welded.dispose();
 return removed;
}

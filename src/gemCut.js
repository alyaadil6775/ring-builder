import * as THREE from 'three';
// Representative brilliant topology: octagonal table, star facets, crown kites,
// upper girdle facets and pavilion mains. Dimensions come from the selected stone.
export function brilliantGeometry(width,length,depth,girdle=0){
 const vertices=[],faces=[];
 const point=(angle,radius,height)=>{vertices.push(Math.cos(angle)*width/2*radius,height,-Math.sin(angle)*length/2*radius);return vertices.length/3-1;};
 const table=Array.from({length:8},(_,i)=>point(i*Math.PI/4,.56,girdle+depth*.22));
 const stars=Array.from({length:8},(_,i)=>point((i+.5)*Math.PI/4,.79,girdle+depth*.105));
 const upper=Array.from({length:32},(_,i)=>point(i*Math.PI/16,1,girdle));
 const lower=Array.from({length:32},(_,i)=>point(i*Math.PI/16,.995,girdle-depth*.025));
 const pavilion=Array.from({length:8},(_,i)=>point((i+.5)*Math.PI/4,.46,girdle-depth*.43));
 vertices.push(0,girdle-depth*.78,0);const culet=vertices.length/3-1;
 function polygon(indices){for(let i=1;i<indices.length-1;i++)faces.push(indices[0],indices[i],indices[i+1]);}
 polygon(table);
 for(let i=0;i<8;i++){
  const next=(i+1)%8,previous=(i+7)%8;
  polygon([table[i],table[next],stars[i]]);
  polygon([table[i],stars[i],upper[i*4],stars[previous]]);
  for(let j=0;j<4;j++)polygon([stars[i],upper[(i*4+j+1)%32],upper[i*4+j]]);
  for(let j=0;j<4;j++)polygon([pavilion[i],lower[i*4+j],lower[(i*4+j+1)%32]]);
  polygon([pavilion[i],pavilion[previous],lower[i*4]]);
  polygon([culet,pavilion[previous],pavilion[i]]);
 }
 for(let i=0;i<32;i++)polygon([upper[i],upper[(i+1)%32],lower[(i+1)%32],lower[i]]);
 const indexed=new THREE.BufferGeometry();indexed.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));indexed.setIndex(faces);
 const geometry=indexed.toNonIndexed();indexed.dispose();geometry.computeVertexNormals();
 // Flat facets need consistent outward normals for physically based reflections.
 const positions=geometry.attributes.position,center=new THREE.Vector3(0,girdle-depth*.28,0);
 for(let i=0;i<positions.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(positions,i),b=new THREE.Vector3().fromBufferAttribute(positions,i+1),c=new THREE.Vector3().fromBufferAttribute(positions,i+2),normal=b.clone().sub(a).cross(c.clone().sub(a)),out=a.clone().add(b).add(c).multiplyScalar(1/3).sub(center);if(normal.dot(out)<0){positions.setXYZ(i+1,c.x,c.y,c.z);positions.setXYZ(i+2,b.x,b.y,b.z);}}
 geometry.computeVertexNormals();
 return geometry;
}
export function refacetBrilliant(mesh){
 mesh.geometry.computeBoundingBox();const box=mesh.geometry.boundingBox,size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
 const geometry=brilliantGeometry(size.x,size.z,size.y,box.max.y-size.y*.22);geometry.translate(center.x,0,center.z);mesh.geometry.dispose();mesh.geometry=geometry;
}

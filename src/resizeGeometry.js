import * as THREE from 'three';
import {radialPoint} from './sizing.js';
export function resizeMesh(mesh,radiusDelta,thickness=1,preserveShape=false){
 const positions=mesh.geometry.attributes.position,point=new THREE.Vector3(),inverse=mesh.matrixWorld.clone().invert();
 let displacement;
 if(preserveShape){mesh.geometry.computeBoundingBox();const center=mesh.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(mesh.matrixWorld);displacement=radialPoint(center.clone(),radiusDelta,thickness).sub(center);}
 for(let i=0;i<positions.count;i++){
  point.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);
  if(displacement)point.add(displacement);else radialPoint(point,radiusDelta,thickness);
  point.applyMatrix4(inverse);positions.setXYZ(i,point.x,point.y,point.z);
 }
 positions.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
}

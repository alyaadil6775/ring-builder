import {BufferGeometry} from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

// Weld the topology used for normal calculation, including the wrap seam.
// Averaging already split normals leaves triangulation-dependent creases.
export function smoothBandSeams(geometry){
 const copy=new BufferGeometry();copy.setAttribute('position',geometry.attributes.position.clone());
 if(geometry.index)copy.setIndex(geometry.index.clone());
 const welded=mergeVertices(copy,1e-4);welded.computeVertexNormals();
 geometry.dispose();geometry.copy(welded);copy.dispose();welded.dispose();
}

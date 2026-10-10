import * as THREE from 'three';
import {ringDimensions} from './sizing.js';

export function createPlainBand({config}){
 const group=new THREE.Group();group.name='Continuous rounded band';
 const geometry=new THREE.TorusGeometry(ringDimensions(config).centerRadiusMm,config.thicknessMm/2,32,256);
 geometry.scale(1,1,config.widthMm/config.thicknessMm);
 group.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({name:'Metal'})));
 return group;
}

import React, {useEffect,useRef} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {metals} from './catalog';

// Coordinates use millimeters. These meshes are visual prototypes, not manufacturing CAD.
export function RingViewer({config}) {
  const mount = useRef(null);
  useEffect(() => {
    const el=mount.current, scene=new THREE.Scene();
    scene.background=new THREE.Color('#f0ede7');
    const camera=new THREE.PerspectiveCamera(35,1,.1,200);
    camera.position.set(26,22,32);
    const renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    el.appendChild(renderer.domElement);
    const controls=new OrbitControls(camera,renderer.domElement);
    controls.target.set(0,2,0); controls.enableDamping=true;
    controls.minDistance=20;controls.maxDistance=65;
    scene.add(new THREE.HemisphereLight(0xffffff,0x8b7860,3));
    for(const [x,y,z] of [[15,25,20],[-20,10,-10]]) {
      const light=new THREE.DirectionalLight(0xffffff,4);light.position.set(x,y,z);scene.add(light);
    }
    const metal=new THREE.MeshStandardMaterial({color:metals[config.metal],metalness:.8,roughness:.24});
    const gem=new THREE.MeshPhysicalMaterial({color:'#eaf4ff',metalness:0,roughness:.04,transmission:.65,thickness:2,ior:2.42,clearcoat:1});
    const add=(geometry,material=metal)=>{const mesh=new THREE.Mesh(geometry,material);scene.add(mesh);return mesh;};
    const radius=8.5;
    if(config.band==='Split shank') {
      for(const sign of [-1,1]) {
        const points=Array.from({length:97},(_,i)=>{const a=i/96*Math.PI*2;return new THREE.Vector3(radius*Math.cos(a),radius*Math.sin(a),sign*(.3+1.2*Math.pow(Math.max(0,Math.sin(a)),4)));});
        add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),96,.48,12,true));
      }
    } else {
      const points=Array.from({length:97},(_,i)=>{const a=i/96*Math.PI*2;return new THREE.Vector3(radius*Math.cos(a),radius*Math.sin(a),0);});
      const band=add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),96,config.band==='Tapered'?.65:.85,16,true));
      band.scale.z=1.35;
    }
    const s=config.stone, w=s.widthMm/2,l=s.lengthMm/2,y=radius+2;
    // Faceted crown and pavilion; shape proportions derive from catalog dimensions.
    const sides=s.shape==='Emerald'?4:16;
    const crown=add(new THREE.CylinderGeometry(.65,1,.8,sides,1),gem);
    crown.scale.set(w,1,l);crown.position.y=y+s.depthMm/2;
    const pavilion=add(new THREE.ConeGeometry(1,s.depthMm-.8,sides),gem);
    pavilion.rotation.z=Math.PI;pavilion.scale.set(w,1,l);pavilion.position.y=y+.4;
    if(s.shape==='Emerald') {crown.rotation.y=Math.PI/4;pavilion.rotation.y=Math.PI/4;crown.scale.x*=1.2;crown.scale.z*=1.2;pavilion.scale.x*=1.2;pavilion.scale.z*=1.2;}
    if(config.setting==='Bezel') {
      const rim=add(new THREE.TorusGeometry(1,.075,10,64));rim.rotation.x=Math.PI/2;rim.scale.set(w,l,5);rim.position.y=y+s.depthMm/2-.4;
    } else {
      const count=Number(config.setting[0]);
      for(let i=0;i<count;i++) {const a=(i+.5)/count*Math.PI*2;const prong=add(new THREE.CylinderGeometry(.22,.3,3.4,12));prong.position.set(Math.cos(a)*(w+.1),y+.3,Math.sin(a)*(l+.1));const tip=add(new THREE.SphereGeometry(.26,12,8));tip.position.copy(prong.position);tip.position.y+=1.7;}
    }
    const basket=add(new THREE.TorusGeometry(1,.09,10,48));basket.rotation.x=Math.PI/2;basket.scale.set(w*.8,l*.8,4);basket.position.y=radius+1;
    const resize=()=>{const width=el.clientWidth,height=el.clientHeight;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();};
    const observer=new ResizeObserver(resize);observer.observe(el);resize();
    renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
    return()=>{observer.disconnect();renderer.setAnimationLoop(null);controls.dispose();scene.traverse(o=>o.geometry?.dispose());metal.dispose();gem.dispose();renderer.dispose();renderer.domElement.remove();};
  },[config]);
  return <div className="viewer" ref={mount} aria-label="Interactive ring preview. Drag to rotate and scroll to zoom."/>;
}

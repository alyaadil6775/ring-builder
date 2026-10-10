import {createSetting} from './proceduralSetting';
import {createLayout} from './proceduralLayout';
import {createBand} from './proceduralBand';
import {createPlainBand} from './plainBand';
import {createBandAccents} from './proceduralAccents';
import {resizeMesh} from './resizeGeometry';
import {smoothBandSeams} from './bandNormals';
import {measureMetal} from './metalVolume';
import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {TrackballControls} from 'three/addons/controls/TrackballControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createGemMaterial,createJewelryEnvironment} from './gemAppearance';
import {metals} from './catalog';
import {gemChoice} from './gemstones';
import {isGemMaterial} from './materials';
export function RingViewer({config,modelId,parts,onReady,onMeasured}){
 const mount=useRef(null),runtime=useRef(null),[status,setStatus]=useState('Loading preview…'),[retry,setRetry]=useState(0),[failed,setFailed]=useState(false);
 useEffect(()=>{
  const el=mount.current;let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{setStatus('3D preview is unavailable in this browser. You can still save your selections.');setFailed(true);onReady?.(null);return;}
  setFailed(false);const scene=new THREE.Scene();scene.background=new THREE.Color('#f0ede7');
  const camera=new THREE.PerspectiveCamera(35,1,.1,300);camera.position.set(26,22,32);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=THREE.ACESFilmicToneMapping;el.appendChild(renderer.domElement);
  function createControls(){
   const controls=new TrackballControls(camera,renderer.domElement);
   controls.target.set(0,2,0);controls.staticMoving=false;controls.dynamicDampingFactor=.12;
   controls.rotateSpeed=2;controls.minDistance=20;controls.maxDistance=90;
   return controls;
  }
  let controls=createControls();
  const env=createJewelryEnvironment(renderer);scene.environment=env.texture;
  scene.add(new THREE.HemisphereLight(0xffffff,0x8b7860,2));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(15,25,20);scene.add(light);
  const group=new THREE.Group();scene.add(group);const state={group,loaded:false,framed:false};runtime.current=state;
  state.api={hasModel:()=>state.loaded&&group.children.length>0,view(name){
   const box=new THREE.Box3().setFromObject(group),sphere=box.getBoundingSphere(new THREE.Sphere()),distance=Math.max(35,sphere.radius/Math.sin(THREE.MathUtils.degToRad(camera.fov/2))*1.1);
   controls.dispose();camera.up.set(0,1,0);controls=createControls();controls.maxDistance=Math.max(90,distance*1.5);controls.target.copy(box.getCenter(new THREE.Vector3()));
   const direction={Front:[0,.05,1],Top:[0,1,.001],Side:[1,.05,0],Reset:[26,22,32]}[name]??[26,22,32];camera.position.copy(new THREE.Vector3(...direction).normalize().multiplyScalar(distance).add(controls.target));controls.update();
  },capture(){renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');}  };
  onReady?.(state.api);
  const resize=()=>{const w=Math.max(1,el.clientWidth),h=Math.max(1,el.clientHeight);renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();controls.handleResize();};
  const observer=new ResizeObserver(resize);observer.observe(el);resize();renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
  const lost=event=>{event.preventDefault();state.loaded=false;onReady?.(null);setFailed(true);setStatus('The 3D preview stopped. Retry to restore it.');};renderer.domElement.addEventListener('webglcontextlost',lost);
  return()=>{runtime.current=null;onReady?.(null);observer.disconnect();renderer.setAnimationLoop(null);renderer.domElement.removeEventListener('webglcontextlost',lost);controls.dispose();disposeGroup(group);env.dispose();renderer.dispose();renderer.domElement.remove();};
 },[retry]);
 useEffect(()=>{
  const state=runtime.current;if(!state)return;let cancelled=false;const {group}=state,loader=new GLTFLoader();state.loaded=false;onReady?.(state.api);setFailed(false);setStatus('Loading preview…');
  const slug=s=>s.toLowerCase().replaceAll(' ','-'),base=import.meta.env.BASE_URL+'models/';
  const entries=modelId?[{path:`variations/${modelId}`}]:parts??[{path:`band-${slug(config.band)}`},{path:`${config.stone.id}-${slug(config.setting)}`},{path:`${config.stone.id}-stone`}];
  if(!entries.length){disposeGroup(group);setStatus('Choose a band to begin.');return()=>{cancelled=true;};}
  Promise.allSettled(entries.map(async part=>part.procedural==='plainBand'?createPlainBand(part):part.procedural==='band'?createBand(part):part.procedural==='bandAccents'?createBandAccents(part):part.procedural==='setting'?createSetting(part.plan):part.procedural==='layout'?createLayout(part):(await loader.loadAsync(base+part.path+'.glb')).scene)).then(results=>{
   const objects=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
   if(cancelled||objects.length!==entries.length){objects.forEach(disposeGroup);if(!cancelled){setFailed(true);setStatus('The preview could not load. Retry, or keep your selections with a share link.');}return;}
   disposeGroup(group);
   objects.forEach((object,index)=>{
    const part=entries[index];if(part.heightOffset)object.position.y+=part.heightOffset;if(part.rotationY)object.rotation.y=part.rotationY;
    if(part.radiusDelta||part.thickness&&part.thickness!==1){object.updateMatrixWorld(true);object.traverse(mesh=>{if(!mesh.isMesh)return;const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];resizeMesh(mesh,part.radiusDelta??0,part.thickness??1,materials.some(m=>isGemMaterial(m.name)));});}
    if(part.widthScale)object.scale.z=part.widthScale;
    if(!part.procedural)object.traverse(mesh=>{if(mesh.isMesh&&(part.id==='band'||mesh.name.startsWith('Band')))smoothBandSeams(mesh.geometry);});
    object.traverse(mesh=>{if(!mesh.isMesh)return;const previous=Array.isArray(mesh.material)?mesh.material:[mesh.material],gem=previous.some(m=>isGemMaterial(m.name));for(const m of previous)m.dispose();mesh.material=gem?createGemMaterial(mesh,gemChoice(config,part.id==='accents'?'accent':part.id==='layout'?'side':'center')):new THREE.MeshStandardMaterial({name:'Metal',color:metals[config.metal],metalness:1,roughness:.2,side:THREE.DoubleSide});});group.add(object);
   });const accentStoneVolumesMm3=objects.flatMap((object,i)=>['accents','layout'].includes(entries[i].id)?measureMetal(object,true).stoneVolumesMm3:[]);onMeasured?.(config,{...measureMetal(group),accentStoneVolumesMm3});state.loaded=true;if(!state.framed){state.api.view('Reset');state.framed=true;}onReady?.(state.api);setStatus('');
  });return()=>{cancelled=true;};
 },[config,modelId,parts,retry]);
 return <div className="preview-shell"><div className="viewer" ref={mount} aria-label="Interactive ring preview. Drag to rotate freely in any direction and pinch to zoom."/>{status&&<div className="preview-status" role="status"><p>{status}</p>{failed&&<button onClick={()=>setRetry(n=>n+1)}>Retry preview</button>}</div>}</div>;
}
function disposeGroup(group){group.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});group.clear();}

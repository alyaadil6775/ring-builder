import {mkdirSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import * as THREE from 'three';
import {OBJExporter} from 'three/addons/exporters/OBJExporter.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {stones} from '../src/catalog.js';
import {initialConfig} from '../src/designStorage.js';
import {settingPlan,createSetting} from '../src/proceduralSetting.js';
import {createLayout,createStone} from '../src/proceduralLayout.js';
import {ringDimensions} from '../src/sizing.js';
import {validateDesign,layoutFootprint} from '../src/designRules.js';
const dir='blender/layout-checks';mkdirSync(dir,{recursive:true});const files=[];
for(const stone of stones.filter(s=>s.source&&(!process.env.CHECK_SHAPE||s.shape===process.env.CHECK_SHAPE)))for(const layout of ['Halo','Hidden halo','Five-stone'])for(const orientationDeg of [0]){
 const config={...initialConfig(),band:'Rounded',setting:'4 prong',layout,orientationDeg,stone};if(validateDesign(config).length)continue;
 const plan=settingPlan(stone,config.setting,config.thicknessMm,ringDimensions(config).centerRadiusMm),root=new THREE.Group();
 const center=createSetting(plan);center.rotation.y=orientationDeg*Math.PI/180;center.traverse(o=>{if(o.isMesh)o.name='center-metal';});root.add(center);
 const gem=createStone(stone,plan.girdle);gem.rotation.y=center.rotation.y;gem.name='center-gem';root.add(gem);
 const fitted=createLayout({config,plan,footprint:layoutFootprint(config)});let index=0;fitted.traverse(o=>{if(o.isMesh)o.name=o.material.name==='Gem'?'layout-gem-'+index++:'layout-metal';});root.add(fitted);
 root.traverse(o=>{if(o.isMesh){o.geometry.deleteAttribute('normal');o.geometry.deleteAttribute('uv');const original=o.geometry;o.geometry=mergeVertices(original,1e-6);original.dispose();}});
 const id=stone.shape+'-'+layout.replaceAll(' ','-')+'-'+orientationDeg;writeFileSync(dir+'/'+id+'.obj.gz',gzipSync(new OBJExporter().parse(root)));files.push(id);
 root.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
}
writeFileSync(dir+'/manifest.json',JSON.stringify(files));console.log('Exported '+files.length+' layout inspection cases');

import {mkdirSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import * as THREE from 'three';
import {OBJExporter} from 'three/addons/exporters/OBJExporter.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {initialConfig} from '../src/designStorage.js';
import {proceduralBands} from '../src/options.js';
import {assemblyParts} from '../src/assembly.js';
import {createBand} from '../src/proceduralBand.js';
import {createBandAccents} from '../src/proceduralAccents.js';
import {createLayout,createStone} from '../src/proceduralLayout.js';
import {createSetting} from '../src/proceduralSetting.js';
const dir='blender/supported-band-checks';mkdirSync(dir,{recursive:true});const cases=[];
for(const band of proceduralBands.filter(b=>!process.env.CHECK_BAND||b===process.env.CHECK_BAND))for(const layout of ['Solitaire','Halo','Five-stone']){
 const config={...initialConfig(),band,accents:band==='Rope'?'Bezel accents':'Pave',layout,setting:'4 prong',showStone:true};
 const group=new THREE.Group(),parts=assemblyParts(config),metadata={};
 for(const part of parts){let object;if(part.id==='band')object=createBand(part);else if(part.id==='accents')object=createBandAccents(part);else if(part.id==='layout')object=createLayout(part);else if(part.id==='setting')object=createSetting(part.plan);else object=createStone(config.stone,parts.find(p=>p.id==='setting').plan.girdle);
  let i=0;object.traverse(o=>{if(o.isMesh){o.name=part.id+'-'+(o.material.name==='Gem'?'gem':'metal')+'-'+i++;o.geometry.deleteAttribute('normal');o.geometry.deleteAttribute('uv');const old=o.geometry;o.geometry=mergeVertices(old,1e-6);old.dispose();}});metadata[part.id]=object.userData.contacts??null;group.add(object);
 }
 const id=band.replaceAll(' ','-')+'-'+layout;writeFileSync(dir+'/'+id+'.obj.gz',gzipSync(new OBJExporter().parse(group)));cases.push({id,contacts:metadata});group.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
}
writeFileSync(dir+'/manifest.json',JSON.stringify(cases,null,2));console.log('Exported '+cases.length+' full fitted band cases');

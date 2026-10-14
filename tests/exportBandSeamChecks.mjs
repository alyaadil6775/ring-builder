import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OBJExporter} from 'three/addons/exporters/OBJExporter.js';
import {smoothBandSeams} from '../src/bandNormals.js';
import {createBand} from '../src/proceduralBand.js';
import {createPlainBand} from '../src/plainBand.js';
import {bandStyles,proceduralBands,slug} from '../src/options.js';
import {initialConfig} from '../src/designStorage.js';
const previous=execFileSync('git',['show','HEAD:src/proceduralBand.js'],{encoding:'utf8'}).replace("'./sizing.js'","'../src/sizing.js'");
fs.writeFileSync(new URL('./band-before.mjs',import.meta.url),previous);
fs.writeFileSync(new URL('./normals-before.mjs',import.meta.url),execFileSync('git',['show','HEAD:src/bandNormals.js'],{encoding:'utf8'}));
const {createBand:oldBand}=await import('./band-before.mjs');
const {smoothBandSeams:oldSmooth}=await import('./normals-before.mjs');
const loader=new GLTFLoader(),exporter=new OBJExporter(),out=new URL('../blender/renders/band-seams/',import.meta.url);
fs.mkdirSync(out,{recursive:true});
for(const band of bandStyles)for(const version of ['before','after']){
 const c={...initialConfig(),band},after=version==='after';
 const g=band==='Rounded'?createPlainBand({config:c}):proceduralBands.includes(band)?(after?createBand:oldBand)({config:c}):(await loader.parseAsync(Uint8Array.from(fs.readFileSync(new URL('../public/models/components/bands-'+slug(band)+'.glb',import.meta.url))).buffer,'')).scene;
 if(!proceduralBands.includes(band)&&band!=='Rounded')g.traverse(o=>{if(o.isMesh)(after?smoothBandSeams:oldSmooth)(o.geometry);});
 g.updateMatrixWorld(true);fs.writeFileSync(new URL(slug(band)+'-'+version+'.obj',out),exporter.parse(g));
 g.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
}
fs.unlinkSync(new URL('./band-before.mjs',import.meta.url));fs.unlinkSync(new URL('./normals-before.mjs',import.meta.url));

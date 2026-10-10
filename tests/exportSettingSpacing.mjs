import fs from 'node:fs';
import {OBJExporter} from 'three/addons/exporters/OBJExporter.js';
import {createLayout} from '../src/proceduralLayout.js';
import {createPlainBand} from '../src/plainBand.js';
import {createSetting,settingPlan} from '../src/proceduralSetting.js';
import {initialConfig} from '../src/designStorage.js';
import {layoutFootprint} from '../src/designRules.js';
import {ringDimensions} from '../src/sizing.js';
import * as THREE from 'three';
const out=new URL('../blender/renders/setting-spacing/',import.meta.url);fs.mkdirSync(out,{recursive:true});
for(const layout of ['Three-stone','Five-stone','Graduated'])for(const shape of ['Round','Emerald','Pear']){
 const c={...initialConfig(),band:'Rounded',layout,setting:'4 prong',sideStoneShape:shape};
 const plan=settingPlan(c.stone,c.setting,c.thicknessMm,ringDimensions(c).centerRadiusMm),group=new THREE.Group();
 group.add(createPlainBand({config:c}),createSetting(plan),createLayout({config:c,plan,footprint:layoutFootprint(c)}));
 // Include a procedural center with the same dimensions for inspection.
 const {createStone}=await import('../src/proceduralLayout.js');const center=createStone(c.stone,plan.girdle);center.name='center-gem';group.add(center);
 let n=0;group.traverse(o=>{if(o.isMesh&&o!==center)o.name=(o.material.name==='Gem'?'side-gem-':'metal-')+n++;});
 group.updateMatrixWorld(true);fs.writeFileSync(new URL(layout+'-'+shape+'.obj',out),new OBJExporter().parse(group));
 group.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
}

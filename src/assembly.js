import {referenceModel} from './referenceOptions.js';
import {settingPlan} from './proceduralSetting.js';
import {ringDimensions} from './sizing.js';
import {layoutFootprint,validateDesign} from './designRules.js';
import {slug,accentCompatibleBands,proceduralBands} from './options.js';
export * from './options.js';
export function accentZone(config){
 // Keep stable legacy footprints for saved designs without a sizing selection.
 if(config.ringSize==null){if(['Five-stone','Graduated'].includes(config.layout))return 'multi';if(['Three-stone','Double halo'].includes(config.layout))return 'wide';if(['Halo','Hidden halo'].includes(config.layout)||Number(config.stone?.widthMm)>7)return 'head';return 'standard';}
 return layoutFootprint(config).zone;
}
export function assemblyParts(config){
 const parts=[];if(!config.band)return parts;
 const errors=validateDesign(config);if(errors.length)return parts;
 const reference=referenceModel(config);if(reference)return [{id:'reference',path:'variations/'+reference.id}];
 const dimensions=ringDimensions(config),radius=dimensions.centerRadiusMm;
 const zone=accentZone(config),suffix=zone==='standard'?'':'-'+zone;
 const fitted=config.accents&&config.accents!=='None'&&accentCompatibleBands.includes(config.band);
 const plan=settingPlan(config.stone,config.setting??'4 prong',config.thicknessMm,radius),footprint=layoutFootprint(config);
 if(proceduralBands.includes(config.band)){
  parts.push({id:'band',procedural:'band',config,plan,footprint});
  if(config.accents&&config.accents!=='None')parts.push({id:'accents',procedural:'bandAccents',config,footprint});
 }else{
 parts.push({id:'band',path:fitted?`components/fitted/${slug(config.band)}-${slug(config.accents)}${suffix}`:`components/bands-${slug(config.band)}`,widthScale:fitted?1:config.widthMm/(config.band==='Wide'?4.4:['Flat','Soft square'].includes(config.band)?2.3:2.1),thickness:fitted?1:config.thicknessMm/1.3,radiusDelta:radius-9.15});
 if(fitted)parts.push({id:'accents',path:`components/accents-${slug(config.accents)}${suffix}`,radiusDelta:radius-9.15});
 if(config.band==='Rounded'&&!fitted){const band=parts[0];band.procedural='plainBand';band.config=config;delete band.radiusDelta;delete band.thickness;delete band.widthScale;}
 }
 if(config.layout&&config.layout!=='Solitaire')parts.push({id:'layout',procedural:'layout',config,plan,footprint:layoutFootprint(config)});
 if(config.setting){parts.push({id:'setting',procedural:'setting',plan,rotationY:Number(config.orientationDeg??0)*Math.PI/180});if(config.showStone)parts.push({id:'stone',...(config.stone.databaseStone?{procedural:'stone',stone:config.stone,girdle:plan.girdle}:{path:`${config.stone.id}-stone`}),heightOffset:config.stone.databaseStone?0:plan.girdle-12.8,rotationY:Number(config.orientationDeg??0)*Math.PI/180});}
 return parts;
}

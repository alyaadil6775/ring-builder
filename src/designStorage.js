import {databaseStoneById} from './databaseStones.js';
import {stones,metals} from './catalog.js';
import {defaultPricing} from './pricing.js';
import {validateDesign} from './designRules.js';
export const DRAFT_KEY='dukaan.ring-builder.draft.v1',SAVED_KEY='dukaan.ring-builder.saved.v1';
export const initialConfig=()=>({band:null,widthMm:2.1,thicknessMm:1.3,metal:'Yellow gold',karat:14,ringSystem:'US',ringSize:7,orientationDeg:0,accents:null,layout:null,sideStoneShape:'Round',centerGemType:'Diamond',centerGemColor:'Colorless',sideGemType:'Diamond',sideGemColor:'Colorless',accentGemType:'Diamond',accentGemColor:'Colorless',setting:null,stone:stones[0],showStone:false,stonePriceCurrency:null,pricing:{...defaultPricing},notes:''});
const keys=['band','widthMm','thicknessMm','metal','karat','ringSystem','ringSize','orientationDeg','accents','layout','sideStoneShape','centerGemType','centerGemColor','sideGemType','sideGemColor','accentGemType','accentGemColor','setting','showStone','stonePriceCurrency','notes'];
export function serializeDesign(config){const data={};for(const key of keys)data[key]=config[key];return {version:1,config:{...data,stoneId:config.stone.id,pricing:{...defaultPricing,...config.pricing}}};}
export function restoreDesign(payload){
 if(!payload||payload.version!==1||!payload.config||typeof payload.config!=='object')throw new Error('Unsupported design format.');
 const raw=payload.config,stone=databaseStoneById.get(raw.stoneId)??stones.find(s=>s.id===raw.stoneId);if(!stone)throw new Error('The selected stone is not in this catalog.');
 const c=initialConfig();for(const key of keys)if(Object.hasOwn(raw,key))c[key]=raw[key];c.stone=stone;
 if(!Object.hasOwn(metals,c.metal)||![10,14,18].includes(c.karat)||!['US','Circumference'].includes(c.ringSystem)||typeof c.showStone!=='boolean'||typeof c.notes!=='string'||c.notes.length>5000||!['USD','EUR','GBP',null].includes(c.stonePriceCurrency))throw new Error('Invalid design selections.');
 const policy={...defaultPricing};for(const key of Object.keys(policy))if(raw.pricing&&Object.hasOwn(raw.pricing,key))policy[key]=raw.pricing[key];
 if(!['USD','EUR','GBP'].includes(policy.currency))throw new Error('Unsupported quote currency.');
 for(const key of Object.keys(policy).filter(k=>k!=='currency'))if(policy[key]!==null&&(!Number.isFinite(policy[key])||policy[key]<0||policy[key]>10000000))throw new Error('Invalid pricing inputs.');
 if(policy.densityGPerCm3!==null&&policy.densityGPerCm3<=0)throw new Error('Alloy density must be positive.');
 if(policy.taxPct>100||policy.castingAllowancePct>100)throw new Error('Percentages must be 0–100.');c.pricing=policy;
 const errors=validateDesign(c);if(errors.length)throw new Error(errors.join(' '));return c;
}
export function encodeDesign(config){const bytes=new TextEncoder().encode(JSON.stringify(serializeDesign(config)));return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
export function decodeDesign(encoded){if(typeof encoded!=='string'||encoded.length>30000)throw new Error('Invalid share link.');const text=atob(encoded.replaceAll('-','+').replaceAll('_','/'));return restoreDesign(JSON.parse(new TextDecoder().decode(Uint8Array.from(text,c=>c.charCodeAt(0)))));}
export function readInitial(storage,url){
 try{const encoded=new URL(url).searchParams.get('design');if(encoded)return {config:decodeDesign(encoded),message:'Shared design restored.'};const draft=storage.getItem(DRAFT_KEY);if(draft)return {config:restoreDesign(JSON.parse(draft)),message:'Previous draft restored.'};}catch(e){return {config:initialConfig(),message:'Could not restore the saved design: '+e.message};}
 return {config:initialConfig(),message:''};
}
export function readSaved(storage){try{const data=JSON.parse(storage.getItem(SAVED_KEY)??'[]');return Array.isArray(data)?data.slice(0,20).filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string'&&x.design):[];}catch{return [];}}
export function saveNamed(storage,config,name,id){const list=readSaved(storage),entry={id,name:name.trim().slice(0,100)||'Untitled ring',createdAt:new Date().toISOString(),design:serializeDesign(config)};storage.setItem(SAVED_KEY,JSON.stringify([entry,...list].slice(0,20)));return entry;}

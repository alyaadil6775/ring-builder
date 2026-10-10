import React,{useEffect,useState} from 'react';
import {RingViewer} from './BlenderRingViewer';
import {stones} from './catalog';
const config={metal:'Yellow gold',stone:stones[0],band:'Plain',setting:'4 prong'};
export function VariationGallery(){
 const [records,setRecords]=useState([]),[category,setCategory]=useState('settings'),[selected,setSelected]=useState(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;fetch(import.meta.env.BASE_URL+'models/variations/manifest.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{if(active){setRecords(data);setSelected(data[0]);}}).catch(()=>{if(active)setError('The variation library could not load.');});return()=>{active=false;};},[]);
 return <><header><span>DUKAAN / MODEL LIBRARY</span><h1>Explore every variation.</h1><p>Representative display models. Select a design to rotate and inspect it.</p><a href={import.meta.env.BASE_URL+"#/"}>Back to ring builder</a></header>{error&&<p role="alert">{error}</p>}<nav className="categories">{['settings','layouts','accents','bands'].map(c=><button key={c} aria-pressed={c===category} onClick={()=>{setCategory(c);setSelected(records.find(r=>r.category===c));}}>{c}</button>)}</nav>{selected&&<><h2>{selected.name}</h2><RingViewer config={config} modelId={selected.id}/></>}<section className="gallery-grid">{records.filter(r=>r.category===category).map(r=><button className="model-card" key={r.id} aria-pressed={selected?.id===r.id} onClick={()=>setSelected(r)}><img loading="lazy" src={import.meta.env.BASE_URL+'previews/'+r.render} alt={r.name+' ring model'}/><span>{r.name}</span></button>)}</section></>;
}

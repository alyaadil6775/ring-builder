import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {RingViewer} from './BlenderRingViewer';
import {stones,metals,quote} from './catalog';
import './style.css';
import {VariationGallery} from './VariationGallery';
import {RingBuilder} from './RingBuilder';
function App(){
 const [config,setConfig]=useState({band:'Plain',setting:'4 prong',metal:'Yellow gold',stone:stones[0]});
 const update=(key,value)=>setConfig(c=>({...c,[key]:value}));
 const price=quote(config),money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
 const choose=(label,key,options)=><label>{label}<select value={config[key]} onChange={e=>update(key,e.target.value)}>{options.map(v=><option key={v}>{v}</option>)}</select></label>;
 return <main><header><span>DUKAAN / DESIGN STUDIO</span><h1>A ring, made yours.</h1><p>Explore your shape, setting, and finish.</p></header><section className="workspace"><div><RingViewer config={config}/><p className="hint">Drag to rotate · Scroll or pinch to zoom</p></div><aside><h2>Build your ring</h2>{choose('Band','band',['Plain','Tapered','Split shank'])}{choose('Setting','setting',['4 prong','6 prong','Bezel'])}{choose('Metal','metal',Object.keys(metals))}<label>Center stone<select value={config.stone.id} onChange={e=>update('stone',stones.find(s=>s.id===e.target.value))}>{stones.map(s=><option key={s.id} value={s.id}>{s.shape} · {s.carat} ct</option>)}</select></label><p>{config.stone.lengthMm} × {config.stone.widthMm} × {config.stone.depthMm} mm</p><div className="price">{[['Band',price.band],['Setting',price.setting],['Stone',price.stone]].map(([name,value])=><div key={name}><span>{name}</span><span>{money(value)}</span></div>)}<div className="total"><span>Sample total</span><strong>{money(price.total)}</strong></div></div><small>Prototype geometry and fictional USD prices. Final fit, availability, and pricing require validation.</small></aside></section></main>;
}
const root=createRoot(document.getElementById('root'));
function renderPage(){
 const references=location.hash==='#/references'||location.pathname.replace(/\/$/,'').endsWith('/references');
 root.render(references?<main><VariationGallery/></main>:<RingBuilder/>);
}
window.addEventListener('hashchange',renderPage);
renderPage();

import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const TAU=Math.PI*2;
export function stoneOutline(shape){
 if(['Emerald','Radiant','Asscher'].includes(shape)){
  const c=shape==='Emerald'?.7:.62;return [[-c,-1],[c,-1],[1,-c],[1,c],[c,1],[-c,1],[-1,c],[-1,-c]];
 }
 if(shape==='Baguette')return [[-1,-1],[1,-1],[1,1],[-1,1]];
 if(shape==='Tapered baguette'||shape==='Trapezoid')return [[-1,-1],[1,-1],[.55,1],[-.55,1]];
 if(shape==='Trillion')return [[-1,-1],[1,-1],[0,1]];
 if(shape==='Half-moon')return Array.from({length:33},(_,i)=>{const t=Math.PI*i/32;return [Math.cos(t),2*Math.sin(t)-1];});
 if(shape==='Princess')return [[-1,-1],[1,-1],[1,1],[-1,1]];
 const points=Array.from({length:64},(_,i)=>{
  const t=TAU*i/64;let x=Math.cos(t),y=Math.sin(t);
  if(shape==='Cushion'){x=Math.sign(x)*Math.abs(x)**.55;y=Math.sign(y)*Math.abs(y)**.55;}
  if(shape==='Pear'){x=Math.sin(t)*(.85-.3*Math.cos(t));y=Math.cos(t);}
  if(shape==='Marquise'){x=Math.sign(Math.sin(t))*Math.abs(Math.sin(t))**1.4;y=Math.cos(t);}
  if(shape==='Heart'){x=16*Math.sin(t)**3;y=13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t);}
  return [x,y];
 });
 const lo=[0,1].map(k=>Math.min(...points.map(p=>p[k]))),hi=[0,1].map(k=>Math.max(...points.map(p=>p[k])));
 return points.map(p=>p.map((v,k)=>(2*v-lo[k]-hi[k])/(hi[k]-lo[k])));
}
function boundary(points,angle){
 const direction=[Math.cos(angle),Math.sin(angle)],cross=(a,b)=>a[0]*b[1]-a[1]*b[0];let hit=null,distance=Infinity;
 for(let i=0;i<points.length;i++){
  const p=points[i],next=points[(i+1)%points.length],edge=[next[0]-p[0],next[1]-p[1]],den=cross(direction,edge);
  if(Math.abs(den)<1e-9)continue;
  const r=cross(p,edge)/den,u=cross(p,direction)/den;
  if(r>=0&&u>=-1e-8&&u<=1+1e-8&&r<distance){distance=r;hit=direction.map(v=>v*r);}
 }
 if(!hit)throw new Error('Stone outline does not contain its setting origin');return hit;
}
export function settingPlan(stone,setting='4 prong',thicknessMm=1.3,bandRadius=9.15,minGirdle=12.8){
 const {widthMm:width,lengthMm:length,depthMm:depth,shape}=stone;
 if(![width,length,depth,thicknessMm].every(v=>Number.isFinite(v)&&v>0))throw new Error('A setting requires positive millimeter dimensions.');
 if(!['4 prong','6 prong','Bezel'].includes(setting))throw new Error('Unsupported setting');
 const outline=stoneOutline(shape),w=width/2,l=length/2;
 const girdle=Math.max(minGirdle,bandRadius+thicknessMm/2+depth*.78+.85),bottom=girdle-depth*.78;
 const root=bottom-.45,galleryHeight=bottom+.65;
 const radius=Math.max(.20,Math.min(.32,.23*Math.sqrt(Math.max(width,length)/6.5)));
 const count=setting==='6 prong'?6:4,angles=Array.from({length:count},(_,i)=>TAU*(i+.5)/count);
 if(shape==='Princess'&&count===6)angles.splice(0,angles.length,...[1,2,3,5,6,7].map(n=>n*Math.PI/4));
 if(shape==='Pear')angles.push(Math.PI/2);
 if(shape==='Trillion')angles.splice(0,angles.length,Math.PI/2,Math.PI*5/4,Math.PI*7/4);
 if(shape==='Marquise')angles.push(Math.PI/2,3*Math.PI/2);
 if(shape==='Heart')angles.push(3*Math.PI/2);
 const unique=angles.filter((a,i)=>angles.findIndex(b=>Math.abs(a-b)<1e-6)===i);
 const prongs=unique.map(a=>{
  const [x,y]=boundary(outline,a),gap=radius*.9;
  return {point:[x,y],protective:setting!=='Bezel'&&((shape==='Princess'&&Math.abs(x)>.98&&Math.abs(y)>.98)||(['Pear','Marquise','Heart','Trillion'].includes(shape)&&Math.abs(x)<.05)),controls:[[x*w*.58,y*l*.58,galleryHeight],[x*(w+gap),y*(l+gap),girdle-.45],[x*(w+gap*.7),y*(l+gap*.7),girdle+.15],[x*w*.97,y*l*.97,girdle+.24]]};
 });
 const spokes=[0,Math.PI/2,Math.PI,3*Math.PI/2].map(a=>{
  const [x,y]=boundary(outline,a);return [[0,0,root],[x*w*.58,y*l*.58,galleryHeight]];
 });
 return {outline,width,length,depth,girdle,bottom,root,galleryHeight,radius,setting,prongs,spokes,stem:[[0,0,bandRadius],[0,0,root]],stemRadius:Math.max(.45,Math.min(.65,width*.085))};
}
// Blender coordinates (x, axial y, height z) -> the viewer's glTF coordinates.
const vector=p=>new THREE.Vector3(p[0],p[2],-p[1]);
export function createSetting(plan){
 const group=new THREE.Group();group.name='Procedural center setting';
 const material=new THREE.MeshStandardMaterial({name:'Metal'});
 function add(geometry,name){const mesh=new THREE.Mesh(geometry,material.clone());mesh.name=name;group.add(mesh);}
 function tube(points,radius,name,closed=false,cubic=false,flatCaps=false){
  const v=points.map(vector);
  const curve=cubic?new THREE.CubicBezierCurve3(...v):v.length===2?new THREE.LineCurve3(...v):new THREE.CatmullRomCurve3(v,closed,'centripetal');
  const geometry=new THREE.TubeGeometry(curve,cubic?40:Math.max(16,points.length*2),radius,12,closed);add(geometry,name);
  if(flatCaps){
   const positions=geometry.attributes.position;
   for(const [offset,endpoint] of [[0,v[0]],[positions.count-13,v.at(-1)]]){
    const capVertices=[...endpoint.toArray()],indices=[];
    for(let i=0;i<12;i++)capVertices.push(positions.getX(offset+i),positions.getY(offset+i),positions.getZ(offset+i));
    for(let i=0;i<12;i++)indices.push(0,i+1,(i+1)%12+1);
    const cap=new THREE.BufferGeometry();cap.setAttribute('position',new THREE.Float32BufferAttribute(capVertices,3));cap.setIndex(indices);cap.computeVertexNormals();add(cap,name+' cap');
   }
  }
  if(!closed&&!flatCaps)for(const endpoint of [v[0],v.at(-1)]){const cap=new THREE.SphereGeometry(radius,12,8);cap.translate(...endpoint.toArray());add(cap,name+' joint');}
 }
 tube(plan.stem,plan.stemRadius,'Center stem',false,false,true);
 const gallery=plan.outline.map(([x,y])=>[x*plan.width*.29,y*plan.length*.29,plan.galleryHeight]);
 // Linear polygon edges preserve cornered galleries and their exact spoke contacts.
 for(let i=0;i<gallery.length;i++)tube([gallery[i],gallery[(i+1)%gallery.length]],.20,'Gallery');
 for(const spoke of plan.spokes)tube(spoke,plan.radius,'Gallery bridge');
 for(const prong of plan.prongs){
  tube(prong.controls,plan.setting==='Bezel'?plan.radius*.8:plan.radius,'Prong',false,true);
  if(prong.protective){
   const [x,y]=prong.point,p=[x*plan.width/2,y*plan.length/2,plan.girdle+.05],t=new THREE.Vector2(-y,x).normalize().multiplyScalar(.23);
   tube([[p[0]+t.x,p[1]+t.y,p[2]],[p[0]+x*.10,p[1]+y*.10,p[2]+.08],[p[0]-t.x,p[1]-t.y,p[2]]],.13,'Protective tip');
  }
 }
 if(plan.setting==='Bezel'){
  const vertices=[],indices=[],n=plan.outline.length;
  for(const [x,y] of plan.outline)for(const [scale,height] of [[1.045,plan.girdle-.55],[1.045,plan.girdle+.12],[.985,plan.girdle+.12],[.985,plan.girdle-.55]])vertices.push(...vector([x*plan.width/2*scale,y*plan.length/2*scale,height]).toArray());
  for(let i=0;i<n;i++)for(let j=0;j<4;j++){const a=i*4+j,b=(i+1)%n*4+j,c=(i+1)%n*4+(j+1)%4,d=i*4+(j+1)%4;indices.push(a,b,c,a,c,d);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();add(geometry,'Bezel wall');
 }
 // Pack the visual metal into one draw call; merging meshes does not fuse CAD solids.
 const pieces=group.children.map(o=>{const geometry=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geometry.deleteAttribute('uv');return geometry;});
 const merged=mergeGeometries(pieces,false),finalMaterial=material.clone();
 for(const piece of pieces)piece.dispose();
 for(const mesh of group.children){mesh.geometry.dispose();mesh.material.dispose();}
 group.clear();const holder=new THREE.Mesh(merged,finalMaterial);holder.name='Fitted center metal';group.add(holder);group.userData.settingPlan=plan;
 material.dispose();return group;
}

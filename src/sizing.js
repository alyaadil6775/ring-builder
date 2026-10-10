// Nominal rounded diameters from the GIA international chart, US 3 through 13.
const diameters=[14.1,14.3,14.5,14.7,14.9,15.1,15.3,15.5,15.7,15.9,16.1,16.3,16.5,16.7,16.9,17.1,17.3,17.5,17.7,17.9,18.1,18.3,18.5,18.8,19,19.2,19.4,19.6,19.8,20,20.2,20.4,20.6,20.8,21,21.2,21.4,21.6,21.8,22,22.2];
export function ringDimensions(config){
 let diameter=17; // Legacy numeric-mm assets when no ring size has been selected.
 if(config.ringSystem==='Circumference')diameter=Number(config.ringSize)/Math.PI;
 else if(config.ringSize!=null){const index=(Number(config.ringSize)-3)*4;if(!Number.isInteger(index)||index<0||index>=diameters.length)throw new Error('Choose a US size from 3 to 13 in quarter-size steps.');diameter=diameters[index];}
 if(!Number.isFinite(diameter)||diameter<14||diameter>22.3)throw new Error('The supported inner diameter is 14–22.3 mm.');
 const thickness=Number(config.thicknessMm??1.3);return {innerDiameterMm:diameter,innerCircumferenceMm:Math.PI*diameter,centerRadiusMm:(diameter+thickness)/2};
}
export function radialPoint(point,radiusDelta=0,thickness=1){
 const r=Math.hypot(point.x,point.y);if(!r)return point;
 const next=9.15+(r-9.15)*thickness+radiusDelta;point.x*=next/r;point.y*=next/r;return point;
}

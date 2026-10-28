// AlpicAir — 3D māja (three.js). Puscaurspīdīga māja ar redzamu grīdas apkuri, boileri un rekuperatoru.
// Scēnas pārslēdz ritināšana (notikumi "alpic-scene" / "alpic-sub").
import * as THREE from 'three';

function init(){
  const stage=document.querySelector('#ka-strada .stage');
  if(!stage)return;
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})}catch(e){return}
  if(!renderer.getContext())return;
  renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const cv=renderer.domElement;cv.className='h3d';stage.prepend(cv);

  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#0d1030');scene.fog=new THREE.Fog('#0d1030',45,110);
  const camera=new THREE.PerspectiveCamera(32,2,.1,300);

  /* ---------- lights ---------- */
  const hemi=new THREE.HemisphereLight('#cfe0ff','#3a3a4a',.6);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#fff3e0',1.5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:80});sun.shadow.bias=-.0004;sun.shadow.normalBias=.02;
  scene.add(sun);scene.add(sun.target);
  const inLight=new THREE.PointLight('#ffd9a0',0,16,1.4);inLight.position.set(0,3.2,.8);scene.add(inLight);

  /* ---------- textures ---------- */
  function canvasTex(w,h,draw,rep=[1,1]){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1]);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const woodTex=canvasTex(512,512,(g,w,h)=>{const n=16,pw=w/n;for(let i=0;i<n;i++){g.fillStyle=`hsl(${rnd(24,30)},${rnd(38,48)}%,${rnd(34,46)}%)`;g.fillRect(i*pw,0,pw,h);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(i*pw,0,2,h)}},[2,1]);
  const roofTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#34343c';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=16){g.fillStyle='#4a4a54';g.fillRect(x,0,3,h)}},[6,1]);
  const deckTex=canvasTex(256,256,(g,w,h)=>{for(let y=0;y<h;y+=16){g.fillStyle=`hsl(28,35%,${rnd(36,44)}%)`;g.fillRect(0,y,w,16);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,y+15,w,1)}},[3,2]);
  // flow texture: bright dashes moving along a tube (u axis)
  const flowTex=(c1,c2)=>canvasTex(128,8,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,c2);gr.addColorStop(.45,c1);gr.addColorStop(.55,'#ffffff');gr.addColorStop(.65,c1);gr.addColorStop(1,c2);g.fillStyle=gr;g.fillRect(0,0,w,h)});

  /* ---------- materials ---------- */
  const ghost=(color,op)=>new THREE.MeshStandardMaterial({color,roughness:.35,metalness:.05,transparent:true,opacity:op,depthWrite:false,side:THREE.DoubleSide});
  const M={
    plaster:ghost('#f3eee6',.2),
    wood:new THREE.MeshStandardMaterial({map:woodTex,roughness:.8,transparent:true,opacity:.2,depthWrite:false,side:THREE.DoubleSide}),
    roof:new THREE.MeshStandardMaterial({map:roofTex,roughness:.6,metalness:.3,transparent:true,opacity:.2,depthWrite:false,side:THREE.DoubleSide}),
    slabG:ghost('#e9e4f5',.16),
    edge:new THREE.LineBasicMaterial({color:'#ffffff',transparent:true,opacity:.55}),
    edgeR:new THREE.LineBasicMaterial({color:'#d9d2ff',transparent:true,opacity:.6}),
    frame:new THREE.MeshStandardMaterial({color:'#2d2d33',roughness:.5,metalness:.2}),
    glass:new THREE.MeshStandardMaterial({color:'#a8cbe4',roughness:.08,transparent:true,opacity:.18,emissive:'#ffcf8a',emissiveIntensity:0,depthWrite:false,side:THREE.DoubleSide}),
    slab:new THREE.MeshStandardMaterial({color:'#cfc6b6',roughness:.9}),
    white:new THREE.MeshStandardMaterial({color:'#f4f4f6',roughness:.4}),
    grey:new THREE.MeshStandardMaterial({color:'#c9cbd2',roughness:.5}),
    dark:new THREE.MeshStandardMaterial({color:'#1d1b26',roughness:.4}),
    furn:new THREE.MeshStandardMaterial({color:'#bdb5d6',roughness:.9,transparent:true,opacity:.45,depthWrite:false}),
    ground:new THREE.MeshStandardMaterial({color:'#7cb342',roughness:1}),
    deck:new THREE.MeshStandardMaterial({map:deckTex,roughness:.85}),
    stone:new THREE.MeshStandardMaterial({color:'#9a968e',roughness:1}),
    trunk:new THREE.MeshStandardMaterial({color:'#6b4a33',roughness:1}),
    leaf:new THREE.MeshStandardMaterial({color:'#4f8f3a',roughness:.9,flatShading:true}),
    leaf2:new THREE.MeshStandardMaterial({color:'#3f7a34',roughness:.9,flatShading:true}),
    screen:new THREE.MeshStandardMaterial({color:'#0b0b14',emissive:'#ff8a3d',emissiveIntensity:1.2}),
    led:new THREE.MeshStandardMaterial({color:'#222',emissive:'#3ee0a8',emissiveIntensity:0}),
    brand:new THREE.MeshStandardMaterial({color:'#7c5cff',roughness:.4}),
    tankShell:ghost('#f6f6fa',.3),
    tank:new THREE.MeshStandardMaterial({color:'#b87333',roughness:.35,metalness:.6}),
    tankHot:new THREE.MeshStandardMaterial({color:'#ff6a2a',emissive:'#ff5a1a',emissiveIntensity:0,transparent:true,opacity:.92}),
    rvBody:new THREE.MeshStandardMaterial({color:'#f2f0f8',roughness:.35}),
    // flowing pipes
    floorPipe:new THREE.MeshStandardMaterial({color:'#b8b2c8',roughness:.4,emissive:'#ff7a2f',emissiveIntensity:0}),
    hot:new THREE.MeshStandardMaterial({color:'#d9574a',roughness:.4,emissive:'#ff4a2a',emissiveIntensity:0}),
    cold:new THREE.MeshStandardMaterial({color:'#4a7fd9',roughness:.4,emissive:'#3a8aff',emissiveIntensity:0}),
    supply:new THREE.MeshStandardMaterial({color:'#bfeedd',roughness:.35,emissive:'#3ee0a8',emissiveIntensity:0,transparent:true,opacity:.9}),
    extract:new THREE.MeshStandardMaterial({color:'#f5d3bd',roughness:.35,emissive:'#ff9a5a',emissiveIntensity:0,transparent:true,opacity:.9}),
  };
  const FLOW={floor:flowTex('#ffb070','#ff5a1a'),hot:flowTex('#ffb07a','#ff3a1a'),cold:flowTex('#9ad0ff','#2a6ad9'),supply:flowTex('#b9ffe6','#1fbf8a'),extract:flowTex('#ffd2b0','#ff7a3a')};
  M.floorPipe.emissiveMap=FLOW.floor;M.hot.emissiveMap=FLOW.hot;M.cold.emissiveMap=FLOW.cold;M.supply.emissiveMap=FLOW.supply;M.extract.emissiveMap=FLOW.extract;

  const box=(w,h,d,m,x=0,y=0,z=0,cast=true)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;return o};
  const edges=(mesh,mat=M.edge)=>{const l=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry,25),mat);l.position.copy(mesh.position);l.rotation.copy(mesh.rotation);l.scale.copy(mesh.scale);return l};
  // tube along polyline (rounded corners)
  function pipe(pts,r,mat,parent,rep=1){
    const path=new THREE.CurvePath();for(let i=0;i<pts.length-1;i++)path.add(new THREE.LineCurve3(new THREE.Vector3(...pts[i]),new THREE.Vector3(...pts[i+1])));
    let len=0;for(let i=0;i<pts.length-1;i++)len+=new THREE.Vector3(...pts[i]).distanceTo(new THREE.Vector3(...pts[i+1]));
    const geo=new THREE.TubeGeometry(path,Math.max(8,Math.round(len*14)),r,10,false);
    const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*len*rep);
    const m=new THREE.Mesh(geo,mat);m.castShadow=false;(parent||scene).add(m);return m;
  }

  /* ---------- house (semi-transparent) ---------- */
  const W=10,D=8,FH=3,T=.25;
  const house=new THREE.Group();scene.add(house);
  function wall(len,h,holes,mat){
    const s=new THREE.Shape();s.moveTo(0,0);s.lineTo(len,0);s.lineTo(len,h);s.lineTo(0,h);s.lineTo(0,0);
    holes.forEach(([x,y,w,hh])=>{const p=new THREE.Path();p.moveTo(x,y);p.lineTo(x,y+hh);p.lineTo(x+w,y+hh);p.lineTo(x+w,y);p.lineTo(x,y);s.holes.push(p)});
    const geo=new THREE.ExtrudeGeometry(s,{depth:T,bevelEnabled:false});
    const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/3,uv.getY(i)/3);
    const g=new THREE.Group();const m=new THREE.Mesh(geo,mat);m.castShadow=false;m.receiveShadow=false;m.renderOrder=2;g.add(m);g.add(edges(m));
    holes.forEach(([x,y,w,hh,door])=>{
      const gl=new THREE.Mesh(new THREE.PlaneGeometry(w,hh),M.glass);gl.position.set(x+w/2,y+hh/2,T*.55);gl.renderOrder=3;g.add(gl);
      const f=.06;[[x+w/2,y+hh-f/2,w,f],[x+w/2,y+f/2,w,f],[x+f/2,y+hh/2,f,hh],[x+w-f/2,y+hh/2,f,hh]].forEach(([cx,cy,fw,fh])=>g.add(box(fw,fh,.1,M.frame,cx,cy,T*.6,false)));
    });
    return g;
  }
  function place(g,side,y0){
    if(side==='front'){g.position.set(-W/2,y0,D/2-T)}
    if(side==='back'){g.rotation.y=Math.PI;g.position.set(W/2,y0,-D/2+T)}
    if(side==='east'){g.rotation.y=-Math.PI/2;g.position.set(W/2-T,y0,-D/2)}
    if(side==='west'){g.rotation.y=Math.PI/2;g.position.set(-W/2+T,y0,D/2)}
    house.add(g);return g;
  }
  place(wall(W,FH,[[1,.35,5,2.3],[7.4,0,1.1,2.35,1]],M.plaster),'front',0);
  place(wall(W,FH,[[2,.9,2,1.4],[6,.9,1.6,1.4]],M.plaster),'back',0);
  place(wall(D,FH,[[2.6,.9,1.5,1.4]],M.plaster),'east',0);
  place(wall(D,FH,[[3,.9,2,1.4]],M.plaster),'west',0);
  place(wall(W,FH,[[1.4,.7,2.6,1.7],[6,.7,2.4,1.7]],M.wood),'front',FH);
  place(wall(W,FH,[[3,.8,2.2,1.4]],M.wood),'back',FH);
  place(wall(D,FH,[[3,.8,2,1.4]],M.wood),'east',FH);
  place(wall(D,FH,[[2.6,.8,2,1.4]],M.wood),'west',FH);
  // slabs: ground floor solid, upper floors ghosted
  house.add(box(W,.25,D,M.slab,0,-.12,0));
  const s1=box(W-T*2,.12,D-T*2,M.slabG,0,FH,0,false);s1.renderOrder=1;house.add(s1);house.add(edges(s1,M.edgeR));
  const s2=box(W-T*2,.1,D-T*2,M.slabG,0,2*FH,0,false);s2.renderOrder=1;house.add(s2);house.add(edges(s2,M.edgeR));
  // gable roof
  const RH=2.7,OV=.6,ang=Math.atan2(RH,D/2),half=D/2+OV,slope=half/Math.cos(ang);
  [1,-1].forEach(sg=>{const r=box(W+OV*2,.16,slope,M.roof,0,0,0,false);r.rotation.x=sg*ang;const zc=half/2;r.position.set(0,2*FH+RH-zc*Math.tan(ang)+.08/Math.cos(ang),sg*zc);r.renderOrder=4;house.add(r);house.add(edges(r,M.edgeR))});
  [W/2-T/2,-W/2+T/2].forEach(x=>{const s=new THREE.Shape();s.moveTo(-D/2,0);s.lineTo(D/2,0);s.lineTo(0,RH);s.lineTo(-D/2,0);const g=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:T,bevelEnabled:false}),M.wood);g.rotation.y=Math.PI/2;g.position.set(x-T/2,2*FH,0);g.renderOrder=2;house.add(g);house.add(edges(g))});
  // roof caps for recuperator (fresh air in / exhaust out)
  const capY=2*FH+RH-.9*Math.tan(ang);
  [[-1.6],[-.4]].forEach(([x])=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,1.0,20),M.grey);c.position.set(x,capY+.35,-.9);house.add(c);const h=new THREE.Mesh(new THREE.CylinderGeometry(.36,.28,.1,20),M.dark);h.position.set(x,capY+.88,-.9);house.add(h)});
  // light ghosted interior (partitions + furniture)
  const part=(w,h,d,x,y,z)=>{const p=box(w,h,d,M.slabG,x,y,z,false);p.renderOrder=1;house.add(p);house.add(edges(p,M.edgeR))};
  part(W-T*2,FH-.1,.08,0,FH/2,-1.2);part(W-T*2,FH-.1,.08,0,FH+FH/2,-1.2);part(.08,FH-.1,D/2+1.2-T,2.0,FH/2,(D/2-T-1.2)/2);part(.08,FH-.1,D/2+1.2-T,.9,FH+FH/2,(D/2-T-1.2)/2);
  house.add(box(3,.45,.9,M.furn,-2,.33,-.6,false));house.add(box(3,.7,.25,M.furn,-2,.6,-1.0,false));
  house.add(box(2,.5,2.2,M.furn,-2.6,FH+.3,-.1,false));
  // wall panel in living room
  const panel=new THREE.Group();panel.add(box(.42,.42,.05,M.white,0,0,0,false));panel.add(box(.34,.34,.02,M.screen,0,0,.03,false));panel.position.set(.4,1.45,-1.13);house.add(panel);
  // wall ACs upstairs
  const iac=new THREE.Group();iac.add(box(1.4,.36,.28,M.white,0,0,0,false));iac.add(box(.05,.05,.02,M.led,.55,.06,.15,false));iac.add(box(1.2,.04,.05,M.grey,0,-.15,.13,false));iac.position.set(-2.6,FH+2.35,-1.02);house.add(iac);
  const iac2=iac.clone();iac2.position.set(3.2,FH+2.35,-1.02);house.add(iac2);
  // deck & steps
  house.add(box(8,.18,2.6,M.deck,-.6,.09,D/2+1.3));
  house.add(box(1.4,.12,.5,M.stone,2.85,.06,D/2+2.9));house.add(box(1.4,.12,.5,M.stone,3.1,.06,D/2+3.7));

  /* ---------- floor heating (serpentine pipes) ---------- */
  function serp(x0,x1,z0,z1,y,step){const pts=[];let dir=1;for(let z=z0;z<=z1+1e-6;z+=step){pts.push(dir>0?[x0,y,z]:[x1,y,z]);pts.push(dir>0?[x1,y,z]:[x0,y,z]);dir*=-1}return pts}
  pipe(serp(-4.45,1.75,-.95,3.45,.07,.4),.045,M.floorPipe,house,1.2);
  pipe(serp(2.25,4.45,.35,3.45,.07,.4),.045,M.floorPipe,house,1.2);
  pipe(serp(-4.45,4.45,-.85,3.45,FH+.1,.45),.04,M.floorPipe,house,1.2);
  // manifold on partition
  house.add(box(.7,.35,.12,M.grey,2.3,.45,-1.0,false));

  /* ---------- All in One with tank ---------- */
  const aio=new THREE.Group();aio.position.set(3.9,0,-.2);house.add(aio);
  const shell=box(.75,1.9,.75,M.tankShell,0,.95,0,false);shell.renderOrder=3;aio.add(shell);aio.add(edges(shell));
  aio.add(box(.4,.22,.03,M.dark,0,1.65,.39,false));
  const tankC=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,1.25,24,1,true),new THREE.MeshStandardMaterial({color:'#b87333',roughness:.35,metalness:.6,transparent:true,opacity:.45,side:THREE.DoubleSide,depthWrite:false}));tankC.position.set(0,.8,0);aio.add(tankC);
  const tankFill=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,1.2,24),M.tankHot);tankFill.position.set(0,.2,0);tankFill.geometry.translate(0,.6,0);tankFill.scale.y=.08;aio.add(tankFill);
  [.2,.45,.7,.95,1.2].forEach(y=>{const c=new THREE.Mesh(new THREE.TorusGeometry(.2,.018,6,24),M.hot);c.rotation.x=Math.PI/2;c.position.set(0,y+.05,0);aio.add(c)});
  // heat pump <-> AIO pipes (through east wall), AIO -> manifold
  pipe([[W/2+.3,.42,1.75],[W/2-.1,.42,1.75],[4.3,.42,1.75],[4.3,.42,.2],[4.1,.42,.05]],.05,M.hot,house,1.4);
  pipe([[W/2+.3,.28,1.45],[W/2-.1,.28,1.45],[4.1,.28,1.45],[4.1,.28,.2]],.05,M.cold,house,1.4);
  pipe([[3.6,.3,-.4],[2.6,.3,-.4],[2.6,.3,-.9],[2.4,.45,-.95]],.04,M.hot,house,1.4);

  /* ---------- recuperator in attic + ducts ---------- */
  const rv=new THREE.Group();rv.position.set(-1,2*FH+.38,-.9);house.add(rv);
  rv.add(box(1.5,.5,.9,M.rvBody,0,0,0,false));rv.add(box(1.5,.06,.9,M.brand,0,.25,0,false));
  const rvFan=new THREE.Group();for(let k=0;k<4;k++){const b=box(.03,.3,.06,M.dark,0,.15,0,false);const p=new THREE.Group();p.add(b);p.rotation.z=k*Math.PI/2;rvFan.add(p)}rvFan.position.set(0,0,.46);rv.add(rvFan);
  rv.add(new THREE.Mesh(new THREE.TorusGeometry(.2,.02,6,24),M.grey).translateZ(.46));
  const ry=2*FH+.38;
  // to roof caps
  pipe([[-1.6,ry+.25,-.9],[-1.6,capY+.2,-.9]],.13,M.supply,house,1.2);
  pipe([[-.4,ry+.25,-.9],[-.4,capY+.2,-.9]],.13,M.extract,house,1.2);
  // supply to bedrooms + down a riser to living room
  pipe([[-1.75,ry,-.9],[-3.2,ry,-.9],[-3.2,ry,1.4],[-3.2,2*FH-.05,1.4]],.1,M.supply,house,1.4);
  pipe([[-.25,ry-.1,-.6],[3.2,ry-.1,-.6],[3.2,ry-.1,1.4],[3.2,2*FH-.05,1.4]],.1,M.supply,house,1.4);
  pipe([[-1.75,ry-.15,-1.1],[-4.4,ry-.15,-1.1],[-4.4,FH-.1,-1.1],[-4.4,FH-.1,1.6],[-3.4,FH-.1,1.6],[-3.4,FH-.25,1.6]],.09,M.supply,house,1.4);
  // extract from bathroom/kitchen (back zone)
  pipe([[-.25,ry,-1.2],[1.6,ry,-1.2],[1.6,ry,-2.8],[1.6,2*FH-.05,-2.8]],.1,M.extract,house,1.4);
  pipe([[-1,ry-.15,-1.35],[-1,ry-.15,-2.9],[.4,ry-.15,-2.9],[.4,FH-.1,-2.9],[.4,FH-.25,-2.9]],.09,M.extract,house,1.4);
  // diffusers
  [[-3.2,2*FH-.08,1.4],[3.2,2*FH-.08,1.4],[-3.4,FH-.28,1.6]].forEach(p=>{const d=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.04,20),M.white);d.position.set(...p);house.add(d)});
  [[1.6,2*FH-.08,-2.8],[.4,FH-.28,-2.9]].forEach(p=>{const d=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.04,20),M.grey);d.position.set(...p);house.add(d)});

  /* ---------- outdoor units: back to facade, fan away ---------- */
  // unit faces +x (fan side) in local space; back at -x
  function outdoor(w,h,d){const g=new THREE.Group();g.add(box(d,h,w,M.white,0,h/2,0));const fr=h*.36,fz=-w*.12;
    const ring=new THREE.Mesh(new THREE.TorusGeometry(fr,.03,8,32),M.grey);ring.position.set(d/2+.015,h*.5,fz);ring.rotation.y=Math.PI/2;g.add(ring);
    const grill=new THREE.Mesh(new THREE.CircleGeometry(fr,32),new THREE.MeshStandardMaterial({color:'#2a2a33',roughness:.6}));grill.position.set(d/2+.006,h*.5,fz);grill.rotation.y=Math.PI/2;g.add(grill);
    for(let k=-2;k<=2;k++)g.add(box(.012,.012,fr*2,M.grey,d/2+.02,h*.5+k*fr*.38,fz,false));
    const bl=new THREE.Group();for(let k=0;k<3;k++){const b=box(.02,fr*.85,.12,M.grey,0,fr*.42,0,false);const p=new THREE.Group();p.add(b);p.rotation.x=k*Math.PI*2/3;bl.add(p)}bl.position.set(d/2+.04,h*.5,fz);g.add(bl);
    for(let k=0;k<6;k++)g.add(box(.012,.03,w*.24,M.grey,d/2+.008,h*.2+k*h*.11,w*.33,false));
    g.add(box(.012,.1,.22,M.brand,d/2+.01,h*.88,w*.33,false));
    g.add(box(.05,.6*h,.05,M.grey,-d/2+.02,h*.3,w*.4,false));
    return {g,blades:bl,d}}
  const hp=outdoor(1.3,1.05,.48);hp.g.position.set(W/2+.3+hp.d/2,.12,1.6);hp.g.add(box(.9,.12,1.6,M.stone,0,-.06,0,false));house.add(hp.g);
  const ac=outdoor(.85,.6,.32);ac.g.rotation.y=Math.PI;ac.g.position.set(-W/2-.18-ac.d/2,FH+.2,1.6);ac.g.add(box(.5,.04,.7,M.frame,0,0,0,false));house.add(ac.g);
  pipe([[-W/2-.18,FH+.35,1.4],[-W/2+.2,FH+.35,1.4],[-W/2+.2,FH+2.3,1.4],[-2.6,FH+2.3,-.8]],.03,M.grey,house);

  /* ---------- landscape ---------- */
  const ground=new THREE.Mesh(new THREE.CircleGeometry(70,64),M.ground);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const path=new THREE.Mesh(new THREE.PlaneGeometry(1.4,12),M.stone);path.rotation.x=-Math.PI/2;path.position.set(2.9,.01,D/2+8);path.receiveShadow=true;scene.add(path);
  const leafMats=[M.leaf,M.leaf2];
  function tree(x,z,s=1,type=0){const g=new THREE.Group();g.add(box(.25*s,1.6*s,.25*s,M.trunk,0,.8*s,0));
    if(type===0){[[2.2,1.4],[3.2,1.1],[4.0,.75]].forEach(([y,r])=>{const c=new THREE.Mesh(new THREE.ConeGeometry(r*s,1.4*s,8),leafMats[1]);c.position.y=y*s;c.castShadow=true;g.add(c)})}
    else{[[0,2.4,1.1],[.6,2.1,.8],[-.5,2.2,.85],[0,3.0,.8]].forEach(([dx,y,r])=>{const c=new THREE.Mesh(new THREE.IcosahedronGeometry(r*s,0),leafMats[0]);c.position.set(dx*s,y*s,0);c.castShadow=true;g.add(c)})}
    g.position.set(x,0,z);scene.add(g)}
  tree(-9,-3,1.2,0);tree(-11,2.5,1,1);tree(13,-10,1.3,0);tree(17,7,.9,1);tree(-6,-8,1.1,1);tree(4,-9,1.2,0);tree(-14,-6,1.4,0);tree(15,-2,1.1,0);
  for(let i=0;i<9;i++){const b=new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(.35,.6),0),leafMats[i%2]);b.position.set(rnd(-5.5,1.8),.3,D/2+2.9+rnd(-.2,.3));if(Math.abs(b.position.x-2.9)<.9)b.position.x-=1.8;b.castShadow=true;scene.add(b)}

  /* ---------- particles ---------- */
  function stream(n,color,size,origin,fn){const geo=new THREE.BufferGeometry();const pos=new Float32Array(n*3);const seed=new Float32Array(n);for(let i=0;i<n;i++)seed[i]=Math.random();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const mat=new THREE.PointsMaterial({color,size,transparent:true,opacity:0,depthWrite:false,sizeAttenuation:true});const p=new THREE.Points(geo,mat);p.position.copy(origin);scene.add(p);
    return {mat,target:0,update(t){for(let i=0;i<n;i++){const v=fn(seed[i],t,i);pos[i*3]=v[0];pos[i*3+1]=v[1];pos[i*3+2]=v[2]}geo.attributes.position.needsUpdate=true;mat.opacity+=(this.target-mat.opacity)*.06}}}
  const S_={};
  S_.snow=stream(1600,'#ffffff',.09,new THREE.Vector3(0,0,0),(s,t,i)=>{const x=((s*9301+i*.37)%1)*50-25,z=((s*4933+i*.71)%1)*50-25;const y=18-((t*1.1+s*18)%18);return [x+Math.sin(t+i)*.3,y,z]});
  const hpFanX=W/2+.3+hp.d+.05;
  S_.hp=stream(150,'#9ad8ff',.08,new THREE.Vector3(hpFanX,.12+1.05*.5,1.6-1.3*.12),(s,t)=>{const k=(t*.9+s)%1;const a=s*6.283;return [k*2.4,Math.sin(a)*.32*k,Math.cos(a)*.32*k]});
  const acFanX=-W/2-.18-ac.d-.05;
  S_.acOut=stream(110,'#ffb070',.08,new THREE.Vector3(acFanX,FH+.2+.3,1.6+.85*.12),(s,t)=>{const k=(t*.9+s)%1;const a=s*6.283;return [-k*1.9,Math.sin(a)*.25*k+k*.3,Math.cos(a)*.25*k]});
  const acIn=(x)=>stream(90,'#7fd3ff',.06,new THREE.Vector3(x,FH+2.15,-.85),(s,t)=>{const k=(t*.6+s)%1;return [(s-.5)*1.2,-k*1.6,k*1.4]});
  S_.ac1=acIn(-2.6);S_.ac2=acIn(3.2);
  S_.rvIn=stream(80,'#3ee0a8',.09,new THREE.Vector3(-1.6,capY+.95,-.9),(s,t)=>{const k=1-((t*.5+s)%1);const a=s*6.283;return [Math.cos(a)*.5*k,k*1.5,Math.sin(a)*.5*k]});
  S_.rvOut=stream(80,'#ffa36b',.09,new THREE.Vector3(-.4,capY+.95,-.9),(s,t)=>{const k=(t*.5+s)%1;const a=s*6.283;return [Math.cos(a)*.4*k,k*1.7,Math.sin(a)*.4*k]});
  const room=(p)=>stream(60,'#3ee0a8',.06,new THREE.Vector3(...p),(s,t)=>{const k=(t*.45+s)%1,a=s*6.283;return [Math.cos(a)*k*1.3,-k*1.6,Math.sin(a)*k*1.3]});
  S_.r1=room([-3.2,2*FH-.12,1.4]);S_.r2=room([3.2,2*FH-.12,1.4]);S_.r3=room([-3.4,FH-.3,1.6]);
  S_.heat=stream(140,'#ffb36b',.05,new THREE.Vector3(-1.3,0,1.25),(s,t)=>{const k=(t*.3+s)%1;return [((s*5.3)%1)*6.2-3.1,.12+k*2.3,((s*9.1)%1)*4.2-2.1]});

  /* ---------- environments ---------- */
  const ENV={
    night:{bg:'#0e1230',fog:'#0e1230',hs:'#2c3a6a',hg:'#0b0b18',hi:.55,sc:'#9fb4ff',si:.6,sp:[-12,16,8],gr:'#2e3a2e',lf:['#2c4a2a','#244022']},
    winter:{bg:'#c9d8ea',fog:'#c9d8ea',hs:'#eaf2ff',hg:'#8d97a8',hi:.95,sc:'#fff4e2',si:1.6,sp:[14,9,10],gr:'#f2f5fa',lf:['#c9d6cf','#b6c7bd']},
    summer:{bg:'#8ccbff',fog:'#a8d8ff',hs:'#d8efff',hg:'#5f8a45',hi:.9,sc:'#fff0d0',si:2.4,sp:[10,22,12],gr:'#79b04a',lf:['#4f8f3a','#3f7a34']},
    dusk:{bg:'#d8957f',fog:'#c98a86',hs:'#ffd0b4',hg:'#4a3a5a',hi:.65,sc:'#ffa860',si:1.4,sp:[-16,6,4],gr:'#7d8a5c',lf:['#55703c','#47603a']},
  };
  const cur={bg:new THREE.Color('#0e1230'),sp:new THREE.Vector3(-12,16,8)};
  let env=ENV.night;
  // camera views per scene: [radius, azimuth°, elevation°, target]
  const VIEWS=[[30,32,20,[0,3.6,0]],[19,52,30,[1.5,1.2,1]],[10,108,14,[3.8,1.1,-.2]],[17,30,26,[-.8,6.3,-.5]],[19,-38,16,[-2.5,4,.5]],[26,-14,12,[0,3.4,0]],[34,-62,24,[0,3,0]]];
  const cam={r:30,az:32,el:20,t:new THREE.Vector3(0,3.6,0)},tgt={r:30,az:32,el:20,t:new THREE.Vector3(0,3.6,0)};
  let state={hp:0,ac:0,rv:0,boil:0,floor:0,lights:1,snow:0,mode:'#b6a3ff'},sub=0,mouse=0;
  function setScene(i,s){
    const v=VIEWS[i]||VIEWS[0];tgt.r=v[0];tgt.el=v[2];tgt.t.set(...v[3]);
    let a=v[1];while(a-cam.az>180)a-=360;while(a-cam.az<-180)a+=360;tgt.az=a;
    env=ENV[s.sky]||ENV.night;
    state={hp:s.d.hp||0,ac:s.d.ac||0,rv:s.d.rv||0,boil:s.d.boil||0,floor:s.d.floor||0,lights:s.lights,snow:s.snow,mode:getComputedStyle(document.documentElement).getPropertyValue('--mode').trim()||'#b6a3ff'};
    S_.snow.target=s.snow?.9:0;
    S_.hp.target=state.hp===1?.8:state.hp===2?.35:0;
    S_.heat.target=state.floor?.6:0;
    S_.ac1.target=S_.ac2.target=state.ac?.85:0;S_.acOut.target=state.ac?.8:0;
    const rvv=state.rv===1?.95:state.rv===2?.4:0;S_.rvIn.target=S_.rvOut.target=rvv;S_.r1.target=S_.r2.target=S_.r3.target=rvv*.8;
    M.screen.emissive.set(state.mode);
  }
  addEventListener('alpic-scene',e=>setScene(e.detail.i,e.detail.s));
  addEventListener('alpic-sub',e=>{sub=e.detail});
  stage.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect();mouse=((e.clientX-r.left)/r.width-.5)*2});
  stage.addEventListener('pointerleave',()=>{mouse=0});

  /* ---------- loop ---------- */
  const clock=new THREE.Clock();let visible=true;
  new IntersectionObserver(es=>{visible=es[0].isIntersecting},{threshold:0}).observe(stage);
  function resize(){const r=stage.getBoundingClientRect();const w=Math.max(1,r.width),h=Math.max(1,r.height);renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<1.4?40:32;if(w>700)camera.setViewOffset(w,h,w*.09,0,w,h);else camera.clearViewOffset();camera.updateProjectionMatrix()}
  new ResizeObserver(resize).observe(stage);resize();
  const L=(a,b,k)=>a+(b-a)*k,C=c=>new THREE.Color(c);
  function frame(){
    requestAnimationFrame(frame);if(!visible)return;
    const dt=Math.min(.05,clock.getDelta()),t=clock.elapsedTime,k=1-Math.pow(.02,dt);
    cam.r=L(cam.r,tgt.r,k*.9);cam.el=L(cam.el,tgt.el,k*.9);cam.az=L(cam.az,tgt.az+sub*14+mouse*6,k*.9);cam.t.lerp(tgt.t,k*.9);
    const az=cam.az*Math.PI/180,el=cam.el*Math.PI/180;
    camera.position.set(cam.t.x+cam.r*Math.cos(el)*Math.sin(az),cam.t.y+cam.r*Math.sin(el),cam.t.z+cam.r*Math.cos(el)*Math.cos(az));camera.lookAt(cam.t);
    const ck=k*.7;
    cur.bg.lerp(C(env.bg),ck);scene.background.copy(cur.bg);scene.fog.color.lerp(C(env.fog),ck);
    hemi.color.lerp(C(env.hs),ck);hemi.groundColor.lerp(C(env.hg),ck);hemi.intensity=L(hemi.intensity,env.hi,ck);
    sun.color.lerp(C(env.sc),ck);sun.intensity=L(sun.intensity,env.si,ck);cur.sp.lerp(new THREE.Vector3(...env.sp),ck);sun.position.copy(cur.sp);
    M.ground.color.lerp(C(env.gr),ck);M.leaf.color.lerp(C(env.lf[0]),ck);M.leaf2.color.lerp(C(env.lf[1]),ck);
    const night=env===ENV.night||env===ENV.dusk,glow=state.lights&&night;
    M.glass.emissiveIntensity=L(M.glass.emissiveIntensity,glow?.5:0,ck);
    inLight.intensity=L(inLight.intensity,glow?7:night?1.5:1,ck);
    // edges brighter at night
    M.edge.opacity=L(M.edge.opacity,night?.75:.5,ck);
    // flows
    const fl=state.floor?1:0,hpOn=state.hp?1:0,rvs=state.rv===1?1:state.rv===2?.35:0;
    M.floorPipe.emissiveIntensity=L(M.floorPipe.emissiveIntensity,fl?1.3:0,ck);M.floorPipe.color.lerp(C(fl?'#ff9a5a':'#b8b2c8'),ck);
    FLOW.floor.offset.x-=dt*.9*fl;
    M.hot.emissiveIntensity=L(M.hot.emissiveIntensity,hpOn?1.1:.15,ck);M.cold.emissiveIntensity=L(M.cold.emissiveIntensity,hpOn?1.0:.12,ck);
    FLOW.hot.offset.x-=dt*1.2*hpOn;FLOW.cold.offset.x+=dt*1.2*hpOn;
    M.supply.emissiveIntensity=L(M.supply.emissiveIntensity,rvs?1.1*Math.max(.5,rvs):.05,ck);M.extract.emissiveIntensity=L(M.extract.emissiveIntensity,rvs?1.1*Math.max(.5,rvs):.05,ck);
    FLOW.supply.offset.x-=dt*1.1*rvs;FLOW.extract.offset.x+=dt*1.1*rvs;
    rvFan.rotation.z+=dt*12*rvs;
    tankFill.scale.y=L(tankFill.scale.y,state.boil?1:.25,k*.7);M.tankHot.emissiveIntensity=L(M.tankHot.emissiveIntensity,state.boil?1.2:.2,ck);
    M.led.emissiveIntensity=L(M.led.emissiveIntensity,state.ac?2:0,ck);
    M.screen.emissiveIntensity=1+.4*Math.sin(t*3);
    hp.blades.rotation.x+=(state.hp===1?14:state.hp===2?5:0)*dt;ac.blades.rotation.x+=(state.ac?16:0)*dt;
    Object.values(S_).forEach(s=>{if(s.mat.opacity>.01||s.target>0)s.update(t)});
    renderer.render(scene,camera);
  }
  frame();
  stage.classList.add('is3d');
  if(window.__alpicScene)setScene(window.__alpicScene.i,window.__alpicScene.s);
}
try{init()}catch(e){console.error('house3d',e)}

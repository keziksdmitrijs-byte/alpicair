// AlpicAir — 3D māja (three.js). Puscaurspīdīga māja ar redzamu grīdas apkuri, boileri un rekuperatoru,
// reālistiska apkārtne: fizikālas debesis, zāle, koki, žogs. Scēnas pārslēdz ritināšana ("alpic-scene" / "alpic-sub").
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

function init(){
  const stage=document.querySelector('#ka-strada .stage');
  if(!stage)return;
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})}catch(e){window.__no3d&&window.__no3d();return}
  if(!renderer.getContext()){window.__no3d&&window.__no3d();return}
  const lowEnd=(navigator.hardwareConcurrency||4)<=4||matchMedia('(max-width:700px)').matches;
  renderer.setPixelRatio(Math.min(lowEnd?1.5:2,devicePixelRatio||1));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.55;
  const cv=renderer.domElement;cv.className='h3d';stage.prepend(cv);

  const scene=new THREE.Scene();
  scene.fog=new THREE.Fog('#b9c9dc',60,260);
  const camera=new THREE.PerspectiveCamera(32,2,.1,4000);
  const rnd=(a,b)=>a+Math.random()*(b-a);
  let seed=7;const srnd=(a,b)=>{seed=(seed*16807)%2147483647;return a+(seed/2147483647)*(b-a)};

  /* ---------- sky + environment ---------- */
  const sky=new Sky();sky.scale.setScalar(2000);scene.add(sky);
  const SU=sky.material.uniforms;
  const envScene=new THREE.Scene();const envSky=new Sky();envSky.scale.setScalar(2000);envScene.add(envSky);
  const pmrem=new THREE.PMREMGenerator(renderer);let envRT=null;
  const sunDir=new THREE.Vector3();
  function sunVec(elev,az,out){const phi=THREE.MathUtils.degToRad(90-elev),th=THREE.MathUtils.degToRad(az);return out.setFromSphericalCoords(1,phi,th)}
  function buildEnv(e){const u=envSky.material.uniforms;u.turbidity.value=e.turb;u.rayleigh.value=e.ray;u.mieCoefficient.value=e.mie;u.mieDirectionalG.value=.8;sunVec(Math.max(e.elev,e.night?-4:e.elev),e.az,u.sunPosition.value);
    if(envRT)envRT.dispose();envRT=pmrem.fromScene(envScene,.02);scene.environment=envRT.texture}
  // stars
  const starGeo=new THREE.BufferGeometry();const sp=new Float32Array(2400*3);for(let i=0;i<2400;i++){const v=new THREE.Vector3(rnd(-1,1),rnd(.05,1),rnd(-1,1)).normalize().multiplyScalar(1500);sp.set([v.x,v.y,v.z],i*3)}
  starGeo.setAttribute('position',new THREE.BufferAttribute(sp,3));
  const starMat=new THREE.PointsMaterial({color:'#ffffff',size:2.2,sizeAttenuation:false,transparent:true,opacity:0,depthWrite:false,fog:false});scene.add(new THREE.Points(starGeo,starMat));
  const moon=new THREE.Mesh(new THREE.SphereGeometry(28,24,16),new THREE.MeshBasicMaterial({color:'#f4f1e4',fog:false,transparent:true,opacity:0}));moon.position.set(-700,520,-900);scene.add(moon);

  /* ---------- lights ---------- */
  const hemi=new THREE.HemisphereLight('#dfe9ff','#4a4a3a',.4);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#fff3e0',3);sun.castShadow=true;sun.shadow.mapSize.set(lowEnd?1024:2048,lowEnd?1024:2048);
  Object.assign(sun.shadow.camera,{left:-26,right:26,top:26,bottom:-26,near:1,far:120});sun.shadow.bias=-.0003;sun.shadow.normalBias=.03;
  scene.add(sun);scene.add(sun.target);
  const inLight=new THREE.PointLight('#ffd2a0',0,18,1.3);inLight.position.set(0,3.2,.8);scene.add(inLight);
  const porch=new THREE.PointLight('#ffc98a',0,9,1.6);porch.position.set(3,2.6,4.6);scene.add(porch);

  /* ---------- textures ---------- */
  function canvasTex(w,h,draw,rep=[1,1],color=true){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1]);if(color)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t}
  function noise(g,w,h,n,cols,sz=[1,3],a=[.05,.25]){for(let i=0;i<n;i++){g.globalAlpha=rnd(a[0],a[1]);g.fillStyle=cols[(Math.random()*cols.length)|0];const s=rnd(sz[0],sz[1]);g.fillRect(rnd(0,w),rnd(0,h),s,s)}g.globalAlpha=1}
  const grassTex=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#5f8f3c';g.fillRect(0,0,w,h);noise(g,w,h,9000,['#4d7a2f','#6fa046','#86b456','#3f6a28','#7a9a40'],[2,5],[.2,.5]);
    for(let i=0;i<5000;i++){g.strokeStyle=['#4a7a2c','#75a84a','#8fbf5a','#3c6624'][(Math.random()*4)|0];g.globalAlpha=rnd(.3,.7);g.lineWidth=1;const x=rnd(0,w),y=rnd(0,h);g.beginPath();g.moveTo(x,y);g.lineTo(x+rnd(-2,2),y-rnd(4,10));g.stroke()}g.globalAlpha=1},[90,90]);
  const snowTex=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#eef3f8';g.fillRect(0,0,w,h);noise(g,w,h,7000,['#ffffff','#dde6f0','#cfdbe8'],[2,8],[.15,.4])},[60,60]);
  const gravelTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#9a958c';g.fillRect(0,0,w,h);for(let i=0;i<2600;i++){g.fillStyle=['#7d786f','#b4afa5','#8c877d','#c9c4ba','#6d685f'][(Math.random()*5)|0];g.beginPath();g.ellipse(rnd(0,w),rnd(0,h),rnd(1,3),rnd(1,2.5),rnd(0,3),0,7);g.fill()}},[3,8]);
  const woodTex=canvasTex(512,512,(g,w,h)=>{const n=16,pw=w/n;for(let i=0;i<n;i++){g.fillStyle=`hsl(${rnd(24,30)},${rnd(38,48)}%,${rnd(34,46)}%)`;g.fillRect(i*pw,0,pw,h);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(i*pw,0,2,h)}},[2,1]);
  const roofTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#34343c';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=16){g.fillStyle='#4a4a54';g.fillRect(x,0,3,h)}},[6,1]);
  const deckTex=canvasTex(512,256,(g,w,h)=>{for(let y=0;y<h;y+=16){g.fillStyle=`hsl(28,35%,${rnd(34,44)}%)`;g.fillRect(0,y,w,16);noise(g,w,16,200,['#5a3d24','#a07650'],[1,3],[.1,.3]);g.fillStyle='rgba(0,0,0,.4)';g.fillRect(0,y+15,w,1)}},[3,2]);
  const birchTex=canvasTex(64,256,(g,w,h)=>{g.fillStyle='#ece8df';g.fillRect(0,0,w,h);for(let i=0;i<40;i++){g.fillStyle='#2b2620';g.globalAlpha=rnd(.5,.9);g.fillRect(rnd(0,w),rnd(0,h),rnd(6,26),rnd(1.5,4))}g.globalAlpha=1},[1,2]);
  const barkTex=canvasTex(64,256,(g,w,h)=>{g.fillStyle='#4e3826';g.fillRect(0,0,w,h);for(let i=0;i<60;i++){g.fillStyle=Math.random()<.5?'#3a2919':'#634832';g.fillRect(rnd(0,w),rnd(0,h),rnd(2,5),rnd(20,60))}},[1,2]);
  const stoneTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#8f8b84';g.fillRect(0,0,w,h);noise(g,w,h,3000,['#7a766f','#a6a29a','#68645e'],[2,6],[.2,.5])},[1,1]);
  const flowTex=(c1,c2)=>canvasTex(128,8,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,c2);gr.addColorStop(.45,c1);gr.addColorStop(.55,'#ffffff');gr.addColorStop(.65,c1);gr.addColorStop(1,c2);g.fillStyle=gr;g.fillRect(0,0,w,h)});

  /* ---------- materials ---------- */
  const ghost=(color,op)=>new THREE.MeshStandardMaterial({color,roughness:.15,metalness:.05,transparent:true,opacity:op,depthWrite:false,side:THREE.DoubleSide,envMapIntensity:1.2});
  const M={
    plaster:ghost('#f3eee6',.2),
    wood:new THREE.MeshStandardMaterial({map:woodTex,roughness:.6,transparent:true,opacity:.24,depthWrite:false,side:THREE.DoubleSide}),
    roof:new THREE.MeshStandardMaterial({map:roofTex,roughness:.4,metalness:.4,transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide}),
    slabG:ghost('#e9e4f5',.14),
    edge:new THREE.LineBasicMaterial({color:'#ffffff',transparent:true,opacity:.5}),
    edgeR:new THREE.LineBasicMaterial({color:'#d9d2ff',transparent:true,opacity:.55}),
    frame:new THREE.MeshStandardMaterial({color:'#2b2b31',roughness:.45,metalness:.3}),
    glass:new THREE.MeshStandardMaterial({color:'#bcd6ea',roughness:.03,metalness:.3,transparent:true,opacity:.16,emissive:'#ffcf8a',emissiveIntensity:0,depthWrite:false,side:THREE.DoubleSide,envMapIntensity:2}),
    concrete:new THREE.MeshStandardMaterial({map:stoneTex,color:'#7d7a74',roughness:.95}),
    slab:new THREE.MeshStandardMaterial({color:'#cfc6b6',roughness:.9}),
    trim:new THREE.MeshStandardMaterial({color:'#3a3a42',roughness:.5,metalness:.5}),
    door:new THREE.MeshStandardMaterial({map:woodTex,color:'#8a5a36',roughness:.6}),
    white:new THREE.MeshStandardMaterial({color:'#f4f4f6',roughness:.35}),
    grey:new THREE.MeshStandardMaterial({color:'#c9cbd2',roughness:.45,metalness:.2}),
    dark:new THREE.MeshStandardMaterial({color:'#1d1b26',roughness:.4}),
    furn:new THREE.MeshStandardMaterial({color:'#bdb5d6',roughness:.9,transparent:true,opacity:.45,depthWrite:false}),
    ground:new THREE.MeshStandardMaterial({map:grassTex,roughness:1,color:'#ffffff'}),
    snow:new THREE.MeshStandardMaterial({map:snowTex,roughness:.85,transparent:true,opacity:0,depthWrite:false}),
    gravel:new THREE.MeshStandardMaterial({map:gravelTex,roughness:1}),
    deck:new THREE.MeshStandardMaterial({map:deckTex,roughness:.8}),
    stone:new THREE.MeshStandardMaterial({map:stoneTex,roughness:1}),
    bark:new THREE.MeshStandardMaterial({map:barkTex,roughness:1}),
    birch:new THREE.MeshStandardMaterial({map:birchTex,roughness:.9}),
    spruce:new THREE.MeshStandardMaterial({color:'#2f5a35',roughness:.95}),
    leaf:new THREE.MeshStandardMaterial({color:'#5a9440',roughness:.85,transparent:true,opacity:1}),
    leaf2:new THREE.MeshStandardMaterial({color:'#7aa84a',roughness:.85,transparent:true,opacity:1}),
    hedge:new THREE.MeshStandardMaterial({color:'#3f6e33',roughness:.95}),
    fence:new THREE.MeshStandardMaterial({color:'#6b4d34',roughness:.9}),
    lamp:new THREE.MeshStandardMaterial({color:'#222',emissive:'#ffcf8a',emissiveIntensity:0}),
    screen:new THREE.MeshStandardMaterial({color:'#0b0b14',emissive:'#ff8a3d',emissiveIntensity:1.2}),
    led:new THREE.MeshStandardMaterial({color:'#222',emissive:'#3ee0a8',emissiveIntensity:0}),
    brand:new THREE.MeshStandardMaterial({color:'#58008c',roughness:.4}),
    tankShell:ghost('#f6f6fa',.3),
    tankHot:new THREE.MeshStandardMaterial({color:'#ff6a2a',emissive:'#ff5a1a',emissiveIntensity:0,transparent:true,opacity:.92}),
    rvBody:new THREE.MeshStandardMaterial({color:'#f2f0f8',roughness:.35}),
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
  function pipe(pts,r,mat,parent,rep=1){
    const path=new THREE.CurvePath();for(let i=0;i<pts.length-1;i++)path.add(new THREE.LineCurve3(new THREE.Vector3(...pts[i]),new THREE.Vector3(...pts[i+1])));
    let len=0;for(let i=0;i<pts.length-1;i++)len+=new THREE.Vector3(...pts[i]).distanceTo(new THREE.Vector3(...pts[i+1]));
    const geo=new THREE.TubeGeometry(path,Math.max(8,Math.round(len*14)),r,10,false);
    const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*len*rep);
    const m=new THREE.Mesh(geo,mat);m.castShadow=false;(parent||scene).add(m);return m;
  }

  /* ---------- house (semi-transparent) ---------- */
  const W=10,D=8,FH=3,T=.25,BASE=.45;
  const house=new THREE.Group();house.position.y=BASE;scene.add(house);
  // foundation plinth (solid)
  const plinth=box(W+.1,BASE,D+.1,M.concrete,0,-BASE/2,0);scene.add(plinth);plinth.position.y=BASE/2;
  function wall(len,h,holes,mat){
    const s=new THREE.Shape();s.moveTo(0,0);s.lineTo(len,0);s.lineTo(len,h);s.lineTo(0,h);s.lineTo(0,0);
    holes.forEach(([x,y,w,hh])=>{const p=new THREE.Path();p.moveTo(x,y);p.lineTo(x,y+hh);p.lineTo(x+w,y+hh);p.lineTo(x+w,y);p.lineTo(x,y);s.holes.push(p)});
    const geo=new THREE.ExtrudeGeometry(s,{depth:T,bevelEnabled:false});
    const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/3,uv.getY(i)/3);
    const g=new THREE.Group();const m=new THREE.Mesh(geo,mat);m.castShadow=false;m.receiveShadow=false;m.renderOrder=2;g.add(m);g.add(edges(m));
    holes.forEach(([x,y,w,hh,door])=>{
      if(door){g.add(box(w-.1,hh-.05,.06,M.door,x+w/2,y+hh/2,T*.55,false));g.add(box(.04,.3,.06,M.grey,x+w-.22,y+1.05,T*.55+.05,false))}
      else{const gl=new THREE.Mesh(new THREE.PlaneGeometry(w,hh),M.glass);gl.position.set(x+w/2,y+hh/2,T*.55);gl.renderOrder=3;g.add(gl);
        g.add(box(w+.16,.05,.3,M.trim,x+w/2,y-.025,T+.08,false));if(w>2.2)g.add(box(.05,hh,.08,M.frame,x+w/2,y+hh/2,T*.6,false))}
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
  house.add(box(W,.12,D,M.slab,0,-.06,0,false));
  const s1=box(W-T*2,.12,D-T*2,M.slabG,0,FH,0,false);s1.renderOrder=1;house.add(s1);house.add(edges(s1,M.edgeR));
  const s2=box(W-T*2,.1,D-T*2,M.slabG,0,2*FH,0,false);s2.renderOrder=1;house.add(s2);house.add(edges(s2,M.edgeR));
  // band between floors (solid trim)
  [[0,D/2+.02,W+.04,.04],[0,-D/2-.02,W+.04,.04]].forEach(([x,z,w,d])=>house.add(box(w,.14,d,M.trim,x,FH,z,false)));
  // gable roof + fascia, gutters, downpipes
  const RH=2.7,OV=.6,ang=Math.atan2(RH,D/2),half=D/2+OV,slope=half/Math.cos(ang);
  [1,-1].forEach(sg=>{const r=box(W+OV*2,.16,slope,M.roof,0,0,0,false);r.rotation.x=sg*ang;const zc=half/2;r.position.set(0,2*FH+RH-zc*Math.tan(ang)+.08/Math.cos(ang),sg*zc);r.renderOrder=4;house.add(r);house.add(edges(r,M.edgeR));
    const ey=2*FH-OV*Math.tan(ang);house.add(box(W+OV*2,.2,.05,M.trim,0,ey+.02,sg*(half+.02),false));
    const gut=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,W+OV*2,12,1,true,0,Math.PI),M.trim);gut.rotation.z=Math.PI/2;gut.rotation.x=sg>0?0:Math.PI;gut.position.set(0,ey-.08,sg*(half+.1));house.add(gut);
    [W/2+OV-.3,-W/2-OV+.3].forEach(x=>{const dp=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,ey+BASE,10),M.trim);dp.position.set(x,(ey-BASE)/2,sg*(half+.1));house.add(dp)})});
  house.add(box(W+OV*2+.05,.14,.28,M.trim,0,2*FH+RH+.06,0,false));
  [W/2-T/2,-W/2+T/2].forEach(x=>{const s=new THREE.Shape();s.moveTo(-D/2,0);s.lineTo(D/2,0);s.lineTo(0,RH);s.lineTo(-D/2,0);const g=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:T,bevelEnabled:false}),M.wood);g.rotation.y=Math.PI/2;g.position.set(x-T/2,2*FH,0);g.renderOrder=2;house.add(g);house.add(edges(g));
    [1,-1].forEach(sg=>{const b=box(.06,.18,slope,M.trim,0,0,0,false);b.rotation.x=sg*ang;b.position.set(x+(x>0?OV:-OV)-(x>0?.02:-.02),2*FH+RH-half/2*Math.tan(ang)+.12,sg*half/2);house.add(b)})});
  const capY=2*FH+RH-.9*Math.tan(ang);
  [-1.6,-.4].forEach(x=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,1.0,20),M.grey);c.position.set(x,capY+.35,-.9);house.add(c);const h=new THREE.Mesh(new THREE.CylinderGeometry(.36,.28,.1,20),M.trim);h.position.set(x,capY+.88,-.9);house.add(h)});
  // entrance canopy + wall lamp
  house.add(box(2,.1,1.3,M.trim,2.95,2.65,D/2+.6));
  [[2.1],[3.8]].forEach(([x])=>house.add(box(.04,.04,1.3,M.trim,x,2.6,D/2+.6,false)));
  const wl=box(.14,.22,.12,M.lamp,3.75,2.0,D/2+.08,false);house.add(wl);
  // interior
  const part=(w,h,d,x,y,z)=>{const p=box(w,h,d,M.slabG,x,y,z,false);p.renderOrder=1;house.add(p);house.add(edges(p,M.edgeR))};
  part(W-T*2,FH-.1,.08,0,FH/2,-1.2);part(W-T*2,FH-.1,.08,0,FH+FH/2,-1.2);part(.08,FH-.1,D/2+1.2-T,2.0,FH/2,(D/2-T-1.2)/2);part(.08,FH-.1,D/2+1.2-T,.9,FH+FH/2,(D/2-T-1.2)/2);
  house.add(box(3,.45,.9,M.furn,-2,.33,-.6,false));house.add(box(3,.7,.25,M.furn,-2,.6,-1.0,false));
  house.add(box(2,.5,2.2,M.furn,-2.6,FH+.3,-.1,false));
  const panel=new THREE.Group();panel.add(box(.42,.42,.05,M.white,0,0,0,false));panel.add(box(.34,.34,.02,M.screen,0,0,.03,false));panel.position.set(.4,1.45,-1.13);house.add(panel);
  const iac=new THREE.Group();iac.add(box(1.4,.36,.28,M.white,0,0,0,false));iac.add(box(.05,.05,.02,M.led,.55,.06,.15,false));iac.add(box(1.2,.04,.05,M.grey,0,-.15,.13,false));iac.position.set(-2.6,FH+2.35,-1.02);house.add(iac);
  const iac2=iac.clone();iac2.position.set(3.2,FH+2.35,-1.02);house.add(iac2);
  // deck & steps (on terrain)
  const deck=box(8,.22,2.8,M.deck,-.6,.32,D/2+1.45);scene.add(deck);
  [[0,.3,.26],[1,.15,.13]].forEach(([i,h,y])=>scene.add(box(1.6,h,.45,M.concrete,2.95,y/1.1,D/2+.25+.45*i+.35)));

  /* ---------- floor heating ---------- */
  function serp(x0,x1,z0,z1,y,step){const pts=[];let dir=1;for(let z=z0;z<=z1+1e-6;z+=step){pts.push(dir>0?[x0,y,z]:[x1,y,z]);pts.push(dir>0?[x1,y,z]:[x0,y,z]);dir*=-1}return pts}
  pipe(serp(-4.45,1.75,-.95,3.45,.07,.4),.045,M.floorPipe,house,1.2);
  pipe(serp(2.25,4.45,.35,3.45,.07,.4),.045,M.floorPipe,house,1.2);
  pipe(serp(-4.45,4.45,-.85,3.45,FH+.1,.45),.04,M.floorPipe,house,1.2);
  house.add(box(.7,.35,.12,M.grey,2.3,.45,-1.0,false));

  /* ---------- All in One with tank ---------- */
  const aio=new THREE.Group();aio.position.set(3.9,0,-.2);house.add(aio);
  const shell=box(.75,1.9,.75,M.tankShell,0,.95,0,false);shell.renderOrder=3;aio.add(shell);aio.add(edges(shell));
  aio.add(box(.4,.22,.03,M.dark,0,1.65,.39,false));
  const tankC=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,1.25,24,1,true),new THREE.MeshStandardMaterial({color:'#b87333',roughness:.35,metalness:.6,transparent:true,opacity:.45,side:THREE.DoubleSide,depthWrite:false}));tankC.position.set(0,.8,0);aio.add(tankC);
  const tankFill=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,1.2,24),M.tankHot);tankFill.position.set(0,.2,0);tankFill.geometry.translate(0,.6,0);tankFill.scale.y=.08;aio.add(tankFill);
  [.2,.45,.7,.95,1.2].forEach(y=>{const c=new THREE.Mesh(new THREE.TorusGeometry(.2,.018,6,24),M.hot);c.rotation.x=Math.PI/2;c.position.set(0,y+.05,0);aio.add(c)});
  pipe([[W/2+.3,.42,1.75],[W/2-.1,.42,1.75],[4.3,.42,1.75],[4.3,.42,.2],[4.1,.42,.05]],.05,M.hot,house,1.4);
  pipe([[W/2+.3,.28,1.45],[W/2-.1,.28,1.45],[4.1,.28,1.45],[4.1,.28,.2]],.05,M.cold,house,1.4);
  pipe([[3.6,.3,-.4],[2.6,.3,-.4],[2.6,.3,-.9],[2.4,.45,-.95]],.04,M.hot,house,1.4);

  /* ---------- recuperator + ducts ---------- */
  const rv=new THREE.Group();rv.position.set(-1,2*FH+.38,-.9);house.add(rv);
  rv.add(box(1.5,.5,.9,M.rvBody,0,0,0,false));rv.add(box(1.5,.06,.9,M.brand,0,.25,0,false));
  const rvFan=new THREE.Group();for(let k=0;k<4;k++){const b=box(.03,.3,.06,M.dark,0,.15,0,false);const p=new THREE.Group();p.add(b);p.rotation.z=k*Math.PI/2;rvFan.add(p)}rvFan.position.set(0,0,.46);rv.add(rvFan);
  const ry=2*FH+.38;
  pipe([[-1.6,ry+.25,-.9],[-1.6,capY+.2,-.9]],.13,M.supply,house,1.2);
  pipe([[-.4,ry+.25,-.9],[-.4,capY+.2,-.9]],.13,M.extract,house,1.2);
  pipe([[-1.75,ry,-.9],[-3.2,ry,-.9],[-3.2,ry,1.4],[-3.2,2*FH-.05,1.4]],.1,M.supply,house,1.4);
  pipe([[-.25,ry-.1,-.6],[3.2,ry-.1,-.6],[3.2,ry-.1,1.4],[3.2,2*FH-.05,1.4]],.1,M.supply,house,1.4);
  pipe([[-1.75,ry-.15,-1.1],[-4.4,ry-.15,-1.1],[-4.4,FH-.1,-1.1],[-4.4,FH-.1,1.6],[-3.4,FH-.1,1.6],[-3.4,FH-.25,1.6]],.09,M.supply,house,1.4);
  pipe([[-.25,ry,-1.2],[1.6,ry,-1.2],[1.6,ry,-2.8],[1.6,2*FH-.05,-2.8]],.1,M.extract,house,1.4);
  pipe([[-1,ry-.15,-1.35],[-1,ry-.15,-2.9],[.4,ry-.15,-2.9],[.4,FH-.1,-2.9],[.4,FH-.25,-2.9]],.09,M.extract,house,1.4);
  [[-3.2,2*FH-.08,1.4],[3.2,2*FH-.08,1.4],[-3.4,FH-.28,1.6]].forEach(p=>{const d=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.04,20),M.white);d.position.set(...p);house.add(d)});
  [[1.6,2*FH-.08,-2.8],[.4,FH-.28,-2.9]].forEach(p=>{const d=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.04,20),M.grey);d.position.set(...p);house.add(d)});

  /* ---------- outdoor units: back to facade, fan away ---------- */
  function outdoor(w,h,d){const g=new THREE.Group();g.add(box(d,h,w,M.white,0,h/2,0));const fr=h*.36,fz=-w*.12;
    const ring=new THREE.Mesh(new THREE.TorusGeometry(fr,.03,8,32),M.grey);ring.position.set(d/2+.015,h*.5,fz);ring.rotation.y=Math.PI/2;g.add(ring);
    const grill=new THREE.Mesh(new THREE.CircleGeometry(fr,32),new THREE.MeshStandardMaterial({color:'#2a2a33',roughness:.6}));grill.position.set(d/2+.006,h*.5,fz);grill.rotation.y=Math.PI/2;g.add(grill);
    for(let k=-2;k<=2;k++)g.add(box(.012,.012,fr*2,M.grey,d/2+.02,h*.5+k*fr*.38,fz,false));
    const bl=new THREE.Group();for(let k=0;k<3;k++){const b=box(.02,fr*.85,.12,M.grey,0,fr*.42,0,false);const p=new THREE.Group();p.add(b);p.rotation.x=k*Math.PI*2/3;bl.add(p)}bl.position.set(d/2+.04,h*.5,fz);g.add(bl);
    for(let k=0;k<6;k++)g.add(box(.012,.03,w*.24,M.grey,d/2+.008,h*.2+k*h*.11,w*.33,false));
    g.add(box(.012,.1,.22,M.brand,d/2+.01,h*.88,w*.33,false));
    return {g,blades:bl,d}}
  const hp=outdoor(1.3,1.05,.48);hp.g.position.set(W/2+.3+hp.d/2,.12,1.6);hp.g.add(box(.9,.12,1.6,M.concrete,0,-.06,0,false));house.add(hp.g);hp.g.position.y=-BASE+.12;
  const ac=outdoor(.85,.6,.32);ac.g.rotation.y=Math.PI;ac.g.position.set(-W/2-.18-ac.d/2,FH+.2,1.6);ac.g.add(box(.5,.04,.7,M.frame,0,0,0,false));house.add(ac.g);
  pipe([[-W/2-.18,FH+.35,1.4],[-W/2+.2,FH+.35,1.4],[-W/2+.2,FH+2.3,1.4],[-2.6,FH+2.3,-.8]],.03,M.grey,house);

  /* ---------- terrain & landscape ---------- */
  const ground=new THREE.Mesh(new THREE.CircleGeometry(400,96),M.ground);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const snowG=new THREE.Mesh(new THREE.CircleGeometry(400,96),M.snow);snowG.rotation.x=-Math.PI/2;snowG.position.y=.02;snowG.receiveShadow=true;snowG.renderOrder=1;scene.add(snowG);
  // distant hills
  const hillGeo=new THREE.SphereGeometry(1,24,12,0,Math.PI*2,0,Math.PI/2);
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2+srnd(0,.3),r=srnd(150,220);const h=new THREE.Mesh(hillGeo,M.ground);h.scale.set(srnd(50,90),srnd(10,22),srnd(40,70));h.position.set(Math.cos(a)*r,-2,Math.sin(a)*r);h.receiveShadow=false;scene.add(h);
    const hs=new THREE.Mesh(hillGeo,M.snow);hs.scale.copy(h.scale).multiplyScalar(1.004);hs.position.copy(h.position);scene.add(hs)}
  // gravel driveway & stone path
  const drive=new THREE.Mesh(new THREE.PlaneGeometry(3.6,16),M.gravel);drive.rotation.x=-Math.PI/2;drive.position.set(-8.2,.03,D/2+7);drive.receiveShadow=true;scene.add(drive);
  for(let i=0;i<14;i++){const st=new THREE.Mesh(new THREE.CylinderGeometry(srnd(.32,.42),srnd(.34,.44),.06,9),M.stone);st.position.set(2.95+srnd(-.2,.2),.04,D/2+2.6+i*.85);st.rotation.y=srnd(0,3);st.receiveShadow=true;scene.add(st)}
  // trees
  const leafMats=[M.leaf,M.leaf2];const decid=[];
  function spruce(x,z,s){const g=new THREE.Group();const tr=new THREE.Mesh(new THREE.CylinderGeometry(.12*s,.2*s,2.2*s,8),M.bark);tr.position.y=1.1*s;tr.castShadow=true;g.add(tr);
    const layers=7;for(let i=0;i<layers;i++){const r=(1.9-i*.24)*s,hh=(1.5-i*.08)*s;const c=new THREE.Mesh(new THREE.ConeGeometry(r,hh,11,1),M.spruce);c.position.y=(1.4+i*.62)*s;c.rotation.y=srnd(0,3);c.castShadow=true;c.receiveShadow=true;g.add(c)}
    g.position.set(x,0,z);g.rotation.y=srnd(0,6);scene.add(g)}
  const blobGeo=new THREE.IcosahedronGeometry(1,2);{const p=blobGeo.attributes.position;for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i);v.multiplyScalar(1+(Math.sin(v.x*5)*Math.cos(v.y*4)*Math.sin(v.z*6))*.12);p.setXYZ(i,v.x,v.y,v.z)}blobGeo.computeVertexNormals()}
  function broadleaf(x,z,s,birch){const g=new THREE.Group();const trunkM=birch?M.birch:M.bark;
    const tr=new THREE.Mesh(new THREE.CylinderGeometry(.1*s,.18*s,3.2*s,8),trunkM);tr.position.y=1.6*s;tr.castShadow=true;g.add(tr);
    for(let k=0;k<3;k++){const br=new THREE.Mesh(new THREE.CylinderGeometry(.03*s,.07*s,1.4*s,6),trunkM);br.position.set(0,2.6*s,0);br.rotation.set(srnd(.5,.9),k*2.1,0);br.translateY(.6*s);br.castShadow=true;g.add(br)}
    const crown=new THREE.Group();const n=birch?6:8;for(let k=0;k<n;k++){const b=new THREE.Mesh(blobGeo,leafMats[k%2]);const r=srnd(.8,1.25)*s*(birch?.85:1);b.scale.set(r,r*srnd(.8,1.1),r);b.position.set(srnd(-1.1,1.1)*s,(3.3+srnd(0,1.5))*s,srnd(-1.1,1.1)*s);b.castShadow=true;b.receiveShadow=true;crown.add(b)}
    g.add(crown);decid.push(crown);g.position.set(x,0,z);scene.add(g)}
  spruce(-12,-6,1.3);spruce(-15,1,1.1);spruce(13.5,-9,1.4);spruce(16,-3,1.2);spruce(-9,-12,1.25);spruce(6,-13,1.35);spruce(-18,-9,1.5);spruce(19,4,1.1);
  broadleaf(-11,4.5,1,true);broadleaf(-13.5,7,1.1,true);broadleaf(12,7,1.1,false);broadleaf(-5,-11,1.2,false);broadleaf(14,1.5,.95,true);broadleaf(1,-12,1.1,true);
  // forest ring (instanced)
  {const coneG=new THREE.ConeGeometry(1,1,7);coneG.translate(0,.5,0);const n=420;const inst=new THREE.InstancedMesh(coneG,M.spruce,n);const m=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),ps=new THREE.Vector3();
    for(let i=0;i<n;i++){const a=srnd(0,Math.PI*2),r=srnd(42,95);if(Math.abs(Math.sin(a))>.92&&Math.sin(a)>0&&r<60)continue;const h=srnd(7,15);ps.set(Math.cos(a)*r,0,Math.sin(a)*r);sc.set(h*.28,h,h*.28);m.compose(ps,q,sc);inst.setMatrixAt(i,m)}
    inst.castShadow=false;inst.receiveShadow=true;scene.add(inst)}
  // hedge & fence
  for(let i=0;i<12;i++){const h=new THREE.Mesh(blobGeo,M.hedge);h.scale.set(.75,.6,.6);h.position.set(-4.6+i*.6,.45,D/2+3.25);if(Math.abs(h.position.x-2.95)<.8)continue;h.castShadow=true;scene.add(h)}
  const FX=[-17,17],FZ=[-15,18];
  function fenceLine(x0,z0,x1,z1,gap){const len=Math.hypot(x1-x0,z1-z0),n=Math.round(len/2.2),dx=(x1-x0)/len,dz=(z1-z0)/len;
    for(let i=0;i<=n;i++){const t=i*len/n,x=x0+dx*t,z=z0+dz*t;if(gap&&x>gap[0]&&x<gap[1])continue;scene.add(box(.12,1.2,.12,M.fence,x,.6,z))}
    [.4,.95].forEach(y=>{const segs=gap?[[x0,gap[0]],[gap[1],x1]]:[[x0,x1]];segs.forEach(([a,b])=>{if(dz!==0){const r=box(.05,.09,len,M.fence,x0,y,(z0+z1)/2);scene.add(r)}else{const l=Math.abs(b-a);scene.add(box(l,.09,.05,M.fence,(a+b)/2,y,z0))}})})}
  fenceLine(FX[0],FZ[1],FX[1],FZ[1],[-10.2,4.2]);fenceLine(FX[0],FZ[0],FX[1],FZ[0]);fenceLine(FX[0],FZ[0],FX[0],FZ[1]);fenceLine(FX[1],FZ[0],FX[1],FZ[1]);
  // garden lamps along path
  const lamps=[];[[2.1,7],[3.8,10],[2.1,13]].forEach(([x,z])=>{scene.add(box(.08,.7,.08,M.trim,x,.35,z));const h=box(.16,.16,.16,M.lamp,x,.75,z,false);scene.add(h);lamps.push(h)});
  // mailbox
  scene.add(box(.08,1,.08,M.trim,4.7,.5,FZ[1]-.3));scene.add(box(.35,.25,.45,M.trim,4.7,1.05,FZ[1]-.3));
  // grass blades (instanced)
  const bladeGeo=new THREE.PlaneGeometry(.05,.38,1,3);bladeGeo.translate(0,.19,0);{const p=bladeGeo.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setX(i,p.getX(i)*(1-y/.4));p.setZ(i,(y*y)*.35)}}
  const grassMat=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.9,side:THREE.DoubleSide,transparent:true,opacity:1});
  const NG=lowEnd?7000:16000;const grass=new THREE.InstancedMesh(bladeGeo,grassMat,NG);{const m=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),ps=new THREE.Vector3(),col=new THREE.Color(),eu=new THREE.Euler();let k=0;
    const blocked=(x,z)=>(Math.abs(x)<5.4&&Math.abs(z)<4.5)||(x>-4.7&&x<3.5&&z>4&&z<7.2)||(x>2.3&&x<3.6&&z>4&&z<18)||(x>-10.1&&x<-6.2&&z>-1&&z<16)||(x>5&&x<8&&z>.5&&z<2.8);
    while(k<NG){const x=srnd(-22,22),z=srnd(-18,22);if(blocked(x,z))continue;ps.set(x,0,z);eu.set(0,srnd(0,6.3),srnd(-.25,.25));q.setFromEuler(eu);const s=srnd(.6,1.4);sc.set(s,s*srnd(.8,1.3),s);m.compose(ps,q,sc);grass.setMatrixAt(k,m);col.setHSL(srnd(.22,.29),srnd(.45,.6),srnd(.28,.42));grass.setColorAt(k,col);k++}}
  grass.receiveShadow=true;scene.add(grass);

  /* ---------- particles ---------- */
  function stream(n,color,size,origin,fn){const geo=new THREE.BufferGeometry();const pos=new Float32Array(n*3);const sd=new Float32Array(n);for(let i=0;i<n;i++)sd[i]=Math.random();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const mat=new THREE.PointsMaterial({color,size,transparent:true,opacity:0,depthWrite:false,sizeAttenuation:true});const p=new THREE.Points(geo,mat);p.position.copy(origin);scene.add(p);
    return {mat,target:0,update(t){for(let i=0;i<n;i++){const v=fn(sd[i],t,i);pos[i*3]=v[0];pos[i*3+1]=v[1];pos[i*3+2]=v[2]}geo.attributes.position.needsUpdate=true;mat.opacity+=(this.target-mat.opacity)*.06}}}
  const S_={};const HB=new THREE.Vector3(0,BASE,0);
  S_.snow=stream(lowEnd?1400:2600,'#ffffff',.08,new THREE.Vector3(0,0,0),(s,t,i)=>{const x=((s*9301+i*.37)%1)*60-30,z=((s*4933+i*.71)%1)*60-30;const y=20-((t*1.0+s*20)%20);return [x+Math.sin(t*.7+i)*.4,y,z]});
  const hpFanX=W/2+.3+hp.d+.05;
  S_.hp=stream(150,'#9ad8ff',.08,new THREE.Vector3(hpFanX,.12+1.05*.5,1.6-1.3*.12),(s,t)=>{const k=(t*.9+s)%1;const a=s*6.283;return [k*2.4,Math.sin(a)*.32*k,Math.cos(a)*.32*k]});
  const acFanX=-W/2-.18-ac.d-.05;
  S_.acOut=stream(110,'#ffb070',.08,new THREE.Vector3(acFanX,FH+.2+.3,1.6+.85*.12).add(HB),(s,t)=>{const k=(t*.9+s)%1;const a=s*6.283;return [-k*1.9,Math.sin(a)*.25*k+k*.3,Math.cos(a)*.25*k]});
  const acIn=(x)=>stream(90,'#7fd3ff',.06,new THREE.Vector3(x,FH+2.15,-.85).add(HB),(s,t)=>{const k=(t*.6+s)%1;return [(s-.5)*1.2,-k*1.6,k*1.4]});
  S_.ac1=acIn(-2.6);S_.ac2=acIn(3.2);
  S_.rvIn=stream(80,'#3ee0a8',.09,new THREE.Vector3(-1.6,capY+.95,-.9).add(HB),(s,t)=>{const k=1-((t*.5+s)%1);const a=s*6.283;return [Math.cos(a)*.5*k,k*1.5,Math.sin(a)*.5*k]});
  S_.rvOut=stream(80,'#ffa36b',.09,new THREE.Vector3(-.4,capY+.95,-.9).add(HB),(s,t)=>{const k=(t*.5+s)%1;const a=s*6.283;return [Math.cos(a)*.4*k,k*1.7,Math.sin(a)*.4*k]});
  const room=(p)=>stream(60,'#3ee0a8',.06,new THREE.Vector3(...p).add(HB),(s,t)=>{const k=(t*.45+s)%1,a=s*6.283;return [Math.cos(a)*k*1.3,-k*1.6,Math.sin(a)*k*1.3]});
  S_.r1=room([-3.2,2*FH-.12,1.4]);S_.r2=room([3.2,2*FH-.12,1.4]);S_.r3=room([-3.4,FH-.3,1.6]);
  S_.heat=stream(140,'#ffb36b',.05,new THREE.Vector3(-1.3,0,1.25).add(HB),(s,t)=>{const k=(t*.3+s)%1;return [((s*5.3)%1)*6.2-3.1,.12+k*2.3,((s*9.1)%1)*4.2-2.1]});

  /* ---------- environments ---------- */
  // elev/az: sun position; turb/ray/mie: atmosphere; exp: exposure; si: sun light; hi: hemi; fog
  const ENV={
    night:{elev:-8,az:200,turb:2,ray:.4,mie:.003,exp:.42,si:.35,sc:'#9fb4ff',hi:.25,hs:'#4a5a9a',hg:'#101018',fog:'#121a35',fogN:40,fogF:200,snow:0,leaves:1,night:1},
    winter:{elev:11,az:140,turb:9,ray:1.6,mie:.006,exp:.5,si:2.2,sc:'#fff1de',hi:.55,hs:'#eaf2ff',hg:'#9aa3b0',fog:'#c8d6e6',fogN:35,fogF:190,snow:1,leaves:0,night:0},
    summer:{elev:52,az:120,turb:3,ray:1.2,mie:.004,exp:.5,si:3.2,sc:'#fff6e6',hi:.45,hs:'#d8efff',hg:'#5f7a40',fog:'#bcdcf5',fogN:70,fogF:300,snow:0,leaves:1,night:0},
    dusk:{elev:2,az:250,turb:6,ray:2.5,mie:.012,exp:.5,si:1.6,sc:'#ffa060',hi:.4,hs:'#ffcfae',hg:'#3a3048',fog:'#d79a86',fogN:45,fogF:220,snow:0,leaves:1,night:0},
  };
  let env=ENV.night;const cur={elev:-8,az:200,turb:2,ray:.4,mie:.003,exp:.42,fog:new THREE.Color('#121a35')};
  const VIEWS=[[30,32,20,[0,3.6,0]],[19,52,30,[1.5,1.6,1]],[10,108,14,[3.8,1.5,-.2]],[17,30,26,[-.8,6.7,-.5]],[19,-38,16,[-2.5,4.4,.5]],[26,-14,12,[0,3.8,0]],[36,-62,22,[0,3.2,0]]];
  const cam={r:30,az:32,el:20,t:new THREE.Vector3(0,3.6,0)},tgt={r:30,az:32,el:20,t:new THREE.Vector3(0,3.6,0)};
  let state={hp:0,ac:0,rv:0,boil:0,floor:0,lights:1,snow:0,mode:'#b6a3ff'},sub=0,mouse=0;
  buildEnv(env);
  function setScene(i,s){
    const v=VIEWS[i]||VIEWS[0];tgt.r=v[0];tgt.el=v[2];tgt.t.set(...v[3]);
    let a=v[1];while(a-cam.az>180)a-=360;while(a-cam.az<-180)a+=360;tgt.az=a;
    const ne=ENV[s.sky]||ENV.night;if(ne!==env){env=ne;buildEnv(env)}
    state={hp:s.d.hp||0,ac:s.d.ac||0,rv:s.d.rv||0,boil:s.d.boil||0,floor:s.d.floor||0,lights:s.lights,snow:s.snow,mode:getComputedStyle(document.documentElement).getPropertyValue('--mode').trim()||'#b6a3ff'};
    S_.snow.target=s.snow?.95:0;
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
    const dt=Math.min(.05,clock.getDelta()),t=clock.elapsedTime,k=1-Math.pow(.02,dt),ck=k*.6;
    cam.r=L(cam.r,tgt.r,k*.9);cam.el=L(cam.el,tgt.el,k*.9);cam.az=L(cam.az,tgt.az+sub*14+mouse*6,k*.9);cam.t.lerp(tgt.t,k*.9);
    const az=cam.az*Math.PI/180,el=cam.el*Math.PI/180;
    camera.position.set(cam.t.x+cam.r*Math.cos(el)*Math.sin(az),cam.t.y+cam.r*Math.sin(el),cam.t.z+cam.r*Math.cos(el)*Math.cos(az));camera.lookAt(cam.t);
    // sky
    cur.elev=L(cur.elev,env.elev,ck);let da=env.az-cur.az;cur.az+=da*ck;cur.turb=L(cur.turb,env.turb,ck);cur.ray=L(cur.ray,env.ray,ck);cur.mie=L(cur.mie,env.mie,ck);cur.exp=L(cur.exp,env.exp,ck);
    SU.turbidity.value=cur.turb;SU.rayleigh.value=cur.ray;SU.mieCoefficient.value=cur.mie;SU.mieDirectionalG.value=.8;sunVec(cur.elev,cur.az,sunDir);SU.sunPosition.value.copy(sunDir);
    renderer.toneMappingExposure=cur.exp;
    const nightK=THREE.MathUtils.clamp((2-cur.elev)/8,0,1);
    starMat.opacity=L(starMat.opacity,env.night?.9:0,ck);moon.material.opacity=starMat.opacity;
    // sun / moon light
    const lp=cur.elev>-1?sunDir.clone():new THREE.Vector3(-.5,.6,-.6).normalize();sun.position.copy(lp.multiplyScalar(60));
    sun.color.lerp(C(env.sc),ck);sun.intensity=L(sun.intensity,env.si,ck);
    hemi.color.lerp(C(env.hs),ck);hemi.groundColor.lerp(C(env.hg),ck);hemi.intensity=L(hemi.intensity,env.hi,ck);
    cur.fog.lerp(C(env.fog),ck);scene.fog.color.copy(cur.fog);scene.fog.near=L(scene.fog.near,env.fogN,ck);scene.fog.far=L(scene.fog.far,env.fogF,ck);
    // seasons
    M.snow.opacity=L(M.snow.opacity,env.snow?1:0,ck);grassMat.opacity=L(grassMat.opacity,env.snow?0:1,ck);grass.visible=grassMat.opacity>.03;
    const lv=env.leaves?1:0;M.leaf.opacity=L(M.leaf.opacity,lv,ck);M.leaf2.opacity=M.leaf.opacity;decid.forEach(c=>c.visible=M.leaf.opacity>.03);
    M.spruce.color.lerp(C(env.snow?'#6f8a78':'#2f5a35'),ck);M.hedge.color.lerp(C(env.snow?'#8aa196':'#3f6e33'),ck);
    M.leaf.color.lerp(C(env===ENV.dusk?'#8a9a40':'#5a9440'),ck);
    // night lights
    const night=env.night||env===ENV.dusk,glow=state.lights&&night;
    M.glass.emissiveIntensity=L(M.glass.emissiveIntensity,glow?.55:0,ck);
    inLight.intensity=L(inLight.intensity,glow?9:night?2:1,ck);porch.intensity=L(porch.intensity,night?6:0,ck);
    M.lamp.emissiveIntensity=L(M.lamp.emissiveIntensity,night?2.5:0,ck);
    M.edge.opacity=L(M.edge.opacity,night?.7:.45,ck);
    // flows
    const fl=state.floor?1:0,hpOn=state.hp?1:0,rvs=state.rv===1?1:state.rv===2?.35:0;
    M.floorPipe.emissiveIntensity=L(M.floorPipe.emissiveIntensity,fl?1.6:0,ck);M.floorPipe.color.lerp(C(fl?'#ff9a5a':'#b8b2c8'),ck);
    FLOW.floor.offset.x-=dt*.9*fl;
    M.hot.emissiveIntensity=L(M.hot.emissiveIntensity,hpOn?1.4:.15,ck);M.cold.emissiveIntensity=L(M.cold.emissiveIntensity,hpOn?1.3:.12,ck);
    FLOW.hot.offset.x-=dt*1.2*hpOn;FLOW.cold.offset.x+=dt*1.2*hpOn;
    const rvI=rvs?1.4*Math.max(.5,rvs):.05;M.supply.emissiveIntensity=L(M.supply.emissiveIntensity,rvI,ck);M.extract.emissiveIntensity=L(M.extract.emissiveIntensity,rvI,ck);
    FLOW.supply.offset.x-=dt*1.1*rvs;FLOW.extract.offset.x+=dt*1.1*rvs;
    rvFan.rotation.z+=dt*12*rvs;
    tankFill.scale.y=L(tankFill.scale.y,state.boil?1:.25,k*.7);M.tankHot.emissiveIntensity=L(M.tankHot.emissiveIntensity,state.boil?1.4:.2,ck);
    M.led.emissiveIntensity=L(M.led.emissiveIntensity,state.ac?2:0,ck);
    M.screen.emissiveIntensity=1.2+.4*Math.sin(t*3);
    hp.blades.rotation.x+=(state.hp===1?14:state.hp===2?5:0)*dt;ac.blades.rotation.x+=(state.ac?16:0)*dt;
    Object.values(S_).forEach(s=>{if(s.mat.opacity>.01||s.target>0)s.update(t)});
    renderer.render(scene,camera);
  }
  frame();
  stage.classList.add('is3d');
  if(window.__alpicScene)setScene(window.__alpicScene.i,window.__alpicScene.s);
}
try{init()}catch(e){console.error('house3d',e);document.querySelector('#ka-strada .h3d')?.remove();window.__no3d&&window.__no3d()}

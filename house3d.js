// AlpicAir — 3D māja (three.js). Scēnas pārslēdz ritināšana (notikums "alpic-scene").
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
  const inLight1=new THREE.PointLight('#ffd9a0',0,14,1.6);inLight1.position.set(-1.5,2.2,1.2);scene.add(inLight1);
  const inLight2=new THREE.PointLight('#ffd9a0',0,14,1.6);inLight2.position.set(-1,5.1,1.2);scene.add(inLight2);

  /* ---------- textures ---------- */
  function canvasTex(w,h,draw,rep=[1,1]){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1]);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const woodTex=canvasTex(512,512,(g,w,h)=>{const n=16,pw=w/n;for(let i=0;i<n;i++){const l=rnd(34,46),c=`hsl(${rnd(24,30)},${rnd(38,48)}%,${l}%)`;g.fillStyle=c;g.fillRect(i*pw,0,pw,h);g.globalAlpha=.08;for(let k=0;k<40;k++){g.fillStyle=Math.random()<.5?'#000':'#fff';g.fillRect(i*pw+rnd(0,pw),rnd(0,h),1,rnd(10,80))}g.globalAlpha=1;g.fillStyle='rgba(0,0,0,.35)';g.fillRect(i*pw,0,2,h)}},[2,1]);
  const plasterTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#f1ede6';g.fillRect(0,0,w,h);for(let i=0;i<5000;i++){g.fillStyle=`rgba(${Math.random()<.5?0:255},${Math.random()<.5?0:255},${Math.random()<.5?0:255},.025)`;g.fillRect(rnd(0,w),rnd(0,h),2,2)}},[3,3]);
  const roofTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#34343c';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=16){g.fillStyle='#4a4a54';g.fillRect(x,0,3,h);g.fillStyle='#2a2a30';g.fillRect(x+3,0,1,h)}},[6,1]);
  const deckTex=canvasTex(256,256,(g,w,h)=>{for(let y=0;y<h;y+=16){g.fillStyle=`hsl(28,35%,${rnd(36,44)}%)`;g.fillRect(0,y,w,16);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,y+15,w,1)}},[3,2]);

  /* ---------- materials ---------- */
  const M={
    plaster:new THREE.MeshStandardMaterial({map:plasterTex,roughness:.92}),
    wood:new THREE.MeshStandardMaterial({map:woodTex,roughness:.8}),
    roof:new THREE.MeshStandardMaterial({map:roofTex,roughness:.6,metalness:.3}),
    frame:new THREE.MeshStandardMaterial({color:'#2d2d33',roughness:.5,metalness:.2}),
    glass:new THREE.MeshStandardMaterial({color:'#a8cbe4',roughness:.08,metalness:.1,transparent:true,opacity:.28,emissive:'#ffcf8a',emissiveIntensity:0,depthWrite:false}),
    slab:new THREE.MeshStandardMaterial({color:'#d9d3c8',roughness:.9}),
    inner:new THREE.MeshStandardMaterial({color:'#f3efe8',roughness:.95}),
    floor:new THREE.MeshStandardMaterial({color:'#b8956a',roughness:.7}),
    white:new THREE.MeshStandardMaterial({color:'#f4f4f6',roughness:.4}),
    grey:new THREE.MeshStandardMaterial({color:'#c9cbd2',roughness:.5}),
    dark:new THREE.MeshStandardMaterial({color:'#1d1b26',roughness:.4}),
    sofa:new THREE.MeshStandardMaterial({color:'#7c6fa8',roughness:.9}),
    bed:new THREE.MeshStandardMaterial({color:'#e8e2f4',roughness:.9}),
    ground:new THREE.MeshStandardMaterial({color:'#7cb342',roughness:1}),
    deck:new THREE.MeshStandardMaterial({map:deckTex,roughness:.85}),
    stone:new THREE.MeshStandardMaterial({color:'#9a968e',roughness:1}),
    trunk:new THREE.MeshStandardMaterial({color:'#6b4a33',roughness:1}),
    leaf:new THREE.MeshStandardMaterial({color:'#4f8f3a',roughness:.9,flatShading:true}),
    leaf2:new THREE.MeshStandardMaterial({color:'#3f7a34',roughness:.9,flatShading:true}),
    heatFloor:new THREE.MeshStandardMaterial({color:'#b8956a',roughness:.7,emissive:'#ff7a2f',emissiveIntensity:0}),
    screen:new THREE.MeshStandardMaterial({color:'#0b0b14',emissive:'#ff8a3d',emissiveIntensity:1.2}),
    led:new THREE.MeshStandardMaterial({color:'#222',emissive:'#3ee0a8',emissiveIntensity:0}),
    boiler:new THREE.MeshStandardMaterial({color:'#222',emissive:'#ff8a3d',emissiveIntensity:0}),
    brand:new THREE.MeshStandardMaterial({color:'#7c5cff',roughness:.4}),
  };
  const box=(w,h,d,m,x=0,y=0,z=0,cast=true)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;return o};

  /* ---------- house ---------- */
  const W=10,D=8,FH=3,T=.3;
  const house=new THREE.Group();scene.add(house);
  function wall(len,h,holes,mat){
    const s=new THREE.Shape();s.moveTo(0,0);s.lineTo(len,0);s.lineTo(len,h);s.lineTo(0,h);s.lineTo(0,0);
    holes.forEach(([x,y,w,hh])=>{const p=new THREE.Path();p.moveTo(x,y);p.lineTo(x,y+hh);p.lineTo(x+w,y+hh);p.lineTo(x+w,y);p.lineTo(x,y);s.holes.push(p)});
    const geo=new THREE.ExtrudeGeometry(s,{depth:T,bevelEnabled:false});
    const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/3,uv.getY(i)/3);
    const g=new THREE.Group();const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;g.add(m);
    holes.forEach(([x,y,w,hh,door])=>{
      const gl=new THREE.Mesh(new THREE.PlaneGeometry(w,hh),door?M.frame:M.glass);gl.position.set(x+w/2,y+hh/2,T*.55);g.add(gl);
      const f=.07;[[x+w/2,y+hh-f/2,w,f],[x+w/2,y+f/2,w,f],[x+f/2,y+hh/2,f,hh],[x+w-f/2,y+hh/2,f,hh]].forEach(([cx,cy,fw,fh])=>g.add(box(fw,fh,.12,M.frame,cx,cy,T*.6,false)));
      if(!door&&w>1.6){g.add(box(.05,hh,.1,M.frame,x+w/2,y+hh/2,T*.6,false))}
      if(!door)g.add(box(w+.16,.06,.34,M.frame,x+w/2,y-.03,T+.06,false));
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
  // ground floor (plaster), first floor (wood)
  place(wall(W,FH,[[1,.35,5,2.3],[7.4,0,1.1,2.35,1]],M.plaster),'front',0);
  place(wall(W,FH,[[2,.9,2,1.4],[6,.9,1.6,1.4]],M.plaster),'back',0);
  place(wall(D,FH,[[2.6,.9,1.5,1.4]],M.plaster),'east',0);
  place(wall(D,FH,[[3,.9,2,1.4]],M.plaster),'west',0);
  place(wall(W,FH,[[1.4,.7,2.6,1.7],[6,.7,2.4,1.7]],M.wood),'front',FH);
  place(wall(W,FH,[[3,.8,2.2,1.4]],M.wood),'back',FH);
  place(wall(D,FH,[[3,.8,2,1.4]],M.wood),'east',FH);
  place(wall(D,FH,[[2.6,.8,2,1.4]],M.wood),'west',FH);
  // slabs
  house.add(box(W,.25,D,M.slab,0,-.12,0));
  house.add(box(W-T*2,.25,D-T*2,M.slab,0,FH,0));
  house.add(box(W-T*2,.2,D-T*2,M.inner,0,2*FH-.1,0,false));
  house.add(box(W+.3,.2,.35,M.frame,0,FH,D/2+.05,false));
  // gable roof (ridge along X)
  const RH=2.7,OV=.6;
  const ang=Math.atan2(RH,D/2),half=D/2+OV,slope=half/Math.cos(ang);
  [1,-1].forEach(sg=>{const r=box(W+OV*2,.22,slope,M.roof,0,0,0);r.rotation.x=sg*ang;const zc=half/2;r.position.set(0,2*FH+RH-zc*Math.tan(ang)+.11/Math.cos(ang),sg*zc);house.add(r)});
  house.add(box(W+OV*2+.05,.18,.3,M.frame,0,2*FH+RH+.02,0));
  [W/2-T/2,-W/2+T/2].forEach(x=>{const s=new THREE.Shape();s.moveTo(-D/2,0);s.lineTo(D/2,0);s.lineTo(0,RH);s.lineTo(-D/2,0);const g=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:T,bevelEnabled:false}),M.wood);g.rotation.y=Math.PI/2;g.position.set(x-T/2,2*FH,0);g.castShadow=true;g.receiveShadow=true;house.add(g)});
  // recuperator roof caps
  const capIn=new THREE.Group(),capOut=new THREE.Group();
  [[capIn,-1.6],[capOut,-.4]].forEach(([g,x])=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,1.1,20),M.grey);c.castShadow=true;g.add(c);const h=new THREE.Mesh(new THREE.CylinderGeometry(.38,.3,.12,20),M.dark);h.position.y=.62;g.add(h);g.position.set(x,2*FH+RH-.9*Math.tan(Math.atan2(RH,D/2))+.4,-.9);house.add(g)});
  // interior: partitions + furniture
  house.add(box(W-T*2,FH-.05,.15,M.inner,0,FH/2,-1.2,false));
  house.add(box(W-T*2,FH-.05,.15,M.inner,0,FH+FH/2,-1.2,false));
  house.add(box(.15,FH,D/2+1.2-T,M.inner,2.0,FH/2,(D/2-T-1.2)/2,false));
  house.add(box(.15,FH,D/2+1.2-T,M.inner,.9,FH+FH/2,(D/2-T-1.2)/2,false));
  const heatFloor=box(6.6,.04,D/2+1.2-T-.1,M.heatFloor,-1.35,.03,1.2,false);house.add(heatFloor);
  house.add(box(3,.45,.9,M.sofa,-2,.33,-.6));house.add(box(3,.7,.25,M.sofa,-2,.6,-1.0));
  house.add(box(1.6,.04,1.1,M.bed,-2.2,.02,.9,false));
  // wall panel in living room (on partition)
  const panel=new THREE.Group();panel.add(box(.42,.42,.05,M.white,0,0,0,false));const scr=box(.34,.34,.02,M.screen,0,0,.03,false);panel.add(scr);panel.position.set(.4,1.45,-1.1);house.add(panel);
  // tech room: All in One tower
  const aio=new THREE.Group();aio.add(box(.6,1.8,.65,M.white,0,.9,0));aio.add(box(.4,.22,.02,M.dark,0,1.55,.34,false));const blr=box(.06,1.0,.02,M.boiler,.2,.75,.34,false);aio.add(blr);aio.position.set(4.3,0,-.2);house.add(aio);
  // upstairs bedroom: bed + wall AC
  house.add(box(2,.5,2.2,M.bed,-2.6,FH+.25,-.1));house.add(box(2,.9,.15,M.dark,-2.6,FH+.55,-1.05));
  const iac=new THREE.Group();iac.add(box(1.4,.36,.28,M.white,0,0,0,false));const led=box(.05,.05,.02,M.led,.55,.06,.15,false);iac.add(led);iac.add(box(1.2,.04,.05,M.grey,0,-.15,.13,false));iac.position.set(-2.6,FH+2.35,-1.0);house.add(iac);
  const iac2=iac.clone();iac2.position.set(3.2,FH+2.35,-1.0);house.add(iac2);
  // deck & steps
  const deck=box(8,.18,2.6,M.deck,-0.6,.09,D/2+1.3);house.add(deck);
  house.add(box(1.4,.12,.5,M.stone,2.85,.06,D/2+2.9));house.add(box(1.4,.12,.5,M.stone,3.1,.06,D/2+3.7));

  /* ---------- outdoor units ---------- */
  function outdoor(w,h,d,fans){const g=new THREE.Group();g.add(box(w,h,d,M.white,0,h/2,0));const blades=[];
    fans.forEach(([fy])=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(h*.34,.025,8,32),M.grey);ring.position.set(d/2+.01,fy,0);ring.rotation.y=Math.PI/2;g.add(ring);
      const grill=new THREE.Mesh(new THREE.CircleGeometry(h*.34,32),new THREE.MeshStandardMaterial({color:'#2a2a33',roughness:.6}));grill.position.set(d/2+.005,fy,0);grill.rotation.y=Math.PI/2;g.add(grill);
      const bl=new THREE.Group();for(let k=0;k<3;k++){const b=box(.02,h*.3,.09,M.grey,0,h*.15,0,false);const piv=new THREE.Group();piv.add(b);piv.rotation.x=k*Math.PI*2/3;bl.add(piv)}bl.position.set(d/2+.03,fy,0);g.add(bl);blades.push(bl)});
    g.add(box(.02,.12,.22,M.brand,d/2+.01,h*.86,-w/2+.25,false));return {g,blades}}
  const hp=outdoor(1.25,1.0,.5,[[.5]]);hp.g.position.set(W/2+1.1,0,1.6);hp.g.add(box(1.5,.12,.8,M.stone,0,-.04,0,false));house.add(hp.g);
  const ac=outdoor(.85,.6,.32,[[.3]]);ac.g.rotation.y=Math.PI;ac.g.position.set(-W/2-.35,FH+.2,1.6);ac.g.add(box(.6,.04,.5,M.frame,0,0,0,false));house.add(ac.g);
  // pipes
  house.add(box(.06,.06,1.2,M.grey,W/2+.3,.3,1.6));

  /* ---------- landscape ---------- */
  const ground=new THREE.Mesh(new THREE.CircleGeometry(70,64),M.ground);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const path=new THREE.Mesh(new THREE.PlaneGeometry(1.4,12),M.stone);path.rotation.x=-Math.PI/2;path.position.set(2.9,.01,D/2+8);path.receiveShadow=true;scene.add(path);
  const leafMats=[M.leaf,M.leaf2];
  function tree(x,z,s=1,type=0){const g=new THREE.Group();g.add(box(.25*s,1.6*s,.25*s,M.trunk,0,.8*s,0));
    if(type===0){[[0,2.2,1.4],[0,3.2,1.1],[0,4.0,.75]].forEach(([y0,y,r])=>{const c=new THREE.Mesh(new THREE.ConeGeometry(r*s,1.4*s,8),leafMats[1]);c.position.y=y*s;c.castShadow=true;g.add(c)})}
    else{[[0,2.4,1.1],[.6,2.1,.8],[-.5,2.2,.85],[0,3.0,.8]].forEach(([dx,y,r])=>{const c=new THREE.Mesh(new THREE.IcosahedronGeometry(r*s,0),leafMats[0]);c.position.set(dx*s,y*s,0);c.castShadow=true;g.add(c)})}
    g.position.set(x,0,z);scene.add(g)}
  tree(-9,-3,1.2,0);tree(-10.5,2,1,1);tree(13,-10,1.3,0);tree(17,7,.9,1);tree(-6,-8,1.1,1);tree(4,-9,1.2,0);tree(-14,-6,1.4,0);tree(15,-2,1.1,0);
  for(let i=0;i<9;i++){const b=new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(.35,.6),0),leafMats[i%2]);b.position.set(rnd(-5.5,1.8),.3,D/2+2.9+rnd(-.2,.3));if(Math.abs(b.position.x-2.9)<.9)b.position.x-=1.8;b.castShadow=true;scene.add(b)}

  /* ---------- particles ---------- */
  function stream(n,color,size,origin,fn){const geo=new THREE.BufferGeometry();const pos=new Float32Array(n*3);const seed=new Float32Array(n);for(let i=0;i<n;i++)seed[i]=Math.random();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const mat=new THREE.PointsMaterial({color,size,transparent:true,opacity:0,depthWrite:false,sizeAttenuation:true});const p=new THREE.Points(geo,mat);p.position.copy(origin);scene.add(p);
    return {p,mat,seed,pos,fn,n,target:0,update(t){for(let i=0;i<n;i++){const v=fn(seed[i],t,i);pos[i*3]=v[0];pos[i*3+1]=v[1];pos[i*3+2]=v[2]}geo.attributes.position.needsUpdate=true;mat.opacity+=(this.target-mat.opacity)*.06}}}
  const S_={};
  // snow
  S_.snow=stream(1600,'#ffffff',.09,new THREE.Vector3(0,0,0),(s,t,i)=>{const x=((s*9301+i*.37)%1)*50-25,z=((s*4933+i*.71)%1)*50-25;const y=18-((t*1.1+s*18)%18);return [x+Math.sin(t+i)*.3,y,z]});
  // heat pump: cold air blown sideways
  S_.hp=stream(140,'#9ad8ff',.08,new THREE.Vector3(W/2+1.4,.5,1.6),(s,t)=>{const k=(t*.9+s)%1;const a=s*6.283;return [k*2.2,Math.sin(a)*.3*k,Math.cos(a)*.3*k]});
  // AC outdoor (summer): warm air
  S_.acOut=stream(110,'#ffb070',.08,new THREE.Vector3(-W/2-.55,FH+.5,1.6),(s,t)=>{const k=(t*.9+s)%1;const a=s*6.283;return [-k*1.8,Math.sin(a)*.25*k+k*.3,Math.cos(a)*.25*k]});
  // indoor AC cool air
  const acIn=(x)=>stream(90,'#7fd3ff',.06,new THREE.Vector3(x,FH+2.15,-.85),(s,t)=>{const k=(t*.6+s)%1;return [(s-.5)*1.2,-k*1.6,k*1.4]});
  S_.ac1=acIn(-2.6);S_.ac2=acIn(3.2);
  // recuperator: fresh in (green) and exhaust out (orange)
  S_.rvIn=stream(80,'#3ee0a8',.09,new THREE.Vector3(-1.6,2*FH+RH+.3,-.9),(s,t)=>{const k=1-((t*.5+s)%1);const a=s*6.283;return [Math.cos(a)*.5*k,k*1.6,Math.sin(a)*.5*k]});
  S_.rvOut=stream(80,'#ffa36b',.09,new THREE.Vector3(-.4,2*FH+RH+.3,-.9),(s,t)=>{const k=(t*.5+s)%1;const a=s*6.283;return [Math.cos(a)*.4*k,k*1.8,Math.sin(a)*.4*k]});
  // fresh air inside rooms
  S_.rvRoom=stream(160,'#3ee0a8',.05,new THREE.Vector3(0,0,0),(s,t,i)=>{const fl=i%2,k=(t*.35+s)%1;return [((s*7.13)%1)*8-4,(fl?FH:0)+2.7-k*2.4,((s*3.7)%1)*3.5-.6]});
  // heat from floor
  S_.heat=stream(120,'#ffb36b',.05,new THREE.Vector3(-1.2,0,1.2),(s,t)=>{const k=(t*.3+s)%1;return [((s*5.3)%1)*6.5-3.25,.1+k*2.4,((s*9.1)%1)*3.6-1.8]});

  /* ---------- environments ---------- */
  const ENV={
    night:{bg:'#0e1230',fog:'#0e1230',hs:'#2c3a6a',hg:'#0b0b18',hi:.45,sc:'#9fb4ff',si:.55,sp:[-12,16,8],gr:'#2e3a2e',lf:['#2c4a2a','#244022'],exp:1.0},
    winter:{bg:'#c9d8ea',fog:'#c9d8ea',hs:'#eaf2ff',hg:'#8d97a8',hi:.95,sc:'#fff4e2',si:1.7,sp:[14,9,10],gr:'#f2f5fa',lf:['#c9d6cf','#b6c7bd'],exp:1.0},
    summer:{bg:'#8ccbff',fog:'#a8d8ff',hs:'#d8efff',hg:'#5f8a45',hi:.9,sc:'#fff0d0',si:2.6,sp:[10,22,12],gr:'#79b04a',lf:['#4f8f3a','#3f7a34'],exp:1.0},
    dusk:{bg:'#d8957f',fog:'#c98a86',hs:'#ffd0b4',hg:'#4a3a5a',hi:.6,sc:'#ffa860',si:1.4,sp:[-16,6,4],gr:'#7d8a5c',lf:['#55703c','#47603a'],exp:1.0},
  };
  const cur={bg:new THREE.Color('#0e1230'),fog:new THREE.Color('#0e1230'),hs:new THREE.Color(),hg:new THREE.Color(),sc:new THREE.Color(),gr:new THREE.Color('#2e3a2e'),lf0:new THREE.Color(),lf1:new THREE.Color(),hi:.45,si:.55,sp:new THREE.Vector3(-12,16,8)};
  let env=ENV.night;
  // camera views per scene: [radius, azimuth°, elevation°, target]
  const VIEWS=[[30,32,17,[0,3.6,0]],[16,72,9,[5,1.6,1]],[11,98,6,[4.6,1.5,-.6]],[24,22,42,[0,6.2,-.5]],[19,-38,14,[-2.5,4,.5]],[26,-14,9,[0,3.4,0]],[34,-62,22,[0,3,0]]];
  const cam={r:30,az:32,el:17,t:new THREE.Vector3(0,3.6,0)},tgt={r:30,az:32,el:17,t:new THREE.Vector3(0,3.6,0)};
  let state={hp:0,ac:0,rv:0,boil:0,floor:0,lights:1,snow:0,mode:'#b6a3ff'},sub=0,mouse=0,sceneIdx=0;
  function setScene(i,s){
    sceneIdx=i;const v=VIEWS[i]||VIEWS[0];tgt.r=v[0];tgt.el=v[2];tgt.t.set(...v[3]);
    let a=v[1];while(a-cam.az>180)a-=360;while(a-cam.az<-180)a+=360;tgt.az=a;
    env=ENV[s.sky]||ENV.night;
    state={hp:s.d.hp||0,ac:s.d.ac||0,rv:s.d.rv||0,boil:s.d.boil||0,floor:s.d.floor||0,lights:s.lights,snow:s.snow,mode:getComputedStyle(document.documentElement).getPropertyValue('--mode').trim()||'#b6a3ff'};
    S_.snow.target=s.snow?.9:0;
    S_.hp.target=state.hp===1?.8:state.hp===2?.35:0;
    S_.heat.target=state.floor?.7:0;
    S_.ac1.target=S_.ac2.target=state.ac?.85:0;S_.acOut.target=state.ac?.8:0;
    S_.rvIn.target=S_.rvOut.target=state.rv===1?.95:state.rv===2?.4:0;S_.rvRoom.target=state.rv===1?.7:state.rv===2?.25:0;
    M.screen.emissive.set(state.mode);
  }
  addEventListener('alpic-scene',e=>setScene(e.detail.i,e.detail.s));
  addEventListener('alpic-sub',e=>{sub=e.detail});
  stage.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect();mouse=((e.clientX-r.left)/r.width-.5)*2});
  stage.addEventListener('pointerleave',()=>{mouse=0});

  /* ---------- loop ---------- */
  const clock=new THREE.Clock();let visible=true,fanA=0;
  new IntersectionObserver(es=>{visible=es[0].isIntersecting},{threshold:0}).observe(stage);
  function resize(){const r=stage.getBoundingClientRect();const w=Math.max(1,r.width),h=Math.max(1,r.height);renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<1.4?40:32;if(w>700)camera.setViewOffset(w,h,w*.09,0,w,h);else camera.clearViewOffset();camera.updateProjectionMatrix()}
  new ResizeObserver(resize).observe(stage);resize();
  const L=(a,b,k)=>a+(b-a)*k;
  function frame(){
    requestAnimationFrame(frame);if(!visible)return;
    const dt=Math.min(.05,clock.getDelta()),t=clock.elapsedTime,k=1-Math.pow(.02,dt);
    // camera
    cam.r=L(cam.r,tgt.r,k*.9);cam.el=L(cam.el,tgt.el,k*.9);cam.az=L(cam.az,tgt.az+sub*14+mouse*6,k*.9);cam.t.lerp(tgt.t,k*.9);
    const az=cam.az*Math.PI/180,el=cam.el*Math.PI/180;
    camera.position.set(cam.t.x+cam.r*Math.cos(el)*Math.sin(az),cam.t.y+cam.r*Math.sin(el),cam.t.z+cam.r*Math.cos(el)*Math.cos(az));camera.lookAt(cam.t);
    // environment
    const ck=k*.7;
    cur.bg.lerp(new THREE.Color(env.bg),ck);scene.background.copy(cur.bg);scene.fog.color.lerp(new THREE.Color(env.fog),ck);
    hemi.color.lerp(new THREE.Color(env.hs),ck);hemi.groundColor.lerp(new THREE.Color(env.hg),ck);hemi.intensity=L(hemi.intensity,env.hi,ck);
    sun.color.lerp(new THREE.Color(env.sc),ck);sun.intensity=L(sun.intensity,env.si,ck);cur.sp.lerp(new THREE.Vector3(...env.sp),ck);sun.position.copy(cur.sp);
    M.ground.color.lerp(new THREE.Color(env.gr),ck);M.leaf.color.lerp(new THREE.Color(env.lf[0]),ck);M.leaf2.color.lerp(new THREE.Color(env.lf[1]),ck);
    const night=env===ENV.night||env===ENV.dusk;
    const glow=state.lights&&night?1:0;
    M.glass.emissiveIntensity=L(M.glass.emissiveIntensity,glow?.9:0,ck);M.glass.opacity=L(M.glass.opacity,glow?.55:.28,ck);
    inLight1.intensity=L(inLight1.intensity,(state.lights&&night)?6:night?1.2:2.5,ck);inLight2.intensity=L(inLight2.intensity,(state.lights&&night)?5:night?.8:2,ck);
    M.heatFloor.emissiveIntensity=L(M.heatFloor.emissiveIntensity,state.floor?.55+.15*Math.sin(t*2):0,ck);
    M.boiler.emissiveIntensity=L(M.boiler.emissiveIntensity,state.boil?1.6:0,ck);
    M.led.emissiveIntensity=L(M.led.emissiveIntensity,state.ac?2:0,ck);
    M.screen.emissiveIntensity=1+.4*Math.sin(t*3);
    // fans
    const hs=state.hp===1?14:state.hp===2?5:0;hp.blades.forEach(b=>b.rotation.x+=hs*dt);
    ac.blades.forEach(b=>b.rotation.x+=(state.ac?16:0)*dt);
    Object.values(S_).forEach(s=>{if(s.mat.opacity>.01||s.target>0)s.update(t)});
    renderer.render(scene,camera);
  }
  frame();
  stage.classList.add('is3d');
  if(window.__alpicScene)setScene(window.__alpicScene.i,window.__alpicScene.s);
}
try{init()}catch(e){console.error('house3d',e)}

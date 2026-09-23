import * as THREE from './vendor/three.module.js';

// An illustrative city model. District indicators come exclusively from the API.
const layouts = [
  {id:'saryarka', points:[[58,52],[200,29],[220,120],[161,171],[37,144]], center:[126,94]},
  {id:'baikonur', points:[[211,30],[358,47],[386,137],[268,166],[229,121]], center:[297,95]},
  {id:'almaty', points:[[396,144],[477,177],[479,289],[356,303],[305,221],[276,179]], center:[399,213]},
  {id:'esil', points:[[165,190],[229,149],[270,181],[299,231],[339,304],[212,330],[145,272]], center:[235,245]},
  {id:'nura', points:[[35,162],[147,186],[127,268],[194,335],[62,318],[20,237]], center:[89,237]},
];
const palette = {transport:0x84b7ff, green:0xb9ec91, social:0xffbf86, safety:0xc9acf7, service:0x7dddd3};
const world = ([x,z]) => new THREE.Vector3((x-255)/20, 0, (z-180)/20);
const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
function inside(x,z,points) {
  let yes=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++) {
    const [xi,zi]=points[i], [xj,zj]=points[j];
    if(((zi>z)!==(zj>z)) && x<(xj-xi)*(z-zi)/(zj-zi)+xi) yes=!yes;
  }
  return yes;
}

export function createCity3D(host, {onSelect, onFailure}) {
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:false, powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x142329);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const canvas = renderer.domElement;
  canvas.className='city3d-canvas';
  canvas.tabIndex=0;
  canvas.setAttribute('aria-label','3D-модель районов. Стрелки — вращение, плюс и минус — масштаб, Home — исходный вид. Выберите район по подписи.');
  host.append(canvas);
  const labels = document.createElement('div');
  labels.className='city3d-labels';
  host.append(labels);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-18,18,18,-18,.1,120);
  const lookAt = new THREE.Vector3(0,0,0);
  let yaw=.2, pitch=.78, zoom=1.1, width=1, height=1, frame=0, dead=false, visible=true;
  let activeTheme='night', numberLocale='ru-RU', translate=key=>key, lastPresentation=null;
  const sceneThemes={
    night:{background:0x142329,base:0x263b3f,floor:0x536353,critical:0x86684a,border:0x829f91,selected:0xe1efb8,concrete:0xc4ccbc},
    studio:{background:0xe5edf0,base:0x9baba7,floor:0x9caa86,critical:0xc5ad87,border:0x9271ad,selected:0x634180,concrete:0xd8d3c5},
  };
  const districtMeshes=[], districtGroups=new Map();
  const resources = new Set();
  const keep = r => {resources.add(r); return r;};
  const mat = color => keep(new THREE.MeshStandardMaterial({color,roughness:.78,metalness:.08}));
  const concrete=mat(0xc4ccbc), roofs=mat(0x708a8b), wood=mat(0x637c59), leaves=mat(0x7f9b61);
  const glass=mat(0x477786), stone=mat(0x34494c), gold=mat(0xd2bc79);
  const box=keep(new THREE.BoxGeometry(1,1,1));
  const sphere=keep(new THREE.IcosahedronGeometry(1,1));
  const cylinder=keep(new THREE.CylinderGeometry(1,1,1,12));
  const mesh=(geo,material,position,scale,parent=scene)=>{
    const m=new THREE.Mesh(geo,material);m.position.set(...position);m.scale.set(...scale);m.receiveShadow=true;parent.add(m);return m;
  };
  scene.add(new THREE.HemisphereLight(0xe2f3ed,0x536746,2.6));
  const sun=new THREE.DirectionalLight(0xffe1b3,3.1);sun.position.set(-12,24,10);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-19,right:19,top:16,bottom:-16,near:1,far:65});
  sun.shadow.bias=-.0005;sun.shadow.normalBias=.035;
  scene.add(sun);
  const fill=new THREE.DirectionalLight(0x90bdff,1);fill.position.set(15,8,-15);scene.add(fill);
  const baseMaterial=mat(0x263b3f);
  mesh(box,baseMaterial,[0,-.5,0],[27,.55,19]);
  const grid=new THREE.GridHelper(34,34,0x355052,0x263d40);grid.material.transparent=true;grid.material.opacity=.14;grid.position.y=-.8;scene.add(grid);keep(grid.geometry);keep(grid.material);
  // Static details are instanced by geometry/material/district, not one draw call per window.
  const batches=new Map();
  const transform=new THREE.Object3D();
  function detail(geo,material,position,scale,parent=scene,rotation=0) {
    const key=`${parent.uuid}/${geo.uuid}/${material.uuid}`;
    if(!batches.has(key))batches.set(key,{geo,material,parent,matrices:[]});
    transform.position.set(...position);transform.scale.set(...scale);transform.rotation.set(0,rotation,0);transform.updateMatrix();
    batches.get(key).matrices.push(transform.matrix.clone());
  }
  const asphalt=mat(0x485255), pavement=mat(0xb1afa3), marking=mat(0xe2d9b8);
  const brick=mat(0xb28b6d), plaster=mat(0xd2c3a2), park=mat(0x698452);
  const windowMat=keep(new THREE.MeshStandardMaterial({color:0x537c8c,roughness:.28,metalness:.35,emissive:0xffce81,emissiveIntensity:.08}));
  const foliage=[leaves,mat(0x527553),mat(0x8c9954)];
  const carMats=[mat(0xe5dfd0),mat(0x45647c),mat(0xa65d4e)];
  const riverCurve=new THREE.CatmullRomCurve3([[-14,0,-1.5],[-9,0,-.6],[-5,0,-.15],[0,0,-1.2],[6,0,-2.05],[13,0,-1.7]].map(p=>new THREE.Vector3(...p)));
  const riverPoints=riverCurve.getPoints(120);
  const nearRiver=(x,z,margin=.8)=>riverPoints.some(p=>Math.hypot(p.x-x,p.z-z)<margin);
  function ribbon(halfWidth,y,material) {
    const vertices=[],indices=[];
    riverPoints.forEach((p,i)=>{
      const tangent=riverCurve.getTangent(i/(riverPoints.length-1));
      const normal=new THREE.Vector3(-tangent.z,0,tangent.x).normalize().multiplyScalar(halfWidth);
      vertices.push(p.x+normal.x,y,p.z+normal.z,p.x-normal.x,y,p.z-normal.z);
      if(i<riverPoints.length-1){const n=i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}
    });
    const geometry=keep(new THREE.BufferGeometry());geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    mesh(geometry,material,[0,0,0],[1,1,1]);
  }
  ribbon(.67,.405,pavement);
  const water=keep(new THREE.MeshStandardMaterial({color:0x398c9e,roughness:.24,metalness:.3}));
  ribbon(.45,.42,water);
  for(let i=5;i<riverPoints.length-5;i+=3){const p=riverPoints[i];detail(box,water,[p.x,.426,p.z],[.24,.008,.018]);}
  for(const x of [-6.2,2.2,7.1]) {
    const p=riverPoints.reduce((best,p)=>Math.abs(p.x-x)<Math.abs(best.x-x)?p:best);
    detail(box,concrete,[x,.57,p.z],[.7,.18,1.85]);
    detail(box,asphalt,[x,.67,p.z],[.52,.025,1.85]);
    for(const dx of [-.32,.32]){
      detail(box,stone,[x+dx,.86,p.z],[.035,.04,1.85]);
      for(let z=-.8;z<=.8;z+=.2)detail(cylinder,stone,[x+dx,.76,p.z+z],[.018,.2,.018]);
    }
    for(const dz of [-.55,.55])detail(box,stone,[x,.22,p.z+dz],[.48,.6,.15]);
  }
  function tree(x,z,seed,parent) {
    const h=.4+seed*.25;
    detail(cylinder,wood,[x,.43+h/2,z],[.045,h,.045],parent);
    detail(sphere,foliage[Math.floor(seed*3)%3],[x,.43+h+.18,z],[.23+seed*.1,.35+seed*.17,.25],parent);
  }

  for(const layout of layouts) {
    const center=world(layout.center);
    const group=new THREE.Group();scene.add(group);
    group.userData.district=layout.id;
    const shape=new THREE.Shape();
    layout.points.forEach((point,i)=>{const p=world(point); i===0 ? shape.moveTo(p.x,-p.z) : shape.lineTo(p.x,-p.z);});
    shape.closePath();
    const geometry=keep(new THREE.ExtrudeGeometry(shape,{depth:.38,bevelEnabled:true,bevelSize:.07,bevelThickness:.05,bevelSegments:1,steps:1}));
    geometry.rotateX(-Math.PI/2);
    const floorMat=mat(0x3d6557);
    const floor=new THREE.Mesh(geometry,floorMat);floor.receiveShadow=true;group.add(floor);floor.userData.district=layout.id;districtMeshes.push(floor);
    const border=new THREE.LineSegments(keep(new THREE.EdgesGeometry(geometry,40)),keep(new THREE.LineBasicMaterial({color:0x789686,transparent:true,opacity:.45})));
    group.add(border);
    let buildingCount=0;
    const fits=(x,z,r=7)=>[[x-r,z-r],[x+r,z-r],[x+r,z+r],[x-r,z+r]].every(([a,b])=>inside(a,b,layout.points));
    // Street grid leaves real space between blocks; reserve the centre for scenario markers.
    const reserved=(x,z)=>Math.hypot(x-layout.center[0],z-layout.center[1])<38;
    for(let px=30;px<485;px+=5)for(let pz=35;pz<330;pz+=5){
      if(!fits(px,pz,3)||reserved(px,pz))continue;
      const p=world([px,pz]);if(nearRiver(p.x,p.z))continue;
      const vertical=(px-30)%60===0, horizontal=(pz-35)%60===0;
      if(!vertical&&!horizontal)continue;
      detail(box,pavement,[p.x,.405,p.z],[vertical?.48:.25,.045,horizontal?.48:.25],group);
      detail(box,asphalt,[p.x,.434,p.z],[vertical?.32:.25,.02,horizontal?.32:.25],group);
      if(!(vertical&&horizontal))detail(box,marking,[p.x,.447,p.z],[vertical?.015:.12,.006,horizontal?.015:.12],group);
      if(vertical&&(pz-35)%30===10){
        const seed=((px*17+pz*13)%97)/97;
        detail(box,carMats[Math.floor(seed*3)],[p.x+.085,.51,p.z],[.095,.1,.2],group);
        detail(box,glass,[p.x+.085,.575,p.z],[.08,.04,.1],group);
        detail(cylinder,stone,[p.x-.27,.7,p.z],[.014,.56,.014],group);
        detail(box,gold,[p.x-.23,.99,p.z],[.11,.035,.06],group);
      }
    }
    for(let px=50;px<480;px+=20)for(let pz=55;pz<325;pz+=20){
      if((px-30)%60===0||(pz-35)%60===0||!fits(px,pz)||reserved(px,pz))continue;
      const p=world([px,pz]);if(nearRiver(p.x,p.z,1))continue;
      const seed=(Math.sin(px*13.17+pz*7.31)+1)/2;
      if(seed<.22){
        detail(box,park,[p.x,.43,p.z],[.75,.05,.75],group);
        for(const [dx,dz] of [[-.2,-.2],[.21,.18],[-.2,.22]])tree(p.x+dx,p.z+dz,seed*3,group);
        detail(box,pavement,[p.x,.465,p.z],[.12,.02,.75],group);
        detail(box,wood,[p.x+.22,.54,p.z-.22],[.23,.07,.08],group);
        continue;
      }
      const tower=(layout.id==='esil'||layout.id==='nura')&&seed>.64;
      const floors=tower?7+Math.floor(seed*7):3+Math.floor(seed*5);
      const h=floors*.22, w=tower?.5:.67, depth=tower?.52:.62;
      const material=tower?glass:seed>.55?plaster:brick;
      detail(box,pavement,[p.x,.44,p.z],[w+.14,.09,depth+.14],group);
      detail(box,material,[p.x,.49+h/2,p.z],[w,h,depth],group);
      detail(box,roofs,[p.x,.5+h,p.z],[w+.06,.07,depth+.06],group);
      detail(box,stone,[p.x+.1,.58+h,p.z],[w*.32,.12,depth*.35],group);
      for(let floor=0;floor<floors;floor++){
        const y=.64+floor*.22;
        for(const side of [-1,1]){
          for(const offset of [-.19,0,.19]){
            detail(box,windowMat,[p.x+offset*(w/.67),y,p.z+side*(depth/2+.006)],[.105,.115,.012],group);
            detail(box,windowMat,[p.x+side*(w/2+.006),y,p.z+offset*(depth/.67)],[.012,.115,.105],group);
          }
          if(!tower&&floor>0&&floor%2===0)detail(box,concrete,[p.x,y-.075,p.z+side*(depth/2+.04)],[w*.8,.025,.09],group);
        }
        if(tower)detail(box,concrete,[p.x,y-.095,p.z],[w+.012,.018,depth+.012],group);
      }
      detail(box,glass,[p.x,.59,p.z+depth/2+.01],[.15,.22,.02],group);
      if(seed>.87){
        detail(cylinder,stone,[p.x,.82+h,p.z],[.012,.6,.012],group);
      }
      buildingCount++;
    }
    // A low ring marks the data label anchor; its height is not a score encoding.
    const ring=mesh(keep(new THREE.TorusGeometry(.65,.045,5,40)),mat(0xadc3a3),[center.x,.49,center.z],[1,1,1],group);
    ring.rotation.x=-Math.PI/2;
    const additions=new THREE.Group();additions.position.set(center.x,.46,center.z);group.add(additions);
    const label=document.createElement('button');label.type='button';label.className='city3d-label';label.dataset.district=layout.id;
    label.onclick=()=>onSelect(layout.id);labels.append(label);
    districtGroups.set(layout.id,{floorMat,border,center,label,additions,ring,buildingCount});
  }
  // Baiterek-inspired lattice tower; an illustration, not a surveyed replica.
  const landmark=new THREE.Group();landmark.position.set(1.3,.45,5.3);scene.add(landmark);
  mesh(cylinder,pavement,[0,.03,0],[.8,.06,.8],landmark);
  mesh(cylinder,stone,[0,.1,0],[.5,.14,.5],landmark);
  for(let i=0;i<12;i++){
    const angle=i*Math.PI/6;
    const curve=new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(angle)*.27,.17,Math.sin(angle)*.27),
      new THREE.Vector3(Math.cos(angle+.16)*.13,1.25,Math.sin(angle+.16)*.13),
      new THREE.Vector3(Math.cos(angle+.3)*.4,2.3,Math.sin(angle+.3)*.4),
    ]);
    mesh(keep(new THREE.TubeGeometry(curve,12,.023,5,false)),concrete,[0,0,0],[1,1,1],landmark);
  }
  mesh(keep(new THREE.SphereGeometry(.4,24,16)),gold,[0,2.42,0],[1,1,1],landmark);
  for(const y of [.35,1.1,1.85]){
    const ring=mesh(keep(new THREE.TorusGeometry(y>1.5?.25:.17,.018,5,24)),concrete,[0,y,0],[1,1,1],landmark);ring.rotation.x=Math.PI/2;
  }
  for(const {geo,material,parent,matrices} of batches.values()){
    const instances=keep(new THREE.InstancedMesh(geo,material,matrices.length));
    matrices.forEach((matrix,i)=>instances.setMatrixAt(i,matrix));
    instances.instanceMatrix.needsUpdate=true;instances.computeBoundingSphere();
    instances.castShadow=[glass,brick,plaster,...foliage].includes(material);
    instances.receiveShadow=true;parent.add(instances);
    if(parent.userData.district){instances.userData.district=parent.userData.district;districtMeshes.push(instances);}
  }
  batches.clear();
  renderer.shadowMap.needsUpdate=true;
  const actionMats=Object.fromEntries(Object.entries(palette).map(([k,v])=>[k,mat(v)]));

  function addIntervention(group,category,index,total) {
    const angle=2*Math.PI*index/Math.max(total,3)-Math.PI/2;
    const marker=new THREE.Group();marker.position.set(Math.cos(angle)*1.22,0,Math.sin(angle)*1.22);group.add(marker);
    const material=actionMats[category];
    mesh(cylinder,material,[0,.055,0],[.44,.11,.44],marker);
    if(category==='green') {
      for(const x of [-.17,.2]){mesh(cylinder,wood,[x,.29,0],[.035,.46,.035],marker);mesh(sphere,material,[x,.6,0],[.24,.35,.24],marker);}
    } else if(category==='transport') {
      mesh(box,material,[0,.29,0],[.73,.35,.3],marker);mesh(box,glass,[0,.33,.157],[.52,.13,.016],marker);
      for(const x of [-.24,.24])mesh(sphere,stone,[x,.12,.15],[.08,.08,.08],marker);
    } else if(category==='social') {
      mesh(box,material,[0,.34,0],[.56,.53,.46],marker);mesh(box,concrete,[0,.67,0],[.36,.09,.1],marker);mesh(box,concrete,[0,.67,0],[.1,.09,.36],marker);
    } else if(category==='safety') {
      mesh(cylinder,material,[0,.56,0],[.035,1.0,.035],marker);mesh(box,material,[.12,1.04,0],[.3,.08,.12],marker);mesh(sphere,gold,[.24,1.01,0],[.13,.1,.13],marker);
    } else {
      mesh(cylinder,material,[0,.36,0],[.24,.57,.24],marker);mesh(box,concrete,[0,.7,0],[.4,.09,.4],marker);
    }
  }
  function update(result,view,district) {
    lastPresentation={result,view,district};
    const colors=sceneThemes[activeTheme];
    for(const d of result.districts) {
      const g=districtGroups.get(d.id);
      const scores=view==='before'?d.baseline_scores:d.scores;
      const critical=Object.values(scores).some(v=>v<40);
      const isSelected=d.id===district;
      g.floorMat.color.setHex(critical?colors.critical:colors.floor);
      g.floorMat.emissive.setHex(isSelected?0x264634:0x000000);g.floorMat.emissiveIntensity=.7;
      g.border.material.color.setHex(isSelected?colors.selected:critical?0xb87731:colors.border);
      g.border.material.opacity=isSelected?1:.55;
      const value=view==='before'?d.before:d.after;
      g.label.replaceChildren();
      const title=document.createElement('span');title.textContent=translate(d.id);
      const number=document.createElement('strong');number.textContent=value.toLocaleString(numberLocale,{minimumFractionDigits:2,maximumFractionDigits:2});
      const change=document.createElement('small');change.textContent=view==='before'?translate('beforeDecisions'):translate('vsBase',{value:`${d.delta>=0?'+':''}${d.delta.toLocaleString(numberLocale,{minimumFractionDigits:2,maximumFractionDigits:2})}`});
      g.label.append(title,number,change);g.label.classList.toggle('selected',isSelected);g.label.classList.toggle('critical',critical);g.label.setAttribute('aria-pressed',String(isSelected));
      // All intervention objects use shared geometries/materials, so clear is sufficient.
      g.additions.clear();
      if(view==='after') {
        const measures=result.contributions.filter(c=>c.targets.includes(d.id));
        measures.forEach((c,i)=>addIntervention(g.additions,c.category,i,measures.length));
      }
    }
    requestRender();
  }
  function render() {
    frame=0;if(dead||!visible)return;
    camera.position.set(Math.sin(yaw)*Math.cos(pitch)*35,Math.sin(pitch)*35,Math.cos(yaw)*Math.cos(pitch)*35);
    camera.lookAt(lookAt);camera.zoom=zoom;camera.updateProjectionMatrix();camera.updateMatrixWorld();
    try { renderer.render(scene,camera); }
    catch { onFailure(); return; }
    for(const g of districtGroups.values()) {
      const p=g.center.clone();p.y=2.5;p.project(camera);
      g.label.style.left=`${(p.x*.5+.5)*width}px`;g.label.style.top=`${(-p.y*.5+.5)*height}px`;
      g.label.hidden=p.z<-1||p.z>1||Math.abs(p.x)>1.1||Math.abs(p.y)>1.1;
    }
  }
  function requestRender(){if(!dead&&!frame&&visible)frame=requestAnimationFrame(render);}
  function resize() {
    const rect=host.getBoundingClientRect();if(!rect.width||!rect.height)return;
    width=rect.width;height=rect.height;
    renderer.setSize(width,height,false);
    const aspect=width/height;
    const half=aspect<1?15/aspect:15;
    camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;requestRender();
  }
  function reset(){yaw=.2;pitch=.78;zoom=1.1;requestRender();}
  function zoomBy(factor){zoom=clamp(zoom*factor,.7,2.3);requestRender();}
  const pointers=new Map();let moved=false,pinch=0;
  const raycaster=new THREE.Raycaster();
  function pick(e){
    const rect=canvas.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);
    const hit=raycaster.intersectObjects(districtMeshes,false)[0];if(hit)onSelect(hit.object.userData.district);
  }
  const controller=new AbortController();const signal=controller.signal;
  canvas.addEventListener('pointerdown',e=>{canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)moved=false;if(pointers.size===2){const [a,b]=[...pointers.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y);moved=true;}},{signal});
  canvas.addEventListener('pointermove',e=>{
    const old=pointers.get(e.pointerId);if(!old)return;
    const dx=e.clientX-old.x,dy=e.clientY-old.y;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===2){const [a,b]=[...pointers.values()];const distance=Math.hypot(a.x-b.x,a.y-b.y);if(pinch>0)zoomBy(distance/pinch);pinch=distance;return;}
    if(Math.abs(dx)+Math.abs(dy)>1)moved=true;
    yaw-=dx*.007;pitch=clamp(pitch+dy*.006,.42,1.42);requestRender();
  },{signal});
  canvas.addEventListener('pointerup',e=>{const click=!moved&&pointers.size===1;pointers.delete(e.pointerId);if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(click)pick(e);},{signal});
  canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);moved=true;},{signal});
  // Scrolling the page remains possible until the canvas has keyboard/pointer focus.
  canvas.addEventListener('wheel',e=>{if(document.activeElement!==canvas)return;e.preventDefault();zoomBy(Math.exp(-e.deltaY*.001));},{signal,passive:false});
  canvas.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key))return;
    e.preventDefault();
    if(e.key==='Home')reset();else if(e.key==='+'||e.key==='=')zoomBy(1.15);else if(e.key==='-')zoomBy(1/1.15);
    else{if(e.key==='ArrowLeft')yaw-=.12;if(e.key==='ArrowRight')yaw+=.12;if(e.key==='ArrowUp')pitch=clamp(pitch+.1,.42,1.42);if(e.key==='ArrowDown')pitch=clamp(pitch-.1,.42,1.42);requestRender();}
  },{signal});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();onFailure();},{signal});
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  return {
    update, reset, zoomBy,
    setAppearance({theme,locale,translate:nextTranslate}) {
      const changed=activeTheme!==theme||numberLocale!==locale||translate!==nextTranslate;
      if(!changed)return;
      activeTheme=sceneThemes[theme]?theme:'studio';numberLocale=locale;translate=nextTranslate;
      const colors=sceneThemes[activeTheme];
      windowMat.emissiveIntensity=activeTheme==='night'?.55:.04;
      renderer.setClearColor(colors.background);baseMaterial.color.setHex(colors.base);concrete.color.setHex(colors.concrete);
      grid.material.vertexColors=false;grid.material.color.setHex(colors.base);grid.material.needsUpdate=true;
      canvas.setAttribute('aria-label',translate('canvasHelp'));
      if(lastPresentation)update(lastPresentation.result,lastPresentation.view,lastPresentation.district);
      requestRender();
    },
    setVisible(value){visible=value;if(value)resize();},
    dispose(){dead=true;controller.abort();observer.disconnect();cancelAnimationFrame(frame);for(const r of resources)r.dispose();renderer.dispose();canvas.remove();labels.remove();},
  };
}

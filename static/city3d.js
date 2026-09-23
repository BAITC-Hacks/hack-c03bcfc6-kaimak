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
  renderer.toneMappingExposure = 1.25;
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
  let yaw=.2, pitch=.94, zoom=1, width=1, height=1, frame=0, dead=false, visible=true;
  let activeTheme='night', numberLocale='ru-RU', translate=key=>key, lastPresentation=null;
  const sceneThemes={
    night:{background:0x142329,base:0x263b3f,floor:0x3f6958,critical:0x86684a,border:0x829f91,selected:0xe1efb8,concrete:0xc4ccbc},
    studio:{background:0xeee8f7,base:0xc7bcd7,floor:0xb8a2cf,critical:0xd6af97,border:0x9271ad,selected:0x634180,concrete:0xe6dfee},
  };
  const districtMeshes=[], districtGroups=new Map();
  const resources = new Set();
  const keep = r => {resources.add(r); return r;};
  const mat = color => keep(new THREE.MeshStandardMaterial({color,roughness:.78,metalness:.08}));
  const concrete=mat(0xc4ccbc), roofs=mat(0x708a8b), wood=mat(0x637c59), leaves=mat(0x7f9b61);
  const glass=mat(0x577f86), stone=mat(0x34494c), gold=mat(0xd2bc79);
  const box=keep(new THREE.BoxGeometry(1,1,1));
  const sphere=keep(new THREE.IcosahedronGeometry(1,1));
  const cylinder=keep(new THREE.CylinderGeometry(1,1,1,12));
  const mesh=(geo,material,position,scale,parent=scene)=>{
    const m=new THREE.Mesh(geo,material);m.position.set(...position);m.scale.set(...scale);parent.add(m);return m;
  };
  scene.add(new THREE.HemisphereLight(0xe2f3ed,0x536746,2.6));
  const sun=new THREE.DirectionalLight(0xffe1b3,3.1);sun.position.set(-12,24,10);scene.add(sun);
  const fill=new THREE.DirectionalLight(0x90bdff,1);fill.position.set(15,8,-15);scene.add(fill);
  const baseMaterial=mat(0x263b3f);
  mesh(box,baseMaterial,[0,-.5,0],[27,.55,19]);
  const grid=new THREE.GridHelper(34,34,0x355052,0x263d40);grid.position.y=-.8;scene.add(grid);keep(grid.geometry);keep(grid.material);
  // River between the northern districts and the southern bank.
  const riverCurve=new THREE.CatmullRomCurve3([[-15,0,-1.5],[-9,0,-.6],[-5,0,-.15],[0,0,-1.2],[6,0,-2.05],[14,0,-1.7]].map(p=>new THREE.Vector3(...p)));
  mesh(keep(new THREE.TubeGeometry(riverCurve,60,.23,7,false)),mat(0x499aaf),[0,.08,0],[1,1,1]);
  for (const x of [-6.2,2.2,7.1]) mesh(box,concrete,[x,.43,-1.1],[.42,.12,2.2]);

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
    const floor=new THREE.Mesh(geometry,floorMat);group.add(floor);floor.userData.district=layout.id;districtMeshes.push(floor);
    const border=new THREE.LineSegments(keep(new THREE.EdgesGeometry(geometry,40)),keep(new THREE.LineBasicMaterial({color:0x789686,transparent:true,opacity:.45})));
    group.add(border);
    let buildingCount=0;
    for(let px=30;px<485;px+=21) for(let pz=40;pz<325;pz+=23) {
      // Keep buildings away from edges, roads and the area reserved for interventions.
      if(!inside(px,pz,layout.points)||!inside(px+12,pz+12,layout.points)||!inside(px-7,pz-7,layout.points))continue;
      if(Math.hypot(px-layout.center[0],pz-layout.center[1])<43)continue;
      const p=world([px,pz]);
      const seed=(Math.sin(px*13.17+pz*7.31)+1)/2;
      if(seed<.24) {
        mesh(cylinder,wood,[p.x,.7,p.z],[.06,.65,.06],group);
        mesh(sphere,leaves,[p.x,1.13,p.z],[.34,.5,.34],group);
      } else {
        const h=.55+seed*(layout.id==='esil'?2.8:1.8);
        const building=mesh(box,seed>.78?glass:concrete,[p.x,.43+h/2,p.z],[.53,h,.56],group);
        building.userData.district=layout.id;districtMeshes.push(building);
        mesh(box,roofs,[p.x,.45+h,p.z],[.58,.06,.61],group);
        if(h>1.4)for(let y=.85;y<h+.25;y+=.45) mesh(box,glass,[p.x,y,p.z+.287],[.38,.09,.012],group);
        buildingCount++;
      }
    }
    // A low ring marks the data label anchor; its height is not a score encoding.
    const ring=mesh(keep(new THREE.TorusGeometry(.65,.045,5,40)),mat(0xadc3a3),[center.x,.49,center.z],[1,1,1],group);
    ring.rotation.x=-Math.PI/2;
    const additions=new THREE.Group();additions.position.set(center.x,.46,center.z);group.add(additions);
    const label=document.createElement('button');label.type='button';label.className='city3d-label';label.dataset.district=layout.id;
    label.onclick=()=>onSelect(layout.id);labels.append(label);
    districtGroups.set(layout.id,{floorMat,border,center,label,additions,ring,buildingCount});
  }
  // Small landmark in Esil; all geometry is schematic, not a building inventory.
  const landmark=new THREE.Group();landmark.position.set(1.3,.45,5.3);scene.add(landmark);
  for(const dx of [-.18,.18])mesh(cylinder,concrete,[dx,1.18,0],[.045,2.36,.045],landmark);
  mesh(sphere,gold,[0,2.48,0],[.39,.39,.39],landmark);
  mesh(cylinder,stone,[0,.06,0],[.5,.12,.5],landmark);
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
  function reset(){yaw=.2;pitch=.94;zoom=1;requestRender();}
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

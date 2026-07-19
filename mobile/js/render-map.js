// =====================================================================
// RENDERING — carte mobile (fond procédural + marqueurs + bottom sheet)
// =====================================================================
function blobPath(cx, cy, baseR, seedOffset, points, irregularity){
  points = points || 10;
  irregularity = irregularity===undefined ? 0.35 : irregularity;
  const rand = mulberry32((Math.floor(seedOffset*1000)+1) >>> 0);
  const pts = [];
  for(let i=0;i<points;i++){
    const angle = (i/points)*Math.PI*2;
    const r = baseR * (1 - irregularity/2 + rand()*irregularity);
    pts.push({x: cx+Math.cos(angle)*r, y: cy+Math.sin(angle)*r});
  }
  const mid = (a,b)=>({x:(a.x+b.x)/2, y:(a.y+b.y)/2});
  let d = "";
  const first = mid(pts[points-1], pts[0]);
  d += `M ${first.x.toFixed(1)} ${first.y.toFixed(1)} `;
  for(let i=0;i<points;i++){
    const p = pts[i];
    const next = pts[(i+1)%points];
    const m = mid(p,next);
    d += `Q ${p.x.toFixed(1)} ${p.y.toFixed(1)} ${m.x.toFixed(1)} ${m.y.toFixed(1)} `;
  }
  d += "Z";
  return d;
}

function buildMapSVG(decor){
  let svg = `<svg viewBox="0 0 ${MAP_W} ${MAP_H}" xmlns="http://www.w3.org/2000/svg" width="${MAP_W}" height="${MAP_H}" style="display:block;">`;
  svg += `<defs>
    <radialGradient id="lakeGrad" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#4a93bf"/><stop offset="60%" stop-color="#2a5f85"/><stop offset="100%" stop-color="#1c4360"/>
    </radialGradient>
    <linearGradient id="grassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#57783c"/><stop offset="100%" stop-color="#3f5c2b"/>
    </linearGradient>
  </defs>`;
  svg += `<rect x="0" y="0" width="${MAP_W}" height="${MAP_H}" fill="url(#grassGrad)"/>`;
  const lk = decor.lake;
  svg += `<path d="${blobPath(lk.cx,lk.cy,lk.r,lk.seedOffset,16,0.22)}" fill="url(#lakeGrad)"/>`;
  svg += `<path d="${blobPath(lk.cx,lk.cy,lk.r*0.82,lk.seedOffset+1,14,0.2)}" fill="#5aa2c9" opacity="0.35"/>`;
  for(const rk of decor.rocks){
    svg += `<path d="${blobPath(rk.cx,rk.cy,rk.r,rk.seedOffset,9,0.35)}" fill="#6b6a63"/>`;
    svg += `<path d="${blobPath(rk.cx,rk.cy,rk.r*0.55,rk.seedOffset+2,7,0.4)}" fill="#8f8d84" opacity="0.7"/>`;
  }
  for(const f of decor.forests){
    const rand = mulberry32((Math.floor(f.seedOffset*1000)+7) >>> 0);
    const nBlobs = 4 + Math.floor(rand()*3);
    for(let i=0;i<nBlobs;i++){
      const angle = rand()*Math.PI*2, dist = rand()*f.r*0.5;
      const bx = f.cx + Math.cos(angle)*dist, by = f.cy + Math.sin(angle)*dist;
      const br = f.r*0.4 + rand()*f.r*0.35;
      svg += `<path d="${blobPath(bx,by,br,f.seedOffset+i*3.1,8,0.3)}" fill="#2f4a24" opacity="0.9"/>`;
    }
    svg += `<path d="${blobPath(f.cx,f.cy,f.r*0.5,f.seedOffset+9,8,0.3)}" fill="#436b35" opacity="0.55"/>`;
  }
  svg += `</svg>`;
  return svg;
}

function renderMapBackground(){
  document.getElementById("mapSvg").innerHTML = buildMapSVG(state.decor);
}

function renderMarkers(){
  const layer = document.getElementById("markerLayer");
  layer.innerHTML = "";

  const storageEl = createStorageMarker();
  storageEl.style.left = state.storage.x + "px";
  storageEl.style.top = state.storage.y + "px";
  layer.appendChild(storageEl);

  for(const site of state.researchSites){
    if(site.locked) continue;
    if(site.type === "hotelville" && (state.menuBuildings.townhall.level > 0 || state.menuBuildings.townhall.building)) continue;
    const el = createSiteMarker(site);
    el.style.left = site.x + "px";
    el.style.top = site.y + "px";
    layer.appendChild(el);
  }

  for(const key of Object.keys(MENU_BUILDINGS)){
    const b = state.menuBuildings[key];
    if(b.level <= 0 && !b.building) continue;
    const pos = state.buildingPositions[key];
    const el = createMenuBuildingMarker(key);
    el.style.left = pos.x + "px";
    el.style.top = pos.y + "px";
    layer.appendChild(el);
  }
}

function createStorageMarker(){
  const div = document.createElement("div");
  div.className = "marker storageMarker";
  div.innerHTML = `<div class="markerIcon">📦</div>`;
  div.onclick = ()=> openStorageSheet();
  return div;
}

function createSiteMarker(site){
  const def = RESEARCH_TYPES[site.type];
  const div = document.createElement("div");
  const stateClass = site.discovered ? "discoveredSite" : (site.launched ? "pendingSite" : "unlaunchedSite");
  div.className = "marker " + stateClass;
  div.dataset.type = site.type;

  if(!site.discovered && !site.launched){
    const btn = document.createElement("button");
    btn.className = "launchBtn";
    btn.innerHTML = `🔍 ${def.label}`;
    btn.onclick = (e)=>{ e.stopPropagation(); launchResearch(state, site); renderAll(); };
    div.appendChild(btn);
    div.onclick = ()=> openSiteSheet(site.type);
    return div;
  }

  const icon = document.createElement("div");
  icon.className = "markerIcon";
  icon.textContent = site.discovered ? def.revealedIcon : def.icon;
  div.appendChild(icon);

  if(!site.discovered){
    const pct = Math.round((1 - site.effortRemaining/site.effortTotal) * 100);
    const wrap = document.createElement("div");
    wrap.className = "barWrap";
    const fill = document.createElement("div"); fill.className = "barFill"; fill.style.width = pct + "%";
    wrap.appendChild(fill);
    const chrono = document.createElement("span"); chrono.className = "barChrono";
    chrono.textContent = site.assigned > 0 ? Math.ceil(site.effortRemaining/site.assigned)+"s" : "⏸";
    wrap.appendChild(chrono);
    div.appendChild(wrap);
    div.appendChild(buildAssignControls(site));
  } else if(site.type !== "hotelville"){
    div.appendChild(buildAssignControls(site));
  }

  div.onclick = ()=> openSiteSheet(site.type);
  return div;
}

function buildAssignControls(site){
  const ctrl = document.createElement("div");
  ctrl.className = "siteControls";
  const minus = document.createElement("button");
  minus.className = "wcMinus"; minus.textContent = "−";
  minus.onclick = (e)=>{ e.stopPropagation(); assignToSite(state, site, -1); renderAll(); };
  const count = document.createElement("span"); count.textContent = site.assigned;
  const plus = document.createElement("button");
  plus.className = "wcPlus"; plus.textContent = "+";
  plus.onclick = (e)=>{ e.stopPropagation(); assignToSite(state, site, 1); renderAll(); };
  ctrl.appendChild(minus); ctrl.appendChild(count); ctrl.appendChild(plus);
  return ctrl;
}

function createMenuBuildingMarker(key){
  const def = MENU_BUILDINGS[key];
  const b = state.menuBuildings[key];
  const status = getMenuBuildStatus(state, key);

  const div = document.createElement("div");
  div.className = "marker " + (b.building ? "buildingInProgress" : "builtBuilding");
  div.dataset.buildingKey = key;

  if(b.building){
    const icon = document.createElement("div");
    icon.className = "markerIcon"; icon.textContent = "🚧";
    div.appendChild(icon);
    const wrap = document.createElement("div"); wrap.className = "barWrap";
    const fill = document.createElement("div"); fill.className = "barFill";
    fill.style.width = Math.round((1-b.buildTimeRemaining/b.buildTimeTotal)*100)+"%";
    wrap.appendChild(fill);
    const chrono = document.createElement("span"); chrono.className = "barChrono"; chrono.textContent = b.buildTimeRemaining+"s";
    wrap.appendChild(chrono);
    div.appendChild(wrap);
    div.onclick = ()=> openBuildingSheet(key);
    return div;
  }

  if(!status.maxed){
    const arrow = document.createElement("button");
    arrow.className = "upgradeArrow"; arrow.textContent = "▲";
    arrow.onclick = (e)=>{ e.stopPropagation(); buildMenuBuilding(state, key); renderAll(); };
    div.appendChild(arrow);
  }

  const icon = document.createElement("div");
  icon.className = "markerIcon"; icon.textContent = def.icon;
  div.appendChild(icon);

  const badge = document.createElement("div");
  badge.className = "levelBadge"; badge.textContent = "Nv." + b.level;
  div.appendChild(badge);

  if(ALT_GATHER[key]){
    const ctrl = document.createElement("div");
    ctrl.className = "siteControls";
    const minus = document.createElement("button"); minus.className = "wcMinus"; minus.textContent = "−";
    minus.onclick = (e)=>{ e.stopPropagation(); assignToAltGather(state, key, -1); renderAll(); };
    const count = document.createElement("span"); count.textContent = b.assigned || 0;
    const plus = document.createElement("button"); plus.className = "wcPlus"; plus.textContent = "+";
    plus.onclick = (e)=>{ e.stopPropagation(); assignToAltGather(state, key, 1); renderAll(); };
    ctrl.appendChild(minus); ctrl.appendChild(count); ctrl.appendChild(plus);
    div.appendChild(ctrl);
  }

  div.onclick = ()=> openBuildingSheet(key);
  return div;
}

function updateTickVisuals(){
  const discoveries = state.justDiscovered && state.justDiscovered.length > 0;
  const completions = state.justCompleted && state.justCompleted.length > 0;
  if(discoveries || completions){
    renderMarkers();
    state.justDiscovered = [];
    state.justCompleted = [];
    renderTopStrip();
    renderBuildScreen();
    renderUpgradesScreen();
    renderPopScreen();
    refreshOpenSheet();
    return;
  }
  for(const site of state.researchSites){
    const el = document.querySelector(`.marker[data-type="${site.type}"]`);
    if(!el) continue;
    if(!site.discovered){
      const fill = el.querySelector(".barFill"), chrono = el.querySelector(".barChrono");
      if(fill){ const pct = Math.round((1 - site.effortRemaining/site.effortTotal) * 100); fill.style.width = pct + "%"; }
      if(chrono) chrono.textContent = site.assigned > 0 ? Math.ceil(site.effortRemaining/site.assigned)+"s" : "⏸";
    }
    const count = el.querySelector(".siteControls span");
    if(count) count.textContent = site.assigned;
  }
  for(const key of Object.keys(MENU_BUILDINGS)){
    const b = state.menuBuildings[key];
    if(b.building){
      const el = document.querySelector(`.marker[data-building-key="${key}"]`);
      if(!el) continue;
      const fill = el.querySelector(".barFill"), chrono = el.querySelector(".barChrono");
      if(fill) fill.style.width = Math.round((1 - b.buildTimeRemaining/b.buildTimeTotal)*100) + "%";
      if(chrono) chrono.textContent = b.buildTimeRemaining + "s";
    } else if(ALT_GATHER[key] && b.level > 0){
      const el = document.querySelector(`.marker[data-building-key="${key}"]`);
      if(!el) continue;
      const count = el.querySelector(".siteControls span");
      if(count) count.textContent = b.assigned || 0;
    }
  }
  renderTopStrip();
  refreshOpenSheet();
}

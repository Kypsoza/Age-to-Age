// =====================================================================
// RENDERING — carte
// =====================================================================
function buildGridDOM(){
  const grid = document.getElementById("grid");
  grid.style.gridTemplateColumns = `repeat(${GRID_W}, ${TILE_PX}px)`;
  grid.style.gridTemplateRows = `repeat(${GRID_H}, ${TILE_PX}px)`;
  grid.innerHTML = "";
  for(let y=0;y<GRID_H;y++){
    for(let x=0;x<GRID_W;x++){
      const div = document.createElement("div");
      div.className = "tile night-shade";
      div.dataset.x = x; div.dataset.y = y;
      div.style.width = TILE_PX+"px"; div.style.height = TILE_PX+"px";
      div.onclick = ()=> onTileClick(x,y);
      grid.appendChild(div);
    }
  }
}

function renderGrid(){
  const night = isNight(state);
  for(const t of state.tiles){
    const div = document.querySelector(`.tile[data-x="${t.x}"][data-y="${t.y}"]`);
    if(!div) continue;
    div.className = "tile night-shade " + t.terrain;
    div.style.setProperty('--night-op', night ? 0.38 : 0);
    div.innerHTML = "";

    if(state.storage.x===t.x && state.storage.y===t.y){
      renderStorageMarker(div);
      continue;
    }
    const site = siteAt(state, t.x, t.y);
    if(site) renderSiteMarker(div, site);
  }
}

function renderStorageMarker(div){
  const span = document.createElement("span");
  span.className = "buildingIcon";
  span.textContent = "📦";
  div.appendChild(span);
  div.classList.add("storageMarker");
}

function renderSiteMarker(div, site){
  const def = RESEARCH_TYPES[site.type];
  const span = document.createElement("span");
  span.className = "buildingIcon";
  span.textContent = site.discovered ? def.revealedIcon : def.icon;
  if(site.discovered) div.classList.add("discoveredSite");
  else div.classList.add("pendingSite");
  div.appendChild(span);

  if(!site.discovered){
    // Barre de progression + chrono, uniquement si de l'effort a déjà été investi ou en cours
    const pct = Math.round((1 - site.effortRemaining/site.effortTotal) * 100);
    if(pct > 0 || site.assigned > 0){
      const wrap = document.createElement("div");
      wrap.className = "barWrap";
      const fill = document.createElement("div");
      fill.className = "barFill";
      fill.style.width = pct + "%";
      wrap.appendChild(fill);
      const chrono = document.createElement("span");
      chrono.className = "barChrono";
      chrono.textContent = site.assigned > 0 ? Math.ceil(site.effortRemaining/site.assigned)+"s" : "⏸";
      wrap.appendChild(chrono);
      div.appendChild(wrap);
    }

    const ctrl = document.createElement("div");
    ctrl.className = "siteControls";
    const minus = document.createElement("button");
    minus.className = "wcMinus";
    minus.textContent = "−";
    minus.onclick = (e)=>{ e.stopPropagation(); assignToSite(state, site, -1); renderAll(); };
    const count = document.createElement("span");
    count.textContent = site.assigned;
    const plus = document.createElement("button");
    plus.className = "wcPlus";
    plus.textContent = "+";
    plus.onclick = (e)=>{ e.stopPropagation(); assignToSite(state, site, 1); renderAll(); };
    ctrl.appendChild(minus); ctrl.appendChild(count); ctrl.appendChild(plus);
    div.appendChild(ctrl);
  }
}

// Mise à jour légère appelée à chaque tick : ne touche qu'aux barres de
// progression et au voile nuit, sans recréer les boutons +/- (évite le
// scintillement déjà corrigé en Phase 0 lors de la première mouture).
function updateTickVisuals(){
  const night = isNight(state);
  for(const site of state.researchSites){
    const div = document.querySelector(`.tile[data-x="${site.x}"][data-y="${site.y}"]`);
    if(!div) continue;
    div.style.setProperty('--night-op', night ? 0.38 : 0);
    if(site.discovered) continue;
    const fill = div.querySelector(".barFill");
    const chrono = div.querySelector(".barChrono");
    if(fill){
      const pct = Math.round((1 - site.effortRemaining/site.effortTotal) * 100);
      fill.style.width = pct + "%";
    }
    if(chrono){
      chrono.textContent = site.assigned > 0 ? Math.ceil(site.effortRemaining/site.assigned)+"s" : "⏸";
    }
    const count = div.querySelector(".siteControls span");
    if(count) count.textContent = site.assigned;
  }
  renderTopbar();
}

function onTileClick(x,y){
  if(state.storage.x===x && state.storage.y===y){
    state.selected = {kind:'storage'};
  } else {
    const site = siteAt(state,x,y);
    if(site){
      state.selected = {kind:'site', type:site.type};
    } else {
      state.selected = {kind:'tile', x, y};
    }
  }
  renderInfoPanel();
}

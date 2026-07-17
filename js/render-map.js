// RENDERING — carte
// ---------------------------------------------------------------------
let selectedInfoTarget = null; // {kind:'building', key} | {kind:'tile', x,y} | {kind:'townhall'}

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

    if(t.x===TOWNHALL_POS.x && t.y===TOWNHALL_POS.y){
      const span = document.createElement("span");
      span.className = "buildingIcon"; span.textContent = "🏛️";
      div.appendChild(span);
    } else {
      const bKey = SLOT_BY_COORD[t.x+","+t.y];
      if(bKey) renderBuildingOnTile(div, bKey);
    }
  }
}

function renderBuildingOnTile(div, key){
  const def = BUILDINGS[key];
  const b = state.buildings[key];
  const span = document.createElement("span");
  span.className = "buildingIcon";
  span.textContent = def.icon;
  if(b.level===0){
    span.style.opacity = 0.35;
    div.classList.add("emptySlot");
  }
  div.appendChild(span);

  if(b.level>0){
    const badge = document.createElement("span");
    badge.className = "levelBadge";
    badge.textContent = "Nv."+b.level;
    div.appendChild(badge);

    if(def.produces){
      const lvl = def.levels[b.level-1];
      const wrap = document.createElement("div");
      wrap.className = "barWrap";
      const fill = document.createElement("div");
      fill.className = "barFill";
      fill.style.width = Math.min(100, ((b.inv[def.produces]||0)/lvl.localCap)*100)+"%";
      wrap.appendChild(fill);
      div.appendChild(wrap);
    }

    if(b.level < def.levels.length){
      const arrow = document.createElement("button");
      arrow.className = "upgradeArrow";
      arrow.textContent = "▲";
      arrow.title = "Améliorer";
      arrow.onclick = (e)=>{ e.stopPropagation(); doUpgrade(key); };
      div.appendChild(arrow);
    }

    if(def.produces){
      const lvl = def.levels[b.level-1];
      const ctrl = document.createElement("div");
      ctrl.className = "workerControls";
      const minus = document.createElement("button");
      minus.textContent = "−";
      minus.onclick = (e)=>{ e.stopPropagation(); adjustWorkers(key,-1); };
      const count = document.createElement("span");
      count.textContent = `${b.workers||0}/${lvl.maxWorkers}`;
      const plus = document.createElement("button");
      plus.textContent = "+";
      plus.onclick = (e)=>{ e.stopPropagation(); adjustWorkers(key,1); };
      ctrl.appendChild(minus); ctrl.appendChild(count); ctrl.appendChild(plus);
      div.appendChild(ctrl);
    }
  }
}

function onTileClick(x,y){
  if(x===TOWNHALL_POS.x && y===TOWNHALL_POS.y){
    selectedInfoTarget = {kind:'townhall'};
  } else {
    const bKey = SLOT_BY_COORD[x+","+y];
    selectedInfoTarget = bKey ? {kind:'building', key:bKey} : {kind:'tile', x, y};
  }
  renderInfoPanel();
}

// ---------------------------------------------------------------------

// RENDERING — panneau d'infos (clic sur la carte)
// ---------------------------------------------------------------------
function renderInfoPanel(){
  const panel = document.getElementById("infoContent");
  const target = selectedInfoTarget;
  if(!target){ panel.innerHTML = "Clique sur un bâtiment ou une case pour voir ses détails."; return; }

  if(target.kind==='townhall'){
    panel.innerHTML = `<div><b>🏛️ Hôtel de Ville</b></div>
      <div style="margin-top:6px;">Le cœur de la cité. Détermine la population maximale.</div>
      <div class="invRow" style="margin-top:8px;"><span>Population</span><span>${state.population}/${state.popCap}</span></div>`;
    return;
  }
  if(target.kind==='tile'){
    const t = getTile(state, target.x, target.y);
    panel.innerHTML = `<div><b>${TERRAIN_LABELS[t.terrain]}</b></div>
      <div style="color:var(--bone-dim);font-family:var(--font-mono);font-size:10.5px;margin-top:4px;">Case (${t.x},${t.y})</div>`;
    return;
  }
  // building
  const key = target.key;
  const def = BUILDINGS[key];
  const b = state.buildings[key];
  let html = `<div><b>${def.icon} ${def.name}</b></div>
    <div style="margin-top:6px;">${def.desc}</div>
    <div class="invRow" style="margin-top:8px;"><span>Niveau</span><span>${b.level>0 ? b.level+"/"+def.levels.length : "Non construit"}</span></div>`;
  if(b.level>0 && def.produces){
    const lvl = def.levels[b.level-1];
    const workerRatio = lvl.maxWorkers ? Math.min(1,(b.workers||0)/lvl.maxWorkers) : 1;
    html += `<div class="invRow"><span>Stock local (${iconFor(def.produces)})</span><span>${Math.floor(b.inv[def.produces]||0)}/${lvl.localCap}</span></div>`;
    html += `<div class="invRow"><span>Production effective</span><span>${(lvl.rate*workerRatio).toFixed(1)}/tick</span></div>`;
    html += `<div class="invRow"><span>Travailleurs</span><span>${b.workers||0}/${lvl.maxWorkers}</span></div>`;
    html += `<div style="display:flex;gap:8px;align-items:center;margin-top:6px;">
      <button class="panelWorkerBtn" id="panelWorkerMinus">− Retirer</button>
      <button class="panelWorkerBtn" id="panelWorkerPlus">+ Assigner</button>
    </div>`;
  }
  if(b.level>0 && def.isStorage){
    const lvl = def.levels[b.level-1];
    html += `<div class="invRow"><span>Bonus stockage</span><span>+${lvl.storageBonus}</span></div>`;
  }
  const lines = getReqLines(key);
  if(lines){
    html += `<hr style="border-color:var(--line);margin:10px 0;">`;
    html += `<div style="color:var(--bone-dim);font-size:11px;margin-bottom:4px;">${b.level===0?"Prérequis pour construire":"Prérequis pour le niveau "+(b.level+1)}</div>`;
    for(const l of lines){
      html += `<div class="reqLine ${l.ok?'ok':'bad'}">${l.label}</div>`;
    }
  } else if(b.level>0){
    html += `<div style="margin-top:10px;color:var(--moss-bright);font-size:11px;">Niveau maximum atteint pour cette ère.</div>`;
  }
  panel.innerHTML = html;

  if(b.level>0 && def.produces){
    const minusBtn = document.getElementById("panelWorkerMinus");
    const plusBtn = document.getElementById("panelWorkerPlus");
    if(minusBtn) minusBtn.onclick = ()=> adjustWorkers(key,-1);
    if(plusBtn) plusBtn.onclick = ()=> adjustWorkers(key,1);
  }
}

// ---------------------------------------------------------------------

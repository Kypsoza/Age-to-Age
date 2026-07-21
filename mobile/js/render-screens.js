// =====================================================================
// RENDERING — barre du haut condensée
// =====================================================================
function setDelta(id, net){
  const el = document.getElementById(id);
  if(!el) return;
  if(Math.abs(net) < 0.01){ el.textContent = ""; el.className = "delta"; return; }
  el.className = "delta " + (net>0 ? "pos" : "neg");
  el.textContent = (net>0?"+":"") + net.toFixed(1);
}

function renderTopStrip(){
  document.getElementById("resBois").textContent = Math.floor(state.resources.bois);
  document.getElementById("resPierre").textContent = Math.floor(state.resources.pierre);
  document.getElementById("resNourriture").textContent = Math.floor(state.resources.nourriture);
  document.getElementById("resOr").textContent = Math.floor(state.resources.or);
  setDelta("deltaBois", getResourceIncome(state,"bois").net);
  setDelta("deltaPierre", getResourceIncome(state,"pierre").net);
  setDelta("deltaNourriture", getResourceIncome(state,"nourriture").net);
  setDelta("deltaOr", getResourceIncome(state,"or").net);

  const boisFound = !!siteByType(state,"bois")?.discovered;
  const foodFound = !!siteByType(state,"nourriture")?.discovered;
  const orFound = !!siteByType(state,"or")?.discovered;
  const pierreFound = !!siteByType(state,"pierre")?.discovered;
  document.getElementById("chipBois").classList.toggle("hidden", !boisFound);
  document.getElementById("chipNourriture").classList.toggle("hidden", !foodFound);
  document.getElementById("chipOr").classList.toggle("hidden", !orFound);
  document.getElementById("chipPierre").classList.toggle("hidden", !pierreFound);

  document.getElementById("popCount").textContent = state.population;
  const season = currentSeason(state);
  const dayOfSeason = ((state.day-1) % DAYS_PER_SEASON) + 1;
  document.getElementById("topClock").textContent = `${season.icon} J${dayOfSeason}`;

  renderTopDefense();
}

// Indicateur condensé dans la topbar mobile : n'apparaît qu'une fois la
// Caserne construite, s'allume en rouge dans les DEFENSE_WARNING_TICKS
// dernières secondes avant l'assaut.
function renderTopDefense(){
  const el = document.getElementById("topDefense");
  const b = state.menuBuildings.barracks;
  if(!b || b.level <= 0){
    el.classList.add("hidden");
    return;
  }
  el.classList.remove("hidden");
  const soon = state.defense.ticksUntilWave <= DEFENSE_WARNING_TICKS;
  el.style.color = soon ? "var(--alert)" : "var(--bone-dim)";
  el.textContent = `🛡️ ${state.defense.ticksUntilWave}s`;
}

// =====================================================================
// BOTTOM SHEET — détails contextuels (site, entrepôt, bâtiment)
// =====================================================================
let currentSheet = null; // {kind:'site'|'storage'|'building', key}

function openSheet(html){
  document.getElementById("sheetContent").innerHTML = html;
  document.getElementById("sheetOverlay").classList.add("show");
  document.getElementById("bottomSheet").classList.add("show");
}
function closeSheet(){
  document.getElementById("sheetOverlay").classList.remove("show");
  document.getElementById("bottomSheet").classList.remove("show");
  currentSheet = null;
}

function refreshOpenSheet(){
  if(!currentSheet) return;
  if(currentSheet.kind === "site") openSiteSheet(currentSheet.key);
  else if(currentSheet.kind === "storage") openStorageSheet();
  else if(currentSheet.kind === "building") openBuildingSheet(currentSheet.key);
}

function openSiteSheet(type){
  currentSheet = {kind:"site", key:type};
  const site = siteByType(state, type);
  const def = RESEARCH_TYPES[type];
  let html = `<h3>${site.discovered?def.revealedIcon:def.icon} ${def.label}</h3><p style="color:var(--bone-dim);font-size:13px;">${def.desc}</p>`;

  if(site.discovered){
    html += `<div style="color:var(--green-bright);font-size:13px;margin:8px 0;">✓ Zone découverte.</div>`;
    if(type !== "hotelville"){
      html += `<div class="invRow"><span>Habitants assignés</span><span>${site.assigned}/${gatherCapFor(state)}</span></div>
        <div style="display:flex;gap:10px;margin-top:14px;">
          <button class="bigActionBtn" id="sheetMinus" style="background:var(--bg-panel-2);border-color:var(--line);">− Retirer</button>
          <button class="bigActionBtn" id="sheetPlus">+ Assigner</button>
        </div>`;
    }
  } else if(!site.launched){
    html += `<button class="bigActionBtn" id="sheetLaunch">🔍 Lancer la recherche</button>`;
  } else {
    const pct = Math.round((1 - site.effortRemaining/site.effortTotal) * 100);
    html += `<div class="invRow"><span>Progression</span><span>${pct}%</span></div>
      <div class="invRow"><span>Temps restant</span><span>${site.assigned>0?Math.ceil(site.effortRemaining/site.assigned)+'s':'—'}</span></div>
      <div class="invRow"><span>Habitants assignés</span><span>${site.assigned}</span></div>
      <div style="display:flex;gap:10px;margin-top:14px;">
        <button class="bigActionBtn" id="sheetMinus" style="background:var(--bg-panel-2);border-color:var(--line);">− Retirer</button>
        <button class="bigActionBtn" id="sheetPlus">+ Assigner</button>
      </div>`;
  }
  openSheet(html);
  const launchBtn = document.getElementById("sheetLaunch");
  if(launchBtn) launchBtn.onclick = ()=>{ launchResearch(state, site); renderAll(); openSiteSheet(type); };
  const minus = document.getElementById("sheetMinus"), plus = document.getElementById("sheetPlus");
  if(minus) minus.onclick = ()=>{ assignToSite(state, site, -1); renderAll(); openSiteSheet(type); };
  if(plus) plus.onclick = ()=>{ assignToSite(state, site, 1); renderAll(); openSiteSheet(type); };
}

function openStorageSheet(){
  currentSheet = {kind:"storage"};
  let html = `<h3>📦 Entrepôt</h3><p style="color:var(--bone-dim);font-size:13px;">Capacité de stockage améliorable indépendamment par ressource.</p>`;
  for(const resKey of STORABLE_RESOURCES){
    const status = getStorageStatus(state, resKey);
    const have = Math.floor(state.resources[resKey]||0);
    html += `<div class="upgradeCard">
      <div class="upgradeCardHead"><span>${iconFor(resKey)} ${resKey[0].toUpperCase()+resKey.slice(1)}</span><span class="tierBadge">${have}/${status.cap}</span></div>
      ${reqLinesHtml(status.lines,'upgradeReqLine')}
      <button class="bigActionBtn" data-storage-res="${resKey}">Agrandir → ${status.nextCap}</button>
    </div>`;
  }
  openSheet(html);
  document.querySelectorAll("[data-storage-res]").forEach(btn=>{
    btn.onclick = ()=>{ buyStorageTier(state, btn.dataset.storageRes); renderAll(); openStorageSheet(); };
  });
}

function openBuildingSheet(key){
  currentSheet = {kind:"building", key};
  const def = MENU_BUILDINGS[key];
  const b = state.menuBuildings[key];
  const status = getMenuBuildStatus(state, key);
  let html = `<h3>${def.icon} ${def.name}</h3><p style="color:var(--bone-dim);font-size:13px;">${def.desc}</p>`;

  if(b.building){
    html += `<div class="invRow ok"><span>🚧 En construction</span><span>${b.buildTimeRemaining}s</span></div>`;
  } else {
    html += `<div class="invRow"><span>Niveau</span><span>${b.level}${def.maxLevel?"/"+def.maxLevel:""}</span></div>`;
    if(status.maxed){
      html += `<div style="color:var(--green-bright);font-size:13px;margin-top:8px;">Niveau maximum atteint.</div>`;
    } else {
      html += `<div style="color:var(--bone-dim);font-size:11px;margin:8px 0 4px;">Niveau ${b.level+1} — ${buildTimeForLevel(b.level)}s :</div>`;
      html += reqLinesHtml(status.lines,'upgradeReqLine');
      html += `<button class="bigActionBtn" id="sheetBuild">${b.level===0?'Construire':'Améliorer'}</button>`;
    }
    if(ALT_GATHER[key] && b.level > 0){
      html += `<div class="invRow" style="margin-top:10px;"><span>Habitants assignés</span><span>${b.assigned||0}/${gatherCapFor(state)}</span></div>
        <div style="display:flex;gap:10px;margin-top:10px;">
          <button class="bigActionBtn" id="sheetAltMinus" style="background:var(--bg-panel-2);border-color:var(--line);">− Retirer</button>
          <button class="bigActionBtn" id="sheetAltPlus">+ Assigner</button>
        </div>`;
    }
    if(key === "barracks" && b.level > 0){
      html += renderDefenseSheetHtml();
    }
  }
  openSheet(html);
  const buildBtn = document.getElementById("sheetBuild");
  if(buildBtn) buildBtn.onclick = ()=>{ buildMenuBuilding(state, key); renderAll(); openBuildingSheet(key); };
  const am = document.getElementById("sheetAltMinus"), ap = document.getElementById("sheetAltPlus");
  if(am) am.onclick = ()=>{ assignToAltGather(state, key, -1); renderAll(); openBuildingSheet(key); };
  if(ap) ap.onclick = ()=>{ assignToAltGather(state, key, 1); renderAll(); openBuildingSheet(key); };
  const sm = document.getElementById("sheetSoldierMinus"), sp = document.getElementById("sheetSoldierPlus");
  if(sm) sm.onclick = ()=>{ assignSoldier(state, -1); renderAll(); openBuildingSheet(key); };
  if(sp) sp.onclick = ()=>{ assignSoldier(state, 1); renderAll(); openBuildingSheet(key); };
}

// ---------------------------------------------------------------------
// Bloc Défense (Caserne) — soldats, score courant, prochaine vague
// ---------------------------------------------------------------------
function renderDefenseSheetHtml(){
  const b = state.menuBuildings.barracks;
  const score = currentDefenseScore(state);
  const threshold = currentWaveThreshold(state);
  const waveNumber = state.defense.assaultCount + 1;
  const ok = score >= threshold;
  return `<div style="border-top:1px solid var(--line);margin-top:14px;padding-top:12px;">
    <div class="villageTitle" style="font-size:14px;">🛡️ Défense</div>
    <div class="invRow"><span>Soldats assignés</span><span>${b.assignedSoldiers||0}</span></div>
    <div style="display:flex;gap:10px;margin:10px 0;">
      <button class="bigActionBtn" id="sheetSoldierMinus" style="background:var(--bg-panel-2);border-color:var(--line);">− Retirer</button>
      <button class="bigActionBtn" id="sheetSoldierPlus">+ Assigner</button>
    </div>
    <div class="invRow ${ok?'ok':'bad'}"><span>Score de Défense</span><span>${score}/${threshold}</span></div>
    <div class="invRow"><span>Vague n°${waveNumber}</span><span>${state.defense.ticksUntilWave}s</span></div>
    <div style="color:var(--bone-dim);font-size:11.5px;margin-top:6px;line-height:1.5;">
      Défense insuffisante à l'arrivée de la vague = -25% de chaque ressource stockée.
    </div>
  </div>`;
}

// =====================================================================
// ÉCRAN CONSTRUIRE
// =====================================================================
function renderBuildScreen(){
  const villageBox = document.getElementById("villagePanelMobile");
  const hdv = siteByType(state, "hotelville");
  const showVillage = hdv && hdv.discovered && !state.villageFounded;
  if(showVillage){
    const lines = Object.entries(VILLAGE_COST).map(([res,amt])=>{
      const have = Math.floor(state.resources[res]||0);
      return `<div class="invRow ${have>=amt?'ok':'bad'}"><span>${iconFor(res)} ${have}/${amt}</span></div>`;
    }).join("");
    villageBox.innerHTML = `<div class="villageBanner">
      <div class="villageTitle">🏘️ Fonder le Village</div>
      <div class="villageDesc">L'emplacement de l'Hôtel de Ville a été retrouvé.</div>
      ${lines}
      <button class="bigActionBtn" id="btnFoundVillageMobile">Fonder le Village</button>
    </div>`;
    document.getElementById("btnFoundVillageMobile").onclick = ()=>{ foundVillage(state); renderAll(); };
  } else {
    villageBox.innerHTML = "";
  }

  const grid = document.getElementById("buildGrid");
  if(!state.villageFounded){
    grid.innerHTML = `<div style="grid-column:1/-1;color:var(--bone-dim);font-size:13px;text-align:center;padding:20px;">Fonde d'abord le Village pour débloquer la construction.</div>`;
    return;
  }
  grid.innerHTML = "";
  for(const key of MENU_ORDER){
    const def = MENU_BUILDINGS[key];
    const b = state.menuBuildings[key];
    const built = b.level > 0;
    const status = getMenuBuildStatus(state, key);
    const unaffordable = !built && !b.building && !status.locked && !status.lines.every(l=>l.ok);

    const tile = document.createElement("div");
    tile.className = "buildTile"
      + (status.locked && !built ? " locked" : "")
      + (b.building ? " constructing" : "")
      + (built && !b.building ? " built" : "")
      + (unaffordable ? " unaffordable" : "");

    let badge = "";
    if(b.building) badge = `<span class="tileBadge">🚧</span>`;
    else if(built) badge = `<span class="tileBadge">✓</span>`;

    tile.innerHTML = `
      <button class="resInfoBtn tileInfoBtn" data-build-info="${key}">i</button>
      ${badge}
      <span class="ic">${(status.locked && !built) ? "🔒" : def.icon}</span>
      <span class="name">${def.name}</span>
      <button class="mainAction" data-build-action="${key}" ${(status.locked && !built) || b.building ? "disabled" : ""}>
        ${b.building ? "En cours..." : built ? "Construit" : "Construire"}
      </button>
    `;
    grid.appendChild(tile);
  }

  grid.querySelectorAll("[data-build-info]").forEach(btn=>{
    btn.onclick = (e)=>{
      e.stopPropagation();
      const key = btn.dataset.buildInfo;
      const def = MENU_BUILDINGS[key];
      const status = getMenuBuildStatus(state, key);
      let body = def.desc;
      if(!status.locked && !status.maxed && !state.menuBuildings[key].building){
        body += "<br><br><b>Coût :</b><br>" + reqLinesHtml(status.lines).replace(/class="invRow/g,'class="invRow" style="display:inline-block;margin-right:10px;');
      }
      showInfoModal(def.icon+" "+def.name, body);
    };
  });
  grid.querySelectorAll("[data-build-action]").forEach(btn=>{
    btn.onclick = ()=>{
      const key = btn.dataset.buildAction;
      const b = state.menuBuildings[key];
      if(b.level > 0){ openBuildingSheet(key); return; }
      const status = getMenuBuildStatus(state, key);
      if(status.locked){ toast("Prérequis non remplis."); return; }
      buildMenuBuilding(state, key);
      renderAll();
    };
  });
}

// =====================================================================
// ÉCRAN AMÉLIORATIONS (entrepôt + income)
// =====================================================================
function renderUpgradesScreen(){
  const storageBox = document.getElementById("storageCards");
  storageBox.innerHTML = "";
  for(const resKey of STORABLE_RESOURCES){
    const status = getStorageStatus(state, resKey);
    const have = Math.floor(state.resources[resKey]||0);
    const card = document.createElement("div");
    card.className = "upgradeCard";
    card.innerHTML = `
      <div class="upgradeCardHead"><span>${iconFor(resKey)} ${resKey[0].toUpperCase()+resKey.slice(1)}</span><span class="tierBadge">${have}/${status.cap}</span></div>
      ${reqLinesHtml(status.lines,'upgradeReqLine')}
      <button class="bigActionBtn" data-storage="${resKey}">Agrandir → ${status.nextCap}</button>`;
    storageBox.appendChild(card);
  }
  storageBox.querySelectorAll("[data-storage]").forEach(btn=>{
    btn.onclick = ()=>{ buyStorageTier(state, btn.dataset.storage); renderAll(); };
  });

  const upgradeBox = document.getElementById("upgradeCards");
  upgradeBox.innerHTML = "";
  for(const resKey of Object.keys(UPGRADES)){
    const def = UPGRADES[resKey];
    const status = getUpgradeStatus(state, resKey);
    const card = document.createElement("div");
    card.className = "upgradeCard";
    let body = `<div class="upgradeCardHead"><span>${iconFor(resKey)} ${def.label}</span><span class="tierBadge">Palier ${status.currentTier}/${status.maxTiers}</span></div>`;
    if(status.maxTiers === 0){
      body += `<div style="color:var(--bone-dim);font-size:12px;">Construis ${MENU_BUILDINGS[def.buildingKey].name} pour débloquer.</div>`;
    } else if(!status.available){
      body += `<div style="color:var(--bone-dim);font-size:12px;">Améliore ${MENU_BUILDINGS[def.buildingKey].name} pour un palier de plus.</div>`;
    } else {
      body += reqLinesHtml(status.lines,'upgradeReqLine');
      body += `<button class="bigActionBtn" data-upgrade="${resKey}">Débloquer (+100% income)</button>`;
    }
    card.innerHTML = body;
    upgradeBox.appendChild(card);
  }
  upgradeBox.querySelectorAll("[data-upgrade]").forEach(btn=>{
    btn.onclick = ()=>{ buyUpgrade(state, btn.dataset.upgrade); renderAll(); };
  });
}

// =====================================================================
// ÉCRAN HABITANTS
// =====================================================================
function renderPopScreen(){
  const free = getFreePopulation(state);
  const busy = state.population - free;
  document.getElementById("popStats").innerHTML = `
    <div class="popStatRow"><span>Population active</span><span>${state.population}</span></div>
    <div class="popStatRow"><span>Libres</span><span>${free}</span></div>
    <div class="popStatRow"><span>Occupés</span><span>${busy}</span></div>
    <div class="popStatRow"><span>En réserve</span><span>${state.populationReserve}</span></div>
  `;
  renderResetButton();
  const recruitBox = document.getElementById("recruitCardMobile");
  if(state.populationReserve <= 0){
    recruitBox.innerHTML = `<div style="color:var(--bone-dim);font-size:13px;margin-top:16px;">Aucun habitant en réserve — construis ou améliore une Maison.</div>`;
    return;
  }
  const cost = recruitCost(state);
  const have = Math.floor(state.resources.nourriture||0);
  recruitBox.innerHTML = `<div class="villageBanner">
    <div class="villageTitle">👥 Recruter</div>
    <div class="villageDesc">${state.populationReserve} en réserve, prêt(s) à intégrer le village.</div>
    <div class="invRow ${have>=cost?'ok':'bad'}"><span>${iconFor('nourriture')} ${have}/${cost}</span></div>
    <button class="bigActionBtn" id="btnRecruitMobile">Recruter (${cost} 🌾)</button>
  </div>`;
  document.getElementById("btnRecruitMobile").onclick = ()=>{ recruitHabitant(state); renderAll(); };
}

function renderResetButton(){
  const box = document.getElementById("popStats");
  const btn = document.createElement("button");
  btn.className = "bigActionBtn";
  btn.style.marginTop = "20px";
  btn.style.background = "var(--bg-panel-2)";
  btn.style.borderColor = "var(--alert)";
  btn.textContent = "🗑️ Nouvelle partie";
  btn.onclick = ()=>{
    if(btn.dataset.armed === "1"){
      state = freshState();
      localStorage.removeItem(SAVE_KEY);
      saveGame(true);
      renderMapBackground();
      renderAll();
      toast("Nouvelle partie démarrée.");
      btn.textContent = "🗑️ Nouvelle partie";
      btn.dataset.armed = "0";
    } else {
      btn.dataset.armed = "1";
      btn.textContent = "⚠️ Confirmer ? (tap à nouveau)";
      toast("Tape une seconde fois pour tout effacer.");
      setTimeout(()=>{ btn.dataset.armed = "0"; btn.textContent = "🗑️ Nouvelle partie"; }, 4000);
    }
  };
  box.appendChild(btn);
}

// =====================================================================
// MASTER RENDER
// =====================================================================
function renderAll(){
  renderTopStrip();
  renderMarkers();
  renderBuildScreen();
  renderUpgradesScreen();
  renderPopScreen();
}

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
  document.getElementById("popCap").textContent = state.population + state.populationReserve;
  const season = currentSeason(state);
  const dayOfSeason = ((state.day-1) % DAYS_PER_SEASON) + 1;
  document.getElementById("topClock").textContent = `${season.icon} Saison ${state.seasonIdx+1} · Jour ${dayOfSeason} · ${isNight(state)?"Soir":"Matin"}`;

  renderDefenseHud();
}

function renderDefenseHud(){
  const el = document.getElementById("defenseHud");
  if(!el) return;
  const b = state.menuBuildings.barracks;
  const built = b && b.level > 0;
  const score = currentDefenseScore(state);
  const threshold = currentWaveThreshold(state);
  const total = state.defense.assaultCount === 0 ? state.rules.defenseFirstWaveTicks : state.rules.defenseWaveIntervalTicks;
  const pct = Math.max(0, Math.min(100, Math.round((1 - state.defense.ticksUntilWave/total) * 100)));
  const soon = state.defense.ticksUntilWave <= state.rules.defenseWarningTicks;
  const ok = score >= threshold;

  el.innerHTML = `
    <div class="defenseHudTitle">${built ? MENU_BUILDINGS.barracks.icon : "🔒"} Défense — Vague n°${state.defense.assaultCount+1}</div>
    <div class="defenseHudBar"><div class="defenseHudFill${soon?' warn':''}" style="width:${pct}%;"></div></div>
    <div class="defenseHudRow"><span>${soon?'⚠️ ':'⏳ '}${state.defense.ticksUntilWave}s</span><span class="${ok?'ok':'bad'}">${score}/${threshold}</span></div>
    ${built ? `<div class="defenseHudRow"><span>🗡️ Soldats</span><span>${b.assignedSoldiers||0}</span></div>` : `<div class="defenseHudRow" style="color:var(--ink-dim);font-size:10px;">Caserne non construite</div>`}
  `;
}

// =====================================================================
// BOTTOM SHEET — détails contextuels (site, entrepôt, bâtiment)
// =====================================================================
let currentSheet = null;

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
  let html = `<h3>${site.discovered?def.revealedIcon:def.icon} ${def.label}</h3><p style="color:var(--ink-dim);font-size:13px;">${def.desc}</p>`;

  if(site.discovered){
    html += `<div style="color:var(--secondary);font-size:13px;margin:8px 0;">✓ Zone découverte.</div>`;
    if(type !== "hotelville"){
      html += `<div class="invRow"><span>Habitants assignés</span><span>${site.assigned}/${gatherCapFor(state)}</span></div>
        <div style="display:flex;gap:10px;margin-top:14px;">
          <button class="bigActionBtn" id="sheetMinus" style="background:var(--cream);border:2px solid var(--line-strong);color:var(--ink);">− Retirer</button>
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
        <button class="bigActionBtn" id="sheetMinus" style="background:var(--cream);border:2px solid var(--line-strong);color:var(--ink);">− Retirer</button>
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
  let html = `<h3>📦 Entrepôt</h3><p style="color:var(--ink-dim);font-size:13px;">Capacité de stockage améliorable indépendamment par ressource.</p>`;
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
  let html = `<h3>${def.icon} ${def.name}</h3><p style="color:var(--ink-dim);font-size:13px;">${def.desc}</p>`;

  if(b.building){
    html += `<div class="invRow ok"><span>🚧 En construction</span><span>${b.buildTimeRemaining}s</span></div>`;
  } else {
    html += `<div class="invRow"><span>Niveau</span><span>${b.level}${def.maxLevel?"/"+def.maxLevel:""}</span></div>`;
    if(status.maxed){
      html += `<div style="color:var(--secondary);font-size:13px;margin-top:8px;">Niveau maximum atteint.</div>`;
    } else {
      html += `<div style="color:var(--ink-dim);font-size:11px;margin:8px 0 4px;">Niveau ${b.level+1} — ${buildTimeForLevel(state, b.level)}s :</div>`;
      html += reqLinesHtml(status.lines,'upgradeReqLine');
      html += `<button class="bigActionBtn" id="sheetBuild">${b.level===0?'Construire':'Améliorer'}</button>`;
    }
    if(ALT_GATHER[key] && b.level > 0){
      html += `<div class="invRow" style="margin-top:10px;"><span>Habitants assignés</span><span>${b.assigned||0}/${gatherCapFor(state)}</span></div>
        <div style="display:flex;gap:10px;margin-top:10px;">
          <button class="bigActionBtn" id="sheetAltMinus" style="background:var(--cream);border:2px solid var(--line-strong);color:var(--ink);">− Retirer</button>
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
}

// ---------------------------------------------------------------------
// Bloc Défense (Caserne) — soldats, score courant, prochaine vague.
// Affichage seul : l'assignation de soldats se fait uniquement via les
// boutons ➖➕ sous l'icône de la Caserne, sur la carte.
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
    <div style="color:var(--ink-dim);font-size:11px;margin:4px 0 8px;">Assigne/retire des soldats depuis les boutons ➖➕ sous l'icône de la Caserne, sur la carte.</div>
    <div class="invRow ${ok?'ok':'bad'}"><span>Score de Défense</span><span>${score}/${threshold}</span></div>
    <div class="invRow"><span>Vague n°${waveNumber}</span><span>${state.defense.ticksUntilWave}s</span></div>
    <div style="color:var(--ink-dim);font-size:11.5px;margin-top:6px;line-height:1.5;">
      Défense insuffisante à l'arrivée de la vague = -${Math.round(state.rules.defenseLossRatio*100)}% de chaque ressource stockée. Chaque soldat coûte aussi ${state.rules.defenseSoldierGoldCost} 🪙/s en continu.
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
    const costObj = scaledVillageCost(state);
    const affordable = Object.entries(costObj).every(([res,amt])=> (state.resources[res]||0) >= amt);
    const lines = Object.entries(costObj).map(([res,amt])=>{
      const have = Math.floor(state.resources[res]||0);
      return `<div class="invRow ${have>=amt?'ok':'bad'}"><span>${iconFor(res)} ${have}/${amt}</span></div>`;
    }).join("");
    villageBox.innerHTML = `<div class="villageBanner">
      <div class="villageTitle">🏘️ Fonder le Village</div>
      <div class="villageDesc">L'emplacement de l'Hôtel de Ville a été retrouvé.</div>
      ${lines}
      <button class="bigActionBtn" id="btnFoundVillageMobile" ${affordable?"":"disabled"}>Fonder le Village</button>
    </div>`;
    document.getElementById("btnFoundVillageMobile").onclick = ()=>{ foundVillage(state); renderAll(); };
  } else {
    villageBox.innerHTML = "";
  }

  const grid = document.getElementById("buildGrid");
  if(!state.villageFounded){
    grid.innerHTML = `<div style="grid-column:1/-1;color:var(--ink-dim);font-size:13px;text-align:center;padding:20px;">Fonde d'abord le Village pour débloquer la construction.</div>`;
    return;
  }
  grid.innerHTML = "";
  for(const key of MENU_ORDER){
    const def = MENU_BUILDINGS[key];
    const b = state.menuBuildings[key];
    const built = b.level > 0;
    const status = getMenuBuildStatus(state, key);
    const locked = status.locked && !built;
    const affordable = !locked && !status.maxed && !b.building && status.lines.every(l=>l.ok);

    const tile = document.createElement("div");
    tile.className = "buildTile"
      + (locked ? " locked" : "")
      + (b.building ? " constructing" : "")
      + (built && !b.building ? " built" : "");
    tile.dataset.buildKey = key;

    let costRow = "", metaLine = "", actionHtml = "";
    if(b.building){
      metaLine = `🚧 En construction — ${b.buildTimeRemaining}s`;
      actionHtml = `<div class="upgradeBtn buildingProgress"><span>🚧</span><span class="btnCost">${b.buildTimeRemaining}s</span></div>`;
    } else if(status.maxed){
      metaLine = `Niveau ${b.level}${def.maxLevel?"/"+def.maxLevel:""}`;
      actionHtml = `<div class="upgradeBtn maxedBtn">MAX</div>`;
    } else if(locked){
      metaLine = `Niveau Max: ${def.maxLevel?def.maxLevel:"Illimité"}`;
      actionHtml = `<div class="upgradeBtn lockedBtn">🔒</div>`;
    } else {
      costRow = status.lines.map(l=>`<span class="${l.ok?'':'bad'}">${l.label}</span>`).join("");
      metaLine = `Max: ${def.maxLevel?def.maxLevel:"Illimité"}${built?" · Niv."+b.level:""}`;
      const label = built ? "Améliorer" : "Construire";
      actionHtml = `<button class="upgradeBtn" data-build-action="${key}" ${affordable?"":"disabled"}>${label}</button>`;
    }

    tile.innerHTML = `
      <span class="ic">${locked ? "🔒" : def.icon}</span>
      <div class="tileBody">
        <div class="nameLine"><span class="name">${def.name}</span>${built?`<span class="levelTag">Nv.${b.level}</span>`:""}</div>
        <div class="costRow">${costRow}</div>
        <div class="metaLine">${metaLine}</div>
        ${locked ? `<div class="lockLine">Requiert : ${status.lines.filter(l=>!l.ok).map(l=>l.label).join(", ")}</div>` : ""}
      </div>
      ${actionHtml}
      <button class="tileInfoBtn" data-build-info="${key}">i</button>
    `;
    grid.appendChild(tile);
  }

  // Bouton d'action = achat DIRECT (comme un upgrade d'incremental) : pas
  // de modale de confirmation, le bouton est grisé/désactivé tant que les
  // ressources manquent et devient cliquable dès qu'elles suffisent.
  grid.querySelectorAll("[data-build-action]").forEach(btn=>{
    btn.onclick = (e)=>{
      e.stopPropagation();
      buildMenuBuilding(state, btn.dataset.buildAction);
      renderAll();
    };
  });
  // Le bouton "i" reste un aperçu en lecture seule (description complète).
  grid.querySelectorAll("[data-build-info]").forEach(btn=>{
    btn.onclick = (e)=>{ e.stopPropagation(); openBuildModal(btn.dataset.buildInfo); };
  });
}

// Modale d'information (lecture seule) sur un bâtiment : description
// complète + coût actuel. L'achat se fait directement depuis le bouton de
// la ligne, pas depuis cette modale (un seul bouton "Fermer").
function openBuildModal(key){
  const def = MENU_BUILDINGS[key];
  const b = state.menuBuildings[key];
  const status = getMenuBuildStatus(state, key);
  let bodyHtml = def.desc;
  if(b.level > 0){
    bodyHtml += `<br><br><b>Niveau actuel :</b> ${b.level}${def.maxLevel?"/"+def.maxLevel:" (illimité)"}`;
  }
  let costHtml = "";
  if(b.building){
    costHtml = `<span>🚧 En construction : ${b.buildTimeRemaining}s restantes</span>`;
  } else if(status.maxed){
    costHtml = `<span style="color:var(--secondary);">Niveau maximum atteint</span>`;
  } else if(status.locked){
    costHtml = status.lines.map(l=>`<span class="${l.ok?'':'bad'}">${l.label}</span>`).join("");
  } else {
    costHtml = costLineHtml(status.lines);
  }
  openModal({ icon: def.icon, title: def.name, bodyHtml, costHtml, secondaryLabel:"Fermer" });
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
    const affordable = status.lines.every(l=>l.ok);
    const card = document.createElement("div");
    card.className = "upgradeCard";
    card.innerHTML = `
      <div class="upgradeCardHead"><span>${iconFor(resKey)} ${resKey[0].toUpperCase()+resKey.slice(1)}</span><span class="tierBadge">${have}/${status.cap}</span></div>
      ${reqLinesHtml(status.lines,'upgradeReqLine')}
      <button class="bigActionBtn" data-storage="${resKey}" ${affordable?"":"disabled"}>Agrandir → ${status.nextCap}</button>`;
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
      body += `<div style="color:var(--ink-dim);font-size:12px;">Construis ${MENU_BUILDINGS[def.buildingKey].name} pour débloquer.</div>`;
    } else if(!status.available){
      body += `<div style="color:var(--ink-dim);font-size:12px;">Améliore ${MENU_BUILDINGS[def.buildingKey].name} pour un palier de plus.</div>`;
    } else {
      const affordable = status.lines.every(l=>l.ok);
      body += reqLinesHtml(status.lines,'upgradeReqLine');
      body += `<button class="bigActionBtn" data-upgrade="${resKey}" ${affordable?"":"disabled"}>Débloquer (+100% income)</button>`;
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
    recruitBox.innerHTML = `<div style="color:var(--ink-dim);font-size:13px;margin-top:16px;">Aucun habitant en réserve — construis ou améliore une Maison.</div>`;
    return;
  }
  const cost = recruitCost(state);
  const have = Math.floor(state.resources.nourriture||0);
  recruitBox.innerHTML = `<div class="villageBanner">
    <div class="villageTitle">👥 Recruter</div>
    <div class="villageDesc">${state.populationReserve} en réserve, prêt(s) à intégrer le village.</div>
    <div class="invRow ${have>=cost?'ok':'bad'}"><span>${iconFor('nourriture')} ${have}/${cost}</span></div>
    <button class="bigActionBtn" id="btnRecruitMobile" ${have>=cost?"":"disabled"}>Recruter (${cost} 🌾)</button>
  </div>`;
  document.getElementById("btnRecruitMobile").onclick = ()=>{ recruitHabitant(state); renderAll(); };
}

function renderResetButton(){
  const box = document.getElementById("popStats");
  const btn = document.createElement("button");
  btn.className = "bigActionBtn";
  btn.style.marginTop = "20px";
  btn.style.background = "var(--cream)";
  btn.style.border = "2px solid var(--danger)";
  btn.style.color = "var(--danger)";
  btn.style.boxShadow = "none";
  btn.textContent = "🗑️ Nouvelle partie";
  btn.onclick = ()=>{
    if(btn.dataset.armed === "1"){
      localStorage.removeItem(SAVE_KEY);
      btn.textContent = "🗑️ Nouvelle partie";
      btn.dataset.armed = "0";
      showDifficultyScreen();
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
  renderDifficultyBadge();
  renderMarkers();
  renderBuildScreen();
  renderUpgradesScreen();
  renderPopScreen();
}

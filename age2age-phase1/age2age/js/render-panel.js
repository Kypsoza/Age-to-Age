// =====================================================================
// RENDERING — panneau de fondation du Village
// =====================================================================
function renderVillagePanel(){
  const panel = document.getElementById("villagePanel");
  const hdv = siteByType(state, "hotelville");
  const shouldShow = hdv && hdv.discovered && !state.villageFounded;

  if(!shouldShow){
    panel.classList.add("hidden");
    return;
  }
  panel.classList.remove("hidden");

  const lines = Object.entries(VILLAGE_COST).map(([res,amt])=>{
    const have = Math.floor(state.resources[res]||0);
    return `<div class="invRow ${have>=amt?'ok':'bad'}"><span>${iconFor(res)} ${have}/${amt}</span></div>`;
  }).join("");

  panel.innerHTML = `
    <div class="villageBanner">
      <div class="villageTitle">🏘️ Fonder le Village</div>
      <div class="villageDesc">L'emplacement de l'Hôtel de Ville a été retrouvé. Rassemble assez de bois et d'or pour y fonder ton village.</div>
      ${lines}
      <button id="btnFoundVillage" class="foundBtn">Fonder le Village</button>
    </div>`;

  document.getElementById("btnFoundVillage").onclick = ()=>{
    foundVillage(state);
    renderAll();
  };
}

// =====================================================================
// RENDERING — panneau d'infos
// =====================================================================
function renderInfoPanel(){
  const panel = document.getElementById("infoContent");
  const sel = state.selected;
  if(!sel){ panel.innerHTML = "Clique sur un site de recherche ou sur l'entrepôt pour voir ses détails."; return; }

  if(sel.kind==='menuBuilding'){
    const def = MENU_BUILDINGS[sel.key];
    const b = state.menuBuildings[sel.key];
    const status = getMenuBuildStatus(state, sel.key);
    let html = `<div><b>${def.icon} ${def.name}</b></div>
      <div style="margin-top:6px;">${def.desc}</div>
      <div class="invRow" style="margin-top:8px;"><span>Niveau</span><span>${b.level>0 ? b.level+(def.maxLevel?'/'+def.maxLevel:' (illimité)') : "Non construit"}</span></div>`;
    if(status.maxed){
      html += `<div style="margin-top:10px;color:var(--moss-bright);font-size:11px;">Niveau maximum atteint.</div>`;
    } else {
      html += `<hr style="border-color:var(--line);margin:10px 0;">
        <div style="color:var(--bone-dim);font-size:11px;margin-bottom:4px;">${b.level===0?"Prérequis pour construire":"Prérequis pour le niveau "+(b.level+1)}</div>`;
      for(const l of status.lines){
        html += `<div class="reqLine ${l.ok?'ok':'bad'}">${l.label}</div>`;
      }
      if(!status.locked){
        html += `<button class="foundBtn" id="btnBuildMenuItem" style="margin-top:10px;">${b.level===0?'Construire':'Améliorer'}</button>`;
      }
    }
    panel.innerHTML = html;
    const buildBtn = document.getElementById("btnBuildMenuItem");
    if(buildBtn) buildBtn.onclick = ()=>{ buildMenuBuilding(state, sel.key); renderAll(); };
    return;
  }

  if(sel.kind==='storage'){
    panel.innerHTML = `<div><b>📦 Entrepôt</b></div>
      <div style="margin-top:6px;">Le stockage que la tribu a déposé à son arrivée. Il peut contenir toutes les ressources.</div>
      <div style="margin-top:10px;color:var(--bone-dim);font-size:11px;">L'amélioration de sa capacité sera disponible une fois les premières ressources collectées.</div>`;
    return;
  }

  if(sel.kind==='tile'){
    // conservé pour compatibilité mais plus jamais déclenché : la carte
    // procédurale n'a plus de cases cliquables, seuls les marqueurs le sont.
    panel.innerHTML = "";
    return;
  }

  // site
  const site = siteByType(state, sel.type);
  const def = RESEARCH_TYPES[site.type];
  let html = `<div><b>${site.discovered ? def.revealedIcon : def.icon} ${def.label}</b></div>
    <div style="margin-top:6px;">${def.desc}</div>`;

  if(site.discovered){
    html += `<div style="margin-top:10px;color:var(--moss-bright);font-size:11px;">✓ Zone découverte.</div>`;
  } else if(!site.launched){
    html += `<div style="margin-top:10px;color:var(--bone-dim);font-size:11px;">Recherche pas encore lancée.</div>
      <button class="foundBtn" id="panelLaunch" style="margin-top:8px;">🔍 Lancer la recherche</button>`;
  } else {
    const pct = Math.round((1 - site.effortRemaining/site.effortTotal) * 100);
    html += `<div class="invRow" style="margin-top:8px;"><span>Progression</span><span>${pct}%</span></div>`;
    html += `<div class="invRow"><span>Temps restant</span><span>${site.assigned>0 ? Math.ceil(site.effortRemaining/site.assigned)+'s' : '—'}</span></div>`;
    html += `<div class="invRow"><span>Habitants assignés</span><span>${site.assigned}</span></div>`;
    html += `<div style="display:flex;gap:8px;align-items:center;margin-top:10px;">
      <button class="panelWorkerBtn" id="panelSiteMinus">− Retirer</button>
      <button class="panelWorkerBtn" id="panelSitePlus">+ Assigner</button>
    </div>`;
  }
  panel.innerHTML = html;

  if(!site.discovered && !site.launched){
    const launchBtn = document.getElementById("panelLaunch");
    if(launchBtn) launchBtn.onclick = ()=>{ launchResearch(state, site); renderAll(); };
  }
  if(!site.discovered && site.launched){
    const minusBtn = document.getElementById("panelSiteMinus");
    const plusBtn = document.getElementById("panelSitePlus");
    if(minusBtn) minusBtn.onclick = ()=>{ assignToSite(state, site, -1); renderAll(); };
    if(plusBtn) plusBtn.onclick = ()=>{ assignToSite(state, site, 1); renderAll(); };
  }
}

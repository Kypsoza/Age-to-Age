// =====================================================================
// RENDERING — topbar
// =====================================================================
function iconFor(resKey){
  return {bois:"🪵",pierre:"🪨",nourriture:"🌾",or:"✨"}[resKey] || "";
}

function setDelta(id, net){
  const el = document.getElementById(id);
  if(!el) return;
  if(Math.abs(net) < 0.01){ el.textContent = ""; el.className = "delta"; return; }
  el.className = "delta " + (net>0 ? "pos" : "neg");
  el.textContent = (net>0?"+":"") + net.toFixed(1) + "/s";
}

function renderTopbar(){
  document.getElementById("resBois").textContent = Math.floor(state.resources.bois);
  document.getElementById("resPierre").textContent = Math.floor(state.resources.pierre);
  document.getElementById("resNourriture").textContent = Math.floor(state.resources.nourriture);
  document.getElementById("resOr").textContent = Math.floor(state.resources.or);

  setDelta("deltaBois", getResourceIncome(state,"bois").net);
  setDelta("deltaNourriture", getResourceIncome(state,"nourriture").net);
  setDelta("deltaOr", getResourceIncome(state,"or").net);
  setDelta("deltaPierre", getResourceIncome(state,"pierre").net);

  const boisFound = !!siteByType(state,"bois")?.discovered;
  const foodFound = !!siteByType(state,"nourriture")?.discovered;
  const orFound = !!siteByType(state,"or")?.discovered;
  const pierreFound = !!siteByType(state,"pierre")?.discovered;
  document.getElementById("pillBois").classList.toggle("hidden", !boisFound);
  document.getElementById("pillNourriture").classList.toggle("hidden", !foodFound);
  document.getElementById("pillOr").classList.toggle("hidden", !orFound);
  document.getElementById("pillPierre").classList.toggle("hidden", !pierreFound);

  const free = getFreePopulation(state);
  const busy = state.population - free;
  document.getElementById("popCount").textContent = state.population;
  let detail = `(${free} libre${free>1?"s":""}, ${busy} occupé${busy>1?"s":""})`;
  if(state.populationReserve > 0) detail += ` · ${state.populationReserve} en réserve`;
  document.getElementById("popDetail").textContent = detail;

  const season = currentSeason(state);
  document.getElementById("seasonIcon").textContent = season.icon;
  const dayOfSeason = ((state.day-1) % DAYS_PER_SEASON) + 1;
  document.getElementById("clockLabel").textContent =
    `${season.name} · Jour ${dayOfSeason}/${DAYS_PER_SEASON} · ${isNight(state)?"Nuit":"Jour"}`;
}

function renderAll(){
  renderTopbar();
  renderMarkers();
  renderInfoPanel();
  renderVillagePanel();
  renderRecruitPanel();
  renderUpgradesPanel();
  renderBuildBar();
  document.getElementById("nightVeil").style.setProperty('--night-op', 0);
}

// ---------------------------------------------------------------------
// Tooltips des pastilles de ressources : détail production/consommation
// ---------------------------------------------------------------------
function setupResourceTooltips(){
  const configs = [
    {id:"pillBois", resKey:"bois", label:"Bois"},
    {id:"pillNourriture", resKey:"nourriture", label:"Nourriture"},
    {id:"pillOr", resKey:"or", label:"Or"},
    {id:"pillPierre", resKey:"pierre", label:"Pierre"},
  ];
  for(const c of configs){
    const el = document.getElementById(c.id);
    if(!el) continue;
    el.onmouseenter = ()=> showResourceTooltip(el, c.resKey, c.label);
    el.onmouseleave = hideMenuTooltip;
  }
}

function showResourceTooltip(anchorEl, resKey, label){
  hideMenuTooltip();
  const mult = 1 + (state.upgrades[resKey]||0);
  const siteProducers = state.researchSites.filter(s2 => s2.type===resKey && s2.discovered && s2.assigned>0);
  const altProducers = Object.entries(ALT_GATHER)
    .filter(([key,cfg]) => cfg.resource===resKey && state.menuBuildings[key].level>0 && state.menuBuildings[key].assigned>0)
    .map(([key,cfg]) => ({ key, cfg, assigned: state.menuBuildings[key].assigned }));

  tooltipEl = document.createElement("div");
  tooltipEl.className = "menuTooltip";
  let html = `<div class="ttTitle">${iconFor(resKey)} ${label}</div>`;
  if(siteProducers.length===0 && altProducers.length===0){
    html += `<div class="ttSub">Aucune production active actuellement.</div>`;
  } else {
    html += `<div class="ttSub">Production active :</div>`;
    for(const p of siteProducers){
      const rate = p.assigned*GATHER_RATE*mult;
      html += `<div class="reqLine ok"><span>${RESEARCH_TYPES[p.type].label} (${p.assigned} hab.)</span><span>+${rate.toFixed(1)}/s</span></div>`;
    }
    for(const a of altProducers){
      const rate = a.assigned*GATHER_RATE*a.cfg.rateMult*mult;
      html += `<div class="reqLine ok"><span>${MENU_BUILDINGS[a.key].name} (${a.assigned} hab.)</span><span>+${rate.toFixed(1)}/s</span></div>`;
    }
  }
  if(resKey==="nourriture"){
    const inc = getResourceIncome(state,"nourriture");
    if(inc.cons>0){
      html += `<div class="reqLine bad"><span>Population (${state.population} hab., consomme toujours)</span><span>-${inc.cons.toFixed(1)}/s</span></div>`;
    }
  }
  tooltipEl.innerHTML = html;
  document.body.appendChild(tooltipEl);
  const rect = anchorEl.getBoundingClientRect();
  tooltipEl.style.left = Math.max(8, rect.left + rect.width/2 - tooltipEl.offsetWidth/2) + "px";
  tooltipEl.style.top = (rect.bottom + 10) + "px";
}

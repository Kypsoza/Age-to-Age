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

  const free = getFreePopulation(state);
  const busy = state.population - free;
  document.getElementById("popCount").textContent = state.population;
  document.getElementById("popDetail").textContent = `(${free} libre${free>1?"s":""}, ${busy} occupé${busy>1?"s":""})`;

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
  renderBuildBar();
  document.getElementById("nightVeil").style.setProperty('--night-op', isNight(state) ? 0.35 : 0);
}

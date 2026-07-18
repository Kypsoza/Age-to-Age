// =====================================================================
// RENDERING — topbar
// =====================================================================
function iconFor(resKey){
  return {bois:"🪵",pierre:"🪨",nourriture:"🌾",or:"✨"}[resKey] || "";
}

function renderTopbar(){
  document.getElementById("resBois").textContent = Math.floor(state.resources.bois);
  document.getElementById("resPierre").textContent = Math.floor(state.resources.pierre);
  document.getElementById("resNourriture").textContent = Math.floor(state.resources.nourriture);
  document.getElementById("resOr").textContent = Math.floor(state.resources.or);

  const free = getFreePopulation(state);
  const busy = state.population - free;
  document.getElementById("popCount").textContent = state.population;
  document.getElementById("popDetail").textContent = `(${free} libre${free>1?"s":""}, ${busy} en recherche)`;

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
  document.getElementById("nightVeil").style.setProperty('--night-op', isNight(state) ? 0.35 : 0);
}

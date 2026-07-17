// RENDERING — topbar
// ---------------------------------------------------------------------
function iconFor(resKey){
  return {bois:"🪵",pierre:"🪨",nourriture:"🌾",or:"✨"}[resKey] || "";
}

function setDelta(elId, net){
  const el = document.getElementById(elId);
  el.classList.remove("pos","neg","flat");
  if(Math.abs(net) < 0.01){ el.classList.add("flat"); el.textContent = "(±0.0/tick)"; }
  else if(net > 0){ el.classList.add("pos"); el.textContent = `(+${net.toFixed(1)}/tick)`; }
  else { el.classList.add("neg"); el.textContent = `(${net.toFixed(1)}/tick)`; }
}

function renderTopbar(){
  document.getElementById("resBois").textContent = Math.floor(state.resources.bois);
  document.getElementById("resPierre").textContent = Math.floor(state.resources.pierre);
  document.getElementById("resNourriture").textContent = Math.floor(state.resources.nourriture);
  document.getElementById("resOr").textContent = Math.floor(state.resources.or);
  document.getElementById("popCount").textContent = state.population;
  document.getElementById("popCap").textContent = state.popCap;
  const free = getUnassignedPopulation();
  document.getElementById("popFree").textContent = `(${free} libre${free>1?"s":""})`;
  document.getElementById("popFree").className = "delta " + (free>0 ? "pos" : "flat");

  // Revenu par ressource : production - consommation
  const boisIncome = getResourceIncome("bois");
  const pierreIncome = getResourceIncome("pierre");
  const foodIncome = getResourceIncome("nourriture");
  setDelta("deltaBois", boisIncome.net);
  setDelta("deltaPierre", pierreIncome.net);
  setDelta("deltaNourriture", foodIncome.net);

  const pill = document.getElementById("foodPill");
  pill.classList.remove("ok","warn","alert");
  if(foodIncome.cons>0){
    if(foodIncome.prod > foodIncome.cons*1.05) pill.classList.add("ok");
    else if(foodIncome.prod >= foodIncome.cons*0.95) pill.classList.add("warn");
    else pill.classList.add("alert");
  }

  const season = currentSeason(state);
  document.getElementById("seasonIcon").textContent = season.icon;
  const dayOfSeason = ((state.day-1) % DAYS_PER_SEASON) + 1;
  document.getElementById("clockLabel").textContent =
    `${season.name} · Jour ${dayOfSeason}/${DAYS_PER_SEASON} · ${isNight(state)?"Nuit":"Jour"}`;
}

// ---------------------------------------------------------------------

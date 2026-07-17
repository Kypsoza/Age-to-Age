// SIMULATION
// ---------------------------------------------------------------------
function totalStorageCap(s, resKey){
  let cap = s.globalCap[resKey] || 0;
  const wh = s.buildings.warehouse;
  if(wh && wh.level>0){
    cap += BUILDINGS.warehouse.levels[wh.level-1].storageBonus / 3;
  }
  return cap;
}
function currentSeason(s){ return SEASONS[s.seasonIdx]; }
function isNight(s){
  const dayProgress = (s.tick % TICKS_PER_DAY) / TICKS_PER_DAY;
  return dayProgress >= NIGHT_START_RATIO;
}

function simTick(s){
  s.tick++;
  if(s.tick % TICKS_PER_DAY === 0){
    s.day++;
    if((s.day-1) % DAYS_PER_SEASON === 0) s.seasonIdx = (s.seasonIdx+1) % SEASONS.length;
  }
  const night = isNight(s);
  const season = currentSeason(s);
  const nightMult = night ? 0.65 : 1.0;

  // 1. Production locale (pondérée par le nombre de travailleurs assignés)
  for(const key of Object.keys(BUILDINGS)){
    const def = BUILDINGS[key];
    if(!def.produces) continue;
    const b = s.buildings[key];
    if(b.level===0) continue;
    const lvl = def.levels[b.level-1];
    const workerRatio = lvl.maxWorkers ? Math.min(1, (b.workers||0)/lvl.maxWorkers) : 1;
    let mult = nightMult * workerRatio;
    if(def.produces==="nourriture") mult *= season.foodMult;
    const amount = lvl.rate * mult;
    b.inv[def.produces] = Math.min((b.inv[def.produces]||0) + amount, lvl.localCap);
  }

  // 2. Transport automatique vers le stock global
  const TRANSPORT_RATE = 2.5;
  for(const key of Object.keys(BUILDINGS)){
    const def = BUILDINGS[key];
    if(!def.produces) continue;
    const b = s.buildings[key];
    if(b.level===0) continue;
    const resKey = def.produces;
    const available = b.inv[resKey] || 0;
    if(available<=0) continue;
    const cap = totalStorageCap(s, resKey);
    const room = cap - s.resources[resKey];
    const moved = Math.max(0, Math.min(available, TRANSPORT_RATE, room));
    b.inv[resKey] -= moved;
    s.resources[resKey] += moved;
  }

  // 3. Consommation de nourriture
  const consumption = s.population * 0.12;
  s.resources.nourriture = Math.max(0, s.resources.nourriture - consumption);
  s._foodProdLastTick = sumProduction(s,"nourriture");
  s._foodConsLastTick = consumption;
  const famine = s.resources.nourriture<=0 && consumption>0;

  // 4. Population
  if(!famine && s.population < s.popCap){
    if(s.tick % 15 === 0) s.population = Math.min(s.popCap, s.population+1);
  } else if(famine){
    if(s.tick % 10 === 0) s.population = Math.max(1, s.population-1);
  }
}

function sumProduction(s,resKey){
  let total = 0;
  for(const key of Object.keys(BUILDINGS)){
    const def = BUILDINGS[key];
    if(def.produces!==resKey) continue;
    const b = s.buildings[key];
    if(b.level===0) continue;
    const lvl = def.levels[b.level-1];
    const workerRatio = lvl.maxWorkers ? Math.min(1, (b.workers||0)/lvl.maxWorkers) : 1;
    let mult = (isNight(s) ? 0.65 : 1.0) * workerRatio;
    if(resKey==="nourriture") mult *= currentSeason(s).foodMult;
    total += lvl.rate * mult;
  }
  return total;
}

// Consommation générique par ressource (pour l'instant, seule la nourriture
// est consommée en continu par la population — les autres n'ont pas encore
// de puits de consommation dans ce milestone).
function sumConsumption(s, resKey){
  if(resKey==="nourriture") return s.population * 0.12;
  return 0;
}

function getResourceIncome(resKey){
  const prod = sumProduction(state, resKey);
  const cons = sumConsumption(state, resKey);
  return {prod, cons, net: prod-cons};
}

// ---------------------------------------------------------------------
// TRAVAILLEURS — assignation manuelle par bâtiment
// ---------------------------------------------------------------------
function getUnassignedPopulation(){
  let assigned = 0;
  for(const key of Object.keys(BUILDINGS)){
    if(!BUILDINGS[key].produces) continue;
    assigned += (state.buildings[key].workers||0);
  }
  return state.population - assigned;
}

function adjustWorkers(key, delta){
  const def = BUILDINGS[key];
  const b = state.buildings[key];
  if(b.level===0) return;
  const lvl = def.levels[b.level-1];
  const maxW = lvl.maxWorkers || 0;
  const newVal = (b.workers||0) + delta;
  if(newVal < 0) return;
  if(newVal > maxW){ toast("Capacité de travailleurs maximale atteinte pour ce niveau."); return; }
  if(delta > 0 && getUnassignedPopulation() <= 0){
    toast("Aucun habitant disponible — retire un travailleur ailleurs ou attends que la population grandisse.");
    return;
  }
  b.workers = newVal;
  renderAll();
}

// ---------------------------------------------------------------------

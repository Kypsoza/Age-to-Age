// =====================================================================
// SIMULATION
// =====================================================================
function currentSeason(s){ return SEASONS[s.seasonIdx]; }
function isNight(s){
  const dayProgress = (s.tick % TICKS_PER_DAY) / TICKS_PER_DAY;
  return dayProgress >= NIGHT_START_RATIO;
}

function getFreePopulation(s){
  let busy = s.researchSites.reduce((sum, site) => sum + site.assigned, 0);
  for(const key of Object.keys(ALT_GATHER)){
    busy += s.menuBuildings[key].assigned || 0;
  }
  busy += (s.menuBuildings.barracks && s.menuBuildings.barracks.assignedSoldiers) || 0;
  return s.population - busy;
}

// Fonctionne en deux modes selon l'état du site : recherche (avant
// découverte) ou récolte manuelle (après découverte, sauf hotelville qui
// n'est qu'un emplacement, pas une ressource).
function launchResearch(s, site){
  if(site.locked || site.launched || site.discovered) return;
  site.launched = true;
  const def = RESEARCH_TYPES[site.type];
  toast(`Recherche lancée : ${def.label}. Assigne des habitants pour avancer.`);
}

function gatherCapFor(s){
  return GATHER_CAP_BASE + s.menuBuildings.townhall.level * GATHER_CAP_PER_HDV_LEVEL;
}

// Plafond de stockage pour une ressource : indépendant et améliorable pour
// toutes, Or compris.
function storageCapFor(s, resKey){
  return STORAGE_CAP_BASE + (s.storageTiers[resKey]||0) * STORAGE_CAP_PER_TIER;
}

function addResource(s, resKey, amount){
  const cap = storageCapFor(s, resKey);
  s.resources[resKey] = Math.min(cap, (s.resources[resKey]||0) + amount);
}

function assignToSite(s, site, delta){
  if(site.locked) return;

  if(!site.discovered){
    if(!site.launched) return;
    if(delta > 0){
      if(getFreePopulation(s) <= 0){ toast("Aucun habitant disponible pour cette recherche."); return; }
    } else {
      if(site.assigned <= 0) return;
    }
    site.assigned += delta;
    if(site.assigned < 0) site.assigned = 0;
    return;
  }

  if(site.type === "hotelville") return; // pas de récolte sur l'emplacement de l'Hôtel de Ville
  const cap = gatherCapFor(s);
  if(delta > 0){
    if(site.assigned >= cap){ toast(`Plafond atteint : max ${cap} habitants sur cette zone (améliore l'Hôtel de Ville pour l'augmenter).`); return; }
    if(getFreePopulation(s) <= 0){ toast("Aucun habitant disponible."); return; }
  } else {
    if(site.assigned <= 0) return;
  }
  site.assigned += delta;
  if(site.assigned < 0) site.assigned = 0;
}

// Assignation d'habitants sur un bâtiment de récolte alternatif (Pavillon
// de Chasse / Cabane de Pêche), même logique que assignToSite mais pour un
// menuBuilding au lieu d'un researchSite.
function assignToAltGather(s, key, delta){
  const b = s.menuBuildings[key];
  if(!b || b.level <= 0) return;
  const cap = gatherCapFor(s);
  if(delta > 0){
    if(b.assigned >= cap){ toast(`Plafond atteint : max ${cap} habitants sur ce bâtiment.`); return; }
    if(getFreePopulation(s) <= 0){ toast("Aucun habitant disponible."); return; }
  } else {
    if(b.assigned <= 0) return;
  }
  b.assigned += delta;
  if(b.assigned < 0) b.assigned = 0;
}

function simTick(s){
  s.tick++;
  if(s.tick % TICKS_PER_DAY === 0){
    s.day++;
    if((s.day-1) % DAYS_PER_SEASON === 0) s.seasonIdx = (s.seasonIdx+1) % SEASONS.length;
  }

  for(const site of s.researchSites){
    if(site.locked) continue;

    if(!site.discovered){
      if(site.assigned <= 0) continue;
      site.effortRemaining -= site.assigned;
      if(site.effortRemaining <= 0){
        site.effortRemaining = 0;
        site.discovered = true;
        const freed = site.assigned;
        site.assigned = 0;
        const def = RESEARCH_TYPES[site.type];
        toast(`${def.label} découverte ! ${freed} habitant(s) libéré(s).`);
        s.justDiscovered.push(site.type);

        if(site.type === "nourriture"){
          for(const other of s.researchSites){
            if(other.type !== "nourriture" && !RESEARCH_TYPES[other.type].unlockedByVillage) other.locked = false;
          }
          toast("De nouveaux sites apparaissent à l'horizon...");
        }
      }
      continue;
    }

    // Récolte manuelle sur zone découverte
    if(site.type !== "hotelville" && site.assigned > 0){
      const mult = 1 + (s.upgrades[site.type]||0);
      addResource(s, site.type, site.assigned * GATHER_RATE * mult);
    }
  }

  // Récolte sur les bâtiments alternatifs (Pavillon de Chasse / Cabane de Pêche)
  for(const [key, cfg] of Object.entries(ALT_GATHER)){
    const b = s.menuBuildings[key];
    if(b.level > 0 && b.assigned > 0){
      const mult = 1 + (s.upgrades[cfg.resource]||0);
      addResource(s, cfg.resource, b.assigned * GATHER_RATE * cfg.rateMult * mult);
    }
  }

  // Consommation de nourriture : TOUS les habitants actifs consomment en
  // permanence, qu'ils travaillent ou non — pas seulement quand une source
  // de nourriture est en cours de récolte ce tick précis.
  s.resources.nourriture = Math.max(0, s.resources.nourriture - s.population*FOOD_CONSUMPTION);

  // Progression des constructions/améliorations en cours.
  for(const key of Object.keys(s.menuBuildings)){
    const b = s.menuBuildings[key];
    if(!b.building) continue;
    b.buildTimeRemaining--;
    if(b.buildTimeRemaining <= 0){
      b.buildTimeRemaining = 0;
      b.building = false;
      b.level++;
      s.justCompleted.push(key);
      const def = MENU_BUILDINGS[key];
      if(key === "house"){
        s.populationReserve += 5;
        toast(`${def.name} ${b.level===1?'construite':'améliorée'} : +5 places en réserve (${s.populationReserve} habitant(s) à recruter).`);
      } else {
        toast(b.level===1 ? `${def.name} construit(e).` : `${def.name} amélioré(e) au niveau ${b.level}.`);
      }
    }
  }

  // Défense & assauts (Phase 8) : ne démarre qu'une fois la Caserne construite.
  tickDefense(s);
}

// Revenu net (production - consommation) par ressource, pour le topbar.
function getResourceIncome(s, resKey){
  let prod = 0;
  for(const site of s.researchSites){
    if(site.type===resKey && site.discovered && site.assigned>0){
      prod += site.assigned*GATHER_RATE*(1+(s.upgrades[resKey]||0));
    }
  }
  for(const [key, cfg] of Object.entries(ALT_GATHER)){
    if(cfg.resource!==resKey) continue;
    const b = s.menuBuildings[key];
    if(b.level>0 && b.assigned>0) prod += b.assigned*GATHER_RATE*cfg.rateMult*(1+(s.upgrades[resKey]||0));
  }
  let cons = 0;
  if(resKey==="nourriture"){
    cons = s.population*FOOD_CONSUMPTION;
  }
  return { prod, cons, net: prod-cons };
}

// ---------------------------------------------------------------------
// RECRUTEMENT — transformer un habitant "en réserve" en habitant actif
// ---------------------------------------------------------------------
function recruitCost(s){
  return Math.ceil(RECRUIT_COST_BASE * Math.pow(RECRUIT_COST_GROWTH, s.recruitedCount));
}

function recruitHabitant(s){
  if(s.populationReserve <= 0){ toast("Aucun habitant en réserve — construis ou améliore une Maison."); return; }
  const cost = recruitCost(s);
  if((s.resources.nourriture||0) < cost){ toast(`Nourriture insuffisante pour recruter (besoin de ${cost}).`); return; }
  s.resources.nourriture -= cost;
  s.populationReserve--;
  s.population++;
  s.recruitedCount++;
  toast(`Nouvel habitant recruté ! Population active : ${s.population}.`);
}

// ---------------------------------------------------------------------
// VILLAGE & BÂTIMENTS DU MENU
// ---------------------------------------------------------------------
function canAffordVillage(s){
  return Object.entries(VILLAGE_COST).every(([res,amt]) => (s.resources[res]||0) >= amt);
}

function foundVillage(s){
  if(s.villageFounded){ toast("Le Village est déjà fondé."); return; }
  if(!canAffordVillage(s)){ toast("Ressources insuffisantes pour fonder le Village."); return; }
  for(const [res,amt] of Object.entries(VILLAGE_COST)) s.resources[res] -= amt;
  s.villageFounded = true;
  for(const site of s.researchSites){
    if(RESEARCH_TYPES[site.type].unlockedByVillage) site.locked = false;
  }
  toast("Le Village est fondé ! Le menu de construction est disponible.");
}

// Coût mis à l'échelle par niveau pour les bâtiments à niveaux illimités
// (townhall, house, forge, treasury, mill) : chaque niveau coûte
// LEVEL_COST_MULTIPLIER fois plus.
function costForLevel(def, currentLevel){
  if(def.maxLevel !== null) return def.cost;
  const mult = Math.pow(LEVEL_COST_MULTIPLIER, currentLevel);
  const scaled = {};
  for(const [res,amt] of Object.entries(def.cost)) scaled[res] = Math.ceil(amt*mult);
  return scaled;
}

// Retourne {locked, lines} — lines = [{label, ok}] pour le coût + les
// prérequis de bâtiments (utilisé pour le cadenas et le tooltip).
function getMenuBuildStatus(s, key){
  const def = MENU_BUILDINGS[key];
  const b = s.menuBuildings[key];
  const lines = [];
  let locked = false;

  if(def.requires && def.requires.length){
    if(def.requiresAny){
      const anyOk = def.requires.some(r => s.menuBuildings[r].level >= 1);
      lines.push({label:`Nécessite : ${def.requires.map(r=>MENU_BUILDINGS[r].name).join(" ou ")}`, ok:anyOk});
      if(!anyOk) locked = true;
    } else {
      for(const r of def.requires){
        const need = (def.requiresLevel && def.requiresLevel[r]) || 1;
        const ok = s.menuBuildings[r].level >= need;
        lines.push({label:`Nécessite : ${MENU_BUILDINGS[r].name}${need>1?' niv.'+need:''}`, ok});
        if(!ok) locked = true;
      }
    }
  }

  const maxed = def.maxLevel!==null && b.level>=def.maxLevel;
  if(!locked && !maxed && !b.building){
    const cost = costForLevel(def, b.level);
    for(const [res,amt] of Object.entries(cost)){
      const have = Math.floor(s.resources[res]||0);
      lines.push({label:`${iconFor(res)} ${have}/${amt}`, ok: have >= amt});
    }
  }

  return { locked, maxed, building:b.building, lines };
}

function buildTimeForLevel(currentLevel){
  return BUILD_TIME_BASE + currentLevel*BUILD_TIME_PER_LEVEL;
}

function buildMenuBuilding(s, key){
  if(!s.villageFounded) return;
  const def = MENU_BUILDINGS[key];
  const b = s.menuBuildings[key];
  if(b.building){ toast("Déjà en construction."); return; }
  const status = getMenuBuildStatus(s, key);
  if(status.locked){ toast("Prérequis non remplis pour ce bâtiment."); return; }
  if(status.maxed){ toast("Niveau maximum atteint."); return; }
  if(!status.lines.every(l=>l.ok)){ toast("Ressources insuffisantes."); return; }
  const cost = costForLevel(def, b.level);
  for(const [res,amt] of Object.entries(cost)) s.resources[res] -= amt;
  b.building = true;
  b.buildTimeTotal = buildTimeForLevel(b.level);
  b.buildTimeRemaining = b.buildTimeTotal;
  toast(`Construction lancée : ${def.name} (${b.buildTimeTotal}s environ).`);
}

// ---------------------------------------------------------------------
// AMÉLIORATIONS D'INCOME (paliers débloqués par Forge/Trésor/Moulin)
// ---------------------------------------------------------------------
function costForUpgradeTier(resKey, currentTier){
  const def = UPGRADES[resKey];
  const mult = Math.pow(UPGRADE_COST_MULTIPLIER, currentTier);
  const scaled = {};
  for(const [res,amt] of Object.entries(def.cost)) scaled[res] = Math.ceil(amt*mult);
  return scaled;
}

// Retourne {maxTiers, currentTier, available, lines} pour une ressource.
function getUpgradeStatus(s, resKey){
  const def = UPGRADES[resKey];
  const maxTiers = s.menuBuildings[def.buildingKey].level;
  const currentTier = s.upgrades[resKey]||0;
  const available = currentTier < maxTiers;
  const lines = [];
  if(available){
    const cost = costForUpgradeTier(resKey, currentTier);
    for(const [res,amt] of Object.entries(cost)){
      const have = Math.floor(s.resources[res]||0);
      lines.push({label:`${iconFor(res)} ${have}/${amt}`, ok: have >= amt});
    }
  }
  return { maxTiers, currentTier, available, lines };
}

function buyUpgrade(s, resKey){
  const def = UPGRADES[resKey];
  const status = getUpgradeStatus(s, resKey);
  if(!status.available){ toast(`Améliore d'abord ${MENU_BUILDINGS[def.buildingKey].name} pour débloquer ce palier.`); return; }
  if(!status.lines.every(l=>l.ok)){ toast("Ressources insuffisantes."); return; }
  const cost = costForUpgradeTier(resKey, status.currentTier);
  for(const [res,amt] of Object.entries(cost)) s.resources[res] -= amt;
  s.upgrades[resKey]++;
  toast(`${def.label} : palier ${s.upgrades[resKey]} débloqué (+100% income, +${s.upgrades[resKey]*100}% cumulé).`);
}

// ---------------------------------------------------------------------
// ENTREPÔT — paliers de plafond de stockage, indépendants par ressource
// ---------------------------------------------------------------------
function costForStorageTier(resKey, currentTier){
  const base = STORAGE_TIER_COST_BASE[resKey];
  const mult = Math.pow(STORAGE_TIER_COST_MULTIPLIER, currentTier);
  const scaled = {};
  for(const [res,amt] of Object.entries(base)) scaled[res] = Math.ceil(amt*mult);
  return scaled;
}

function getStorageStatus(s, resKey){
  const currentTier = s.storageTiers[resKey]||0;
  const cap = storageCapFor(s, resKey);
  const cost = costForStorageTier(resKey, currentTier);
  const lines = [];
  for(const [res,amt] of Object.entries(cost)){
    const have = Math.floor(s.resources[res]||0);
    lines.push({label:`${iconFor(res)} ${have}/${amt}`, ok: have >= amt});
  }
  return { currentTier, cap, nextCap: cap + STORAGE_CAP_PER_TIER, lines };
}

function buyStorageTier(s, resKey){
  const status = getStorageStatus(s, resKey);
  if(!status.lines.every(l=>l.ok)){ toast("Ressources insuffisantes."); return; }
  const cost = costForStorageTier(resKey, status.currentTier);
  for(const [res,amt] of Object.entries(cost)) s.resources[res] -= amt;
  s.storageTiers[resKey]++;
  toast(`Entrepôt : plafond ${iconFor(resKey)} porté à ${storageCapFor(s,resKey)}.`);
}

// =====================================================================
// PHASE 8 — DÉFENSE & ASSAUTS (Caserne)
// =====================================================================
function freshDefenseState(){
  return { active:false, assaultCount:0, ticksUntilWave: DEFENSE_WAVE_INTERVAL_TICKS, lastResult:null };
}

function currentDefenseScore(s){
  const b = s.menuBuildings.barracks;
  if(!b || b.level<=0) return 0;
  return (b.assignedSoldiers||0) * DEFENSE_PER_SOLDIER;
}

function currentWaveThreshold(s){
  const idx = Math.min(s.defense.assaultCount, DEFENSE_WAVE_THRESHOLDS.length-1);
  return DEFENSE_WAVE_THRESHOLDS[idx];
}

function assignSoldier(s, delta){
  const b = s.menuBuildings.barracks;
  if(!b || b.level<=0) return;
  if(delta>0){
    if(getFreePopulation(s)<=0){ toast("Aucun habitant disponible pour la Caserne."); return; }
  } else {
    if((b.assignedSoldiers||0)<=0) return;
  }
  b.assignedSoldiers = (b.assignedSoldiers||0) + delta;
  if(b.assignedSoldiers<0) b.assignedSoldiers = 0;
}

function resolveDefenseWave(s){
  const threshold = currentWaveThreshold(s);
  const score = currentDefenseScore(s);
  const waveNumber = s.defense.assaultCount + 1;
  const success = score >= threshold;

  if(success){
    toast(`🛡️ Vague d'assaut n°${waveNumber} repoussée ! Défense ${score}/${threshold}.`);
    s.defense.lastResult = { waveNumber, success:true, score, threshold };
  } else {
    const lostAmounts = {};
    for(const res of STORABLE_RESOURCES){
      const have = s.resources[res]||0;
      const lost = Math.floor(have*DEFENSE_LOSS_RATIO);
      s.resources[res] = have - lost;
      lostAmounts[res] = lost;
    }
    toast(`⚠️ Vague d'assaut n°${waveNumber} ! Défense insuffisante (${score}/${threshold}) : -25% des stocks.`);
    s.defense.lastResult = { waveNumber, success:false, score, threshold, lostAmounts };
  }

  s.defense.assaultCount++;
  s.defense.ticksUntilWave = DEFENSE_WAVE_INTERVAL_TICKS;
  s.justDefenseEvent = true;
}

function tickDefense(s){
  const b = s.menuBuildings.barracks;
  if(!b || b.level<=0) return;
  if(!s.defense.active){
    s.defense.active = true;
    s.defense.ticksUntilWave = DEFENSE_WAVE_INTERVAL_TICKS;
  }
  s.defense.ticksUntilWave--;
  if(s.defense.ticksUntilWave <= 0){
    resolveDefenseWave(s);
  }
}

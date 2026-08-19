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
      const mult = (1 + (s.upgrades[site.type]||0)) * s.rules.gatherRateMult;
      addResource(s, site.type, site.assigned * GATHER_RATE * mult);
    }
  }

  // Récolte sur les bâtiments alternatifs (Pavillon de Chasse / Cabane de Pêche)
  for(const [key, cfg] of Object.entries(ALT_GATHER)){
    const b = s.menuBuildings[key];
    if(b.level > 0 && b.assigned > 0){
      const mult = (1 + (s.upgrades[cfg.resource]||0)) * s.rules.gatherRateMult;
      addResource(s, cfg.resource, b.assigned * GATHER_RATE * cfg.rateMult * mult);
    }
  }

  // Consommation de nourriture : TOUS les habitants actifs consomment en
  // permanence, qu'ils travaillent ou non — pas seulement quand une source
  // de nourriture est en cours de récolte ce tick précis.
  s.resources.nourriture = Math.max(0, s.resources.nourriture - s.population*FOOD_CONSUMPTION);

  // Famine : si la nourriture reste à 0, la population commence à décliner.
  tickFamine(s);

  // Solde des soldats (or/tick), en plus de la nourriture déjà décomptée ci-dessus.
  paySoldierUpkeep(s);

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

  // Défaite : population active tombée à 0 (ne se redéclenche pas si déjà constatée).
  if(!s.defeated && s.population <= 0){
    s.defeated = true;
  }
}

// Revenu net (production - consommation) par ressource, pour le topbar.
function getResourceIncome(s, resKey){
  let prod = 0;
  for(const site of s.researchSites){
    if(site.type===resKey && site.discovered && site.assigned>0){
      prod += site.assigned*GATHER_RATE*(1+(s.upgrades[resKey]||0))*s.rules.gatherRateMult;
    }
  }
  for(const [key, cfg] of Object.entries(ALT_GATHER)){
    if(cfg.resource!==resKey) continue;
    const b = s.menuBuildings[key];
    if(b.level>0 && b.assigned>0) prod += b.assigned*GATHER_RATE*cfg.rateMult*(1+(s.upgrades[resKey]||0))*s.rules.gatherRateMult;
  }
  let cons = 0;
  if(resKey==="nourriture"){
    cons = s.population*FOOD_CONSUMPTION;
  } else if(resKey==="or"){
    const b = s.menuBuildings.barracks;
    if(b && b.assignedSoldiers) cons = b.assignedSoldiers * s.rules.defenseSoldierGoldCost;
  }
  return { prod, cons, net: prod-cons };
}

// ---------------------------------------------------------------------
// RECRUTEMENT — transformer un habitant "en réserve" en habitant actif
// ---------------------------------------------------------------------
function recruitCost(s){
  return Math.ceil(s.rules.recruitCostBase * Math.pow(s.rules.recruitCostGrowth, s.recruitedCount));
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
function scaledVillageCost(s){
  const scaled = {};
  for(const [res,amt] of Object.entries(VILLAGE_COST)) scaled[res] = Math.ceil(amt * s.rules.buildCostMult);
  return scaled;
}

function canAffordVillage(s){
  const cost = scaledVillageCost(s);
  return Object.entries(cost).every(([res,amt]) => (s.resources[res]||0) >= amt);
}

function foundVillage(s){
  if(s.villageFounded){ toast("Le Village est déjà fondé."); return; }
  if(!canAffordVillage(s)){ toast("Ressources insuffisantes pour fonder le Village."); return; }
  const cost = scaledVillageCost(s);
  for(const [res,amt] of Object.entries(cost)) s.resources[res] -= amt;
  s.villageFounded = true;
  for(const site of s.researchSites){
    if(RESEARCH_TYPES[site.type].unlockedByVillage) site.locked = false;
  }
  toast("Le Village est fondé ! Le menu de construction est disponible.");
}

// Coût mis à l'échelle par niveau pour les bâtiments à niveaux illimités
// (townhall, house, forge, treasury, mill) : chaque niveau coûte
// LEVEL_COST_MULTIPLIER fois plus, puis le résultat est multiplié par
// buildCostMult (palier de difficulté) — y compris pour les bâtiments à
// coût fixe (maxLevel non nul), qui restent eux aussi affectés.
function costForLevel(s, def, currentLevel){
  const mult = (def.maxLevel !== null ? 1 : Math.pow(LEVEL_COST_MULTIPLIER, currentLevel)) * s.rules.buildCostMult;
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
    const cost = costForLevel(s, def, b.level);
    for(const [res,amt] of Object.entries(cost)){
      const have = Math.floor(s.resources[res]||0);
      lines.push({label:`${iconFor(res)} ${have}/${amt}`, ok: have >= amt});
    }
  }

  return { locked, maxed, building:b.building, lines };
}

function buildTimeForLevel(s, currentLevel){
  return Math.round((BUILD_TIME_BASE + currentLevel*BUILD_TIME_PER_LEVEL) * s.rules.buildTimeMult);
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
  const cost = costForLevel(s, def, b.level);
  for(const [res,amt] of Object.entries(cost)) s.resources[res] -= amt;
  b.building = true;
  b.buildTimeTotal = buildTimeForLevel(s, b.level);
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
function freshDefenseState(rules){
  return { active:true, assaultCount:0, ticksUntilWave: rules.defenseFirstWaveTicks, intervalTotal: rules.defenseFirstWaveTicks, lastResult:null };
}

function currentDefenseScore(s){
  const b = s.menuBuildings.barracks;
  if(!b || b.level<=0) return 0;
  return (b.assignedSoldiers||0) * s.rules.defensePerSoldier;
}

function currentWaveThreshold(s){
  const thresholds = s.rules.defenseWaveThresholds;
  const idx = Math.min(s.defense.assaultCount, thresholds.length-1);
  return thresholds[idx];
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

// Solde d'or des soldats : en plus de la nourriture que consomme tout
// habitant actif, chaque soldat assigné coûte rules.defenseSoldierGoldCost
// or/tick. Si le stock d'or ne suffit plus, les soldats en surnombre
// désertent un par un (plutôt que de laisser l'or passer sous zéro).
function paySoldierUpkeep(s){
  const b = s.menuBuildings.barracks;
  if(!b || !b.assignedSoldiers) return;
  const unitCost = s.rules.defenseSoldierGoldCost;
  const fullCost = b.assignedSoldiers * unitCost;
  if((s.resources.or||0) >= fullCost){
    s.resources.or -= fullCost;
    return;
  }
  let soldiers = b.assignedSoldiers;
  while(soldiers > 0 && (s.resources.or||0) < soldiers * unitCost){
    soldiers--;
  }
  const deserted = b.assignedSoldiers - soldiers;
  b.assignedSoldiers = soldiers;
  s.resources.or = Math.max(0, (s.resources.or||0) - soldiers * unitCost);
  if(deserted > 0){
    toast(`⚠️ Solde d'or insuffisant : ${deserted} soldat(s) déserte(nt) la Caserne.`);
  }
}

function resolveDefenseWave(s){
  const threshold = currentWaveThreshold(s);
  const score = currentDefenseScore(s);
  const waveNumber = s.defense.assaultCount + 1;
  const success = score >= threshold;
  const lossRatio = s.rules.defenseLossRatio;

  if(success){
    toast(`🛡️ Vague d'assaut n°${waveNumber} repoussée ! Défense ${score}/${threshold}.`);
    s.defense.lastResult = { waveNumber, success:true, score, threshold };
  } else {
    const lostAmounts = {};
    for(const res of STORABLE_RESOURCES){
      const have = s.resources[res]||0;
      const lost = Math.floor(have*lossRatio);
      s.resources[res] = have - lost;
      lostAmounts[res] = lost;
    }
    toast(`⚠️ Vague d'assaut n°${waveNumber} ! Défense insuffisante (${score}/${threshold}) : -${Math.round(lossRatio*100)}% des stocks.`);
    s.defense.lastResult = { waveNumber, success:false, score, threshold, lostAmounts };
  }

  s.defense.assaultCount++;
  s.defense.ticksUntilWave = s.rules.defenseWaveIntervalTicks;
  s.defense.intervalTotal = s.rules.defenseWaveIntervalTicks;
  s.justDefenseEvent = true;
}

// Actif dès le début de la partie (voir freshDefenseState) : le compte à
// rebours tourne que la Caserne existe ou non. Si elle n'existe pas encore
// (ou n'a aucun soldat), currentDefenseScore() vaut 0 et la vague est
// automatiquement perdue à son arrivée.
function tickDefense(s){
  s.defense.ticksUntilWave--;
  if(s.defense.ticksUntilWave <= 0){
    resolveDefenseWave(s);
  }
}

// =====================================================================
// FAMINE — la population décline si la nourriture reste à 0 trop longtemps
// =====================================================================
// Tant que la nourriture est > 0, rien ne se passe (compteur remis à 0).
// Dès qu'elle tombe à 0 : un délai de grâce (famineGraceTicks) s'écoule
// avant la 1ère mort. Ensuite, un habitant meurt toutes les
// famineDeathIntervalBase secondes, cet intervalle se réduisant à chaque
// mort (×famineDeathIntervalDecay) jusqu'à un plancher
// (famineDeathIntervalFloor) : plus la famine dure, plus elle devient
// meurtrière. Le compteur se réinitialise entièrement dès que la
// nourriture repasse au-dessus de 0.
function freshFamineState(){
  return { ticksAtZero:0, deathsInEpisode:0, ticksSinceLastDeath:0 };
}

function tickFamine(s){
  const f = s.famine;
  if(s.resources.nourriture > 0){
    if(f.ticksAtZero > 0){ f.ticksAtZero=0; f.deathsInEpisode=0; f.ticksSinceLastDeath=0; }
    return;
  }
  f.ticksAtZero++;
  if(f.ticksAtZero <= s.rules.famineGraceTicks) return;

  f.ticksSinceLastDeath++;
  const interval = Math.max(
    s.rules.famineDeathIntervalFloor,
    Math.round(s.rules.famineDeathIntervalBase * Math.pow(s.rules.famineDeathIntervalDecay, f.deathsInEpisode))
  );
  if(f.ticksSinceLastDeath >= interval){
    f.ticksSinceLastDeath = 0;
    f.deathsInEpisode++;
    killOneHabitant(s);
  }
}

// Fait mourir un habitant de faim : retire 1 de la population, puis
// libère en priorité un poste de soldat (surnuméraire une fois la
// population réduite), sinon un poste de récolte/recherche quelconque,
// pour que les effectifs assignés ne dépassent jamais la population réelle.
function killOneHabitant(s){
  if(s.population <= 0) return;
  s.population--;
  toast("💀 Un habitant est mort de faim.");
  enforcePopulationCaps(s);
}

function enforcePopulationCaps(s){
  let overflow = -getFreePopulation(s);
  if(overflow <= 0) return;
  const b = s.menuBuildings.barracks;
  while(overflow > 0 && b && (b.assignedSoldiers||0) > 0){
    b.assignedSoldiers--; overflow--;
  }
  for(const key of Object.keys(ALT_GATHER)){
    const bb = s.menuBuildings[key];
    while(overflow > 0 && bb && (bb.assigned||0) > 0){
      bb.assigned--; overflow--;
    }
  }
  for(const site of s.researchSites){
    while(overflow > 0 && site.assigned > 0){
      site.assigned--; overflow--;
    }
  }
}

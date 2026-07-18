// =====================================================================
// SIMULATION
// =====================================================================
function currentSeason(s){ return SEASONS[s.seasonIdx]; }
function isNight(s){
  const dayProgress = (s.tick % TICKS_PER_DAY) / TICKS_PER_DAY;
  return dayProgress >= NIGHT_START_RATIO;
}

function getFreePopulation(s){
  const busy = s.researchSites.reduce((sum, site) => sum + site.assigned, 0);
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
  if(delta > 0){
    if(site.assigned >= GATHER_CAP){ toast(`Cap atteint : max ${GATHER_CAP} habitants sur cette zone.`); return; }
    if(getFreePopulation(s) <= 0){ toast("Aucun habitant disponible."); return; }
  } else {
    if(site.assigned <= 0) return;
  }
  site.assigned += delta;
  if(site.assigned < 0) site.assigned = 0;
}

function simTick(s){
  s.tick++;
  if(s.tick % TICKS_PER_DAY === 0){
    s.day++;
    if((s.day-1) % DAYS_PER_SEASON === 0) s.seasonIdx = (s.seasonIdx+1) % SEASONS.length;
  }

  s.justDiscovered = [];
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
            if(other.type !== "nourriture") other.locked = false;
          }
          toast("De nouveaux sites apparaissent à l'horizon...");
        }
      }
      continue;
    }

    // Récolte manuelle sur zone découverte
    if(site.type !== "hotelville" && site.assigned > 0){
      s.resources[site.type] = (s.resources[site.type]||0) + site.assigned * GATHER_RATE;
    }
  }

  // Consommation de nourriture : seulement si la zone nourriture est
  // découverte ET a du monde assigné ce tick précis ("income actif").
  const foodSite = siteByType(s, "nourriture");
  if(foodSite && foodSite.discovered && foodSite.assigned > 0){
    s.resources.nourriture = Math.max(0, s.resources.nourriture - s.population*FOOD_CONSUMPTION);
  }
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
  toast("Le Village est fondé ! Le menu de construction est disponible.");
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

  if(!locked){
    for(const [res,amt] of Object.entries(def.cost)){
      const have = Math.floor(s.resources[res]||0);
      lines.push({label:`${iconFor(res)} ${have}/${amt}`, ok: have >= amt});
    }
  }

  return { locked, maxed: def.maxLevel!==null && b.level>=def.maxLevel, lines };
}

function buildMenuBuilding(s, key){
  if(!s.villageFounded) return;
  const def = MENU_BUILDINGS[key];
  const b = s.menuBuildings[key];
  const status = getMenuBuildStatus(s, key);
  if(status.locked){ toast("Prérequis non remplis pour ce bâtiment."); return; }
  if(status.maxed){ toast("Niveau maximum atteint."); return; }
  if(!status.lines.every(l=>l.ok)){ toast("Ressources insuffisantes."); return; }
  for(const [res,amt] of Object.entries(def.cost)) s.resources[res] -= amt;
  b.level++;
  toast(b.level===1 ? `${def.name} construit(e).` : `${def.name} amélioré(e) au niveau ${b.level}.`);
}

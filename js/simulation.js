// =====================================================================
// SIMULATION
// =====================================================================
function currentSeason(s){ return SEASONS[s.seasonIdx]; }
function isNight(s){
  const dayProgress = (s.tick % TICKS_PER_DAY) / TICKS_PER_DAY;
  return dayProgress >= NIGHT_START_RATIO;
}

function getFreePopulation(s){
  const busy = s.researchSites.reduce((sum, site) => sum + (site.discovered ? 0 : site.assigned), 0);
  return s.population - busy;
}

function assignToSite(s, site, delta){
  if(site.discovered || site.locked) return;
  if(delta > 0){
    if(getFreePopulation(s) <= 0){
      toast("Aucun habitant disponible pour cette recherche.");
      return;
    }
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
    if(site.discovered || site.locked || site.assigned <= 0) continue;
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
  }
}

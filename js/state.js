// =====================================================================
// STATE — génération de la partie fraîche (carte procédurale organique)
// =====================================================================
let state = null;

function mulberry32(seed){
  return function(){
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function freshState(){
  const seed = Math.floor(Math.random()*1e9);
  const rand = mulberry32(seed);

  const s = {
    tick:0, day:1, seasonIdx:0, speed:1,
    resources: { bois:0, pierre:0, nourriture:0, or:0 },
    population: START_POPULATION,
    seed,
    decor: generateDecor(rand),
    researchSites: [],
    storage: null,
    selected: null, // {kind:'site', type} | {kind:'storage'}
  };

  const taken = [];
  function pickSpot(){
    for(let attempt=0; attempt<500; attempt++){
      const x = 60 + rand()*(MAP_W-120);
      const y = 60 + rand()*(MAP_H-120);
      const ok = taken.every(p => Math.hypot(p.x-x, p.y-y) >= MARKER_MIN_DIST);
      if(ok){ taken.push({x,y}); return {x,y}; }
    }
    const x = 60 + rand()*(MAP_W-120), y = 60 + rand()*(MAP_H-120);
    taken.push({x,y});
    return {x,y};
  }

  for(const type of Object.keys(RESEARCH_TYPES)){
    const pos = pickSpot();
    s.researchSites.push({
      type, x:pos.x, y:pos.y,
      effortTotal: RESEARCH_TYPES[type].effort,
      effortRemaining: RESEARCH_TYPES[type].effort,
      assigned: 0,
      discovered: false,
    });
  }
  const storagePos = pickSpot();
  s.storage = { x:storagePos.x, y:storagePos.y };

  return s;
}

// Génère les éléments décoratifs de la carte : un lac sur un bord aléatoire,
// des clusters de forêt et des formations rocheuses, tous en coordonnées
// pixel continues (aucune grille). Purement visuel en Phase 1.
function generateDecor(rand){
  const side = Math.floor(rand()*4); // 0=haut 1=droite 2=bas 3=gauche
  const lakeCenter = [
    {x: MAP_W*(0.3+rand()*0.4), y: -30},
    {x: MAP_W+30, y: MAP_H*(0.3+rand()*0.4)},
    {x: MAP_W*(0.3+rand()*0.4), y: MAP_H+30},
    {x: -30, y: MAP_H*(0.3+rand()*0.4)},
  ][side];
  const lake = { cx:lakeCenter.x, cy:lakeCenter.y, r: 140+rand()*60, seedOffset: rand()*1000 };

  const forests = [];
  const nForests = 5 + Math.floor(rand()*3);
  for(let i=0;i<nForests;i++){
    forests.push({
      cx: 40+rand()*(MAP_W-80), cy: 40+rand()*(MAP_H-80),
      r: 35+rand()*35, seedOffset: rand()*1000,
    });
  }

  const rocks = [];
  const nRocks = 3 + Math.floor(rand()*3);
  for(let i=0;i<nRocks;i++){
    rocks.push({
      cx: 40+rand()*(MAP_W-80), cy: 40+rand()*(MAP_H-80),
      r: 22+rand()*20, seedOffset: rand()*1000,
    });
  }

  return { lake, forests, rocks };
}

function siteByType(s, type){
  return s.researchSites.find(site => site.type===type) || null;
}

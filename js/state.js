// =====================================================================
// STATE — génération de la partie fraîche
// =====================================================================
let state = null;

function pseudoRand(x,y,seed){
  const v = Math.sin(x*127.1 + y*311.7 + seed*74.7) * 43758.5453;
  return v - Math.floor(v);
}

function freshState(){
  const seed = Math.random()*1000;
  const s = {
    tick:0, day:1, seasonIdx:0, speed:1,
    resources: { bois:0, pierre:0, nourriture:0, or:0 },
    population: START_POPULATION,
    tiles: [],
    researchSites: [],
    storage: null,
    selected: null, // {kind:'site', index} | {kind:'storage'} | {kind:'tile', x, y}
  };

  // Terrain décoratif (aucun effet fonctionnel en Phase 1)
  for(let y=0;y<GRID_H;y++){
    for(let x=0;x<GRID_W;x++){
      let terrain = "grass";
      const r = pseudoRand(x,y,seed);
      if(r < 0.12) terrain = "forest";
      else if(r < 0.18) terrain = "stoneDeposit";
      else if(r < 0.26) terrain = "fertile";
      s.tiles.push({x,y,terrain});
    }
  }

  // Placement aléatoire des 5 marqueurs (4 recherches + entrepôt), avec
  // une distance minimale entre eux pour rester lisibles sur la carte.
  const MIN_DIST = 3;
  const taken = [];
  function pickSpot(){
    for(let attempt=0; attempt<400; attempt++){
      const x = 1 + Math.floor(Math.random()*(GRID_W-2));
      const y = 1 + Math.floor(Math.random()*(GRID_H-2));
      const ok = taken.every(p => Math.abs(p.x-x)+Math.abs(p.y-y) >= MIN_DIST);
      if(ok){ taken.push({x,y}); return {x,y}; }
    }
    // fallback si jamais on n'a pas trouvé (grille trop petite) : position libre quelconque
    const x = 1 + Math.floor(Math.random()*(GRID_W-2));
    const y = 1 + Math.floor(Math.random()*(GRID_H-2));
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

function getTile(s,x,y){
  if(x<0||y<0||x>=GRID_W||y>=GRID_H) return null;
  return s.tiles[y*GRID_W+x];
}

function siteAt(s,x,y){
  return s.researchSites.find(site => site.x===x && site.y===y) || null;
}

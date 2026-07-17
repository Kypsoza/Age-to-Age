// STATE
// ---------------------------------------------------------------------
let state = null;

function freshState(){
  const s = {
    tick: 0, day: 1, seasonIdx: 0, speed: 1,
    resources: { bois: 40, pierre: 10, nourriture: 20, or: 0 },
    globalCap: { bois: 300, pierre: 300, nourriture: 300 },
    population: 4, popCap: 12,
    tiles: [],
    buildings: {}, // key -> {level:0, inv:{}}
  };
  for(const key of Object.keys(BUILDINGS)) s.buildings[key] = {level:0, inv:{}, workers:0};

  for(let y=0;y<GRID_H;y++){
    for(let x=0;x<GRID_W;x++){
      s.tiles.push({x,y,terrain:"grass"});
    }
  }
  // terrain dédié sous chaque emplacement de bâtiment
  for(const key of Object.keys(BUILDINGS)){
    const slot = BUILDINGS[key].slot;
    setTerrain(s, slot.x, slot.y, BUILDINGS[key].terrain);
  }
  // routes fixes reliant l'Hôtel de Ville à chaque emplacement (segments alignés)
  for(const key of Object.keys(BUILDINGS)){
    drawRoadPath(s, TOWNHALL_POS, BUILDINGS[key].slot);
  }
  return s;
}

function setTerrain(s,x,y,terrain){
  const t = s.tiles[y*GRID_W+x];
  if(t) t.terrain = terrain;
}
function getTile(s,x,y){
  if(x<0||y<0||x>=GRID_W||y>=GRID_H) return null;
  return s.tiles[y*GRID_W+x];
}
function drawRoadPath(s, from, to){
  // chemin en L : d'abord horizontal, puis vertical
  let x = from.x, y = from.y;
  while(x !== to.x){
    x += (to.x > x) ? 1 : -1;
    if(!(x===to.x && y===to.y)) setTerrain(s,x,y,"road");
  }
  while(y !== to.y){
    y += (to.y > y) ? 1 : -1;
    if(!(x===to.x && y===to.y)) setTerrain(s,x,y,"road");
  }
}

// ---------------------------------------------------------------------

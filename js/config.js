/* =====================================================================
   CITY BUILDER ÉVOLUTIF — MILESTONE 1 (rev. 2)
   Un seul bâtiment de chaque type, à emplacement fixe sur la carte.
   On le construit / l'améliore via le menu horizontal du bas ou la
   flèche ▲ affichée au-dessus du bâtiment une fois construit.
   ===================================================================== */

// ---------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------
const GRID_W = 17, GRID_H = 11;
const TILE_PX = 42;
const TICK_MS = 1000;
const TICKS_PER_DAY = 20;
const DAYS_PER_SEASON = 6;
const NIGHT_START_RATIO = 0.62;
const SAVE_KEY = "citybuilder_save_v2";
const AUTOSAVE_MS = 120000;

const SEASONS = [
  {name:"Printemps", icon:"🌱", foodMult:1.0},
  {name:"Été",        icon:"☀️", foodMult:1.15},
  {name:"Automne",    icon:"🍂", foodMult:0.85},
  {name:"Hiver",      icon:"❄️", foodMult:0.0},
];

const TOWNHALL_POS = {x:8, y:5};

// Chaque bâtiment : emplacement fixe, terrain requis (cosmétique), et
// une liste de "levels" — levels[0] = prérequis/effets du niveau 1,
// levels[1] = niveau 2, etc.
const BUILDINGS = {
  woodcutter: {
    name:"Camp de Bûcherons", icon:"🪓", slot:{x:8,y:2}, terrain:"forest", produces:"bois",
    desc:"Récolte le bois du gisement forestier. Le rendement dépend du nombre de travailleurs assignés.",
    levels:[
      {cost:{bois:5},              rate:1.0, localCap:20, popReq:2, maxWorkers:2},
      {cost:{bois:20,pierre:5},    rate:2.0, localCap:35, popReq:4, maxWorkers:4},
      {cost:{bois:50,pierre:15},   rate:3.5, localCap:60, popReq:6, maxWorkers:6},
    ]
  },
  quarry: {
    name:"Carrière", icon:"⛏️", slot:{x:12,y:5}, terrain:"stoneDeposit", produces:"pierre",
    desc:"Extrait la pierre d'un gisement rocheux. Le rendement dépend du nombre de travailleurs assignés.",
    levels:[
      {cost:{bois:10},             rate:0.7, localCap:20, popReq:2, maxWorkers:2},
      {cost:{bois:25,pierre:10},   rate:1.4, localCap:35, popReq:4, maxWorkers:4},
      {cost:{bois:60,pierre:25},   rate:2.5, localCap:60, popReq:6, maxWorkers:6},
    ]
  },
  farm: {
    name:"Enclos & Cueillette", icon:"🌾", slot:{x:8,y:8}, terrain:"fertile", produces:"nourriture",
    desc:"Produit de la nourriture. Rendement nul en hiver. Le rendement dépend du nombre de travailleurs assignés.",
    levels:[
      {cost:{bois:8},              rate:1.4, localCap:30, popReq:2, maxWorkers:2},
      {cost:{bois:22,pierre:5},    rate:2.6, localCap:50, popReq:4, maxWorkers:4},
      {cost:{bois:55,pierre:15},   rate:4.5, localCap:80, popReq:6, maxWorkers:6},
    ]
  },
  warehouse: {
    name:"Entrepôt", icon:"🏚️", slot:{x:4,y:5}, terrain:"grass", isStorage:true,
    desc:"Augmente la capacité de stockage globale de la cité.",
    levels:[
      {cost:{bois:15,pierre:5},    storageBonus:150, popReq:1},
      {cost:{bois:40,pierre:20},   storageBonus:350, popReq:2},
      {cost:{bois:90,pierre:45},   storageBonus:700, popReq:3},
    ]
  },
};

const TERRAIN_LABELS = {
  grass:"Herbe", forest:"Gisement de bois", stoneDeposit:"Gisement de pierre",
  fertile:"Terre fertile", road:"Route"
};

// pré-calcul : coordonnée -> clé de bâtiment
const SLOT_BY_COORD = {};
for(const key of Object.keys(BUILDINGS)){
  const s = BUILDINGS[key].slot;
  SLOT_BY_COORD[s.x+","+s.y] = key;
}

// ---------------------------------------------------------------------

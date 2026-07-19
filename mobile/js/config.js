// =====================================================================
// CONFIG (MOBILE) — mêmes règles de jeu que la version PC, dimensions de
// carte adaptées au portrait. state.js et simulation.js sont partagés tels
// quels avec la version PC (chargés depuis ../../js/).
// =====================================================================
const MAP_W = 650, MAP_H = 1050;  // carte verticale, adaptée à un écran mobile en portrait
const MARKER_MIN_DIST = 130;
const TICK_MS = 1000;
const TICKS_PER_DAY = 20;
const DAYS_PER_SEASON = 6;
const NIGHT_START_RATIO = 0.62;
const SAVE_KEY = "age2age_save_mobile_v1"; // sauvegarde séparée de la version PC (dimensions de carte différentes)
const AUTOSAVE_MS = 120000;

const SEASONS = [
  {name:"Printemps", icon:"🌱"},
  {name:"Été",        icon:"☀️"},
  {name:"Automne",    icon:"🍂"},
  {name:"Hiver",      icon:"❄️"},
];

const START_POPULATION = 5;
const START_FOOD = 50;

const RESEARCH_TYPES = {
  nourriture: { label:"Zone de Nourriture", icon:"❓", revealedIcon:"🌾", effort:40,
    desc:"Un terrain fertile où la tribu pourra cultiver ou chasser." },
  bois:       { label:"Zone Boisée", icon:"❓", revealedIcon:"🪵", effort:40,
    desc:"Une forêt dense, riche en bois de charpente." },
  or:         { label:"Gisement d'Or", icon:"❓", revealedIcon:"✨", effort:50,
    desc:"Des vestiges technologiques enfouis, brillants comme de l'or." },
  hotelville: { label:"Emplacement de l'Hôtel de Ville", icon:"❓", revealedIcon:"🏛️", effort:35,
    desc:"L'endroit où, inconsciemment, la tribu se sent chez elle. Un écho de mémoire génétique." },
  pierre:     { label:"Carrière de Pierre", icon:"❓", revealedIcon:"🪨", effort:45,
    desc:"Un affleurement rocheux, exploitable une fois le Village fondé.", unlockedByVillage:true },
};

const TERRAIN_LABELS = {
  grass:"Herbe", forest:"Forêt", stoneDeposit:"Formation rocheuse", water:"Étendue d'eau"
};

const GATHER_RATE = 0.4;
const GATHER_CAP_BASE = 3;
const GATHER_CAP_PER_HDV_LEVEL = 5;
const FOOD_CONSUMPTION = 0.12;
const LEVEL_COST_MULTIPLIER = 1.75;

const BUILD_TIME_BASE = 18;
const BUILD_TIME_PER_LEVEL = 9;

const RECRUIT_COST_BASE = 8;
const RECRUIT_COST_GROWTH = 1.4;

const ALT_GATHER = {
  huntlodge: { resource:"nourriture", rateMult:1.5 },
  fishcabin: { resource:"nourriture", rateMult:2.0 },
};

const STORAGE_CAP_BASE = 80;
const STORAGE_CAP_PER_TIER = 60;
const STORAGE_TIER_COST_BASE = { bois:{bois:10,pierre:10}, pierre:{bois:15,or:5}, nourriture:{bois:10,pierre:5} };
const STORAGE_TIER_COST_MULTIPLIER = 1.5;
const STORABLE_RESOURCES = ["bois","pierre","nourriture"];

const VILLAGE_COST = { bois:30, or:15 };

const MENU_BUILDINGS = {
  townhall: { name:"Hôtel de Ville", icon:"🏛️", cost:{bois:25,or:10}, requires:[], maxLevel:null,
    desc:"Le cœur de la tribu. Débloque tous les autres bâtiments. Chaque niveau augmente de "+GATHER_CAP_PER_HDV_LEVEL+" le plafond d'habitants assignables par zone/bâtiment." },
  house: { name:"Maison", icon:"🏠", cost:{bois:15,pierre:8}, requires:["townhall"], maxLevel:null,
    desc:"+5 places en réserve par niveau. Chaque habitant doit ensuite être recruté (coûte de la nourriture) pour devenir actif." },
  forge: { name:"Forge", icon:"⚒️", cost:{bois:20,pierre:10,or:5}, requires:["townhall"], maxLevel:null,
    desc:"Chaque niveau débloque un palier d'amélioration du Bois ET de la Pierre (+100% cumulatif chacun)." },
  huntlodge: { name:"Pavillon de Chasse", icon:"🏹", cost:{bois:18,pierre:5}, requires:["forge"], maxLevel:1,
    desc:"Devient un point de récolte de nourriture sur la carte, ×1.5 le rendement d'un site classique." },
  treasury: { name:"Salle du Trésor", icon:"💰", cost:{pierre:12,or:15}, requires:["forge"], maxLevel:null,
    desc:"Chaque niveau débloque un palier d'amélioration de l'Or (+100% cumulatif)." },
  fishcabin: { name:"Cabane de Pêche", icon:"🎣", cost:{bois:15,pierre:8}, requires:["huntlodge"], maxLevel:1,
    desc:"Point de récolte de nourriture sur l'eau, ×2 le rendement d'un site classique (meilleur que le Pavillon)." },
  mill: { name:"Moulin", icon:"🌾", cost:{bois:15,pierre:15,or:5}, requires:["huntlodge","fishcabin"], requiresAny:true, maxLevel:null,
    desc:"Chaque niveau débloque un palier d'amélioration de la Nourriture (+100% cumulatif)." },
  barracks: { name:"Caserne", icon:"🛡️", cost:{bois:20,pierre:20,or:10}, requires:["house"], requiresLevel:{house:2}, maxLevel:1,
    desc:"Recrute des soldats pour la défense (effet complet en Phase 8)." },
};
const MENU_ORDER = ["townhall","house","forge","huntlodge","fishcabin","treasury","mill","barracks"];

const UPGRADES = {
  bois:       { buildingKey:"forge",    label:"Bois",       cost:{or:15} },
  pierre:     { buildingKey:"forge",    label:"Pierre",     cost:{bois:15} },
  or:         { buildingKey:"treasury", label:"Or",         cost:{bois:15,pierre:10} },
  nourriture: { buildingKey:"mill",     label:"Nourriture", cost:{bois:10,or:10} },
};
const UPGRADE_COST_MULTIPLIER = 1.6;

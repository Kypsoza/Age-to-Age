// =====================================================================
// CONFIG (MOBILE) — mêmes règles de jeu que la version PC, dimensions de
// carte adaptées au portrait. state.js et simulation.js sont partagés tels
// quels avec la version PC (chargés depuis ../../js/).
// =====================================================================
const MAP_W = 650, MAP_H = 1050;
const MARKER_MIN_DIST = 130;
const TICK_MS = 1000;
const TICKS_PER_DAY = 20;
const DAYS_PER_SEASON = 6;
const NIGHT_START_RATIO = 0.62;
const SAVE_KEY = "age2age_save_mobile_v2";
const AUTOSAVE_MS = 120000;

const SEASONS = [
  {name:"Printemps", icon:"🌱"},
  {name:"Été",        icon:"☀️"},
  {name:"Automne",    icon:"🍂"},
  {name:"Hiver",      icon:"❄️"},
];

// START_POPULATION et START_FOOD sont désormais définis par palier de
// difficulté (voir DIFFICULTIES en bas de fichier), identique à la version PC.

const RESEARCH_TYPES = {
  nourriture: { label:"Zone de Nourriture", icon:"❓", revealedIcon:"🌾", effort:40,
    desc:"Un terrain fertile où la tribu pourra cultiver ou chasser." },
  bois:       { label:"Zone Boisée", icon:"❓", revealedIcon:"🪵", effort:40,
    desc:"Une forêt dense, riche en bois de charpente." },
  or:         { label:"Gisement d'Or", icon:"❓", revealedIcon:"🪙", effort:50,
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
const LEVEL_COST_MULTIPLIER = 1.9;

const BUILD_TIME_BASE = 18;
const BUILD_TIME_PER_LEVEL = 9;

// Coût de recrutement : désormais défini par palier de difficulté.

const ALT_GATHER = {
  huntlodge: { resource:"nourriture", rateMult:1.5 },
  fishcabin: { resource:"nourriture", rateMult:2.0 },
};

const STORAGE_CAP_BASE = 1000;
const STORAGE_CAP_PER_TIER = 1000;
const STORAGE_TIER_COST_BASE = {
  bois:{pierre:12,or:8},
  pierre:{bois:15,or:10},
  nourriture:{bois:10,pierre:8,or:6},
  or:{bois:15,pierre:15},
};
const STORAGE_TIER_COST_MULTIPLIER = 1.7;
const STORABLE_RESOURCES = ["bois","pierre","nourriture","or"];

const VILLAGE_COST = { bois:30, or:15 };

const MENU_BUILDINGS = {
  townhall: { name:"Hôtel de Ville", icon:"🏛️", cost:{bois:25,pierre:15,or:12}, requires:[], maxLevel:null,
    desc:"Le cœur de la tribu. Débloque tous les autres bâtiments. Chaque niveau augmente de "+GATHER_CAP_PER_HDV_LEVEL+" le plafond d'habitants assignables par zone/bâtiment." },
  house: { name:"Maison", icon:"🏠", cost:{bois:18,pierre:12,or:6}, requires:["townhall"], maxLevel:null,
    desc:"+5 places en réserve par niveau. Chaque habitant doit ensuite être recruté (coûte de la nourriture) pour devenir actif." },
  forge: { name:"Forge", icon:"⚒️", cost:{bois:22,pierre:18,or:10}, requires:["townhall"], maxLevel:null,
    desc:"Chaque niveau débloque un palier d'amélioration du Bois ET de la Pierre (+100% cumulatif chacun)." },
  huntlodge: { name:"Pavillon de Chasse", icon:"🏹", cost:{bois:20,pierre:10,or:6}, requires:["forge"], maxLevel:1,
    desc:"Devient un point de récolte de nourriture sur la carte, ×1.5 le rendement d'un site classique." },
  treasury: { name:"Salle du Trésor", icon:"💰", cost:{bois:10,pierre:18,or:20}, requires:["forge"], maxLevel:null,
    desc:"Chaque niveau débloque un palier d'amélioration de l'Or (+100% cumulatif)." },
  fishcabin: { name:"Cabane de Pêche", icon:"🎣", cost:{bois:18,pierre:12,or:8}, requires:["huntlodge"], maxLevel:1,
    desc:"Point de récolte de nourriture sur l'eau, ×2 le rendement d'un site classique (meilleur que le Pavillon)." },
  mill: { name:"Moulin", icon:"🌾", cost:{bois:18,pierre:18,or:10}, requires:["huntlodge","fishcabin"], requiresAny:true, maxLevel:null,
    desc:"Chaque niveau débloque un palier d'amélioration de la Nourriture (+100% cumulatif)." },
  barracks: { name:"Caserne", icon:"🛡️", cost:{bois:22,pierre:22,or:16}, requires:["house"], requiresLevel:{house:2}, maxLevel:1,
    desc:"Recrute des soldats pour la défense (effet complet en Phase 8 — consommera de l'or)." },
};
const MENU_ORDER = ["townhall","house","forge","huntlodge","fishcabin","treasury","mill","barracks"];

const UPGRADES = {
  bois:       { buildingKey:"forge",    label:"Bois",       cost:{pierre:12,or:15} },
  pierre:     { buildingKey:"forge",    label:"Pierre",     cost:{bois:15,or:12} },
  or:         { buildingKey:"treasury", label:"Or",         cost:{bois:15,pierre:15} },
  nourriture: { buildingKey:"mill",     label:"Nourriture", cost:{bois:12,pierre:8,or:10} },
};
const UPGRADE_COST_MULTIPLIER = 1.8;

// =====================================================================
// PHASE 8 — DÉFENSE & ASSAUTS (Caserne)
// =====================================================================
const DEFENSE_WAVE_LOOP_AT_MAX = true;

// =====================================================================
// DIFFICULTÉ — 4 paliers choisis en début de partie (identique à la PC)
// =====================================================================
// Facile/Moyen : délais validés par simulation. Difficile/Très difficile :
// estimés à partir du temps de construction de la Caserne observé (le bot
// de test n'achète pas les améliorations d'income Forge/Trésor) — voir
// js/config.js (PC) pour le détail du calibrage et ses limites.
const DIFFICULTIES = {
  easy: {
    label: "Facile",
    buildCostMult: 0.8,
    gatherRateMult: 1.25,
    researchEffortMult: 0.8,
    buildTimeMult: 0.8,
    startPopulation: 6,
    startFood: 70,
    recruitCostBase: 6,
    recruitCostGrowth: 1.3,
    defenseWaveThresholds: [50, 65, 85, 110, 145],
    defensePerSoldier: 30,
    defenseSoldierGoldCost: 0.12,
    defenseLossRatio: 0.15,
    defenseFirstWaveTicks: 900,
    defenseWaveIntervalTicks: 110,
    defenseWarningTicks: 20,
    famineGraceTicks: 35,
    famineDeathIntervalBase: 35,
    famineDeathIntervalFloor: 18,
    famineDeathIntervalDecay: 0.9,
  },
  medium: {
    label: "Moyen",
    buildCostMult: 1,
    gatherRateMult: 1,
    researchEffortMult: 1,
    buildTimeMult: 1,
    startPopulation: 5,
    startFood: 50,
    recruitCostBase: 8,
    recruitCostGrowth: 1.4,
    defenseWaveThresholds: [50, 65, 85, 110, 145],
    defensePerSoldier: 25,
    defenseSoldierGoldCost: 0.2,
    defenseLossRatio: 0.25,
    defenseFirstWaveTicks: 600,
    defenseWaveIntervalTicks: 90,
    defenseWarningTicks: 15,
    famineGraceTicks: 18,
    famineDeathIntervalBase: 20,
    famineDeathIntervalFloor: 9,
    famineDeathIntervalDecay: 0.8,
  },
  hard: {
    label: "Difficile",
    buildCostMult: 1.2,
    gatherRateMult: 0.8,
    researchEffortMult: 1.2,
    buildTimeMult: 1.15,
    startPopulation: 5,
    startFood: 40,
    recruitCostBase: 10,
    recruitCostGrowth: 1.5,
    defenseWaveThresholds: [55, 72, 94, 122, 159],
    defensePerSoldier: 18,
    defenseSoldierGoldCost: 0.25,
    defenseLossRatio: 0.35,
    defenseFirstWaveTicks: 780,
    defenseWaveIntervalTicks: 75,
    defenseWarningTicks: 10,
    famineGraceTicks: 18,
    famineDeathIntervalBase: 20,
    famineDeathIntervalFloor: 9,
    famineDeathIntervalDecay: 0.8,
  },
  very_hard: {
    label: "Très difficile",
    buildCostMult: 1.4,
    gatherRateMult: 0.65,
    researchEffortMult: 1.4,
    buildTimeMult: 1.3,
    startPopulation: 5,
    startFood: 30,
    recruitCostBase: 12,
    recruitCostGrowth: 1.6,
    defenseWaveThresholds: [60, 80, 104, 136, 177],
    defensePerSoldier: 14,
    defenseSoldierGoldCost: 0.3,
    defenseLossRatio: 0.4,
    defenseFirstWaveTicks: 1500,
    defenseWaveIntervalTicks: 65,
    defenseWarningTicks: 8,
    famineGraceTicks: 18,
    famineDeathIntervalBase: 20,
    famineDeathIntervalFloor: 9,
    famineDeathIntervalDecay: 0.8,
  },
};
const DIFFICULTY_ORDER = ["easy", "medium", "hard", "very_hard"];
const DEFAULT_DIFFICULTY = "medium";

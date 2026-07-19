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
const LEVEL_COST_MULTIPLIER = 1.9; // multiplicateur de coût par niveau pour les bâtiments à niveaux illimités

// Temps de construction (en ticks) : ralentit volontairement la progression
// pour que chaque niveau soit une vraie décision, pas un clic instantané.
const BUILD_TIME_BASE = 18;     // ticks pour un niveau 0→1
const BUILD_TIME_PER_LEVEL = 9; // ticks supplémentaires par niveau déjà atteint

// Coût d'un habitant recruté depuis la réserve (Maison) vers la population
// active. Croissance géométrique : les premiers sont abordables, puis ça
// ralentit nettement pour forcer une gestion progressive de la nourriture.
const RECRUIT_COST_BASE = 8;      // nourriture pour le 1er recrutement
const RECRUIT_COST_GROWTH = 1.4;  // multiplicateur par recrutement déjà effectué

// Pavillon de Chasse et Cabane de Pêche sont de vrais points de récolte
// alternatifs pour la nourriture, avec un meilleur rendement que le site de
// base (multiplicateur appliqué à GATHER_RATE).
const ALT_GATHER = {
  huntlodge: { resource:"nourriture", rateMult:1.5 },
  fishcabin: { resource:"nourriture", rateMult:2.0 },
};

// Entrepôt : plafond de stockage indépendant par ressource. L'Or reste sans
// limite (monnaie virtuelle et sans poids, cf. cahier des charges).
const STORAGE_CAP_BASE = 80;
const STORAGE_CAP_PER_TIER = 60;
const STORAGE_TIER_COST_BASE = {
  bois:{pierre:12,or:8},
  pierre:{bois:15,or:10},
  nourriture:{bois:10,pierre:8,or:6},
};
const STORAGE_TIER_COST_MULTIPLIER = 1.7;
const STORABLE_RESOURCES = ["bois","pierre","nourriture"];

const VILLAGE_COST = { bois:30, or:15 };

// Bâtiments du menu (débloqué une fois le Village fondé). "requires" liste
// les clés d'autres bâtiments du menu qu'il faut avoir construits ;
// "requiresLevel" force un niveau minimum sur l'un d'entre eux ;
// "requiresAny" signifie qu'un seul des "requires" suffit (au lieu de tous).
// Tous les coûts mélangent Bois/Pierre/Or : impossible de tout financer
// avec une seule ressource, il faut répartir ses habitants sur plusieurs
// zones de récolte pour progresser.
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

// Améliorations d'income par ressource : chaque palier (tier) coûte de plus
// en plus cher et ajoute +100% cumulatif à l'income de cette ressource.
// Le coût ne porte jamais sur la ressource qu'on améliore elle-même — pour
// booster le Bois il faut de la Pierre et de l'Or, etc. — afin d'obliger à
// répartir ses habitants sur toutes les zones plutôt que de se spécialiser.
const UPGRADES = {
  bois:       { buildingKey:"forge",    label:"Bois",       cost:{pierre:12,or:15} },
  pierre:     { buildingKey:"forge",    label:"Pierre",     cost:{bois:15,or:12} },
  or:         { buildingKey:"treasury", label:"Or",         cost:{bois:15,pierre:15} },
  nourriture: { buildingKey:"mill",     label:"Nourriture", cost:{bois:12,pierre:8,or:10} },
};
const UPGRADE_COST_MULTIPLIER = 1.8;

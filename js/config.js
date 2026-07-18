// =====================================================================
// CONFIG — PHASE 1 : Genèse, Recherche & Découverte
// =====================================================================
const MAP_W = 1100, MAP_H = 680; // dimensions de la carte en pixels (plus de grille)
const MARKER_MIN_DIST = 150;    // distance mini entre deux marqueurs (px)
const TICK_MS = 1000;
const TICKS_PER_DAY = 20;
const DAYS_PER_SEASON = 6;
const NIGHT_START_RATIO = 0.62;
const SAVE_KEY = "age2age_save_phase1_v3";
const AUTOSAVE_MS = 120000;

const SEASONS = [
  {name:"Printemps", icon:"🌱"},
  {name:"Été",        icon:"☀️"},
  {name:"Automne",    icon:"🍂"},
  {name:"Hiver",      icon:"❄️"},
];

const START_POPULATION = 5;

// Les 4 zones à découvrir en tout début de partie. "effort" = nombre de
// points d'effort nécessaires (1 habitant assigné consomme 1 point/tick).
const RESEARCH_TYPES = {
  nourriture: { label:"Zone de Nourriture", icon:"❓", revealedIcon:"🌾", effort:40,
    desc:"Un terrain fertile où la tribu pourra cultiver ou chasser." },
  bois:       { label:"Zone Boisée", icon:"❓", revealedIcon:"🪵", effort:40,
    desc:"Une forêt dense, riche en bois de charpente." },
  or:         { label:"Gisement d'Or", icon:"❓", revealedIcon:"✨", effort:50,
    desc:"Des vestiges technologiques enfouis, brillants comme de l'or." },
  hotelville: { label:"Emplacement de l'Hôtel de Ville", icon:"❓", revealedIcon:"🏛️", effort:35,
    desc:"L'endroit où, inconsciemment, la tribu se sent chez elle. Un écho de mémoire génétique." },
};

const TERRAIN_LABELS = {
  grass:"Herbe", forest:"Forêt", stoneDeposit:"Formation rocheuse", water:"Étendue d'eau"
};

// Récolte manuelle sur une zone découverte (avant que le vrai bâtiment
// collecteur n'existe — Phase 4). Rendement modeste et volontairement lent.
const GATHER_RATE = 0.4;      // ressource / tick / habitant assigné
const GATHER_CAP_BASE = 3;    // plafond par zone avant que l'Hôtel de Ville existe
const GATHER_CAP_PER_HDV_LEVEL = 5; // bonus de plafond par niveau d'Hôtel de Ville
const FOOD_CONSUMPTION = 0.12; // nourriture / tick / habitant, uniquement si la zone nourriture a du monde assigné ce tick
const LEVEL_COST_MULTIPLIER = 1.6; // multiplicateur de coût par niveau pour les bâtiments à niveaux illimités

const VILLAGE_COST = { bois:30, or:15 };

// Bâtiments du menu (débloqué une fois le Village fondé). "requires" liste
// les clés d'autres bâtiments du menu qu'il faut avoir construits ;
// "requiresLevel" force un niveau minimum sur l'un d'entre eux ;
// "requiresAny" signifie qu'un seul des "requires" suffit (au lieu de tous).
const MENU_BUILDINGS = {
  townhall: { name:"Hôtel de Ville", icon:"🏛️", cost:{bois:25,or:10}, requires:[], maxLevel:null,
    desc:"Le cœur de la tribu. Débloque tous les autres bâtiments. Chaque niveau augmente de "+GATHER_CAP_PER_HDV_LEVEL+" le plafond d'habitants assignables par zone/bâtiment." },
  house: { name:"Maison", icon:"🏠", cost:{bois:15}, requires:["townhall"], maxLevel:null,
    desc:"+5 habitants par niveau, niveaux illimités (effet complet en Phase 5)." },
  forge: { name:"Forge", icon:"⚒️", cost:{bois:20,or:10}, requires:["townhall"], maxLevel:1,
    desc:"Débloque les améliorations d'outils (effet complet en Phase 7)." },
  huntlodge: { name:"Pavillon de Chasse", icon:"🏹", cost:{bois:15}, requires:["forge"], maxLevel:1,
    desc:"Chasse pour la nourriture, bon rendement (effet complet en Phase 4/7)." },
  treasury: { name:"Salle du Trésor", icon:"💰", cost:{or:20}, requires:["forge"], maxLevel:1,
    desc:"Débloque les améliorations d'or (effet complet en Phase 7)." },
  fishcabin: { name:"Cabane de Pêche", icon:"🎣", cost:{bois:20}, requires:["huntlodge"], maxLevel:1,
    desc:"Pêche pour la nourriture, meilleur rendement que la chasse (effet complet en Phase 4/7)." },
  mill: { name:"Moulin", icon:"🌾", cost:{bois:25,or:10}, requires:["huntlodge","fishcabin"], requiresAny:true, maxLevel:1,
    desc:"Débloque les améliorations de nourriture (effet complet en Phase 7)." },
  barracks: { name:"Caserne", icon:"🛡️", cost:{bois:30,or:15}, requires:["house"], requiresLevel:{house:2}, maxLevel:1,
    desc:"Recrute des soldats pour la défense (effet complet en Phase 8)." },
};
const MENU_ORDER = ["townhall","house","forge","huntlodge","fishcabin","treasury","mill","barracks"];

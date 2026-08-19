// =====================================================================
// CONFIG — PHASE 1 : Genèse, Recherche & Découverte
// =====================================================================
const MAP_W = 1100, MAP_H = 680; // dimensions de la carte en pixels (plus de grille)
const MARKER_MIN_DIST = 150;    // distance mini entre deux marqueurs (px)
const TICK_MS = 1000;
const TICKS_PER_DAY = 20;
const DAYS_PER_SEASON = 6;
const NIGHT_START_RATIO = 0.62;
const SAVE_KEY = "age2age_save_phase1_v6";
const AUTOSAVE_MS = 120000;

const SEASONS = [
  {name:"Printemps", icon:"🌱"},
  {name:"Été",        icon:"☀️"},
  {name:"Automne",    icon:"🍂"},
  {name:"Hiver",      icon:"❄️"},
];

// START_POPULATION et START_FOOD sont désormais définis par palier de
// difficulté (voir DIFFICULTIES en bas de fichier) plutôt que fixes ici.

// Les 4 zones à découvrir en tout début de partie. "effort" = nombre de
// points d'effort nécessaires (1 habitant assigné consomme 1 point/tick).
// Ce sont des valeurs DE BASE ; le palier de difficulté applique un
// multiplicateur (researchEffortMult) au moment de la génération de partie.
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

// Récolte manuelle sur une zone découverte (avant que le vrai bâtiment
// collecteur n'existe — Phase 4). Rendement modeste et volontairement lent.
const GATHER_RATE = 0.4;      // ressource / tick / habitant assigné — valeur DE BASE, multipliée par gatherRateMult (difficulté)
const GATHER_CAP_BASE = 3;    // plafond par zone avant que l'Hôtel de Ville existe
const GATHER_CAP_PER_HDV_LEVEL = 5; // bonus de plafond par niveau d'Hôtel de Ville
const FOOD_CONSUMPTION = 0.12; // nourriture / tick / habitant, uniquement si la zone nourriture a du monde assigné ce tick
const LEVEL_COST_MULTIPLIER = 1.9; // multiplicateur de coût par niveau pour les bâtiments à niveaux illimités

// Temps de construction (en ticks) : ralentit volontairement la progression
// pour que chaque niveau soit une vraie décision, pas un clic instantané.
const BUILD_TIME_BASE = 18;     // ticks pour un niveau 0→1 — valeur DE BASE, multipliée par buildTimeMult (difficulté)
const BUILD_TIME_PER_LEVEL = 9; // ticks supplémentaires par niveau déjà atteint — idem

// Coût de recrutement (base + croissance) : désormais défini par palier de
// difficulté (recruitCostBase / recruitCostGrowth dans DIFFICULTIES).

// Pavillon de Chasse et Cabane de Pêche sont de vrais points de récolte
// alternatifs pour la nourriture, avec un meilleur rendement que le site de
// base (multiplicateur appliqué à GATHER_RATE).
const ALT_GATHER = {
  huntlodge: { resource:"nourriture", rateMult:1.5 },
  fishcabin: { resource:"nourriture", rateMult:2.0 },
};

// Entrepôt : plafond de stockage indépendant par ressource, y compris l'Or.
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

const VILLAGE_COST = { bois:30, or:15 }; // valeurs DE BASE, multipliées par buildCostMult (difficulté)

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

// =====================================================================
// PHASE 8 — DÉFENSE & ASSAUTS (Caserne)
// =====================================================================
// La Caserne (barracks) permet d'assigner des habitants comme soldats.
// Chaque soldat assigné apporte un score de Défense. À intervalle régulier,
// une vague d'assaut survient : si le score de Défense est insuffisant face
// au seuil de la vague courante, la tribu perd un pourcentage de chaque
// ressource stockée ; sinon la vague est repoussée sans perte.
// DEFENSE_WAVE_LOOP_AT_MAX : au-delà de la 5e vague, les vagues suivantes
// restent au dernier seuil de la liste, en boucle (jamais plus dur que ça).
const DEFENSE_WAVE_LOOP_AT_MAX = true;

// =====================================================================
// DIFFICULTÉ — 4 paliers choisis en début de partie
// =====================================================================
// Chaque palier définit un jeu complet de règles (rules) calculées et
// vérifiées par simulation :
//  - Chrono : délai avant la 1ère vague, intervalle des suivantes, alerte
//  - Défense : seuils des vagues, score/soldat, coût en or/soldat, perte en
//    cas d'échec
//  - Économie : multiplicateurs sur coût de construction et vitesse de
//    récolte
//  - Rythme : multiplicateurs sur le temps de recherche et de construction
//  - Population & départ : survivants initiaux, nourriture initiale, coût
//    de recrutement
//  - Famine : si la nourriture reste à 0, un habitant meurt après un délai
//    de grâce, puis la fréquence des morts s'accélère (voir tickFamine)
//
// Calibrage (bot de simulation jouant chaque configuration : recherche et
// récolte réparties automatiquement en priorisant survie > fondation du
// Village > construction, jusqu'à avoir une Caserne + assez de soldats
// "payables en or" pour le seuil de la vague 1) :
//  - Facile   : bot prêt en ~3,2 min → 1ère vague à 15 min (large marge)
//  - Moyen    : bot prêt en ~5,5 min → 1ère vague à 10 min (marge confortable)
//  - Difficile / Très difficile : le bot de test ne sait PAS acheter les
//    améliorations d'income (Forge/Trésor), qui sont pourtant l'outil prévu
//    par le jeu pour desserrer la contrainte or/soldats à ces paliers — sans
//    elles, le bot met beaucoup plus longtemps qu'un joueur optimal réel à
//    atteindre le seuil de la vague 1 (jusqu'à ~44 min mesurées en Difficile
//    sans aucune amélioration achetée). Les délais ci-dessous (13 min pour
//    Difficile, 25 min pour Très difficile) sont donc une ESTIMATION
//    raisonnée à partir des temps de construction de la Caserne observés
//    (~10,5 min et ~18 min) plutôt qu'un minimum théorique strictement
//    prouvé — contrairement à Facile/Moyen, ils mériteraient d'être
//    ajustés après un vrai playtest.
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

// =====================================================================
// NAVIGATION PAR ONGLETS
// =====================================================================
function switchTab(tabId){
  document.querySelectorAll(".screen").forEach(s=> s.classList.toggle("active", s.id===tabId));
  document.querySelectorAll("#tabBar button").forEach(b=> b.classList.toggle("active", b.dataset.tab===tabId));
}

// =====================================================================
// GAME LOOP
// =====================================================================
let loopTimer = null;
let overlayActive = true; // écran d'accueil / difficulté / défaite affiché : la simulation est en pause

function startLoop(){
  if(loopTimer) clearInterval(loopTimer);
  loopTimer = setInterval(()=>{
    if(overlayActive || state.speed === 0) return;
    // BUG-P3-003 : reset une seule fois par tick de timer réel (pas dans
    // simTick), sinon en vitesse ×3 les événements des premiers sous-ticks
    // sont écrasés avant qu'updateTickVisuals() ne les lise.
    state.justDiscovered = [];
    state.justCompleted = [];
    state.justDefenseEvent = false;
    for(let i=0;i<state.speed;i++){
      simTick(state);
      if(state.defeated) break;
    }
    updateTickVisuals();
    if(state.defeated) showDefeatScreen();
  }, TICK_MS);
}

// =====================================================================
// ÉCRAN D'ACCUEIL
// =====================================================================
function showHomeScreen(){
  overlayActive = true;
  document.getElementById("difficultyScreen").classList.add("hidden");
  document.getElementById("defeatScreen").classList.add("hidden");
  document.getElementById("homeScreen").classList.remove("hidden");
}
function hideHomeScreen(){
  document.getElementById("homeScreen").classList.add("hidden");
}

// =====================================================================
// ÉCRAN DE DIFFICULTÉ
// =====================================================================
const DIFFICULTY_DESCRIPTIONS = {
  easy: "Chrono souple (15 min avant la 1ère vague), économie généreuse, famine tolérante.",
  medium: "Réglage de référence (10 min avant la 1ère vague). Ni facile ni punitif.",
  hard: "Chrono serré (~30s de marge seulement), économie plus dure, famine plus risquée.",
  very_hard: "Chrono calculé au strict minimum : la moindre hésitation force à recommencer.",
};

function renderDifficultyScreen(){
  const grid = document.getElementById("difficultyGrid");
  grid.innerHTML = "";
  for(const key of DIFFICULTY_ORDER){
    const def = DIFFICULTIES[key];
    const tile = document.createElement("div");
    tile.className = "difficultyTile " + key;
    tile.innerHTML = `<div class="diffName">${def.label}</div><div class="diffDesc">${DIFFICULTY_DESCRIPTIONS[key]}</div>`;
    tile.onclick = ()=> startNewGame(key);
    grid.appendChild(tile);
  }
}

function showDifficultyScreen(){
  overlayActive = true;
  document.getElementById("homeScreen").classList.add("hidden");
  document.getElementById("defeatScreen").classList.add("hidden");
  document.getElementById("difficultyScreen").classList.remove("hidden");
}
function hideDifficultyScreen(){
  document.getElementById("difficultyScreen").classList.add("hidden");
  overlayActive = false;
}

function startNewGame(difficultyKey){
  state = freshState(difficultyKey);
  localStorage.removeItem(SAVE_KEY);
  saveGame(true);
  renderMapBackground();
  renderAll();
  hideDifficultyScreen();
  toast(`Nouvelle partie — difficulté : ${DIFFICULTIES[difficultyKey].label}.`);
}

// =====================================================================
// ÉCRAN DE DÉFAITE
// =====================================================================
function showDefeatScreen(){
  overlayActive = true;
  document.getElementById("homeScreen").classList.add("hidden");
  document.getElementById("defeatMessage").textContent =
    `La tribu s'est éteinte au bout de ${state.day} jour(s), en difficulté ${DIFFICULTIES[state.difficulty].label}.`;
  document.getElementById("defeatScreen").classList.remove("hidden");
  saveGame(true);
}

// =====================================================================
// BADGE DE DIFFICULTÉ
// =====================================================================
function renderDifficultyBadge(){
  const el = document.getElementById("difficultyBadge");
  if(!el || !state) return;
  el.textContent = DIFFICULTIES[state.difficulty] ? DIFFICULTIES[state.difficulty].label : "";
}

// =====================================================================
// RÉGLAGES (icônes engrenage)
// =====================================================================
function showSettingsSheet(){
  document.getElementById("settingsOverlay").classList.remove("hidden");
  document.getElementById("settingsSheet").classList.remove("hidden");
}
function hideSettingsSheet(){
  document.getElementById("settingsOverlay").classList.add("hidden");
  document.getElementById("settingsSheet").classList.add("hidden");
}

// =====================================================================
// INIT
// =====================================================================
function init(){
  const existing = loadGame();
  const compatible = existing && existing.researchSites && existing.decor
    && existing.menuBuildings && existing.buildingPositions && existing.storage
    && existing.upgrades && existing.storageTiers && typeof existing.populationReserve === "number";
  state = compatible ? existing : null;
  if(compatible) ensureStateMigrations(state);

  // --- Écran d'accueil ---
  document.getElementById("btnHomeNewGame").onclick = ()=>{ hideHomeScreen(); showDifficultyScreen(); };
  document.getElementById("btnHomeLoad").onclick = ()=> document.getElementById("fileImport").click();
  document.getElementById("backToHomeBtn").onclick = ()=>{ document.getElementById("difficultyScreen").classList.add("hidden"); showHomeScreen(); };
  document.getElementById("btnDefeatRestart").onclick = ()=> showDifficultyScreen();

  // --- Réglages (engrenages) ---
  document.getElementById("btnSettingsTop").onclick = showSettingsSheet;
  document.getElementById("btnSettingsBottom").onclick = showSettingsSheet;
  document.getElementById("settingsOverlay").onclick = hideSettingsSheet;
  document.getElementById("btnSave").onclick = ()=> saveGame(false);
  document.getElementById("btnExport").onclick = exportGame;
  document.getElementById("btnReset").onclick = ()=>{
    const btn = document.getElementById("btnReset");
    if(btn.dataset.armed === "1"){
      localStorage.removeItem(SAVE_KEY);
      btn.textContent = "🗑️ Nouvelle partie";
      btn.dataset.armed = "0";
      hideSettingsSheet();
      showDifficultyScreen();
    } else {
      btn.dataset.armed = "1";
      btn.textContent = "⚠️ Confirmer ? (tap à nouveau)";
      toast("Tape une seconde fois pour tout effacer et recommencer.");
      setTimeout(()=>{ btn.dataset.armed = "0"; btn.textContent = "🗑️ Nouvelle partie"; }, 4000);
    }
  };
  document.getElementById("fileImport").onchange = (e)=>{
    if(e.target.files[0]) importGame(e.target.files[0]);
    e.target.value = "";
  };

  // --- Navigation par onglets ---
  document.querySelectorAll("#tabBar button").forEach(btn=>{
    btn.onclick = ()=> switchTab(btn.dataset.tab);
  });

  // --- Bottom sheet (site/bâtiment/entrepôt) ---
  document.getElementById("sheetOverlay").onclick = closeSheet;

  // --- Modale info ressources ---
  document.getElementById("infoModalOverlay").onclick = (e)=>{ if(e.target.id==="infoModalOverlay") hideInfoModal(); };
  document.querySelectorAll("[data-info]").forEach(btn=>{
    btn.onclick = ()=>{
      const resKey = btn.dataset.info;
      const label = {bois:"Bois",pierre:"Pierre",nourriture:"Nourriture",or:"Or"}[resKey];
      const income = getResourceIncome(state, resKey);
      const cap = storageCapFor(state, resKey);
      let body = `Stock : ${Math.floor(state.resources[resKey]||0)}/${cap}<br>Production : +${income.prod.toFixed(1)}/s`;
      if(income.cons>0) body += `<br>Consommation : -${income.cons.toFixed(2)}/s`;
      showInfoModal(label, body, iconFor(resKey));
    };
  });

  // --- Vitesse ---
  document.querySelectorAll("#speedControls button").forEach(btn=>{
    btn.onclick = ()=>{
      state.speed = parseInt(btn.dataset.speed,10);
      document.querySelectorAll("#speedControls button").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
    };
  });

  renderDifficultyScreen();
  startLoop();

  if(state){
    renderMapBackground();
    renderAll();
    if(state.defeated){ showDefeatScreen(); }
    else {
      hideHomeScreen();
      document.getElementById("difficultyScreen").classList.add("hidden");
      overlayActive = false;
    }
  } else {
    showHomeScreen();
  }

  setInterval(()=>{ if(state) saveGame(true); }, AUTOSAVE_MS);
  window.addEventListener("beforeunload", ()=>{ if(state) saveGame(true); });
}

init();

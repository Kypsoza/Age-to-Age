// =====================================================================
// GAME LOOP
// =====================================================================
let loopTimer = null;
let overlayActive = true; // écran de difficulté ou de défaite affiché : la simulation est en pause

function startLoop(){
  if(loopTimer) clearInterval(loopTimer);
  loopTimer = setInterval(()=>{
    if(overlayActive || state.speed === 0) return;
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
// ÉCRAN DE DIFFICULTÉ
// =====================================================================
const DIFFICULTY_DESCRIPTIONS = {
  easy: "Chrono souple (15 min avant la 1ère vague), économie généreuse, famine tolérante. Pour découvrir le jeu tranquillement.",
  medium: "Réglage de référence (10 min avant la 1ère vague). Ni facile ni punitif.",
  hard: "Chrono serré (~30s de marge seulement), économie plus dure, famine plus risquée.",
  very_hard: "Chrono calculé au strict minimum : la moindre hésitation force à recommencer. Économie très dure.",
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
  document.getElementById("defeatMessage").textContent =
    `La tribu s'est éteinte au bout de ${state.day} jour(s), en difficulté ${DIFFICULTIES[state.difficulty].label}.`;
  document.getElementById("defeatScreen").classList.remove("hidden");
  saveGame(true);
}

// =====================================================================
// BADGE DE DIFFICULTÉ (topbar)
// =====================================================================
function renderDifficultyBadge(){
  const el = document.getElementById("difficultyBadge");
  if(!el) return;
  el.textContent = DIFFICULTIES[state.difficulty] ? DIFFICULTIES[state.difficulty].label : "";
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

  document.getElementById("btnSave").onclick = ()=> saveGame(false);
  document.getElementById("btnExport").onclick = exportGame;
  document.getElementById("btnImport").onclick = ()=> document.getElementById("fileImport").click();
  document.getElementById("fileImport").onchange = (e)=>{
    if(e.target.files[0]) importGame(e.target.files[0]);
    e.target.value = "";
  };
  document.getElementById("btnReset").onclick = ()=>{
    const btn = document.getElementById("btnReset");
    if(btn.dataset.armed === "1"){
      localStorage.removeItem(SAVE_KEY);
      btn.textContent = "🗑️ Nouvelle partie";
      btn.dataset.armed = "0";
      showDifficultyScreen();
    } else {
      btn.dataset.armed = "1";
      btn.textContent = "⚠️ Confirmer ? (clic à nouveau)";
      toast("Clique une seconde fois pour tout effacer et recommencer.");
      setTimeout(()=>{ btn.dataset.armed = "0"; btn.textContent = "🗑️ Nouvelle partie"; }, 4000);
    }
  };
  document.getElementById("btnDefeatRestart").onclick = ()=> showDifficultyScreen();

  document.querySelectorAll("#speedControls button").forEach(btn=>{
    btn.onclick = ()=>{
      state.speed = parseInt(btn.dataset.speed,10);
      document.querySelectorAll("#speedControls button").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
    };
  });

  renderDifficultyScreen();
  setupResourceTooltips();
  startLoop();

  if(state){
    renderMapBackground();
    renderAll();
    if(state.defeated){ showDefeatScreen(); }
    else { hideDifficultyScreen(); }
  } else {
    showDifficultyScreen();
  }

  setInterval(()=>{ if(state) saveGame(true); }, AUTOSAVE_MS);
  window.addEventListener("beforeunload", ()=>{ if(state) saveGame(true); });
}

init();

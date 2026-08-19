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
let overlayActive = true;

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
// BADGE DE DIFFICULTÉ
// =====================================================================
function renderDifficultyBadge(){
  const el = document.getElementById("difficultyBadge");
  if(!el) return;
  el.textContent = DIFFICULTIES[state.difficulty] ? DIFFICULTIES[state.difficulty].label : "";
}

// =====================================================================
// DÉMO — bascule visuelle entre les 6 Ères (habillage uniquement, aucun
// effet sur la partie en cours : seule l'Ère 1 est réellement développée
// pour l'instant, voir la roadmap). Permet de prévisualiser rapidement le
// design system par variables CSS (.era-1 à .era-6 dans mobile/css/style.css).
// =====================================================================
let currentEraDemo = 1;
function setEra(n){
  currentEraDemo = ((n-1)%6+6)%6 + 1;
  document.body.className = "era-" + currentEraDemo;
}
function cycleEraDemo(){
  setEra(currentEraDemo + 1);
  toast(`Aperçu visuel : Ère ${currentEraDemo} (démo — n'affecte pas la partie).`);
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

  document.querySelectorAll("#tabBar button").forEach(btn=>{
    btn.onclick = ()=> switchTab(btn.dataset.tab);
  });

  document.getElementById("sheetOverlay").onclick = closeSheet;

  document.getElementById("infoModalOverlay").onclick = (e)=>{ if(e.target.id==="infoModalOverlay") hideInfoModal(); };
  document.getElementById("infoModalClose").onclick = hideInfoModal;
  document.querySelectorAll("[data-info]").forEach(btn=>{
    btn.onclick = ()=>{
      const resKey = btn.dataset.info;
      const label = {bois:"Bois",pierre:"Pierre",nourriture:"Nourriture",or:"Or"}[resKey];
      const income = getResourceIncome(state, resKey);
      const cap = storageCapFor(state, resKey);
      let body = `Stock : ${Math.floor(state.resources[resKey]||0)}/${cap}<br>Production : +${income.prod.toFixed(1)}/s`;
      if(income.cons>0) body += `<br>Consommation : -${income.cons.toFixed(2)}/s`;
      showInfoModal(iconFor(resKey)+" "+label, body);
    };
  });

  document.querySelectorAll("#speedControls button").forEach(btn=>{
    btn.onclick = ()=>{
      state.speed = parseInt(btn.dataset.speed,10);
      document.querySelectorAll("#speedControls button").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
    };
  });

  document.getElementById("btnDefeatRestart").onclick = ()=> showDifficultyScreen();
  const eraBtn = document.getElementById("eraDemoBtn");
  if(eraBtn) eraBtn.onclick = cycleEraDemo;

  renderDifficultyScreen();
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

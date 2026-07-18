// =====================================================================
// GAME LOOP
// =====================================================================
let loopTimer = null;
function startLoop(){
  if(loopTimer) clearInterval(loopTimer);
  loopTimer = setInterval(()=>{
    if(state.speed === 0) return;
    for(let i=0;i<state.speed;i++) simTick(state);
    updateTickVisuals();
  }, TICK_MS);
}

// =====================================================================
// INIT
// =====================================================================
function init(){
  const existing = loadGame();
  const compatible = existing && existing.researchSites && existing.decor
    && existing.menuBuildings && existing.buildingPositions && existing.storage
    && existing.upgrades && existing.storageTiers && typeof existing.populationReserve === "number";
  state = compatible ? existing : freshState();

  // Les boutons sont branchés AVANT le premier rendu : si jamais le rendu
  // plante (ex: sauvegarde incompatible), les contrôles restent utilisables
  // (notamment "Nouvelle partie") au lieu de rester figés.
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
      state = freshState();
      localStorage.removeItem(SAVE_KEY);
      saveGame(true);
      renderMapBackground();
      renderAll();
      toast("Nouvelle partie démarrée.");
      btn.textContent = "🗑️ Nouvelle partie";
      btn.dataset.armed = "0";
    } else {
      btn.dataset.armed = "1";
      btn.textContent = "⚠️ Confirmer ? (clic à nouveau)";
      toast("Clique une seconde fois pour tout effacer et recommencer.");
      setTimeout(()=>{ btn.dataset.armed = "0"; btn.textContent = "🗑️ Nouvelle partie"; }, 4000);
    }
  };

  document.querySelectorAll("#speedControls button").forEach(btn=>{
    btn.onclick = ()=>{
      state.speed = parseInt(btn.dataset.speed,10);
      document.querySelectorAll("#speedControls button").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
    };
  });

  renderMapBackground();
  renderAll();
  setupResourceTooltips();
  startLoop();

  setInterval(()=> saveGame(true), AUTOSAVE_MS);
  window.addEventListener("beforeunload", ()=> saveGame(true));
}

init();

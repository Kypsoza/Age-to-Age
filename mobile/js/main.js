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

  // Navigation
  document.querySelectorAll("#tabBar button").forEach(btn=>{
    btn.onclick = ()=> switchTab(btn.dataset.tab);
  });

  // Bottom sheet
  document.getElementById("sheetOverlay").onclick = closeSheet;

  // Info modal (petites icônes "i")
  document.getElementById("infoModalOverlay").onclick = (e)=>{ if(e.target.id==="infoModalOverlay") hideInfoModal(); };
  document.getElementById("infoModalClose").onclick = hideInfoModal;
  document.querySelectorAll("[data-info]").forEach(btn=>{
    btn.onclick = ()=>{
      const resKey = btn.dataset.info;
      const label = {bois:"Bois",pierre:"Pierre",nourriture:"Nourriture",or:"Or"}[resKey];
      const income = getResourceIncome(state, resKey);
      const cap = storageCapFor(state, resKey);
      let body = `Stock : ${Math.floor(state.resources[resKey]||0)}/${cap}<br>Production : +${income.prod.toFixed(1)}/s`;
      if(income.cons>0) body += `<br>Consommation : -${income.cons.toFixed(1)}/s`;
      showInfoModal(iconFor(resKey)+" "+label, body);
    };
  });

  // Vitesse
  document.querySelectorAll("#speedControls button").forEach(btn=>{
    btn.onclick = ()=>{
      state.speed = parseInt(btn.dataset.speed,10);
      document.querySelectorAll("#speedControls button").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
    };
  });

  renderMapBackground();
  renderAll();
  startLoop();

  setInterval(()=> saveGame(true), AUTOSAVE_MS);
  window.addEventListener("beforeunload", ()=> saveGame(true));
}

init();

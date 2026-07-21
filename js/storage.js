// =====================================================================
// SAVE / LOAD
// =====================================================================
function saveGame(silent){
  try{
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    if(!silent) toast("Partie sauvegardée localement.");
  }catch(e){ toast("Erreur de sauvegarde : "+e.message); }
}
function loadGame(){
  const raw = localStorage.getItem(SAVE_KEY);
  if(!raw) return null;
  try{ return JSON.parse(raw); }catch(e){ return null; }
}
function exportGame(){
  const blob = new Blob([JSON.stringify(state,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `age2age_save_jour${state.day}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast("Sauvegarde exportée.");
}
function importGame(file){
  const reader = new FileReader();
  reader.onload = (e)=>{
    try{
      const data = JSON.parse(e.target.result);
      if(!data.researchSites || !data.storage || !data.decor) throw new Error("Structure invalide.");
      state = data;
      ensureStateMigrations(state);
      renderMapBackground();
      renderAll();
      toast("Sauvegarde importée avec succès.");
    }catch(err){
      toast("Fichier invalide : "+err.message);
    }
  };
  reader.readAsText(file);
}

// Complète une sauvegarde plus ancienne avec les champs introduits par des
// phases ultérieures (ex: Phase 8 — Défense), pour éviter tout crash au
// chargement d'une partie qui ne les avait pas encore.
function ensureStateMigrations(s){
  if(!s.defense) s.defense = freshDefenseState();
  if(s.menuBuildings && s.menuBuildings.barracks && typeof s.menuBuildings.barracks.assignedSoldiers !== "number"){
    s.menuBuildings.barracks.assignedSoldiers = 0;
  }
}

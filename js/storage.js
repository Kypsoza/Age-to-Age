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
// phases ultérieures (Défense, puis Difficulté/Famine), pour éviter tout
// crash au chargement d'une partie qui ne les avait pas encore. Une
// sauvegarde sans "rules" est nécessairement antérieure au système de
// difficulté : elle est alors migrée sur le palier "Moyen" par défaut, ce
// qui correspond exactement à son comportement d'origine (valeurs
// identiques à l'ancien jeu de constantes fixes).
function ensureStateMigrations(s){
  if(!s.difficulty || !DIFFICULTIES[s.difficulty]) s.difficulty = DEFAULT_DIFFICULTY;
  if(!s.rules) s.rules = DIFFICULTIES[s.difficulty];
  if(!s.defense) s.defense = freshDefenseState(s.rules);
  if(!s.famine) s.famine = freshFamineState();
  if(typeof s.defeated !== "boolean") s.defeated = false;
  if(s.menuBuildings && s.menuBuildings.barracks && typeof s.menuBuildings.barracks.assignedSoldiers !== "number"){
    s.menuBuildings.barracks.assignedSoldiers = 0;
  }
}

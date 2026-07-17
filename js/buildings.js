// PRÉREQUIS (partagés entre tooltip menu bas, panneau info, et flèche)
// ---------------------------------------------------------------------
function getReqLines(key){
  const def = BUILDINGS[key];
  const b = state.buildings[key];
  if(b.level >= def.levels.length) return null; // niveau max
  const lvl = def.levels[b.level]; // prochain niveau (b.level -> b.level+1)
  const lines = [];
  if(lvl.popReq){
    lines.push({label:`👥 Population ≥ ${lvl.popReq}`, ok: state.population >= lvl.popReq});
  }
  for(const [resKey, amount] of Object.entries(lvl.cost||{})){
    const have = Math.floor(state.resources[resKey]||0);
    lines.push({label:`${iconFor(resKey)} ${have}/${amount}`, ok: (state.resources[resKey]||0) >= amount});
  }
  return lines;
}

function canAfford(key){
  const lines = getReqLines(key);
  if(lines===null) return false; // max level, rien à construire
  return lines.every(l=>l.ok);
}

function doUpgrade(key){
  const def = BUILDINGS[key];
  const b = state.buildings[key];
  if(b.level >= def.levels.length){ toast("Niveau maximum atteint."); return; }
  const lines = getReqLines(key);
  if(!lines.every(l=>l.ok)){
    toast("Prérequis non remplis : " + lines.filter(l=>!l.ok).map(l=>l.label).join(" · "));
    return;
  }
  const lvl = def.levels[b.level];
  for(const [resKey, amount] of Object.entries(lvl.cost||{})) state.resources[resKey] -= amount;
  b.level++;
  toast(b.level===1 ? `${def.name} construit.` : `${def.name} amélioré au niveau ${b.level}.`);
  renderAll();
}

// ---------------------------------------------------------------------

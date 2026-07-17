// RENDERING — barre de construction horizontale + tooltip
// ---------------------------------------------------------------------
function renderBuildBar(){
  const list = document.getElementById("menuList");
  list.innerHTML = "";
  for(const key of Object.keys(BUILDINGS)){
    const def = BUILDINGS[key];
    const b = state.buildings[key];
    const item = document.createElement("div");
    item.className = "menuItem";
    if(b.level >= def.levels.length) item.classList.add("maxed");
    item.innerHTML = `<span class="ic">${def.icon}</span>
      <span>${def.name}</span>
      <span class="lvl">${b.level>0 ? "Nv. "+b.level+"/"+def.levels.length : "Non construit"}</span>`;
    item.onclick = ()=>{
      if(b.level===0){ doUpgrade(key); }
      else { toast("Déjà construit — utilise la flèche ▲ sur la carte pour l'améliorer."); }
    };
    item.onmouseenter = (e)=> showMenuTooltip(item, key);
    item.onmouseleave = hideMenuTooltip;
    list.appendChild(item);
  }
}

let tooltipEl = null;
function showMenuTooltip(anchorEl, key){
  hideMenuTooltip();
  const def = BUILDINGS[key];
  const b = state.buildings[key];
  const lines = getReqLines(key);
  tooltipEl = document.createElement("div");
  tooltipEl.className = "menuTooltip";
  let html = `<div class="ttTitle">${def.icon} ${def.name}</div>
    <div class="ttSub">${b.level>0 ? "Niveau actuel : "+b.level+"/"+def.levels.length : "Pas encore construit"}</div>`;
  if(lines===null){
    html += `<div style="color:var(--moss-bright);font-size:11px;">Niveau maximum atteint.</div>`;
  } else {
    html += `<div style="color:var(--bone-dim);font-size:10.5px;margin-bottom:4px;">${b.level===0?"Prérequis pour construire :":"Prérequis pour le niveau "+(b.level+1)+" :"}</div>`;
    for(const l of lines){
      html += `<div class="reqLine ${l.ok?'ok':'bad'}">${l.label}</div>`;
    }
  }
  tooltipEl.innerHTML = html;
  document.body.appendChild(tooltipEl);
  const rect = anchorEl.getBoundingClientRect();
  tooltipEl.style.left = Math.max(8, rect.left + rect.width/2 - tooltipEl.offsetWidth/2) + "px";
  tooltipEl.style.top = (rect.top - tooltipEl.offsetHeight - 10) + "px";
}
function hideMenuTooltip(){
  if(tooltipEl){ tooltipEl.remove(); tooltipEl = null; }
}

// ---------------------------------------------------------------------

// =====================================================================
// RENDERING — barre de construction (bas de l'écran)
// =====================================================================
function renderBuildBar(){
  const bar = document.getElementById("buildBar");
  if(!state.villageFounded){
    bar.classList.add("hidden");
    return;
  }
  bar.classList.remove("hidden");

  const list = document.getElementById("menuList");
  list.innerHTML = "";
  for(const key of MENU_ORDER){
    const def = MENU_BUILDINGS[key];
    const b = state.menuBuildings[key];
    const status = getMenuBuildStatus(state, key);

    const item = document.createElement("div");
    const unaffordable = !status.locked && !status.maxed && !status.lines.every(l=>l.ok);
    item.className = "menuItem"
      + (status.locked ? " locked" : "")
      + (status.maxed ? " maxed" : "")
      + (unaffordable ? " unaffordable" : "");
    item.innerHTML = `
      <span class="ic">${status.locked ? "🔒" : def.icon}</span>
      ${b.level>0 ? `<span class="miniLevel">${b.level}</span>` : ""}
    `;
    item.onclick = ()=>{
      if(status.locked){ toast("Prérequis non remplis — regarde le cadenas."); return; }
      buildMenuBuilding(state, key);
      renderAll();
    };
    item.onmouseenter = ()=> showMenuTooltip(item, key);
    item.onmouseleave = hideMenuTooltip;
    list.appendChild(item);
  }
}

let tooltipEl = null;
function showMenuTooltip(anchorEl, key){
  hideMenuTooltip();
  const def = MENU_BUILDINGS[key];
  const b = state.menuBuildings[key];
  const status = getMenuBuildStatus(state, key);
  tooltipEl = document.createElement("div");
  tooltipEl.className = "menuTooltip";
  let html = `<div class="ttTitle">${def.icon} ${def.name}</div>
    <div class="ttSub">${b.level>0 ? "Niveau actuel : "+b.level : "Pas encore construit"}</div>`;
  if(status.maxed){
    html += `<div style="color:var(--moss-bright);font-size:11px;">Niveau maximum atteint.</div>`;
  } else {
    for(const l of status.lines){
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

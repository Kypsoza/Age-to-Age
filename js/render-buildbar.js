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
    const built = b.level > 0;
    const status = getMenuBuildStatus(state, key);
    const unaffordable = !built && !b.building && !status.locked && !status.lines.every(l=>l.ok);

    const item = document.createElement("div");
    item.className = "menuItem"
      + (status.locked && !built ? " locked" : "")
      + (b.building ? " constructing" : "")
      + (built && !b.building ? " built" : "")
      + (unaffordable ? " unaffordable" : "");

    let badge = "";
    if(b.building) badge = `<span class="builtCheck constructingIcon">🚧</span>`;
    else if(built) badge = `<span class="builtCheck">✓</span>`;

    item.innerHTML = `
      <span class="ic">${(status.locked && !built) ? "🔒" : (b.building ? "🚧" : def.icon)}</span>
      ${badge}
    `;
    item.onclick = ()=>{
      if(b.building){ toast("Construction en cours..."); return; }
      if(built){
        if(key === "barracks"){
          state.selected = {kind:'menuBuilding', key};
          renderInfoPanel();
          toast("Gère tes soldats depuis le panneau de droite.");
          return;
        }
        toast("Déjà construit — utilise la flèche ▲ sur la carte pour l'améliorer.");
        return;
      }
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
    <div class="ttSub">${b.level>0 ? "Niveau actuel : "+b.level+(def.maxLevel?"/"+def.maxLevel:"") : "Pas encore construit"}</div>
    <div class="ttDesc">${def.desc}</div>`;

  if(b.building){
    html += `<div class="reqLine ok">🚧 En construction : ${b.buildTimeRemaining}s restantes</div>`;
  } else if(b.level > 0){
    if(key === "barracks"){
      const score = currentDefenseScore(state);
      const threshold = currentWaveThreshold(state);
      html += `<div class="reqLine ${score>=threshold?'ok':'bad'}">🛡️ Défense ${score}/${threshold}</div>
        <div class="reqLine">⏳ Prochaine vague dans ${state.defense.ticksUntilWave}s</div>`;
    } else {
      html += `<div class="reqLine ok" style="margin-top:6px;">✓ Construit — améliore-le depuis la carte</div>`;
    }
  } else if(status.locked){
    html += `<div style="margin-top:6px;">`;
    for(const l of status.lines){
      html += `<div class="reqLine ${l.ok?'ok':'bad'}">${l.label}</div>`;
    }
    html += `</div>`;
  } else {
    html += `<div style="color:var(--bone-dim);font-size:10.5px;margin:6px 0 4px;">Coût de construction (${buildTimeForLevel(b.level)}s) :</div>`;
    for(const l of status.lines){
      html += `<div class="reqLine ${l.ok?'ok':'bad'}">${l.label}</div>`;
    }
  }
  tooltipEl.innerHTML = html;
  document.body.appendChild(tooltipEl);
  const rect = anchorEl.getBoundingClientRect();
  positionTooltip(tooltipEl, rect, true);
}
function hideMenuTooltip(){
  if(tooltipEl){ tooltipEl.remove(); tooltipEl = null; }
}

// Positionne un tooltip pour qu'il reste toujours entièrement visible à
// l'écran : centré horizontalement sur l'ancre mais bridé aux bords, et
// bascule au-dessus/en-dessous de l'ancre selon la place disponible.
function positionTooltip(el, rect, preferAbove){
  let left = rect.left + rect.width/2 - el.offsetWidth/2;
  left = Math.max(8, Math.min(left, window.innerWidth - el.offsetWidth - 8));
  el.style.left = left + "px";

  let top;
  if(preferAbove){
    top = rect.top - el.offsetHeight - 10;
    if(top < 8) top = rect.bottom + 10;
  } else {
    top = rect.bottom + 10;
    if(top + el.offsetHeight > window.innerHeight - 8) top = rect.top - el.offsetHeight - 10;
  }
  top = Math.max(8, Math.min(top, window.innerHeight - el.offsetHeight - 8));
  el.style.top = top + "px";
}

// Tooltip dédié à la flèche ▲ sur la carte : contrairement au tooltip du
// menu du bas (qui redirige une fois construit), celle-ci doit toujours
// montrer le coût et le temps du PROCHAIN niveau, puisque c'est justement
// le seul endroit où on peut encore l'améliorer.
function showUpgradeTooltip(anchorEl, key){
  hideMenuTooltip();
  const def = MENU_BUILDINGS[key];
  const b = state.menuBuildings[key];
  const status = getMenuBuildStatus(state, key);
  tooltipEl = document.createElement("div");
  tooltipEl.className = "menuTooltip";
  let html = `<div class="ttTitle">${def.icon} ${def.name}</div>
    <div class="ttSub">Niveau actuel : ${b.level}${def.maxLevel?"/"+def.maxLevel:""}</div>
    <div class="ttDesc">${def.desc}</div>`;
  if(status.maxed){
    html += `<div style="color:var(--green-bright);font-size:11px;">Niveau maximum atteint.</div>`;
  } else {
    html += `<div style="color:var(--bone-dim);font-size:10.5px;margin:6px 0 4px;">Niveau ${b.level+1} — ${buildTimeForLevel(b.level)}s de construction :</div>`;
    for(const l of status.lines){
      html += `<div class="reqLine ${l.ok?'ok':'bad'}">${l.label}</div>`;
    }
  }
  tooltipEl.innerHTML = html;
  document.body.appendChild(tooltipEl);
  const rect = anchorEl.getBoundingClientRect();
  positionTooltip(tooltipEl, rect, true);
}

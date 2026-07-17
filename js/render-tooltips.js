// TOOLTIP — capacité de stockage au survol des pastilles de ressources
// ---------------------------------------------------------------------
function setupResourceTooltips(){
  const configs = [
    {id:"pillBois", resKey:"bois", label:"Bois"},
    {id:"pillPierre", resKey:"pierre", label:"Pierre"},
    {id:"foodPill", resKey:"nourriture", label:"Nourriture"},
  ];
  for(const c of configs){
    const el = document.getElementById(c.id);
    el.onmouseenter = ()=> showResTooltip(el, c.resKey, c.label);
    el.onmouseleave = hideMenuTooltip;
  }
  const orEl = document.getElementById("pillOr");
  orEl.onmouseenter = ()=> showPlainTooltip(orEl, "✨ Monnaie", "Ressource virtuelle sans poids : aucune limite de stockage.");
  orEl.onmouseleave = hideMenuTooltip;
}

function showResTooltip(anchorEl, resKey, label){
  hideMenuTooltip();
  const cap = totalStorageCap(state, resKey);
  const have = Math.floor(state.resources[resKey]||0);
  const income = getResourceIncome(resKey);
  tooltipEl = document.createElement("div");
  tooltipEl.className = "menuTooltip";
  tooltipEl.innerHTML = `
    <div class="ttTitle">${iconFor(resKey)} ${label}</div>
    <div class="reqLine"><span>Stock actuel</span><span>${have}/${Math.floor(cap)}</span></div>
    <div class="reqLine"><span>Production</span><span>${income.prod.toFixed(1)}/tick</span></div>
    <div class="reqLine"><span>Consommation</span><span>${income.cons.toFixed(1)}/tick</span></div>
    <div class="reqLine ${income.net>=0?'ok':'bad'}"><span>Net</span><span>${income.net>=0?'+':''}${income.net.toFixed(1)}/tick</span></div>
  `;
  document.body.appendChild(tooltipEl);
  const rect = anchorEl.getBoundingClientRect();
  tooltipEl.style.left = Math.max(8, rect.left + rect.width/2 - tooltipEl.offsetWidth/2) + "px";
  tooltipEl.style.top = (rect.bottom + 10) + "px";
}

function showPlainTooltip(anchorEl, title, text){
  hideMenuTooltip();
  tooltipEl = document.createElement("div");
  tooltipEl.className = "menuTooltip";
  tooltipEl.innerHTML = `<div class="ttTitle">${title}</div><div class="ttSub" style="margin-bottom:0;">${text}</div>`;
  document.body.appendChild(tooltipEl);
  const rect = anchorEl.getBoundingClientRect();
  tooltipEl.style.left = Math.max(8, rect.left + rect.width/2 - tooltipEl.offsetWidth/2) + "px";
  tooltipEl.style.top = (rect.bottom + 10) + "px";
}

function renderAll(){
  renderTopbar();
  renderGrid();
  renderBuildBar();
  renderInfoPanel();
}

// ---------------------------------------------------------------------

// =====================================================================
// RENDERING — panneau d'infos
// =====================================================================
function renderInfoPanel(){
  const panel = document.getElementById("infoContent");
  const sel = state.selected;
  if(!sel){ panel.innerHTML = "Clique sur un site de recherche ou sur l'entrepôt pour voir ses détails."; return; }

  if(sel.kind==='storage'){
    panel.innerHTML = `<div><b>📦 Entrepôt</b></div>
      <div style="margin-top:6px;">Le stockage que la tribu a déposé à son arrivée. Il peut contenir toutes les ressources.</div>
      <div style="margin-top:10px;color:var(--bone-dim);font-size:11px;">L'amélioration de sa capacité sera disponible une fois les premières ressources collectées.</div>`;
    return;
  }

  if(sel.kind==='tile'){
    // conservé pour compatibilité mais plus jamais déclenché : la carte
    // procédurale n'a plus de cases cliquables, seuls les marqueurs le sont.
    panel.innerHTML = "";
    return;
  }

  // site
  const site = siteByType(state, sel.type);
  const def = RESEARCH_TYPES[site.type];
  let html = `<div><b>${site.discovered ? def.revealedIcon : def.icon} ${def.label}</b></div>
    <div style="margin-top:6px;">${def.desc}</div>`;

  if(site.discovered){
    html += `<div style="margin-top:10px;color:var(--moss-bright);font-size:11px;">✓ Zone découverte.</div>`;
  } else {
    const pct = Math.round((1 - site.effortRemaining/site.effortTotal) * 100);
    html += `<div class="invRow" style="margin-top:8px;"><span>Progression</span><span>${pct}%</span></div>`;
    html += `<div class="invRow"><span>Temps restant</span><span>${site.assigned>0 ? Math.ceil(site.effortRemaining/site.assigned)+'s' : '—'}</span></div>`;
    html += `<div class="invRow"><span>Habitants assignés</span><span>${site.assigned}</span></div>`;
    html += `<div style="display:flex;gap:8px;align-items:center;margin-top:10px;">
      <button class="panelWorkerBtn" id="panelSiteMinus">− Retirer</button>
      <button class="panelWorkerBtn" id="panelSitePlus">+ Assigner</button>
    </div>`;
  }
  panel.innerHTML = html;

  if(!site.discovered){
    const minusBtn = document.getElementById("panelSiteMinus");
    const plusBtn = document.getElementById("panelSitePlus");
    if(minusBtn) minusBtn.onclick = ()=>{ assignToSite(state, site, -1); renderAll(); };
    if(plusBtn) plusBtn.onclick = ()=>{ assignToSite(state, site, 1); renderAll(); };
  }
}

// =====================================================================
// UTILS — toast, icônes, modale (info simple OU confirmation d'achat)
// =====================================================================
let toastTimer = null;
function toast(msg){
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> el.classList.remove("show"), 2600);
}

function iconFor(resKey){
  return {bois:"🪵",pierre:"🪨",nourriture:"🌾",or:"🪙"}[resKey] || "";
}

// Modale générique : icône + titre centrés, description, ligne de coût
// optionnelle, et 1 ou 2 boutons d'action ("Annuler"/"Fermer" toujours
// présent, "Construire"/primaire optionnel). Reproduit la maquette :
// même coquille pour l'info d'une ressource (1 bouton "Fermer") et pour
// la confirmation d'achat d'un bâtiment (2 boutons "Annuler"/"Construire").
function openModal({icon="", title="", bodyHtml="", costHtml="", primaryLabel=null, onPrimary=null, secondaryLabel="Fermer"}){
  document.getElementById("infoModalIcon").textContent = icon;
  document.getElementById("infoModalTitle").textContent = title;
  document.getElementById("infoModalBody").innerHTML = bodyHtml;
  const costEl = document.getElementById("infoModalCost");
  costEl.innerHTML = costHtml;
  costEl.classList.toggle("hidden", !costHtml);

  const secondaryBtn = document.getElementById("infoModalSecondary");
  const primaryBtn = document.getElementById("infoModalPrimary");
  secondaryBtn.textContent = secondaryLabel;
  secondaryBtn.onclick = hideInfoModal;

  if(primaryLabel && onPrimary){
    primaryBtn.textContent = primaryLabel;
    primaryBtn.classList.remove("hidden");
    primaryBtn.onclick = ()=>{ onPrimary(); };
  } else {
    primaryBtn.classList.add("hidden");
    primaryBtn.onclick = null;
  }

  document.getElementById("infoModalOverlay").classList.add("show");
}

// Info simple (ex: pastille de ressource) — un seul bouton "Fermer".
function showInfoModal(title, bodyHtml, icon=""){
  openModal({icon, title, bodyHtml, secondaryLabel:"Fermer"});
}
function hideInfoModal(){
  document.getElementById("infoModalOverlay").classList.remove("show");
}

function reqLinesHtml(lines, cls){
  return lines.map(l=>`<div class="${cls||'invRow'} ${l.ok?'ok':'bad'}">${l.label}</div>`).join("");
}

// Ligne de coût compacte pour la modale (icônes + montants, en rouge si
// insuffisant) — utilisée par la confirmation d'achat de bâtiment.
function costLineHtml(lines){
  return lines.map(l=>`<span class="${l.ok?'':'bad'}">${l.label}</span>`).join("");
}

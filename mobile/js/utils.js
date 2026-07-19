// =====================================================================
// UTILS — toast, icônes, modale d'info (remplace les tooltips au survol)
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
  return {bois:"🪵",pierre:"🪨",nourriture:"🌾",or:"✨"}[resKey] || "";
}

function showInfoModal(title, bodyHtml){
  document.getElementById("infoModalTitle").textContent = title;
  document.getElementById("infoModalBody").innerHTML = bodyHtml;
  document.getElementById("infoModalOverlay").classList.add("show");
}
function hideInfoModal(){
  document.getElementById("infoModalOverlay").classList.remove("show");
}

function reqLinesHtml(lines, cls){
  return lines.map(l=>`<div class="${cls||'invRow'} ${l.ok?'ok':'bad'}">${l.label}</div>`).join("");
}

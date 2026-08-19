# 📓 CHANGELOG — Age to Age

---

## 🎮 État actuel du jeu (contenu)
Voir versions précédentes du changelog pour l'historique complet des mécaniques
(recherche, village, bâtiments, entrepôt, population, famine, défense/vagues,
4 paliers de difficulté). Ce fichier résume la version courante.

### Architecture (v0.12)
- **Une seule UI, pour PC et mobile** : `index.html` + `css/style.css` + `js/*.js`
  suffisent désormais — plus de dossier `mobile/` séparé (il ne contient plus
  qu'une redirection vers la racine, pour ne pas casser d'anciens liens).
  Sur grand écran, l'app reste au format "carte téléphone" centrée : c'est ce
  qui garantit que PC et mobile affichent rigoureusement la même interface.
- **Refonte graphique complète**, calée sur la maquette fournie (3 captures) :
  écran d'accueil illustré (titre "AGE TO AGE", boutons "Nouvelle partie" /
  "Charger partie (JSON)", icônes de réglages), pastilles de ressources,
  fiche coulissante du bas, écran Construire en liste de cartes (icône,
  coût, niveau max, verrou rouge), modale d'achat avec boutons
  "Annuler"/"Construire".
- **Nouveau flux d'achat de bâtiment** : dans l'onglet Construire, taper une
  carte ouvre désormais une modale de confirmation (description, coût,
  Annuler/Construire) au lieu de construire directement au clic.
- Limite assumée : le fond de carte (lac/forêts/rochers) reste une
  approximation vectorielle stylisée, pas une illustration peinte — aucun
  outil de génération d'image n'est disponible dans cet environnement.

### Non encore implémenté (roadmap)
- Crises majeures de l'Ère 1 (Mégafaune, Vague de Froid, Épuisement Local, Pourrissement) — Phase 9
- Grand Chantier & transition vers l'Ère 2 — Phase 11
- Déplacement animé des habitants sur la carte (pathfinding) — Phase 6
- Assets graphiques réellement illustrés (remplacement du rendu vectoriel) — Phase 10

---

## 🗂️ Historique des versions (résumé)
- **v0.12** — Fusion PC/mobile en une UI unique, refonte graphique complète (maquette), modale d'achat Annuler/Construire, écran d'accueil
- **v0.11** — (retiré) tentative de design system par Ères à partir d'une description texte seule
- **v0.10** — Système de difficulté (4 paliers) + Famine + Écran de Défaite
- **v0.9.1 / v0.9** — Phase 8 : Défense & Assauts (Caserne), rééquilibrage
- **v0.8** — Stockage de l'or, paliers agrandis
- **v0.7** — Équilibrage stratégique & tooltips
- **v0.6** — Version mobile dédiée (fusionnée dans v0.12)
- **v0.5** — Entrepôt & Stockage (Phase 2)
- **v0.4** — Pierre, récolte alternative, recrutement, améliorations
- **v0.3** — Village, Hôtel de Ville, dépendances (Phase 3)
- **v0.2** — Refonte : Genèse & Recherche (Phase 1)
- **v0.1** — Milestone 1 (ancien système, archivé)

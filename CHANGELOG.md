# 📓 CHANGELOG — Age to Age

Ce fichier est mis à jour à chaque évolution du jeu : ajouts, corrections, améliorations. Deux parties : l'état actuel du contenu, puis l'historique des versions.

---

## 🎮 État actuel du jeu (contenu)

### Boucle de jeu
- **Genèse** : 5 survivants, aucune ressource au départ (50 nourriture en réserve). 4 sites de recherche (Nourriture/Bois/Or/Emplacement Hôtel de Ville) + 1 Entrepôt, positions aléatoires à chaque partie sur une carte procédurale (lac, forêts, rochers, sans grille visible).
- **Recherche** : chaque site caché derrière un bouton "🔍 Lancer la recherche" nommé. Une fois lancée, assignation de plusieurs habitants en parallèle (barre de progression + chrono), coût en habitants uniquement (temporaires, libérés à la fin). Seule Nourriture est visible au départ ; sa découverte révèle Bois/Or/Emplacement HDV. La Pierre reste cachée jusqu'à la fondation du Village.
- **Récolte manuelle** : une fois une zone découverte, on y assigne des habitants (➖➕) qui récoltent en continu (0,4/tick/habitant), plafonné par le niveau de l'Hôtel de Ville (3 de base, +5/niveau).
- **Village** : dès l'Emplacement HDV découvert, panneau de fondation (30 bois + 15 or) → débloque le menu de construction.
- **Bâtiments** (menu du bas, dépendances) : Hôtel de Ville (premier, débloque tout) → Maison + Forge → Pavillon de Chasse / Salle du Trésor → Cabane de Pêche → Moulin, et Maison niv.2 → Caserne. Construction chronométrée (18s + 9s/niveau), coût croissant (×1,75/niveau).
- **Pavillon de Chasse / Cabane de Pêche** : deviennent de vrais points de récolte de nourriture sur la carte (×1,5 et ×2 le rendement de base).
- **Forge / Moulin / Salle du Trésor** : chaque niveau débloque un palier d'amélioration d'income (+100% cumulatif) sur Bois+Pierre / Nourriture / Or respectivement, achetable indépendamment.
- **Entrepôt** : plafond de stockage indépendant par ressource (Bois/Pierre/Nourriture, 80 de base +60/palier), améliorable séparément. L'Or reste illimité (monnaie virtuelle).
- **Population** : la Maison ajoute des places en réserve (+5/niveau), pas des habitants actifs. Le recrutement (bouton dédié) coûte de la nourriture, coût croissant (×1,4/recrutement). Tous les habitants actifs consomment de la nourriture en permanence, qu'ils travaillent ou non.
- **Cycle temporel** : jours/saisons, cycle jour/nuit présent en interne mais voile visuel désactivé pour l'instant.

### Plateformes
- **PC** (`index.html`) : carte 1100×680, panneau latéral droit, menu de construction en bas, tooltips au survol.
- **Mobile** (`mobile/index.html`) : détection auto (écran tactile < 820px), carte portrait 650×1050 déplaçable au doigt, 4 onglets (Carte/Construire/Améliorations/Habitants), fiches coulissantes au tap, boutons "i" pour les infos. Réutilise state.js/simulation.js/storage.js du PC.

### Non encore implémenté (roadmap)
- Déplacement animé des habitants sur la carte (pathfinding)
- Caserne : recrutement de soldats, assauts
- Crises majeures de l'Ère 1 (froid, épuisement, pourrissement)
- Assets graphiques (remplacement des emojis)
- Grand Chantier & transition vers l'Ère 2

---

## 🗂️ Historique des versions

### v0.6 — Version mobile dédiée
**Ajouts**
- Dossier `mobile/` complet : détection automatique, carte portrait, 4 onglets, fiches coulissantes, modales d'info tactiles
- Redirection automatique PC → mobile selon la taille d'écran (`?desktop=1` pour forcer le PC)

### v0.5 — Entrepôt & Stockage (Phase 2)
**Ajouts**
- Plafond de stockage indépendant par ressource, améliorable via un panneau dédié sur l'Entrepôt
- Or laissé illimité (monnaie virtuelle)

**Corrections**
- Tooltip de la flèche ▲ sur la carte : affichait "Construit" au lieu du coût du niveau suivant
- Pastille Pierre invisible dans le topbar (oubliée masquée en dur après son ajout)
- Consommation de nourriture rendue permanente (tous les habitants consomment en continu, plus seulement quand une source est activement récoltée)
- Réserve de nourriture de départ (50) ajoutée pour amorcer la partie

### v0.4 — Pierre, récolte alternative, recrutement, améliorations
**Ajouts**
- Pierre ajoutée comme 5ᵉ ressource (débloquée à la fondation du Village)
- Pavillon de Chasse / Cabane de Pêche transformés en vrais points de récolte
- Panneau d'améliorations d'income (Forge/Moulin/Trésor), paliers cumulatifs
- Système de recrutement séparé de la Maison (réserve + coût en nourriture croissant)
- Coûts de construction mixés (bois/pierre/or) pour forcer la réallocation d'habitants

**Corrections**
- `render-buildbar.js` avait disparu du dépôt de travail — recréé
- Menu du bas non rafraîchi à la fin d'une construction (icône 🚧 figée, reclique relançait une construction)
- Chevauchement du marqueur Hôtel de Ville avec le site de recherche découvert

### v0.3 — Village, Hôtel de Ville, dépendances (Phase 3)
**Ajouts**
- Panneau de fondation du Village, menu de construction avec cadenas et dépendances entre bâtiments
- Construction chronométrée avec barre de progression (carte + menu)
- Plafond d'habitants par zone lié au niveau de l'Hôtel de Ville

**Corrections**
- Maison ne créditait pas les habitants (effet non câblé)
- Crash au chargement d'une ancienne sauvegarde incompatible (bouton "Nouvelle partie" bloqué en conséquence)

### v0.2 — Refonte : Genèse & Recherche (Phase 1)
**Ajouts**
- Nouveau lore (boucle temporelle) et nouvelle boucle de démarrage : recherche de zones, découverte progressive, entrepôt initial
- Carte procédurale organique (SVG : lac, forêts, rochers), sans grille, sans cases cliquables
- Boutons de lancement de recherche nommés par zone

**Corrections**
- Scintillement des boutons ➖➕ (rendu complet de la carte à chaque tick) → rendu léger séparé du rendu structurel

### v0.1 — Milestone 1 (ancien système, archivé)
- Bâtiments à emplacement fixe sur grille, population automatique, économie de base
- Remplacé par la refonte v0.2 ; conservé pour historique dans le classeur QA (onglet ARCHIVE)

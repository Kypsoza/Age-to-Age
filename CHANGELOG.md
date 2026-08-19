# 📓 CHANGELOG — Age to Age

Ce fichier est mis à jour à chaque évolution du jeu : ajouts, corrections, améliorations.

---

## 🎮 État actuel du jeu (contenu)

### Boucle de jeu
- **Difficulté** : choix entre 4 paliers (Facile/Moyen/Difficile/Très difficile) à chaque nouvelle partie, qui fixent pour toute la partie : chrono des vagues, seuils/coût de la Défense, multiplicateurs de coût de construction et de vitesse de récolte, temps de recherche/construction, population et nourriture de départ, coût de recrutement, sévérité de la famine. Détail complet dans `js/config.js` (objet `DIFFICULTIES`).
- **Genèse** : survivants et réserve de nourriture de départ variables selon la difficulté (5-6 survivants, 30-70 nourriture). 4 sites de recherche (Nourriture/Bois/Or/Emplacement Hôtel de Ville) + 1 Entrepôt, positions aléatoires à chaque partie sur une carte procédurale (lac, forêts, rochers, sans grille visible).
- **Recherche** : chaque site caché derrière un bouton "🔍 Lancer la recherche" nommé. Une fois lancée, assignation de plusieurs habitants en parallèle, coût en habitants uniquement. Seule Nourriture est visible au départ ; sa découverte révèle Bois/Or/Emplacement HDV. La Pierre reste cachée jusqu'à la fondation du Village.
- **Récolte manuelle** : une fois une zone découverte, on y assigne des habitants (➖➕) qui récoltent en continu, plafonné par le niveau de l'Hôtel de Ville.
- **Village** : dès l'Emplacement HDV découvert, panneau de fondation → débloque le menu de construction.
- **Bâtiments** : Hôtel de Ville → Maison + Forge → Pavillon de Chasse / Salle du Trésor → Cabane de Pêche → Moulin, et Maison niv.2 → Caserne. Construction chronométrée, tous les coûts mélangent Bois+Pierre+Or.
- **Forge / Moulin / Salle du Trésor** : améliorations d'income (+100% cumulatif par palier).
- **Entrepôt** : plafond de stockage indépendant par ressource, améliorable.
- **Population** : la Maison ajoute des places en réserve. Le recrutement coûte de la nourriture, coût croissant selon la difficulté.
- **Famine** : si la nourriture reste à 0 au-delà d'un délai de grâce, la population décline. Peut mener à l'écran de Défaite.
- **Cycle temporel** : jours/saisons, cycle jour/nuit interne.
- **Défense (Caserne)** : assignation de soldats uniquement via les boutons sur la carte, coût en or continu (désertion si insuffisant). Vagues d'assaut automatiques, seuils et pénalités modulés par la difficulté. HUD dédié en haut à gauche.
- **Écran de Défaite** : population à 0 → écran bloquant, bouton "Nouvelle partie".

### Plateformes
- **PC** (`index.html`) : carte 1100×680, panneau latéral droit, menu de construction en bas, tooltips au survol.
- **Mobile** (`mobile/index.html`) : détection auto (écran tactile < 820px), carte portrait, 4 onglets, fiches coulissantes, boutons "i" pour les infos.

### Non encore implémenté (roadmap)
- Crises majeures de l'Ère 1 (Mégafaune, Vague de Froid, Épuisement Local, Pourrissement) — Phase 9
- Grand Chantier & transition vers l'Ère 2 — Phase 11
- Déplacement animé des habitants sur la carte (pathfinding) — Phase 6
- Assets graphiques (remplacement des emojis) — Phase 10

---

## 🗂️ Historique des versions (résumé)

### v0.11 — Refonte graphique complète de l'UI mobile
- Nouveau design system par variables CSS, thème "Ère 1 — Genèse" (tons organiques : beige papyrus, vert sauge, terre cuite, ardoise), architecture prête pour les 5 ères suivantes (`.era-1` à `.era-6`)
- Topbar deux lignes, bottom sheet et modales redessinées façon "fiche crème à coins arrondis", cartes de construction avec vignette/coût/verrou, navigation basse à 4 onglets restylée

### v0.10 — Système de difficulté (4 paliers) + Famine + Écran de Défaite
### v0.9.1 / v0.9 — Phase 8 : Défense & Assauts (Caserne), rééquilibrage
### v0.8 — Stockage de l'or, paliers agrandis
### v0.7 — Équilibrage stratégique & tooltips
### v0.6 — Version mobile dédiée
### v0.5 — Entrepôt & Stockage (Phase 2)
### v0.4 — Pierre, récolte alternative, recrutement, améliorations
### v0.3 — Village, Hôtel de Ville, dépendances (Phase 3)
### v0.2 — Refonte : Genèse & Recherche (Phase 1)
### v0.1 — Milestone 1 (ancien système, archivé)

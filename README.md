# City Builder Évolutif — Prototype

Prototype jouable du city builder évolutif (cahier des charges : 6 ères, ressources, stockage physique, population). Ce dépôt contient le **Milestone 1** : la boucle de base sur l'Ère 1 (L'Aube des Clans).

## Arborescence

```
.
├── index.html              → structure de la page, charge la CSS et les scripts
├── css/
│   └── style.css            → tout le style visuel (thème, tuiles, UI)
├── js/
│   ├── config.js             → constantes, définition des bâtiments et de leurs niveaux
│   ├── state.js               → état de la partie (freshState), génération de la carte
│   ├── simulation.js         → boucle de simulation (production, saisons, population, travailleurs)
│   ├── buildings.js           → prérequis / construction / amélioration des bâtiments
│   ├── render-map.js          → affichage de la grille et des bâtiments
│   ├── render-panel.js        → panneau de détails (clic sur la carte)
│   ├── render-buildbar.js     → menu horizontal du bas + tooltip
│   ├── render-topbar.js       → barre du haut (ressources, revenu, horloge)
│   ├── render-tooltips.js     → tooltips de capacité de stockage
│   ├── utils.js                → notifications (toast)
│   ├── storage.js             → sauvegarde / export / import JSON
│   └── main.js                 → boucle de jeu + initialisation
└── docs/
    └── assets-libres-de-droits.md  → liste des assets CC0/gratuits trouvés pour chaque ère
```

Les scripts sont chargés en balises `<script>` classiques (pas de modules ES, pas de bundler) — l'ordre dans `index.html` est important, ne pas le modifier. Ça permet de tester le jeu simplement en ouvrant `index.html` dans un navigateur, sans serveur.

## Mettre ce projet sur GitHub

Ton dépôt existe déjà et il est vide : https://github.com/Kypsoza/Age-to-Age

Dans le dossier contenant ces fichiers (après extraction du zip) :

```bash
git init
git add .
git commit -m "Milestone 1 : boucle de base Ère 1"
git branch -M main
git remote add origin https://github.com/Kypsoza/Age-to-Age.git
git push -u origin main
```

## Tester en ligne avec GitHub Pages (recommandé)

Ça te permet de tester sur mobile/tablette sans rien installer, juste avec un lien :

1. Sur GitHub, va dans **Settings → Pages** du dépôt.
2. Source : **Deploy from a branch**, branche `main`, dossier `/ (root)`.
3. Sauvegarde. Après ~1 minute, ton jeu est accessible à :
   **https://kypsoza.github.io/Age-to-Age/**

Chaque `git push` met à jour automatiquement cette URL (compte 30s à 1 min de délai). C'est l'option la plus simple pour tester sur téléphone : ouvre juste le lien.

## Tester en local sans rien installer

Double-clique sur `index.html` — ça fonctionne directement dans le navigateur, sauvegarde comprise (localStorage).

## Workflow de test recommandé

1. Je te donne les fichiers modifiés (ou je te donne directement le contenu à coller si un seul fichier change).
2. Tu remplaces les fichiers concernés dans ton dossier local.
3. `git add . && git commit -m "..." && git push`
4. Tu rafraîchis **https://kypsoza.github.io/Age-to-Age/** (ou `index.html` en local) et tu testes.
5. Tu me remontes les retours.

Le dépôt s'appelle **Age-to-Age** — je m'en sers comme référence pour toutes mes prochaines instructions de fichiers/commits.

# Roadmap IsoHome

## 001 – POC une pièce (code terminé, validation sur appareils réels en attente)
Import Magicplan d'une pièce, rendu iso, appareils réels contrôlables sur tablette.

Fait : import SVG Magicplan, rendu iso au repos (0 redraw idle), gestes tactiles (tap, appui long, pan, zoom par paliers, double-tap), packs de base (placeholders), mode mock, carte Lovelace (`packages/ha-card`, 291 Ko gzip, WebGL seul) et mode live du playground, grisage des sprites à la perte de connexion.

Reste : tester le mode live sur un vrai Home Assistant, vérifier le tactile sur l'app Companion (iOS/Android) et Fully Kiosk (tâche T039a), remplacer les sprites placeholders par de vrais assets, importer la palette Agent Office, GIF de démo.

## 002 – Maison complète
Import Magicplan multi-pièces et multi-étages, navigation entre étages (swipe), vue d'ensemble et zoom sur une pièce.

## 003 – Persistance de la configuration
Où vit le modèle de maison : config de la carte Lovelace (YAML/JSON) ou stockage HA via une petite intégration custom. Décision par ADR, avec export/import JSON dans tous les cas.

## 004 – Éditeur de maison (tactile)
Mode édition dans la carte : ajouter, déplacer et pivoter des éléments au doigt, lier un élément à une entité HA (sélecteur filtré par domaine compatible), retoucher murs et ouvertures après import, annuler/rétablir.

## 005 – Catalogue élargi
climate, cover, fan, vacuum, camera, capteurs affichés (température, ouverture de porte), scènes. Ambiance jour/nuit selon sun.sun.

## 006 – Packs communautaires
Chargement de packs externes, validation stricte (schéma + charte + domaines interdits), CLI `pnpm pack:validate`, registre de packs dans le repo, galerie de prévisualisation.

## 007 – Kit contributeur
Template de pack, guide de prompting finalisé, exemples avant/après, templates d'issues et de PR, labels « good first pack ».

## 008 – v1.0 = MVP
Publication HACS par défaut, documentation utilisateur, démo en ligne du playground (GitHub Pages), versionnage sémantique et changelog.

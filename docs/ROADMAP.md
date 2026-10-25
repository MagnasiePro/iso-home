# Roadmap IsoHome

## 001 – POC une pièce (en cours)
Import Magicplan d'une pièce, rendu iso, appareils réels contrôlables sur tablette.

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

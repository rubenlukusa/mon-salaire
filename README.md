# Mon Salaire — calculateur

App locale (aucune connexion internet requise) pour calculer et suivre ton salaire hebdomadaire.

## Lancer l'app

**Windows** : double-clique sur `start.bat`.
**Mac/Linux** : lance `./start.sh` dans un terminal (ou `python3 server.py`).

Il faut avoir Python installé (déjà présent sur la plupart des PC/Mac). Le script ouvre automatiquement `http://localhost:8000` dans ton navigateur.

Tu peux aussi juste ouvrir `index.html` directement dans un navigateur, sans serveur — ça marche pareil, sauf que l'URL ne sera pas "localhost".

## Pages

- **Calculatrice** : entre tes heures de la semaine, elle calcule brut / ONSS / imposable / précompte / net / indemnités / total à payer. Les taux sont préremplis avec tes vraies conditions Randstad (12,3849 €/h, ONSS 2,71%, indemnité transport 6,90 €/jour) — modifiables si ça change.
- **Historique** : toutes tes semaines enregistrées, avec export/import (JSON pour sauvegarde, CSV pour Excel).
- **Totaux** : cumul net/brut, moyenne par semaine, total du mois, graphique d'évolution.
- **Budget & Épargne** : répartis chaque salaire pas encore "budgétisé" entre des catégories (Épargne, Dépenses, Loisirs, Imprévus — modifiables), avec objectif d'épargne et estimation du temps pour l'atteindre.

## Où sont stockées les données ?

Tout est sauvegardé dans le navigateur (localStorage), rien n'est envoyé sur internet. Pense à faire un export JSON de temps en temps pour avoir une sauvegarde, surtout si tu vides le cache de ton navigateur.

## Bonus ajoutés

- Rappel automatique du vendredi au lundi : "envoie ta fiche de prestations avant lundi soir" (comme indiqué dans ton contrat).
- Mode sombre (bouton 🌙 en haut à droite).
- Bascule "Étudiant / Travailleur normal" qui ajuste les taux ONSS/précompte par défaut si un jour tu n'es plus sous contingent étudiant.

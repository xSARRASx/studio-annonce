# Vérifications de la bibliothèque de démonstration

Ces tests sont hors ligne. Ils ne contactent aucun fournisseur, ne débitent aucun compte et n'ouvrent pas les bases du navigateur de Martin.

`library.test.mjs` utilise un vrai déroulement des transactions via fake-indexeddb. Il vérifie les téléchargements et reprises simultanés, le dernier crédit, l'offre unique, les sept jours exacts, l'annulation atomique, les quotas de stockage, les données corrompues conservées, les mutations asynchrones refusées et la récupération après indisponibilité/fermeture IndexedDB.

`use-library.test.mjs` exerce le hook React avec des promesses contrôlées : résultats arrivant dans le mauvais ordre, anciennes erreurs, notifications indisponibles, retour au premier plan, démontage, renouvellement et libération des aperçus Blob. L'adaptateur du sous-dossier `fixtures` est exclusivement un point d'injection pour ces tests ; il n'est pas importé par l'application.

Exécution vérifiée le 23 septembre 2026 avec Node 26.5.0, fake-indexeddb 6.2.5 et react-test-renderer 19.2.8. Le chargeur TypeScript natif et `node:module.registerHooks` sont utilisés. Les deux dépendances de test sont enregistrées dans le manifeste et le verrou npm du web pour rendre les contrôles reproductibles :

```sh
cd /Users/more/Documents/Codex/studio-annonce/web
npm ci
npm run test:library
```

Résultat : **25 tests réussis**. TypeScript global et ESLint ciblé sur la bibliothèque et le hook réussissent également.

Deux avertissements de l'outillage sont attendus : dépréciation de react-test-renderer et détection automatique du format ESM pour les fichiers TypeScript. Ils ne correspondent pas à des erreurs de l'application. Ces tests de transactions et de courses asynchrones complètent les contrôles navigateur ; ils ne remplacent pas une validation sur un iPhone/Android réel ni une intégration serveur.

Changements internes couverts :

- `revision` est un champ facultatif de la sauvegarde existante, sans changement de schéma IndexedDB ni suppression/migration des anciennes données.
- Le contrat retourné par `useLibrary` est inchangé.
- Des données invalides provoquent un message de conservation et un refus d'écriture, jamais une remise à zéro automatique.
- Une erreur de notification inter-onglets ou de création d'aperçu ne peut pas faire croire qu'un commit réussi a été annulé.
- Le quota de démonstration et les paiements simulés n'ont aucune valeur de protection de facturation réelle : celle-ci appartient à l'API et à sa base serveur.

# Studio Annonce

Prototype photo immobilier web et mobile. [studioannonce.fr](https://studioannonce.fr/) présente le produit et donne accès au compte connecté ou à la démonstration. L'API FastAPI répond sur [studioannonce.fr/api/sante](https://studioannonce.fr/api/sante) depuis le 29 septembre 2026. La connexion par email est opérationnelle ; la retouche attend des crédits OpenAI et le paiement attend la configuration Stripe et la validation des prix.

- [Démonstration publique](https://studioannonce.fr/demo/) et [aperçu mobile interactif](https://studioannonce.fr/mobile-preview/).
- [État du déploiement N0C](deploiement/N0C-STATIQUE.md) : pages, API, vérifications et fonctions encore indisponibles.
- [Compte connecté](https://studioannonce.fr/connexion/) : prénom, nom, email vérifié et première photo rattachée au compte.
- [Coûts fournisseur et simulations privées](COUTS-PHOTOS-2026-09-29.md) : tarifs vérifiés, hypothèses distinctes des mesures.

- [Site et studio](http://127.0.0.1:3173/demo/) — `cd web && npm run dev -- --hostname 127.0.0.1 --port 3173`.
- [Aperçu iPhone/Android](http://127.0.0.1:3173/mobile-preview/) — nécessite aussi `cd mobile && npx expo start --web --localhost --port 8173`.
- [État actuel et historique](DESIGN-DEMO.md), [application mobile](DESIGN-MOBILE.md), [préparer une première vente](LANCEMENT-2026-09-23.md).
- [Visites vidéo : préparation et contrôles à connecter](VIDEO-VISITES.md).
- Tests bibliothèque : `cd web && npm run test:library` (Node 26.5 utilisé pour la vérification).

Les photos restent locales dans `/demo/` et dans l'aperçu mobile ; ces démonstrations ne sont pas reliées au compte serveur. La maquette vidéo est un montage de photos fictives. Le parcours `/connexion/` → `/app/` utilise l'API et conserve le profil en base. Il faut le distinguer de la démonstration. Un vrai code a été reçu sur Gmail et a permis de se connecter, mais Gmail l'a classé dans le spam malgré la signature du domaine ; la délivrabilité reste à améliorer.

Le parcours Stripe Checkout et les confirmations signées sont implémentés et testés avec simulation du fournisseur. Aucun paiement réel ni session Checkout externe n'a été réalisé. Les ventes restent désactivées (`PAIEMENT_ACTIF=false`) jusqu'à configuration, recette Stripe, disponibilité de l'IA et décision sur les prix. Les clés restent exclusivement sur le serveur.

`api/` contient FastAPI, les comptes, les photos et les crédits ; `web/` contient Next.js ; `mobile/` contient l'aperçu Expo. Aucune clé ne doit entrer dans Git : voir `api/.env.example` pour les variables du serveur. Le déploiement actif est sur N0C. `render.yaml` documente une autre option d'hébergement et ne décrit pas le service en ligne actuel.

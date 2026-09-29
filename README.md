# Studio Annonce

Prototype photo immobilier web et mobile. [studioannonce.fr](https://studioannonce.fr/) sert le studio de démonstration. L'API FastAPI répond sur [studioannonce.fr/api/sante](https://studioannonce.fr/api/sante) depuis le 29 septembre 2026 ; les services nécessitant des fournisseurs externes restent fermés tant qu'ils ne sont pas configurés et vérifiés.

- [Démonstration publique](https://studioannonce.fr/demo/) et [aperçu mobile interactif](https://studioannonce.fr/mobile-preview/).
- [État du déploiement N0C](deploiement/N0C-STATIQUE.md) : pages, API, vérifications et fonctions encore indisponibles.

- [Site et studio](http://127.0.0.1:3173/demo/) — `cd web && npm run dev -- --hostname 127.0.0.1 --port 3173`.
- [Aperçu iPhone/Android](http://127.0.0.1:3173/mobile-preview/) — nécessite aussi `cd mobile && npx expo start --web --localhost --port 8173`.
- [État actuel et historique](DESIGN-DEMO.md), [application mobile](DESIGN-MOBILE.md), [préparer une première vente](LANCEMENT-2026-09-23.md).
- [Visites vidéo : préparation et contrôles à connecter](VIDEO-VISITES.md).
- Tests bibliothèque : `cd web && npm run test:library` (Node 26.5 utilisé pour la vérification).

Les photos sont conservées localement dans la démo. Cette interface n'utilise pas encore l'API : comptes, retouche automatique, paiement et synchronisation ne sont pas connectés à cet aperçu. La maquette vidéo intégrée est un montage de photos fictives. La page `/connexion/` vérifie l'état de l'API et oriente vers la démo tant que l'envoi des codes email est désactivé.

`api/` contient FastAPI, les comptes, les photos et les crédits ; `web/` contient Next.js ; `mobile/` contient l'aperçu Expo. Aucune clé ne doit entrer dans Git : voir `api/.env.example` pour les variables du serveur. Le déploiement actif est sur N0C. `render.yaml` documente une autre option d'hébergement et ne décrit pas le service en ligne actuel.

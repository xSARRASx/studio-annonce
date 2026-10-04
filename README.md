# Studio Annonce

Studio photo immobilier web et mobile. [studioannonce.fr](https://studioannonce.fr/) présente le produit et donne accès au compte connecté ou aux exemples. L'API FastAPI répond sur [studioannonce.fr/api/sante](https://studioannonce.fr/api/sante). Au 4 octobre 2026, le compte propriétaire peut tester la retouche OpenAI et la vidéo Higgsfield sans débit client. La vente reste fermée : Martin a demandé de traiter les paiements à la fin.

- [Démonstration publique](https://studioannonce.fr/demo/) et [aperçu mobile interactif](https://studioannonce.fr/mobile-preview/).
- [État du déploiement N0C](deploiement/N0C-STATIQUE.md) : pages, API, vérifications et fonctions encore indisponibles.
- [Mouvements vidéo et prochain essai](docs/VIDEO-CAMERA-2026-10-04.md) : trajectoires dynamiques par photo, demande conservée et comparaison Kling à valider après recharge.
- [Archives, corbeille et ajout multiple](docs/CORBEILLE-ET-AJOUT-MULTIPLE-2026-10-04.md) : confirmations visibles, restauration des photos/vidéos et choix de plusieurs photos dès le premier écran.
- [Corrections du 4 octobre](docs/CORRECTIONS-STUDIO-2026-10-04.md) : quota de stockage, imports repris sans doublon, retouches par lot, préparation vidéo de 5 à 30 secondes et archives.
- [Contrôle retouche du 1er octobre](VERIFICATION-RETOUCHE-2026-10-01.md) : crédit API épuisé confirmé, consignes photo communes publiées et limites de l'abonnement ChatGPT.
- [Compte connecté](https://studioannonce.fr/connexion/) : prénom, nom, email vérifié et première photo rattachée au compte.
- [Coûts fournisseur et simulations privées](COUTS-PHOTOS-2026-09-29.md) : tarifs vérifiés, hypothèses distinctes des mesures.
- [Grille photo et vidéo](TARIFS-PHOTO-VIDEO-2026-09-30.md) : packs dégressifs, deux soldes et garde-fous d’ouverture.

- [Site et studio](http://127.0.0.1:3173/demo/) — `cd web && npm run dev -- --hostname 127.0.0.1 --port 3173`.
- [Aperçu iPhone/Android](http://127.0.0.1:3173/mobile-preview/) — nécessite aussi `cd mobile && npx expo start --web --localhost --port 8173`.
- [État actuel et historique](DESIGN-DEMO.md), [application mobile](DESIGN-MOBILE.md), [préparer une première vente](LANCEMENT-2026-09-23.md).
- [Visites vidéo : préparation et contrôles à connecter](VIDEO-VISITES.md).
- Tests bibliothèque : `cd web && npm run test:library` (Node 26.5 utilisé pour la vérification).

Les photos de `/demo/` et les anciens brouillons mobiles restent locaux. Le parcours `/connexion/` → `/app/` et l'entrée `/mobile/` utilisent le même compte serveur, ses photos, ses versions et ses limites. Les exemples préparés restent distincts des créations réelles. Un vrai code a été reçu sur Gmail lors d'une recette antérieure, mais Gmail l'a classé dans le spam malgré la signature du domaine ; la délivrabilité reste à améliorer.

Le parcours Stripe Checkout et les confirmations signées sont implémentés et testés avec simulation du fournisseur. Aucun paiement réel ni session Checkout externe n'a été réalisé. Les ventes restent désactivées (`PAIEMENT_ACTIF=false`) jusqu'à configuration, recette Stripe et disponibilité de l'IA. La vidéo exige en plus `VIDEO_ACTIVE=true` après une recette Higgsfield réussie. Les clés restent exclusivement sur le serveur.

Le parcours d'import d'annonce du compte connecté reconnaît les liens Airbnb et Booking et les conserve avec le logement, même si les photos sont ajoutées plus tard. Le site accepte jusqu'à 40 photos depuis l'appareil, par glisser-déposer ou en collant une image copiée ; le mobile utilise sa photothèque. L'ajout ne débite aucun crédit ; chaque version HD conservée est traitée individuellement selon la règle d'une photo offerte, puis un crédit par photo. Un ajout depuis l’écran de retouche ouvre la préparation du lot lorsque plusieurs photos sont choisies ; une photo seule ouvre son éditeur. Un simple lien public ne déclenche pas d'extraction automatique : [Airbnb interdit la collecte automatisée](https://www.airbnb.com/help/article/2857) et [l'API Photos de Booking.com est destinée aux partenaires Connectivity autorisés](https://developers.booking.com/connectivity/docs/photo-api/understanding-the-photo-api). La migration additive `logements.source_url` a déjà été publiée ; ne pas la rejouer pour une simple mise à jour des interfaces.

`api/` contient FastAPI, les comptes, les photos et les crédits ; `web/` contient Next.js ; `mobile/` contient l'aperçu Expo. Aucune clé ne doit entrer dans Git : voir `api/.env.example` pour les variables du serveur. Le déploiement actif est sur N0C. `render.yaml` documente une autre option d'hébergement et ne décrit pas le service en ligne actuel.

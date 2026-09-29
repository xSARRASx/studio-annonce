# Studio Annonce sur N0C — état vérifié le 29 septembre 2026

`https://studioannonce.fr/` répond directement en HTTPS avec l'accueil et le studio de démonstration. Le site statique Next.js et l'aperçu web de l'application Expo sont servis depuis le compte N0C du domaine. La page d'accueil initiale de l'hébergeur et l'ancien index de redirection ont été sauvegardés hors de la racine publique avant activation. Un second export reste accessible sous `/apercu/` avec `X-Robots-Tag: noindex, nofollow`.

Pages vérifiées en ligne : `/`, `/demo/`, `/demo/exemples/`, `/demo/tarifs/`, `/mobile-preview/`, `/mobile/atelier/` et `/connexion/`. Le bouton de l'accueil ouvre le studio sur `/#studio`. Le parcours du studio et le formulaire Photos → vidéo ont été ouverts dans le navigateur, ainsi que le parcours de création mobile. Le build web, 42 tests web et le lint passent (cinq avertissements `<img>` web préexistants).

Cette publication est **une démonstration** : les projets sont conservés dans le navigateur de chaque utilisateur. Elle ne synchronise pas les comptes ou les créations, ne lance aucune génération IA et n'encaisse aucun paiement. La page l'indique explicitement. L'application FastAPI est déployée via Python 3.11 et Passenger dans `~/studioapi`, hors de `public_html`, sous le préfixe `/api`. `https://studioannonce.fr/api/sante` répond `200` avec les statuts de connexion, retouche et paiement. Les 28 tests API passent sur le serveur. Sans SMTP ni clé de fournisseur sur le serveur, la santé indique `false` pour ces fonctions et `/api/auth/code` répond `503`, sans créer de code inutilisable. Les pages `/connexion/` et `/app/` sont exportées, mais la première montre un état d'attente et l'espace connecté n'est pas ouvert aux visiteurs. Ne pas présenter cette démo comme un service commercial opérationnel.

La recette Docker/Caddy du dossier `deploiement/` exige un serveur avec accès root et ne s'applique pas directement à ce compte mutualisé. Voir la [documentation N0C des applications Python](https://kb.n0c.com/en/knowledge-base/python-application-management/). La base SQLite et le stockage local privé sont installés pour valider le backend ; les fichiers locaux sont servis uniquement par URL signée et temporaire. Avant ouverture commerciale : configurer et tester l'envoi des codes email, le fournisseur OpenAI ou Gemini, le stockage et les sauvegardes, puis un paiement réel avec webhooks et un essai client complet. La vidéo IA n'a pas encore de moteur connecté. Voir [`LANCEMENT-2026-09-23.md`](../LANCEMENT-2026-09-23.md) pour les preuves attendues.

Pour reproduire l'export statique connecté au chemin de l'API :

```bash
cd web
NEXT_PUBLIC_BASE_PATH='' NEXT_PUBLIC_MOBILE_URL=/mobile NEXT_PUBLIC_API_URL=/api npm run build
cd ../mobile
EXPO_BASE_URL=/mobile CI=1 npx expo export --platform web --output-dir dist
```

Publier `web/out/index.html`, les fichiers RSC de la racine, `web/out/_next`, `web/out/demo`, `web/out/mobile-preview`, les icônes nécessaires et `mobile/dist` sous `/mobile`. Expo exporte `atelier.html` et les autres routes en fichiers `.html` : sur N0C, copier aussi chaque page dans `mobile/<route>/index.html` pour que les URL avec barre finale et les liens internes fonctionnent. La racine du site est un vrai export Next.js ; `.htaccess` se limite à `Options -Indexes` et `DirectoryIndex index.html`. Conserver les fichiers de l'API et les secrets hors de `public_html`.

La branche de travail reste `codex-travail`. Le déploiement statique a été transféré directement sur l'hébergement ; aucun merge dans `main` n'a été effectué.

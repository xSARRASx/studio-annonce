# Studio Annonce sur N0C — état vérifié le 29 septembre 2026

`https://studioannonce.fr/` répond en HTTPS et redirige vers `/demo/`. Le site statique Next.js et l'aperçu web de l'application Expo sont servis depuis le compte N0C du domaine. La page d'accueil initiale de l'hébergeur a été sauvegardée hors de la racine publique avant activation. Un second export reste accessible sous `/apercu/` avec `X-Robots-Tag: noindex, nofollow`.

Pages vérifiées en ligne : `/demo/`, `/demo/exemples/`, `/demo/tarifs/`, `/demo/aide/`, `/mobile-preview/` et `/mobile/atelier/`. Le parcours du studio et le formulaire Photos → vidéo ont été ouverts dans le navigateur, ainsi que le parcours de création mobile. L'export public compte 124 fichiers ; 187 références internes aux ressources ont été contrôlées sans fichier manquant. Les builds web et Expo, les tests existants, les vérifications TypeScript et les lints passent (cinq avertissements `<img>` web préexistants).

Cette publication est **une démonstration** : les projets sont conservés dans le navigateur de chaque utilisateur. Elle ne synchronise pas les comptes ou les créations, ne lance aucune génération IA et n'encaisse aucun paiement. La page l'indique explicitement. `https://studioannonce.fr/api/sante` répond encore 404 ; l'application API n'a pas été déployée. Les anciennes routes web `/app` dépendant de l'API ne font pas partie de l'export public. Ne pas présenter cette démo comme un service commercial opérationnel.

L'hébergement N0C a un sélecteur Python avec Passenger et Python 3.11 disponible, mais la recette Docker/Caddy du dossier `deploiement/` exige un serveur avec accès root et ne s'applique pas directement à ce compte mutualisé. Voir la [documentation N0C des applications Python](https://kb.n0c.com/en/knowledge-base/python-application-management/). Le backend FastAPI, la base, le stockage des photos, les codes de connexion par mail, le fournisseur de retouche et Stripe demandent une intégration et une validation séparées avant ouverture commerciale. Voir [`LANCEMENT-2026-09-23.md`](../LANCEMENT-2026-09-23.md) pour les preuves attendues.

Pour reproduire l'export statique sans publier l'application API :

```bash
cd web
NEXT_PUBLIC_BASE_PATH='' NEXT_PUBLIC_MOBILE_URL=/mobile NEXT_PUBLIC_API_URL=/api npm run build
cd ../mobile
EXPO_BASE_URL=/mobile CI=1 npx expo export --platform web --output-dir dist
```

Publier uniquement `web/out/_next`, `web/out/demo`, `web/out/mobile-preview`, les icônes nécessaires et `mobile/dist` sous `/mobile`. Expo exporte `atelier.html` et les autres routes en fichiers `.html` : sur N0C, copier aussi chaque page dans `mobile/<route>/index.html` pour que les URL avec barre finale et les liens internes fonctionnent. À la racine, la règle `.htaccess` `RewriteRule ^$ /demo/ [R=302,L]` dirige les visiteurs vers la démo. Conserver les fichiers de l'API et les secrets hors de `public_html`.

La branche de travail reste `codex-travail`. Le déploiement statique a été transféré directement sur l'hébergement ; aucun merge dans `main` n'a été effectué.

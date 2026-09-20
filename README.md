# Studio Annonce

Photos retouchées par IA et vidéos pub pour annonces immobilières.

- `api/` : le cerveau, en Python (FastAPI). Comptes, photos, retouches, crédits, vidéos.
- `web/` : le site (Next.js). À venir.
- `mobile/` : l'application iPhone et Android (Expo). À venir.

Aucune clé ni secret dans ce dépôt : tout vit dans le `.env` du serveur (voir `api/.env.example`).

## Mise en ligne (première version, pour voir le site)

- **Cerveau** : Render, via le fichier `render.yaml` (New + > Blueprint > ce dépôt). Une seule
  variable à coller à la main : `GEMINI_API_KEY`. La base Postgres est créée par le Blueprint.
- **Site** : Vercel (Add New > Project > ce dépôt), dossier racine `web`, une variable :
  `NEXT_PUBLIC_API_URL` = l'adresse Render du cerveau (ex. `https://studio-annonce-api.onrender.com`).
- `CODE_DANS_LA_REPONSE=true` affiche le code de connexion à l'écran tant qu'il n'y a pas de SMTP.
  **À passer à `false` avant d'ouvrir le site au public.**
- Sur l'offre gratuite de Render, les images déposées vivent sur le disque du serveur et
  disparaissent à chaque redémarrage : c'est prévu pour regarder, pas pour les vrais clients.
  Le stockage durable (Amazon S3 ou Cloudflare R2) se branche par les variables `S3_*` + `AWS_REGION` ou `R2_ACCOUNT_ID`.

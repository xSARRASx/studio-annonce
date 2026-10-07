# Accueil et exemple vidéo — 6 octobre 2026

## Choix éditoriaux

- La première vue explique maintenant que Studio Annonce aide à préparer les photos **et** les vidéos d'annonces immobilières. Le H1, les métadonnées SEO, les URL canoniques et le plan du site ne sont pas modifiés.
- Un lien « Voir la vidéo d'exemple » mène au lecteur de la vraie visite de 15 secondes validée par Martin, dans son format paysage. L'ancien film de présentation du parcours (43 secondes) reste distinct.
- La mention discrète « by Sébastien More » utilise le portrait publié par [GuestLucky](https://www.guestlucky.com/a-propos.html), avec des liens séparés vers sa [chaîne YouTube officielle](https://www.youtube.com/@moresebastien) et [GuestLucky](https://www.guestlucky.com/). Le rôle de fondateur et l'orthographe du nom sont confirmés par GuestLucky. La mention « plus de 3 000 membres accompagnés en conciergerie et sous-location » reprend le chiffre et les domaines indiqués sur [la page officielle de GuestLucky](https://www.guestlucky.com/webinaire-conciergerie.html).
- L'exemple vidéo est identique dans la démo web et dans l'exemple du studio connecté. Les projets d'exemple déjà enregistrés localement sont affichés avec le nouveau MP4 sans effacer leurs données.

## Provenance et limites

- MP4 : `/Users/more/Documents/ChatGPT/SAAS 💻/verification-studio-annonce/essai-video-2026-10-06/rendu.mp4`, essai réel de 15,04 secondes à partir de trois images de démonstration. Fichier web réencodé en H.264 1280 × 720, sans nouvelle génération.
- Image de Sébastien : `https://www.guestlucky.com/assets/about/sebastien-laptop-4-640.webp`, copiée sans modification du visage.
- Cette vidéo illustre le rendu sur des images d'exemple. Elle ne garantit ni une visite sans coupure, ni le respect du plan d'un autre logement sans références suffisantes.

## Vérifications

- Build Next.js exporté, lint sans erreur (huit avertissements préexistants) et 26 tests de bibliothèque réussis.
- MP4 décodé intégralement sans erreur ; lecture navigateur vérifiée à 15,041667 secondes.
- Affichage de l'accueil contrôlé sur ordinateur et à 390 px ; lien vers la vidéo testé sur le site public après correction d'une navigation par fragment.
- Sauvegarde préalable des trois pages remplacées : `/Users/more/Documents/Codex/studio-annonce-backups/accueil-video-fondateur-20261006/` ; empreintes identiques aux fichiers N0C avant publication.
- Après publication, les empreintes des pages `index.html`, `app/index.html`, `demo/index.html`, du MP4, de son affiche et du portrait correspondent aux fichiers locaux. Le lecteur public se charge sans erreur et indique 15,041667 secondes.
- Seuls l'export web et les nouveaux médias publics ont été transférés. Aucune modification de l'API, des comptes, de la base, de Stripe, du mobile natif, de `.env`, de `.htaccess` ou de `main`.

La vérification authentifiée de l'exemple vidéo dans le studio connecté reste à faire avec un compte de test. L'export statique et son média sont toutefois publiés et contrôlés.

## Retour depuis les conseils et remboursements — 6 octobre 2026

- Le retour depuis « Lire nos conseils » réaffichait parfois l'ancienne page d'accueil. Les pages HTML, les données de navigation Next (`index.txt`) et les ressources JavaScript ne provenaient pas toutes du même export. Le nouvel export du blog, de ses 24 articles et ses ressources ont été publiés ensemble (125 fichiers HTML/TXT), sans supprimer les anciens fichiers nécessaires aux onglets déjà ouverts. Les parcours accueil → conseils → retour et article → accueil ont été vérifiés sur le site public : le nouvel accueil, la vidéo et la mention de Sébastien sont conservés. À l'avenir, déployer ces trois éléments du même build pour toutes les pages de navigation concernées.
- Le paiement test de 9,99 € est enregistré en base comme un achat réel crédité, puis « remboursé ». Il ne doit donc pas entrer dans le chiffre d'affaires net, mais doit rester visible dans l'historique. Le tableau d'administration distingue désormais les encaissements avant remboursements, les remboursements enregistrés et le chiffre d'affaires net ; il indique aussi « Remboursé » pour chaque achat concerné.
- Sur les données actuelles : 9,99 € d'encaissements bruts, 9,99 € remboursés, 0 € de chiffre d'affaires net. La réponse de l'API a été vérifiée sur le serveur avec la base ouverte en lecture seule. Les tests de l'administration passent (19 tests), ainsi que la compilation web et les 26 tests de bibliothèque. Une vérification visuelle en session administrateur reste nécessaire lors de la prochaine connexion ; la route publique sans session renvoie bien 401.
- Sauvegarde avant publication : `/Users/more/Documents/Codex/studio-annonce-backups/accueil-admin-20261006/`. Seuls les fichiers statiques concernés et `api/app/routes/admin.py` ont été transférés. `api/app/routes/paiements.py`, Stripe, `.env`, la base de données et les fichiers de configuration du père n'ont pas été modifiés.

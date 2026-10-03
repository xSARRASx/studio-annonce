# Studio Annonce — publication et vérification du 3 octobre 2026

## Résultat constaté

Martin a demandé explicitement de reprendre la dernière version de son site, de terminer le référencement de l'ensemble de Studio Annonce et de publier après contrôle. La branche `codex-travail` a été récupérée sans réinitialisation ; elle contenait déjà la correction récente du résultat photo (`4b3bad7`), présente aussi sur le site en ligne. Aucune modification de la branche `main`, du backend, de la base, des clés ou d'un autre projet n'a été nécessaire.

Le premier lot SEO et juridique a été publié depuis `13bf839`. Le second lot, `8754c1c`, ajoute une page `/entreprise/` et précise les pages légales à partir des fonctions réelles de Studio Annonce. ProprioRadar a servi de repère pour la séparation des rubriques ; aucune clause de vente ni formulation propre à son service de prospection n'a été reprise.

Le dernier contrôle public après transfert donne **43 URL dans le sitemap**, dont **24 articles**, toutes répondant avec un titre, une description, un H1, la langue française, une canonique cohérente et sans `noindex`. Seize ressources chargées par les pages échantillonnées répondent. Les écrans de connexion, de l'atelier photo et de l'aperçu mobile gardent `noindex`. `/api/sante`, `/mobile/` et le film V5 répondent `200`. La page `/entreprise/` a aussi été ouverte dans le navigateur ; [capture de contrôle](entreprise-live.png).

Une dernière relecture a retiré de la page Tarifs l'étiquette « Le plus choisi », impossible à justifier tant que les ventes sont fermées. Le libellé neutre « Grand pack » est en ligne. Après ce dernier export, les **43 URL** et leurs canoniques ont été recontrôlées publiquement, l'API et le mobile répondent `200`, et la comparaison de l'export avec le serveur ne relève plus de différence de fichier.

L'export final a généré 62 routes statiques. L'audit HTML local `python3 tests/seo-export.py out` a contrôlé 43 pages et 24 articles sans erreur (liens internes, images, métadonnées, canonique, plan du site, robots et données structurées). `npm run lint` passe avec quatre avertissements préexistants sur des images des écrans privés, sans erreur. Les suites de brouillons (17/17), de bibliothèque (25/25) et de contenu SEO (2/2) ont passé avant la dernière révision éditoriale ; l'export et l'audit complet ont été rejoués ensuite.

## Sauvegardes et incident de quota

- Copie intégrale de `public_html` avant le premier transfert : `/Users/more/Documents/Codex/studio-annonce-backups/seo-20261003-prepublication-0lBljf/public_html/`, comparée octet par octet au serveur avant publication.
- Copie intégrale juste avant la page Entreprise : `/Users/more/Documents/Codex/studio-annonce-backups/seo-20261003-before-company-RNDV1P/public_html/`, comparée au serveur avant le second transfert.
- Copie intégrale avant la correction du libellé commercial : `/Users/more/Documents/Codex/studio-annonce-backups/seo-20261003-before-pricing-ZV6P4H/public_html/`, également comparée au serveur avant transfert.
- Le premier essai du second transfert a échoué sur le quota du compte. Les fichiers de la seconde sauvegarde ont été remis en place, leur correspondance vérifiée et les 42 URL précédentes ainsi que l'API recontrôlées avant toute nouvelle tentative.
- Seul le cache de téléchargement `~/.cache/pip/http` (six fichiers, 2,9 Mo) a été vidé après une copie locale vérifiée dans `seo-20261003-before-company-RNDV1P/pip-cache/`. Aucun fichier client ni archive du compte n'a été supprimé. Le transfert final a été effectué sans suppression, avec remplacement sur place pour éviter une nouvelle pointe d'espace.
- Après publication, le contenu des fichiers de l'export correspond au serveur ; seul un répertoire généré vide (`_next 4/`) manque. Le fichier `.htaccess` conserve son empreinte SHA-256 `957f4d9d46673ed7f4e0f0776cdf26a474446fc7dabc03698ecf3e5d47555702`. `/api`, `/mobile`, `/apercu`, l'API, la base et les sauvegardes restent hors du périmètre de la mise à jour.

## Points encore ouverts

La publication technique ne garantit pas un classement Google ni une citation par les assistants IA. Dans le compte Google consulté le 3 octobre, aucune propriété `studioannonce.fr` n'apparaît dans Search Console ; le sitemap n'y a pas été soumis et les requêtes, positions et pages réellement indexées ne sont donc pas mesurées par ce compte.

Le contrôle public a confirmé la disponibilité de l'accueil, du blog et de la page Entreprise. Le service gratuit PageSpeed Insights a répondu `429` au contrôle mobile : aucun score Lighthouse ni Core Web Vitals n'est revendiqué sur cette base. Les temps observés par une simple requête réseau ne remplacent pas une mesure de navigateur ni les données de terrain.

Les pages juridiques décrivent l'état actuel sans prétendre que le dossier est complet. Il reste à confirmer la durée de conservation effective et la procédure d'effacement des comptes, photos et versions ; les garanties et lieux de traitement des prestataires d'IA ; l'éventuel représentant du responsable de traitement dans l'Union ; le numéro d'immatriculation et le lien contractuel exact entre MA INDUSTRY COMPANY LIMITED et Studio Annonce. Le nom est repris de VériFoncier selon la demande de Martin ; ProprioRadar emploie la forme abrégée « MA INDUSTRY LTD ». Aucune équivalence juridique ni immatriculation actuelle n'a été déduite de cette différence.

Les achats publics restent désactivés. Les conditions générales de vente devront être adaptées aux crédits, aux remboursements et au public effectivement visé avant toute ouverture. Aucun tarif, prestation ou droit de rétractation n'a été inventé pour remplir cette page.

Une [trame de CGV et les décisions à prendre](CGV-PREPARATION.md) sont conservées dans le dépôt, hors du site public.

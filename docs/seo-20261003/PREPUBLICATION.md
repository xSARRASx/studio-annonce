# Studio Annonce — contrôle avant publication (3 octobre 2026)

## État constaté

- Le site en ligne est servi depuis `public_html` sur le compte N0C propre à Studio Annonce. Au second contrôle du 3 octobre, `/application/` est encore absente ; les films V5 ont été publiés entre les deux contrôles par un autre travail sur le projet et sont maintenant présents. L'API publique répond ; elle indique que la connexion fonctionne, mais que retouche, vidéo et achats ne sont pas ouverts aux visiteurs anonymes.
- La version de travail contient 24 guides, les pages publiques existantes, une nouvelle page sur le stockage du navigateur, des conditions d'utilisation et des mentions légales. Les choix « accepter/refuser » de l'ancien bandeau n'activaient aucun outil de mesure ; la version préparée remplace ce bandeau par un lien explicatif. La page de confidentialité a été réécrite à partir du code et de la configuration du serveur.
- La configuration vérifiée utilise l'hébergement et le stockage local N0C, son SMTP, et le fournisseur d'images OpenAI pour le pilote autorisé. Les achats publics sont désactivés. Aucun secret ni contenu de compte n'a été copié dans ce rapport.
- Le 3 octobre, Martin a demandé de reprendre pour Studio Annonce les informations d'éditeur de VériFoncier. Sa page de mentions légales consultée en direct indique MA INDUSTRY COMPANY LIMITED, son siège à Hong Kong, Sébastien Moré comme directeur de publication et PlanetHoster comme hébergeur. La version préparée reprend ces informations d'identité et emploie les coordonnées propres à Studio Annonce, déjà configurées dans ce projet. Cette reprise est une instruction de Martin, pas une preuve indépendante du contrat d'exploitation de Studio Annonce. Aucun contenu fiscal ni clause commerciale de VériFoncier n'a été copié.

## Contrôles effectués sur la copie locale

- Export Next.js et vérification TypeScript après ajout des mentions légales : réussis, 61 routes statiques générées.
- Audit initial du HTML exporté : 41 URL publiques, dont 24 articles, zéro erreur de titre, description, canonique, H1, liens internes, images, sitemap ou robots. Après ajout des mentions légales, nouvel audit des 42 URL du sitemap : tous les fichiers HTML existent et possèdent un titre, une description, un H1 et la canonique attendue ; zéro erreur. Les autres points de l'audit initial n'ont pas été réexécutés sur les 42 pages.
- Lint des fichiers modifiés : réussi, y compris après l'ajout des mentions légales. Tests de brouillons : 17/17. Tests de bibliothèque locale : 25/25 ; ces deux suites n'ont pas été rejouées après la modification des textes juridiques.
- Aperçu navigateur : accueil et page Cookies contrôlés sur ordinateur et à 390 px ; le film V5 se lance. Le pied de page mobile a été corrigé après vérification visuelle.
- Comparaison à blanc avec le serveur après la publication distincte des films V5 (`rsync -n`, sans suppression) : 293 fichiers seraient transférés, environ 6,2 Mo. Aucun transfert réel ni modification du serveur n'a été effectué pour ce lot SEO/juridique.

## Conditions non encore satisfaites

1. Obtenir, s'il existe, le numéro d'immatriculation de MA INDUSTRY COMPANY LIMITED et vérifier ses informations contractuelles pour Studio Annonce. La page VériFoncier n'indique aucun numéro ; aucun numéro n'a été inventé ici.
2. Valider une durée de conservation des comptes, photos et versions, puis prévoir la procédure effective de suppression. Le code actuel n'applique aucune purge automatique ; la page préparée l'indique au lieu de promettre un délai fictif.
3. Vérifier les informations contractuelles des prestataires d'IA, notamment les transferts hors UE, avant de présenter la politique de confidentialité comme complète. L'éditeur étant établi hors UE et le service s'adressant à la France, vérifier aussi avec la personne responsable si un représentant dans l'Union doit être désigné au titre de l'article 27 du RGPD ; la loi prévoit des exceptions à apprécier selon le traitement réel.
4. Rédiger et valider les CGV avant d'ouvrir les achats. Les achats sont actuellement fermés ; les conditions d'utilisation le précisent. Publier des CGV pour un parcours de vente inexistant ou leur attribuer des règles encore non décidées serait trompeur.

**Décision de publication : en attente.** L'autorisation donnée porte sur une publication après contrôle complet, sans effacer l'existant. Le résultat technique local ne prouve ni la conformité juridique ni un classement Google garanti. Il ne faut pas publier ce lot tant que les points ci-dessus ne sont pas résolus.

## Mise en ligne prévue après résolution

Juste avant l'opération : refaire l'état du site, sauvegarder intégralement `public_html` hors du répertoire public, et vérifier l'espace disponible. Transférer seulement l'export web, sans `--delete`, en conservant `.htaccess`, `/api`, `/mobile`, les fichiers clients et les anciennes sauvegardes. Relire publiquement l'accueil, les 42 URL du sitemap, la connexion, les nouvelles pages et la santé API ; restaurer la sauvegarde si une vérification échoue. Ne pas modifier le backend, la base, les clés ou la branche `main` pour cette mise à jour.

## Sources de cadrage

- [CNIL — information des personnes](https://www.cnil.fr/fr/conformite-rgpd-information-des-personnes-et-transparence) et [durées de conservation](https://www.cnil.fr/fr/passer-laction/les-durees-de-conservation-des-donnees).
- [CNIL — article 27 du RGPD, représentant dans l'Union et exceptions](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).
- [CNIL — cookies et traceurs](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies).
- [VériFoncier — mentions légales consultées le 3 octobre 2026](https://www.verifoncier.fr/mentions-legales).
- [Service-Public — CGV](https://entreprendre.service-public.fr/vosdroits/F33527) et [adresse légale de l'entreprise](https://entreprendre.service-public.fr/vosdroits/F37412).
- [Google Search Central — contenu utile](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).
- ProprioRadar a été consulté pour sa séparation claire des pages légales ; aucun texte ni fait propre à ce service n'a été repris.

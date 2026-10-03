# Studio Annonce — contrôle avant publication (3 octobre 2026)

## État constaté

- Le site en ligne est servi depuis `public_html` sur le compte N0C propre à Studio Annonce. Au second contrôle du 3 octobre, `/application/` est encore absente ; les films V5 ont été publiés entre les deux contrôles par un autre travail sur le projet et sont maintenant présents. L'API publique répond ; elle indique que la connexion fonctionne, mais que retouche, vidéo et achats ne sont pas ouverts aux visiteurs anonymes.
- La version de travail contient 24 guides, les pages publiques existantes, une nouvelle page sur le stockage du navigateur et des conditions d'utilisation. Les choix « accepter/refuser » de l'ancien bandeau n'activaient aucun outil de mesure ; la version préparée remplace ce bandeau par un lien explicatif. La page de confidentialité a été réécrite à partir du code et de la configuration du serveur.
- La configuration vérifiée utilise l'hébergement et le stockage local N0C, son SMTP, et le fournisseur d'images OpenAI pour le pilote autorisé. Les achats publics sont désactivés. Aucun secret ni contenu de compte n'a été copié dans ce rapport.

## Contrôles effectués sur la copie locale

- Export Next.js et vérification TypeScript : réussis, 60 routes statiques générées.
- Audit du HTML exporté : 41 URL publiques, dont 24 articles, zéro erreur de titre, description, canonique, H1, liens internes, images, sitemap ou robots.
- Lint des fichiers modifiés : réussi. Tests de brouillons : 17/17. Tests de bibliothèque locale : 25/25.
- Aperçu navigateur : accueil et page Cookies contrôlés sur ordinateur et à 390 px ; le film V5 se lance. Le pied de page mobile a été corrigé après vérification visuelle.
- Comparaison à blanc avec le serveur après la publication distincte des films V5 (`rsync -n`, sans suppression) : 293 fichiers seraient transférés, environ 6,2 Mo. Aucun transfert réel ni modification du serveur n'a été effectué pour ce lot SEO/juridique.

## Conditions non encore satisfaites

1. Confirmer le nom légal, l'adresse professionnelle et, s'il existe, le numéro d'immatriculation de la personne ou société qui exploite **Studio Annonce**. Le nom de marque seul ne suffit pas à remplir les mentions légales. Il faut aussi confirmer le directeur de publication et les coordonnées de l'hébergeur à afficher.
2. Valider une durée de conservation des comptes, photos et versions, puis prévoir la procédure effective de suppression. Le code actuel n'applique aucune purge automatique ; la page préparée l'indique au lieu de promettre un délai fictif.
3. Vérifier les informations contractuelles des prestataires d'IA, notamment les transferts hors UE, avant de présenter la politique de confidentialité comme complète.
4. Rédiger et valider les CGV avant d'ouvrir les achats. Les achats sont actuellement fermés ; les conditions d'utilisation le précisent. Publier des CGV pour un parcours de vente inexistant ou leur attribuer des règles encore non décidées serait trompeur.

**Décision de publication : en attente.** L'autorisation donnée porte sur une publication après contrôle complet, sans effacer l'existant. Le résultat technique local ne prouve ni la conformité juridique ni un classement Google garanti. Il ne faut pas publier ce lot tant que les points ci-dessus ne sont pas résolus.

## Mise en ligne prévue après résolution

Juste avant l'opération : refaire l'état du site, sauvegarder intégralement `public_html` hors du répertoire public, et vérifier l'espace disponible. Transférer seulement l'export web, sans `--delete`, en conservant `.htaccess`, `/api`, `/mobile`, les fichiers clients et les anciennes sauvegardes. Relire publiquement l'accueil, les 41 URL du sitemap, la connexion, les nouvelles pages et la santé API ; restaurer la sauvegarde si une vérification échoue. Ne pas modifier le backend, la base, les clés ou la branche `main` pour cette mise à jour.

## Sources de cadrage

- [CNIL — information des personnes](https://www.cnil.fr/fr/conformite-rgpd-information-des-personnes-et-transparence) et [durées de conservation](https://www.cnil.fr/fr/passer-laction/les-durees-de-conservation-des-donnees).
- [CNIL — cookies et traceurs](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies).
- [Service-Public — CGV](https://entreprendre.service-public.fr/vosdroits/F33527) et [adresse légale de l'entreprise](https://entreprendre.service-public.fr/vosdroits/F37412).
- [Google Search Central — contenu utile](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).
- ProprioRadar a été consulté pour sa séparation claire des pages légales ; aucun texte ni fait propre à ce service n'a été repris.

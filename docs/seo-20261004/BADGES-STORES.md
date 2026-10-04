# Studio Annonce — logos Apple et Android dans le pied de page, 4 octobre 2026

Martin a précisé que les encarts mobiles doivent montrer les logos des plateformes : la pomme Apple et le robot Android. Le pied de page affiche désormais la pomme en blanc dans l'encart App Store et le robot en vert dans l'encart Google Play. Le logo Studio Annonce reste sur son fond clair dans le bloc de marque.

Les deux encarts gardent « Bientôt sur » et n'ont pas de lien actif. Les liens vers les fiches des applications seront ajoutés après leur publication.

Les silhouettes vectorielles proviennent de Simple Icons : [Apple](https://github.com/simple-icons/simple-icons/blob/develop/icons/apple.svg) et [Android](https://github.com/simple-icons/simple-icons/blob/develop/icons/android.svg). Leur géométrie est conservée ; la couleur de remplissage permet une lecture nette sur le fond sombre. Les deux fichiers sont servis localement sous `web/public/platforms/`.

Avant transfert, une sauvegarde complète du site a été enregistrée dans `/Users/more/Documents/Codex/studio-annonce-backups/platform-logos-20261004-before/public_html/`, puis comparée au serveur par contenu : aucune différence de fichier. Export Next.js de 62 routes, audit de 43 pages publiques et 24 articles sans erreur, lint sans erreur (quatre avertissements préexistants), et `git diff --check` réussis.

Les logos et les ressources ont été transférés avant les pages, sans suppression de fichiers serveur. Après publication, la comparaison entre l'export et le serveur ne montre aucune différence ; `.htaccess` conserve son empreinte `92d8217fb0bb5a178d3989eefce1fd05ebb18ed041139d0edeb234954839f99e`. Accueil, blog, page Application, mentions légales, les deux SVG, `/api/sante` et `/mobile/` répondent `200`.

Le navigateur montre les deux logos chargés sur le site public. À 390 px, la largeur du document est de 390 px et les encarts ne contiennent aucun lien. Les captures ordinateur et téléphone sont conservées avec la sauvegarde sous `footer-live-desktop.png` et `footer-live-mobile.png`. Le changement source concerne le pied de page et ses deux SVG, sur `codex-travail`.

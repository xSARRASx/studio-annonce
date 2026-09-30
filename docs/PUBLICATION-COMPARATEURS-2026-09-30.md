# Comparateurs avant/après sur tous les exemples — 30 septembre 2026

Publié sur studioannonce.fr le 30 septembre 2026 à 16:32:16 UTC, suite à la demande de Martin de reprendre le curseur du grand exemple dans toutes les cartes.

## Parcours livré

- Les huit cartes de la galerie ont un comparateur indépendant, directement manipulable. Une consigne explique le geste, les libellés Avant / Après restent visibles et le lien vers le détail est séparé du curseur.
- Le même composant est utilisé dans les trois cartes de l’accueil, les exemples associés, la couverture du blog et les huit illustrations de son article.
- Les images restent superposées à taille fixe pendant le glissement ; les cartes utilisent les WebP de 640 pixels déjà disponibles.
- La version mobile Expo dispose du même geste dans ses huit exemples et dans la carte du salon de la démonstration locale. Les versions intermédiaires restent prévues lorsqu’un exemple en possède.
- Les curseurs web restent utilisables au clavier avec un focus visible. Le glissement horizontal laisse le défilement vertical de la page disponible au doigt.

## Vérifications

- Next : export de 30 pages et contrôle des types réussis. Lint sans erreur, quatre avertissements préexistants sur les images du parcours client.
- Expo : contrôle des types, lint et export web de 15 routes réussis. Code natif prévu avec PanResponder et actions d’accessibilité ; aucune installation native iOS/Android testée dans cette intervention.
- Navigateur isolé, local puis production : manipulation à la souris des huit cartes, indépendance des curseurs, touches Début / Fin / flèche, alignement des deux images et absence de navigation accidentelle vérifiés.
- À 390 pixels, gestes tactiles émulés et défilement vertical vérifiés dans la galerie et dans `/mobile/exemples/`. Aucun débordement horizontal ni erreur JavaScript observé. Les illustrations du blog occupent toute la largeur sur petit écran.
- Vérification publique : 13 pages et 25 dépendances JavaScript/CSS récupérées avec succès ; les 38 empreintes SHA-256 correspondent à l’export testé.

## Publication

Compte et domaine vérifiés : `vzbbtadpbm`, `studioannonce.fr`, racine `/home/vzbbtadpbm/public_html`. Publication limitée au frontend : 164 fichiers écrits, 299 fichiers vérifiés, 135 déjà identiques. La configuration d’hébergement et la passerelle API ont conservé leurs empreintes et permissions.

Sauvegarde : `/home/vzbbtadpbm/sauvegardes-studio/comparateurs-20260930T163004Z/public_html.tar.gz`.

- SHA-256 sauvegarde : `4790870ae427b4b9016c3f502891cacf909bfbf4a7c8f8b23ea42b49bf1c7ed6`.
- SHA-256 archive publiée : `d7520be07f31c2684a15a0ec659db16fd19052ee9bf6c71d7dea21ee81b4d9f1`.
- Manifeste et contrôles conservés hors du site dans `SAAS/livraisons/comparateurs-20260930`.

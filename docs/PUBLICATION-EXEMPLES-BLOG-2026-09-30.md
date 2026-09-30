# Huit exemples et rubrique Blog — publication du 30 septembre 2026

## Résultat publié

Publication du site et de l’export mobile Expo sur studioannonce.fr à 16:08:40 UTC. Huit avant/après issus des quatre annonces fournies par Martin, deux vues par logement, approuvés pour publication dans son dernier message. Les essais fictifs non retenus restent sauvegardés hors du site dans le dossier privé `archives-exemples-non-retenus-20260930`.

- Galerie : https://studioannonce.fr/demo/exemples/
- Huit pages détaillées : `/exemples/[slug]/`, avec demande, explications, original, proposition et lien vers la source.
- Parcours préparé : `/demo/#decouvrir/[slug]` ; garde la demande affichée à l’étape du résultat.
- Blog : https://studioannonce.fr/blog/
- Premier article : `/blog/retouche-photo-immobiliere-exemples-avant-apres/`.
- Mobile : https://studioannonce.fr/mobile/exemples/ — mêmes huit images, versions et demandes, lien vers le blog.

## Référencement et images

Titres et descriptions propres aux pages, liens canoniques, textes alternatifs, images de partage, données structurées WebPage / BreadcrumbList / BlogPosting et plan du site à quinze adresses. Le doublon d’accueil `/demo/` désigne l’accueil canonique `/`. Aucun référencement acquis ni position Google ne sont prétendus : ce sont les éléments publiés pour permettre l’exploration et la compréhension des pages.

Seize photographies avant/après au format WebP, plus seize miniatures : 2 144 614 octets au total pour ces nouveaux fichiers web. Le mobile embarque les mêmes seize photographies. Les propositions de décoration et de rénovation sont présentées comme virtuelles.

Le blog dispose d’une source éditoriale avec statuts brouillon/publié ; voir BLOG.md. Aucun éditeur d’articles dans l’admin n’est encore implémenté.

## Vérifications

- Export Next : 30 pages construites, types valides.
- Lint web : aucune erreur ; quatre avertissements déjà présents sur les images du parcours client.
- Mobile : typecheck, lint et export Expo web réussis ; 15 routes.
- Tests existants : 17 sur les demandes guidées et 25 sur la bibliothèque, tous réussis.
- HTML exporté : une H1, titre/description/canonique, images et liens internes vérifiés sur 12 pages ; huit canoniques d’exemples distincts.
- Navigateur isolé : desktop 1440 px, mobile 390 px ; comparateurs, filtres, parcours guidé, articles et galerie Expo vérifiés ; pas de débordement horizontal constaté ni erreur JavaScript remontée.
- Vérification publique : 47 URL répondent HTTP 200 et leur SHA-256 correspond aux fichiers testés localement.

## Hébergement et périmètre

Compte Studio vérifié : `vzbbtadpbm`, racine `/home/vzbbtadpbm/public_html`. 234 fichiers écrits, 311 vérifiés, 77 déjà identiques. Les fichiers de configuration de l’hébergement et la passerelle API sont inchangés. Aucun changement de compte, paiement, crédit client ou clé API dans cette publication.

Sauvegarde avant publication : `/home/vzbbtadpbm/sauvegardes-studio/exemples-blog-20260930T1605Z/public_html.tar.gz`.
SHA-256 : `377cc596a6e2c4dcebe695394cc4472fef9aec93c8b9b3eb748b59b96bc88815`.
Archive de publication SHA-256 : `c079e9ac97f164126c75ee3bd0be2e45d7439f892d2b3982eac737038d3dd33b`.
Le manifeste et le rapport public restent dans le dossier privé `livraisons/exemples-blog-20260930`.

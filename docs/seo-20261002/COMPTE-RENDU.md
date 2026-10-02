# Studio Annonce — SEO et contenus, 2 octobre 2026

## Résultat disponible localement

La présentation du site est conservée. Cinq guides originaux complètent l’article avant/après existant, avec les images déjà approuvées pour Studio Annonce. Aucune nouvelle génération payante, publication distante, modification d’un compte client ou intervention sur D’Or Tranquille n’a été effectuée pendant ce travail.

La copie de travail est `/Users/more/Documents/Codex/studio-annonce-seo-20261002`, branche `codex/seo-contenus-20261002`. Elle intègre déjà le commit motion design `49618bf2ad4be1dc244ba8a568f74ffafaed8dca` du projet principal. L’accueil, ses vidéos et leurs composants ne font pas partie du diff SEO. Le projet principal est resté intact.

Aperçu : http://127.0.0.1:3192/blog/ (serveur local à maintenir ouvert pour le consulter).

## Contenus préparés

| Adresse sous /blog/ | Sujet et intention |
| --- | --- |
| photos-immobilieres-smartphone/ | Préparer, cadrer et contrôler les photos d’un logement au téléphone |
| eclaircir-photo-interieur-sombre/ | Diagnostiquer une photo sombre, limiter la correction et choisir quand refaire la prise de vue |
| home-staging-virtuel-photo-annonce/ | Comprendre et présenter une projection de décoration, contrôler les volumes et distinguer l’état réel |
| choisir-photos-annonce-location/ | Choisir la couverture, organiser la visite et rédiger des légendes factuelles |
| demande-retouche-photo-immobiliere/ | Formuler une demande précise et contrôler les corrections successives |

Ces sujets forment une proposition éditoriale adaptée au produit. Aucun volume de recherche, position Google ou résultat commercial n’est inventé. Les données Search Console n’ont pas été consultées. Les textes ne promettent ni une disponibilité publique du moteur photo ni la génération vidéo, encore limitée selon la documentation du produit.

Les références Airbnb sont citées sur les deux articles concernés. Les conseils spécifiques au produit s’appuient sur les huit exemples et leurs demandes. Les captures de couverture sont présentées comme des illustrations de retouche, pas comme une preuve de séance smartphone ou de rénovation réalisée.

## Améliorations techniques

- Titres et descriptions distincts, canoniques et partage Open Graph/Twitter pour chaque article.
- CollectionPage/ItemList sur le blog ; BlogPosting et fil d’Ariane sur les articles, en accord avec les contenus visibles.
- Sommaire à ancres, listes de vérification, ressources et liens entre articles et exemples.
- Légende propre à chaque couverture ; suppression du texte générique qui mentionnait un canapé pour toutes les images.
- Miniatures sur la liste du blog et priorité de chargement limitée à la première carte.
- Ajout de la canonique manquante à la page de confidentialité, sans changer son texte.
- Les cinq nouvelles routes rejoignent automatiquement le sitemap existant. Aucune URL existante changée.

## Vérifications effectuées

- Compilation Next.js et vérification TypeScript réussies, y compris après intégration du motion design : 39 routes statiques générées.
- ESLint réussi sur les cinq fichiers TypeScript/TSX modifiés.
- Audit de l’export : 20 pages du sitemap, 6 articles, aucune erreur détectée. Résultat : `verification.json`.
- Contrôle navigateur : blog et article au format ordinateur ; liste et lecture de l’article à 390 × 844, sans débordement horizontal constaté.
- Sommaire testé : navigation vers la troisième section, titre placé à environ 30 pixels du haut.
- Comparateur testé au clavier : valeur et découpe mises à 100 % avec la touche Fin.
- Aucun message d’erreur JavaScript relevé pendant les contrôles du blog.
- Accueil de la version réunie : titre existant conservé, section « Voyez comment ça se passe. » et affiche du film ordinateur présentes. Les fichiers de la vidéo sont ceux du commit motion design ; cette intervention SEO n’a pas refait sa recette vidéo.
- Diff limité au blog, à son style éditorial, à une canonique, au contrôle d’export et à cette documentation. Aucun changement de l’API ou du parcours de paiement.

Captures : `blog-ordinateur.jpg` et `article-mobile.jpg`.

## Intégration et mise en ligne

1. Relire l’aperçu et obtenir la validation de publication du lot SEO.
2. Vérifier le dernier état du projet principal. Intégrer cette branche en conservant les éventuelles modifications survenues depuis `49618bf` ; ne pas remplacer le site par une ancienne copie de `web/out`.
3. Recompiler la version réunie et relancer `python3 tests/seo-export.py` depuis `web`.
4. Pour une publication autorisée, vérifier le compte PlanetHoster de Studio Annonce et sauvegarder l’export existant. Conserver la configuration d’hébergement et de l’API.
5. Relire publiquement le blog, les cinq articles, le sitemap, l’accueil et sa section vidéo. Vérifier les réponses HTTP, canoniques, images et navigation. Arrêter au premier résultat divergent.
6. Avec l’accès Search Console, contrôler l’indexation et suivre impressions, clics et requêtes. Ces mesures serviront à choisir les prochains articles ; aucune position n’est garantie.

## Sources consultées

- Google Search Central, contenus utiles : https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=fr
- Airbnb, prise de vue : https://www.airbnb.fr/help/article/746
- Airbnb, visite photo : https://www.airbnb.fr/help/article/477
- Documentation Next.js 16.3.5 embarquée : métadonnées, export statique et generateStaticParams.
- Projet : README.md, deploiement/N0C-STATIQUE.md, docs/BLOG.md, docs/PILOTE-PHOTO-2026-10-02.md et shared/photo-examples.ts.

# Studio Annonce — SEO et contenus, 2 octobre 2026

## Résultat disponible localement

La présentation du site est conservée. Vingt-trois nouveaux guides complètent l’article avant/après existant : 24 articles au total, classés en cinq thèmes. Les illustrations réutilisent les images approuvées ; les sujets sans image adaptée restent sans couverture. Aucune nouvelle génération payante, publication distante, modification d’un compte client ou intervention sur D’Or Tranquille n’a été effectuée pendant ce travail.

La copie de travail est `/Users/more/Documents/Codex/studio-annonce-seo-20261002`, branche `codex/seo-contenus-20261002`. Elle intègre déjà le commit motion design `7c8711e1c9f9b2ffddb642e73405a788873d8e0f` du projet principal. Les composants visuels de l’accueil et des vidéos ne font pas partie du diff SEO ; seul un balisage Organization/WebSite est ajouté au composant serveur de l’accueil. Le projet principal est resté intact.

Aperçu : http://127.0.0.1:3192/blog/ (serveur local à maintenir ouvert pour le consulter).

## Contenus préparés

| Thème | Nombre de guides | Périmètre |
| --- | --- | --- |
| Pièce par pièce | 7 | Salon, chambre, cuisine, salle de bain, terrasse, petite pièce, extérieur |
| Prise de vue | 5 | Smartphone, perspective, couleur, reflets et netteté |
| Retouche & décoration | 7 | Avant/après, lumière, home staging, demandes, cohérence, pièce vide, palette |
| Images sur le web | 2 | Formats et poids, textes alternatifs |
| Organisation | 3 | Sélection d’annonce, préparation de séance, classement des versions |

Catalogue des adresses et comptage reproductible du corps des guides (incluant sommaires et légendes) : `catalogue.json`.

Ces sujets forment une proposition éditoriale adaptée au produit. Aucun volume de recherche, position Google ou résultat commercial n’est inventé. Les données Search Console n’ont pas été consultées. Les textes ne promettent ni une disponibilité publique du moteur photo ni la génération vidéo, encore limitée selon la documentation du produit.

Les références Airbnb sont citées sur les deux articles concernés. Les conseils spécifiques au produit s’appuient sur les huit exemples et leurs demandes. Les captures de couverture sont présentées comme des illustrations de retouche, pas comme une preuve de séance smartphone ou de rénovation réalisée.

## Améliorations techniques

- Titres et descriptions distincts, canoniques et partage Open Graph/Twitter pour chaque article.
- CollectionPage/ItemList sur le blog ; BlogPosting et fil d’Ariane sur les articles, en accord avec les contenus visibles.
- Sommaire à ancres, listes de vérification, ressources et liens entre articles et exemples.
- Légende propre à chaque couverture ; suppression du texte générique qui mentionnait un canapé pour toutes les images.
- Blog organisé par thèmes avec ancres et grille responsive. Miniatures chargées à la demande ; pas de couverture sans illustration pertinente.
- Ajout de la canonique manquante à la page de confidentialité, sans changer son texte.
- Les 23 nouvelles routes rejoignent automatiquement le sitemap existant. Aucune URL existante changée.

## Vérifications effectuées

- Compilation Next.js et vérification TypeScript réussies, y compris après intégration du motion design : 57 routes statiques générées.
- ESLint réussi sur les fichiers TypeScript/TSX modifiés. Deux contrôles de catalogue vérifient les références, les métadonnées uniques et l’absence de paragraphes de corps identiques.
- Audit de l’export : 38 pages du sitemap, 24 articles, aucune erreur détectée. Résultat : `verification.json`.
- Contrôle navigateur : blog et article au format ordinateur ; liste et lecture de l’article à 390 × 844, sans débordement horizontal constaté.
- Sommaire testé : navigation vers la troisième section, titre placé à environ 30 pixels du haut.
- Comparateur testé au clavier : valeur et découpe mises à 100 % avec la touche Fin.
- Aucun message d’erreur JavaScript relevé pendant les contrôles du blog.
- Accueil de la version réunie : titre existant conservé, section « Voyez comment ça se passe. » et affiche du film ordinateur présentes. Les fichiers de la vidéo sont ceux du commit motion design ; cette intervention SEO n’a pas refait sa recette vidéo.
- Diff limité au blog, à son style éditorial, aux métadonnées publiques, aux contrôles et à cette documentation. Aucun changement de l’API ou du parcours de paiement.

Captures actuelles : `blog-24-ordinateur.jpg`, `blog-24-mobile.jpg` et `guide-accessibilite-mobile.jpg`. Les captures du premier lot restent conservées.

## Intégration et mise en ligne

1. Relire l’aperçu et obtenir la validation de publication du lot SEO.
2. Vérifier le dernier état du projet principal. Intégrer cette branche en conservant les éventuelles modifications survenues depuis `7c8711e` ; ne pas remplacer le site par une ancienne copie de `web/out`.
3. Recompiler la version réunie et relancer `python3 tests/seo-export.py` depuis `web`.
4. Pour une publication autorisée, vérifier le compte PlanetHoster de Studio Annonce et sauvegarder l’export existant. Conserver la configuration d’hébergement et de l’API.
5. Relire publiquement le blog, les 24 articles, le sitemap, l’accueil et sa section vidéo. Vérifier les réponses HTTP, canoniques, images et navigation. Arrêter au premier résultat divergent.
6. Avec l’accès Search Console, contrôler l’indexation et suivre impressions, clics et requêtes. Ces mesures serviront à choisir les prochains articles ; aucune position n’est garantie.

## Sources consultées

- Google Search Central, contenus utiles : https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=fr
- Airbnb, prise de vue : https://www.airbnb.fr/help/article/746
- Airbnb, visite photo : https://www.airbnb.fr/help/article/477
- Documentation Next.js 16.3.5 embarquée : métadonnées, export statique et generateStaticParams.
- Projet : README.md, deploiement/N0C-STATIQUE.md, docs/BLOG.md, docs/PILOTE-PHOTO-2026-10-02.md et shared/photo-examples.ts.

## Google et assistants IA : état réel

Les contenus sont présents dans le HTML statique, les titres et URL canoniques sont uniques, les liens sont explorables sans interaction JavaScript et les données structurées correspondent aux sujets visibles. Le fichier robots.txt local autorise les routes publiques via la règle générique ; il ne contient pas de refus spécifique d’OAI-SearchBot. Les espaces applicatifs restent hors du sitemap.

Google indique que ses fonctions AI Overviews et AI Mode reprennent les prérequis SEO habituels, sans fichier ou balisage spécial obligatoire. OpenAI distingue OAI-SearchBot (recherche) de GPTBot (entraînement). Aucun changement de politique d’entraînement ni de protection serveur n’a été effectué.

Ce qui reste non vérifié : accès réel des robots depuis leurs IP sur l’hébergement, exploration et indexation après mise en ligne, données Search Console, performance réseau en production, citations dans les assistants et trafic acquis. Le rapport de tests locaux ne valide pas ces résultats externes. Aucun llms.txt n’est ajouté comme prétendue garantie de visibilité.

Références vérifiées le 2 octobre 2026 :
- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.openai.com/api/docs/bots
- https://developers.google.com/search/docs/appearance/google-images
- https://www.w3.org/WAI/tutorials/images/informative/
- https://web.dev/learn/images/

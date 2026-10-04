# Blog Studio Annonce

La rubrique publique est `/blog/`. Les articles publiés ont une page HTML autonome, une adresse canonique, un titre, une description, une image de partage et des données structurées BlogPosting. Ils sont automatiquement ajoutés au plan du site. Les exemples sont accessibles à `/exemples/[slug]/`.

## Ajouter un article

Le contenu est centralisé dans `web/app/blog/articles.ts`. Ajouter une entrée avec un identifiant d’adresse stable (`slug`), un statut `draft` ou `published`, un titre, une description, une date ISO, une catégorie, l’identifiant de la photographie de couverture, une introduction et des sections. Chaque section accepte des paragraphes et, facultativement, des liens vers les exemples.

Un brouillon n’apparaît ni dans le blog public, ni dans les pages exportées, ni dans le plan du site. Passer à `published` quand le contenu est validé, vérifier les routes et la mise en page, puis publier l’export du site. Cette première version est éditée dans le projet : il n’y a pas encore d’éditeur d’articles dans l’espace administrateur.

## Ligne éditoriale

Écrire des conseils utiles, fondés sur les images présentées. Distinguer amélioration photographique et aménagement virtuel. Ne pas inventer de résultats commerciaux, de clients satisfaits ou de travaux effectués. Ajouter les nouvelles photos avec des textes alternatifs descriptifs et un lien vers la source lorsque nécessaire. Utiliser un sujet précis par article et des liens internes pertinents, sans répétition artificielle de mots-clés.

## Publication initiale

30 septembre 2026 : huit transformations approuvées par Martin, issues de quatre annonces Airbnb, et un premier article qui explique ces exemples. Les seize images avant/après sont compressées en WebP, avec seize miniatures supplémentaires pour le site. Le mobile utilise les mêmes images et donne accès au blog.

## Guides SEO préparés le 2 octobre 2026

Le catalogue `articles.ts` importe désormais cinq guides depuis `guides.ts`. Un statut `published` signifie « inclus dans l’export local » ; il ne prouve pas une mise en ligne. Cette série est préparée sur la branche `codex/seo-contenus-20261002`, à valider avant déploiement.

Les articles peuvent définir `seoTitle`, `coverCaption`, `related` et `sources`. Une section peut ajouter une `checklist` et des liens internes `links`. Les liens de lecture complémentaire ne ciblent que des articles publiés ; les images de partage sont résolues à partir du même exemple que la couverture. La page blog expose une CollectionPage et une ItemList ; chaque article conserve BlogPosting et BreadcrumbList. Le sommaire est disponible sans JavaScript.

Après compilation, lancer depuis `web` : `python3 tests/seo-export.py`. Ce contrôle parcourt les URL du sitemap et vérifie les pages HTML, les titres et descriptions uniques, les canoniques, les H1, les images, les liens et ancres internes, l’accord entre le blog exporté et le sitemap, ainsi que les données structurées des articles. Les contrôles ne mesurent ni le classement dans Google ni les performances réseau de production.

Détail et consignes d’intégration : `docs/seo-20261002/COMPTE-RENDU.md`.


## Extension du catalogue : 24 articles en aperçu

Les 18 guides supplémentaires sont répartis dans `guides-pieces.ts`, `guides-technique.ts` et `guides-projets.ts`. Le champ `topic` utilise les cinq thèmes de `BLOG_TOPICS` ; l’index les affiche avec leurs compteurs et leurs ancres, sans filtre qui cacherait les liens aux lecteurs sans JavaScript.

`coverExample` est facultatif. Un sujet sans illustration pertinente n’affiche pas de couverture ; sa carte de partage reste textuelle. Ne pas inventer une illustration de cas client pour remplir ce champ. Les références d’exemples, les sujets et les liens de lecture sont vérifiés par `node --test tests/seo-content.test.mjs`, à lancer depuis `web` avant l’export.

Le statut `published` concerne l’export de préparation. Les 23 nouveaux articles n’ont pas encore été déployés. Le rapport dans `docs/seo-20261002/COMPTE-RENDU.md` décrit les validations locales et ce qui reste à contrôler en production pour Google et les assistants IA.

## Dates de publication vérifiables

Le premier article est daté du 30 septembre 2026. Les 23 autres guides ont été préparés le 2 octobre et mis en ligne ensemble le 3 octobre 2026. Leur date interne reflète cette mise en ligne, mais `showDate: false` évite d’afficher 23 fois la même date dans les pages. Quand la date n’est pas affichée, elle est aussi omise des données structurées et de l’aperçu Open Graph. Le plan du site garde la dernière modification connue. Une prochaine publication réellement distincte pourra afficher sa date. Ne pas antidater un guide pour donner artificiellement l’impression d’un historique de publications.

## Correction du 4 octobre 2026

L’index utilise désormais deux colonnes continues sur ordinateur et une sur téléphone : les cartes de hauteurs différentes ne créent plus de lignes vides sous les cartes courtes. Les dates des 23 guides publiés ensemble ne sont plus répétées visuellement. L’article initial conserve sa date vérifiable.

Après compilation, l’audit de l’export couvre 43 pages et 24 articles sans erreur ; les deux contrôles de contenu passent et le lint n’a aucune erreur (quatre avertissements préexistants dans les écrans privés). Une copie complète du site précédent a été conservée dans `/Users/more/Documents/Codex/studio-annonce-backups/blog-20261004-before-layout-dates/public_html/` et comparée au serveur. Le transfert n’a supprimé aucun fichier ; la comparaison de contenu du nouvel export avec le serveur ne relève aucune différence. Les contrôles publics de l’index, de guides, de l’entrée du compte, de l’API, du mobile, du plan du site et de `robots.txt` répondent correctement. Le navigateur a confirmé deux colonnes sur ordinateur, une sur téléphone, et l’absence de date répétée dans un guide publié en lot. Les captures sont conservées dans le dossier de sauvegarde.

Après le retour de Martin sur la lecture des articles eux-mêmes, le gabarit des 24 guides a été repris : sommaire dans une colonne dédiée sur ordinateur, texte plus contrasté, sections numérotées et exemples photographiques affichés sur toute la largeur de leur carte. La photo déjà utilisée en couverture n’est plus répétée dans le corps du même article. Sur téléphone, le sommaire précède le texte et les cartes se suivent sur une seule colonne. Le contrôle visuel local a couvert l’article illustré initial et un guide sans exemple dans le corps, sur ordinateur et sur téléphone ; l’audit de l’export reste à 43 pages et 24 articles sans erreur, les deux tests de contenu passent et le lint ne signale aucune erreur (quatre avertissements anciens dans les écrans privés).

Cette reprise des articles a été publiée après une seconde sauvegarde complète et comparée, conservée dans `/Users/more/Documents/Codex/studio-annonce-backups/blog-20261004-before-article-layout/public_html/` (1 270 fichiers). Les nouvelles ressources ont été transférées avant les pages, sans suppression et sans toucher à `.htaccess` ; la comparaison par empreintes de l’export et des fichiers du serveur ne relève aucune différence. L’accueil, l’index, deux articles, l’entrée du compte, l’API, le mobile, le plan du site et `robots.txt` répondent HTTP 200. Le navigateur montre les cartes remplies et les sections lisibles sur ordinateur comme sur téléphone, sans débordement horizontal mobile. Captures `article-publie-desktop.png` et `article-publie-mobile.png` dans ce dossier de sauvegarde.

## Cohérence avec le reste du site

Le lot du 2 octobre ne se limite plus au blog : accueil, exemples, tarifs et aide renvoient aux guides adaptés ; la page publique `/application/` explique les fonctions et leurs limites actuelles. Le plan de requêtes et les données réellement disponibles figurent dans `docs/seo-20261002/RECHERCHE-MOTS-CLES.md`. Les écrans de compte et l’aperçu mobile sont exclus de l’index par `noindex`, tandis que la présentation publique de l’application reste indexable. L’audit de l’export contrôle aussi les liens entrants et les anciennes routes canoniques.

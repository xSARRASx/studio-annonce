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

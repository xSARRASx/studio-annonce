# Studio Annonce — SEO et contenus, 2 octobre 2026

## Résultat disponible localement

La présentation du site est conservée. L’accueil, les exemples, l’aide, les tarifs et la nouvelle page de présentation de l’application ont été revus avec les 24 guides du blog. Vingt-trois de ces guides sont nouveaux, répartis en cinq thèmes avec l’article avant/après existant. Les illustrations réutilisent les images approuvées ; les sujets sans image adaptée restent sans couverture. Selon `docs/PILOTE-PHOTO-2026-10-02.md`, la vraie retouche photo est active pour le seul compte propriétaire, tandis que les achats et la génération vidéo restent fermés. Aucune nouvelle génération payante, publication distante, modification d’un compte client ou intervention sur D’Or Tranquille n’a été effectuée pendant ce travail.

La copie de travail est `/Users/more/Documents/Codex/studio-annonce-seo-20261002`, branche `codex/seo-contenus-20261002`. Elle intègre déjà le commit motion design `7c8711e1c9f9b2ffddb642e73405a788873d8e0f` du projet principal. L’accueil conserve ses visuels et ses vidéos ; son texte de présentation, ses liens et le chargement mobile de ses images de comparaison sont améliorés. Le projet principal est resté intact.

Aperçu local : http://127.0.0.1:3192/ et http://127.0.0.1:3192/application/ (serveur local à maintenir ouvert pour les consulter).

## Contenus préparés

| Thème | Nombre de guides | Périmètre |
| --- | --- | --- |
| Pièce par pièce | 7 | Salon, chambre, cuisine, salle de bain, terrasse, petite pièce, extérieur |
| Prise de vue | 5 | Smartphone, perspective, couleur, reflets et netteté |
| Retouche & décoration | 7 | Avant/après, lumière, home staging, demandes, cohérence, pièce vide, palette |
| Images sur le web | 2 | Formats et poids, textes alternatifs |
| Organisation | 3 | Sélection d’annonce, préparation de séance, classement des versions |

Catalogue des adresses et comptage reproductible du corps des guides (incluant sommaires et légendes) : `catalogue.json`.

Ces sujets forment une proposition éditoriale adaptée au produit. Les comparaisons Google Trends, les résultats publics et la disponibilité des outils de mesure sont consignés dans `RECHERCHE-MOTS-CLES.md`. Aucun volume de recherche, position Google ou résultat commercial n’est inventé : le compte connecté ne présentait pas de propriété Search Console pour `studioannonce.fr`, ni de compte Google Ads utilisable pour le Planificateur de mots-clés. Les textes ne promettent ni une disponibilité publique du moteur photo ni la génération vidéo, encore limitée selon la documentation du produit.

Les références Airbnb sont citées sur les deux articles concernés. Les conseils spécifiques au produit s’appuient sur les huit exemples et leurs demandes. Les captures de couverture sont présentées comme des illustrations de retouche, pas comme une preuve de séance smartphone ou de rénovation réalisée.

## Améliorations techniques

- Titres et descriptions distincts, canoniques et partage Open Graph/Twitter pour chaque article.
- CollectionPage/ItemList sur le blog ; BlogPosting et fil d’Ariane sur les articles, en accord avec les contenus visibles.
- Sommaire à ancres, listes de vérification, ressources et liens entre articles et exemples.
- Légende propre à chaque couverture ; suppression du texte générique qui mentionnait un canapé pour toutes les images.
- Blog organisé par thèmes avec ancres et grille responsive. Miniatures chargées à la demande ; pas de couverture sans illustration pertinente.
- Ajout de la canonique manquante à la page de confidentialité, sans changer son texte.
- Accueil : description explicite de la retouche immobilière, accès au blog et à l’application, données structurées Organization/WebSite. Les deux photos du comparateur utilisent leurs variantes légères à 640 pixels sur petit écran ; la navigation ne déborde plus à 390 pixels.
- Une page `/application/` indexable explique le parcours, l’aperçu mobile et les limites du pilote sans donner à croire que la vidéo IA ou les achats sont ouverts. Les écrans du compte et l’aperçu mobile reçoivent `noindex` ; les anciennes adresses `/demo/` sont soit non indexées, soit canoniques vers les pages publiques correspondantes.
- Métadonnées et textes visibles de l’aide, des tarifs et des exemples ajustés pour leurs intentions propres. Maillage entre ces pages, l’application et les guides.
- Les 23 nouvelles routes d’articles et `/application/` rejoignent le sitemap existant. Aucune URL existante changée. `robots.txt` laisse lire les directives `noindex` des écrans privés ; API et administration restent bloquées.

## Vérifications effectuées

- Compilation Next.js et vérification TypeScript réussies, y compris après intégration du motion design : 58 routes statiques générées.
- ESLint réussi sur les fichiers TypeScript/TSX modifiés. Deux contrôles de catalogue vérifient les références, les métadonnées uniques et l’absence de paragraphes de corps identiques.
- Audit de l’export : 39 pages du sitemap, 24 articles, aucune erreur détectée. Il vérifie également les liens entrants vers les pages publiques, les anciennes routes canoniques, les zones privées en `noindex` et les liens sans cible. Résultat : `verification.json`.
- Contrôle navigateur : accueil, présentation de l’application, tarifs, aide, exemples, blog et article. L’accueil et la page application ont été examinés à 390 × 844, sans débordement horizontal ; l’application a aussi été examinée au format ordinateur.
- Sommaire testé : navigation vers la troisième section, titre placé à environ 30 pixels du haut.
- Comparateur testé au clavier : valeur et découpe mises à 100 % avec la touche Fin.
- Aucun message d’erreur JavaScript relevé pendant les contrôles du blog, de l’accueil et de la page application.
- Accueil de la version réunie : titre existant conservé, section « Voyez comment ça se passe. » et affiche du film ordinateur présentes. Les fichiers de la vidéo sont ceux du commit motion design ; cette intervention SEO n’a pas refait sa recette vidéo.
- PageSpeed Insights de la version actuellement **en ligne**, avant ces changements : score mobile 84, ordinateur 96, et plus grande peinture mobile à 4,2 s dans le test de laboratoire ; aucune donnée réelle CrUX disponible. Le poids des images était une piste majeure. Les variantes mobiles du comparateur sont bien chargées dans l’aperçu local, mais **aucun nouveau score PageSpeed en production** ne peut encore leur être attribué. Rapport : https://pagespeed.web.dev/analysis/https-studioannonce-fr/qjf1v9pd7j?form_factor=mobile.
- Aucun changement de l’API, du paiement ou de la logique privée de l’application ; seul son balisage d’indexation a changé.

Captures actuelles : `accueil-mobile.png`, `application-mobile.png`, `application-ordinateur.png`, `blog-24-ordinateur.jpg`, `blog-24-mobile.jpg` et `guide-accessibilite-mobile.jpg`. Les captures du premier lot restent conservées.

## Intégration et mise en ligne

1. Relire l’aperçu et obtenir la validation de publication du lot SEO. `main` publie le site ; aucune fusion dans `main` sans cet accord.
2. Vérifier le dernier état du projet principal et de `codex-travail`. Intégrer les changements en conservant les modifications survenues depuis `7c8711e` ; ne pas remplacer le site par une ancienne copie de `web/out`.
3. Recompiler la version réunie et relancer `python3 tests/seo-export.py` depuis `web`.
4. Pour une publication autorisée, vérifier le compte **N0C actuellement utilisé** par Studio Annonce, sauvegarder l’export servi et conserver sa configuration ainsi que celle de l’API. Le journal du 29 septembre et `docs/PILOTE-PHOTO-2026-10-02.md` décrivent l’installation actuelle ; l’ancienne passation PlanetHoster ne doit pas servir de destination.
5. Relire publiquement l’accueil, l’application, les exemples, l’aide, les tarifs, le blog, les 24 articles, `robots.txt` et le sitemap. Vérifier les réponses HTTP, canoniques, images et navigation. Arrêter au premier résultat divergent.
6. Avec un accès Search Console vérifié, contrôler l’indexation et suivre impressions, clics et requêtes. Ces mesures serviront à choisir les prochains contenus ; aucune position n’est garantie.

## Sources consultées

- Google Search Central, contenus utiles : https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=fr
- Google Search Central, URL dupliquées et `noindex` : https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls et https://developers.google.com/search/docs/crawling-indexing/block-indexing
- Google Trends, France, douze derniers mois : https://trends.google.com/trends/explore?geo=FR&q=home%20staging,retouche%20photo,photo%20immobili%C3%A8re
- PageSpeed Insights, mesure de la version en ligne avant ce lot : https://pagespeed.web.dev/analysis/https-studioannonce-fr/qjf1v9pd7j?form_factor=mobile
- Airbnb, prise de vue : https://www.airbnb.fr/help/article/746
- Airbnb, visite photo : https://www.airbnb.fr/help/article/477
- Documentation Next.js 16.3.5 embarquée : métadonnées, export statique et generateStaticParams.
- Projet : README.md, deploiement/N0C-STATIQUE.md, docs/BLOG.md, docs/PILOTE-PHOTO-2026-10-02.md et shared/photo-examples.ts.

## Google et assistants IA : état réel

Les contenus sont présents dans le HTML statique, les titres et URL canoniques sont uniques, les liens sont explorables sans interaction JavaScript et les données structurées correspondent aux sujets visibles. Le fichier robots.txt local autorise les routes publiques via la règle générique ; il ne contient pas de refus spécifique d’OAI-SearchBot. Les espaces applicatifs restent hors du sitemap.

Google indique que ses fonctions AI Overviews et AI Mode reprennent les prérequis SEO habituels, sans fichier ou balisage spécial obligatoire. OpenAI distingue OAI-SearchBot (recherche) de GPTBot (entraînement). Aucun changement de politique d’entraînement ni de protection serveur n’a été effectué.

Ce qui reste non vérifié : accès réel des robots depuis leurs IP sur l’hébergement, exploration et indexation après mise en ligne, données Search Console, performance de **ce nouveau lot** en production, citations dans les assistants et trafic acquis. Le rapport de tests locaux ne valide pas ces résultats externes. Aucun llms.txt n’est ajouté comme prétendue garantie de visibilité.

Références vérifiées le 2 octobre 2026 :
- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.openai.com/api/docs/bots
- https://developers.google.com/search/docs/appearance/google-images
- https://www.w3.org/WAI/tutorials/images/informative/
- https://web.dev/learn/images/

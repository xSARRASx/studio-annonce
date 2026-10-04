# Studio Annonce — images et indexation, 4 octobre 2026

Les seize images originales et retouchées des huit exemples sont maintenant déclarées dans le sitemap existant. Les pages d’exemple contiennent chacune leurs deux images ; les articles ayant une couverture reprennent les mêmes images lorsqu’elles sont réellement présentes dans leur HTML. Les 43 URL publiques, leur ordre et leurs dates de modification sont conservés. Aucun article supplémentaire ni date de publication artificielle n’a été ajouté.

Ce changement aide les moteurs à découvrir les visuels ; il ne garantit pas leur indexation ni une position dans Google Images. Il suit le [format de sitemap pour images documenté par Google](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps). Le contrôle d’export distingue désormais les URL de pages des URL d’images et vérifie que chaque image existe et apparaît sur la page déclarée.

## Contrôles effectués

- Audit HTTP du site publié : 43 pages, dont 24 articles, 159 destinations internes et fragments, 72 ressources ou destinations complémentaires ; aucune erreur détectée dans les contrôles de titres, descriptions, langue, H1, URL canoniques, directives d’indexation, données structurées, ressources et liens.
- Export Next.js réussi sur une copie du code validé, comprenant uniquement les deux modifications de ce lot ; les changements simultanés du studio connecté et de l’API sont exclus de cette copie.
- Audit d’export : 43 pages, 24 articles, 16 images distinctes déclarées, zéro erreur. Les deux tests de contenu SEO et le lint ciblé du sitemap passent.
- Après publication : `/sitemap.xml` répond 200 et correspond exactement à l’export ; les seize images répondent 200 avec le type `image/webp`.

## Publication

Une sauvegarde intégrale de `public_html` a été conservée et comparée par contenu avant transfert : aucune différence. Elle se trouve hors dépôt dans `/Users/more/Documents/Codex/studio-annonce-backups/final-seo-20261004T093519Z/public_html-before-images/`.

**Seul `sitemap.xml` a été transféré.** Son SHA-256 publié est `89c65a1a050f11a17dc96f6f4d644b2a341c0cf406d93a74e6d3f6425657cdef`. Aucun HTML, bundle, fichier de l’API, donnée de compte, fichier mobile ou `.htaccess` n’a été remplacé dans cette publication. Le travail reste sur `codex-travail`.

## Vérifications Google

Les inspections Search Console montrent des états différents selon les pages :

| Page | Résultat vérifié le 4 octobre |
| --- | --- |
| Accueil | Indexé lors du contrôle précédent de cette journée |
| Tarifs | « Cette URL est sur Google », page indexée et HTTPS valide |
| Guide home staging virtuel | Page indexée, HTTPS valide, un fil d’Ariane valide |
| Application | Détectée mais non indexée ; demande reçue et ajout à la file d’exploration prioritaire |
| Guides (`/blog/`) | Détectée mais non indexée ; demande reçue et ajout à la file d’exploration prioritaire |
| Exemples | Détectée mais non indexée ; demande reçue et ajout à la file d’exploration prioritaire |

Les captures de confirmation sont privées et conservées avec la sauvegarde. Une demande reçue n’est pas une indexation terminée. Les pages déjà indexées n’ont pas reçu de demande répétée. Les rapports globaux ne fournissent pas encore de données exploitables de requêtes, positions ou visites ; aucun volume de mot-clé n’est inventé.

## Accès des assistants et limites

Les requêtes de contrôle utilisant les agents Googlebot, Bingbot, OAI-SearchBot et Claude-SearchBot ont reçu le HTML public attendu sur les cinq adresses testées. Il s’agit de simulations depuis la connexion de contrôle, pas de preuves d’une visite réelle de ces robots ni d’une citation par un assistant.

La même série avec ChatGPT-User a reçu 403. Le diagnostic et les limites du correctif envisagé restent dans le rapport privé local. Ce blocage n’est pas présenté comme corrigé. [OpenAI distingue ChatGPT-User, utilisé pour certaines lectures demandées par l’utilisateur, d’OAI-SearchBot, utilisé pour la recherche](https://developers.openai.com/api/docs/bots).

Le suivi des décisions Google, de l’accès des robots et des limites d’hébergement doit précéder de nouveaux ajouts de contenu. Les scores techniques, le sitemap et les demandes d’indexation ne constituent pas des preuves de classement ni de résolution des signalements de sécurité.

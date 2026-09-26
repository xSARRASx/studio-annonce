# Studio Annonce : aperçu réel et connexions utiles

Recherche du 22 septembre 2026. Recommandations de l'assistant, pas décisions d'architecture validées par Martin.

## État vérifié de l'application

- [Site public](https://xsarrasx.github.io/studio-annonce/) ouvert et observé dans le navigateur Codex : accueil sombre, accent ambre, logo Studio Annonce, arguments commerciaux et connexion par code email. Onglet conservé pour Martin.
- Le JavaScript réellement publié appelle `http://localhost:8000`. Vérification dans `_next/static/chunks/0sxpd2mrs70mq.js`, au niveau de `fetch`. Il n'est donc pas relié à une API publique : chaque visiteur tenterait de joindre son propre ordinateur. Cela ne prouve pas qu'aucun serveur n'existe ailleurs.
- [Dépôt](https://github.com/xSARRASx/studio-annonce), branche `main`, arbre complet au commit `b8b485d5dbc019cc2d551a94ef06228c728fa797`. Présence de `web`, `api`, `design`, `deploiement`, `render.yaml`. Écrans logements, logement, photo et compte présents. Aucun projet Expo/React Native ou natif mobile trouvé dans cet arbre.
- Connexion GitHub testée : utilisateur xSARRASx, dépôt accessible, permissions pull/push rapportées. Aucun fichier distant modifié, aucun envoi, aucun déploiement.
- Le workflow GitHub Pages prend l'adresse du serveur dans la variable Actions `API_URL`. Pour une version publique utilisable, il faudra une API publique configurée et reconstruire le site. Le fonctionnement des retouches, des emails et du paiement n'a pas été testé ici.

## Ce que signifie « connecter »

Trois choses différentes : donner à Codex un accès de travail à un service ; relier GitHub à un hébergeur ou à un outil de construction ; configurer les API que l'application utilisera pour ses clients. Une connexion de travail ne configure pas automatiquement les clés du serveur applicatif.

ChatGPT et Codex partagent un annuaire de plugins, mais les capacités restent dépendantes de l'interface, du compte, des autorisations et de l'environnement. Il faut vérifier l'accès dans la tâche où l'on souhaite l'utiliser. Source : [architecture officielle des plugins](https://developers.openai.com/plugins/concepts/plugins), [MCP dans Codex](https://learn.chatgpt.com/docs/extend/mcp).

## Sélection recommandée

| Connexion | Usage concret | État observé et priorité |
|---|---|---|
| GitHub | Lire le code, préparer branches et modifications, ouvrir des PR et consulter les constructions | Accès testé ici. Déjà prêt ; pas besoin de reconnecter pour lire ce dépôt. |
| Figma | Concevoir et revoir les écrans web/mobile, lire composants et styles pour les implémenter | Plugin trouvé dans l'annuaire, non installé lors de la recherche. Suggestion proposée ; aucune connexion confirmée. Utile si Martin souhaite valider les maquettes. |
| Expo / EAS | Construire le mobile iOS/Android, consulter les erreurs de construction, tester l'app dans un simulateur | MCP et plugin officiels documentés. Pas de résultat Expo dans l'annuaire accessible à cette session ; configuration Codex séparée possible. À préparer au démarrage du mobile. |
| OpenAI Developers | Aider à configurer et développer l'intégration OpenAI | Plugin installé selon l'annuaire. Projet API, clé et facturation applicative non vérifiés. Ne pas confondre installation et API de retouche fonctionnelle. |
| Stripe | Préparer les packs, le paiement et diagnostiquer l'intégration | Serveur MCP officiel et plugin ChatGPT documentés. Non connecté dans cette session. Commencer dans un environnement de test. |
| Sentry | Comprendre les erreurs et plantages web/mobile, relier les incidents au code | Serveur MCP officiel disponible ; pas de connexion testée. Utile avant les premiers testeurs. Nécessite aussi l'instrumentation de l'application. |
| Context7 | Consulter les documentations techniques correspondant aux bibliothèques employées | MCP/plugin documenté ; non connecté. Complément facultatif, les documentations officielles sont déjà consultables sur le web. |
| Vercel | Gérer les déploiements du site et consulter leurs journaux | Plugin installé, accès au compte non testé. Option si l'hébergement du frontend change. Pas nécessaire pour conserver PlanetHoster. |
| Render | Gérer services Python, journaux et bases de données | Skills/outils Render présents dans la session ; accès au compte non testé. Alternative d'hébergement, pas une migration décidée. |

Sources directes :

- [Figma : installation et capacités](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/). Connexion OAuth, lecture du contexte de design et édition selon le client. Codex est explicitement documenté.
- [Expo MCP](https://docs.expo.dev/mcp/) et [Expo pour les agents](https://docs.expo.dev/agents/). Compte Expo requis ; fonctions locales à activer dans le projet. Pour iOS, les fonctions locales décrites concernent le simulateur sur Mac, pas un iPhone physique.
- [Expo et GitHub](https://docs.expo.dev/build/building-from-github/). Permet de déclencher des constructions mobiles depuis le dépôt. Ce lien ne donne pas, à lui seul, l'accès Expo à Codex.
- [Stripe MCP](https://docs.stripe.com/mcp). OAuth avec droits et environnements séparables. Le plugin officiel est documenté par Stripe, mais la recherche dans l'annuaire de cette session n'a pas retourné Stripe directement ; ne pas remplacer par un agrégateur marketing.
- [Sentry MCP](https://mcp.sentry.dev/). OAuth, recherche d'erreurs, performance, incidents ; connexion ciblable sur un projet.
- [Context7 pour les clients MCP](https://context7.com/docs/resources/all-clients).
- [Vercel MCP](https://vercel.com/docs/agent-resources/vercel-mcp).
- [Render MCP](https://render.com/docs/mcp-server).

## Choix adaptés au projet existant

Conserver pour l'instant la direction rapportée dans la passation : FastAPI, PostgreSQL, HybridCloud de Sébastien et S3. Ne pas ajouter Supabase, Vercel et Render simultanément simplement pour disposer de connecteurs. GitHub plus un environnement local suffisent pour commencer à corriger et développer le code.

Pour PlanetHoster, la recherche de plugins n'a pas trouvé d'entrée directe dans l'annuaire accessible. Cela ne prouve pas l'absence de toute intégration. Un accès serveur configuré par Sébastien, par exemple SSH avec des droits adaptés, peut permettre le travail de déploiement depuis ce Mac. L'accès au serveur et au bucket AWS n'a pas été inspecté ni demandé pendant cette recherche.

Pour les essais visuels web, le navigateur contrôlable est déjà disponible et a servi à ouvrir le site. Un second connecteur navigateur n'est pas nécessaire pour cette première étape. Pour le mobile, ajouter Expo lorsque le projet mobile est créé.

Notion, Slack, Dropbox et Box ne sont pas prioritaires pour coder ce produit. La bibliothèque de mémoire locale existe déjà. Aucun abonnement supplémentaire n'est recommandé à ce stade ; les coûts de construction mobile, hébergement, API et stores devront être examinés au moment du choix.

## Ordre proposé

1. Examiner l'accueil existant et remettre en état une prévisualisation complète des écrans déjà codés, avec un serveur local ou un environnement de test.
2. Valider l'apparence et le parcours ; connecter Figma si l'on veut des maquettes partagées et modifiables.
3. Développer et tester la V1 web avec GitHub déjà accessible ; configurer les API applicatives dans l'environnement du projet.
4. Connecter Stripe pour l'intégration de paiement en test et Sentry pour les premiers retours.
5. Créer le projet mobile Expo, connecter Expo/EAS et préparer les constructions iOS/Android.

Aucune installation, autorisation supplémentaire, clé API, dépense ou modification du produit n'a été effectuée pendant cette recherche. Seule une suggestion Figma a été présentée. Les disponibilités et connexions sont celles observées pendant cette tâche.

# Application mobile — cadrage initial

Demande de Martin du 22 septembre 2026 : décliner Studio Annonce en application mobile.
Le dépôt contient actuellement une application web Next.js ; aucune application native mobile présente lors de la vérification.

## Parcours proposé
- Mes photos : collection et accès à l’appareil photo ou à la photothèque.
- Atelier : photo en grand, demande de retouche, résultat puis comparaison.
- Versions : historique complet, sans écraser les propositions précédentes.
- Compte : crédits et réglages, à connecter ultérieurement.

Conserver logo porte lumineuse, couleurs crème/olive et textes courts. Préférer une barre de navigation en bas à la colonne latérale du site. Présenter le résultat avant les réglages sur les petits écrans.

## Périmètre de la première maquette
Réutiliser les quatre images déjà créées ; génération manuelle dans la conversation. Aucun paiement ni authentification réels à présenter comme opérationnels. La synchronisation web/mobile sera à implémenter avec le backend partagé.

## Cibles confirmées et aperçu
Martin utilise un iPhone et veut proposer iOS et Android. Il demande d’abord un aperçu interactif comme pour le site. Base créée dans mobile/ avec quatre écrans et Expo Router. Aperçu au format téléphone : http://127.0.0.1:3173/mobile-preview/. Voir mobile/README.md pour lancement, contrôles et limites. Aucune installation ni publication native réalisée.

## Itération du 23 septembre 2026 — continuité locale
Le prototype Expo existe désormais ; le constat initial ci-dessus est conservé comme historique.

L’accueil propose d’abord d’ajouter une photo et laisse le salon préparé comme exemple explicite. L’atelier reste une liste, jamais un éditeur ouvert sans choix. Les photos sont rangées de la plus récente à la plus ancienne ; un filtre « Gardées » retrouve les versions préférées. Les historiques sont eux aussi des listes par photo, puis une liste de versions ouvrant chacune l’image en grand. Les quatre images existantes et le logo porte lumineuse sont préservés.

Photos importées, sélection, version gardée, demande en cours et simulation de crédit sont conservées localement : IndexedDB dans l’aperçu web, fichiers Documents et AsyncStorage pour les cibles natives. Les images personnelles ne sont envoyées à aucun service. Ce stockage ne synchronise pas les appareils et n’est pas une sauvegarde serveur.

Le parcours de téléchargement est **explicitement simulé** : première photo retouchée offerte à zéro crédit, puis un crédit de démonstration par nouvelle photo retouchée, dialogue centré avec date/heure limite à sept jours, croix et bouton « J’ai compris ». Les retéléchargements ne modifient ni le débit ni l’échéance. Après expiration, le projet et ses versions restent consultables ; reprendre les retouches nécessite une action distincte « Réactiver les retouches · 1 crédit démo ». Aucune génération automatique, aucun téléchargement de fichier, aucun paiement réel.

Avant publication : mettre en cohérence ce parcours avec l’authentification, le stockage partagé, l’API de facturation et les conditions commerciales validées. Une compilation Expo ne vaut pas une validation iPhone/Android sur appareil physique.

Validation technique : lint, TypeScript, douze tests des règles offre/crédit/expiration/migration/restauration, Expo Doctor 21/21 et export des trois plateformes réussis. Contrôle visuel navigateur à intégrer à la revue d’ensemble du site et de l’aperçu mobile ; aucun test physique natif revendiqué.


Alignement de l’offre mobile et web : cinq crédits démo pour les nouveaux espaces, en plus de la première photo offerte. Les espaces déjà enregistrés conservent leur solde historique, sans remise à zéro. L’offre consommée est conservée avec les projets. Le reçu gratuit dit explicitement « 0 crédit utilisé » ; le reçu payant reste distinct. Vérifié dans Chrome avec conservation de l’échéance, de la version gardée et du solde au rechargement. L’import d’une photo de cuisine a ensuite été réalisé dans le navigateur intégré pendant la revue principale. La tentative Chrome antérieure était limitée par les permissions de son extension.


Finition de cohérence : les originaux (y compris les imports sans résultat IA) n’utilisent jamais l’offre ou un crédit et ne lancent pas les sept jours. Ils affichent un reçu gratuit distinct. Un téléchargement ne remplace jamais la version gardée ; « Garder cette version » reste la seule action qui choisit le favori. Quatre régressions supplémentaires couvrent ces règles et la conservation d’une échéance déjà ouverte.

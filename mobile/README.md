# Studio Annonce mobile — prototype

Expo SDK 57, React Native et Expo Router. Cibles iOS et Android confirmées par Martin ; aperçu navigateur demandé en premier.

## Lancer
`npm ci`, puis `npm run web -- --localhost --port 8173` dans mobile.
Démarrer également le site Next.js sur 3173 pour le cadre téléphone : http://127.0.0.1:3173/mobile-preview/.
Aperçu direct : http://127.0.0.1:8173/.

## Écrans
Photos, Atelier, Versions, Compte. Quatre images conservées ; sélection d’une version et vue original. Photothèque/appareil photo utilisent expo-image-picker et restent à tester sur appareils physiques. Aucun envoi de photo serveur. Images ajoutées, demandes, sélection et version gardée enregistrées localement sur cet appareil. Pas de génération automatique, paiement ni authentification. Pas encore de synchronisation avec le site.

## Vérifications
TypeScript, lint et expo-doctor (21/21) passent. Export des bundles iOS, Android et web réussi ; ce ne sont pas des binaires signés installables. Navigation et sélection d’une ancienne version testées dans Chrome ; rendu vérifié dans le cadre téléphone. Pas de test iPhone/Android natif effectué. Icônes de lancement issues du modèle Expo restent à remplacer avant distribution. npm rapporte des vulnérabilités modérées dans les dépendances : audit à traiter avant livraison de production.

## Suite
Validation du design avec Martin, puis essai physique sur son iPhone selon le flux Expo compatible. Aucun compte Expo/Apple/Google configuré, aucune publication sur les stores.

## Navigation par photo
Atelier vide au démarrage, puis liste des photos ajoutées (plus récente en premier). Versions liste les mêmes dossiers, ouvrant chacun son historique. Routes retouche et historique avec id de photo, états de sélection distincts par dossier. Le salon préparé doit être ajouté explicitement depuis Mes photos ; les imports personnels commencent avec leur seul original. État restauré au rechargement, avec récupération des images locales.


## Persistance et parcours crédit — 23 septembre 2026
- Stockage web : IndexedDB, photos conservées comme Blob, URI temporaires recréées au chargement. Pas de grandes images en localStorage.
- Stockage natif : copie durable dans Documents avec expo-file-system ; métadonnées versionnées dans AsyncStorage. Aucun secret ni compte utilisateur stocké.
- Le modèle valide les métadonnées avant restauration. Une erreur de lecture empêche de les écraser et affiche une explication ; une image manquante conserve son projet.
- Première photo retouchée téléchargée offerte : zéro crédit consommé, horodatage fixé, échéance exacte sept jours plus tard. Les nouvelles photos suivantes utilisent un crédit au premier téléchargement simulé. Cinq crédits de démonstration disponibles dans un nouvel espace.
- Retélécharger garde la même échéance et ne débite pas de crédit, y compris après l'expiration. Réactiver les retouches expirées est une action distincte, explicite, à un crédit de démonstration.
- Dialogue centré, défilable sur petit écran, fermeture par croix ou « J’ai compris ». Pas de fermeture au toucher du fond ou du bouton retour Android.
- Toutes les opérations sont simulées : aucun fichier exporté, aucune génération IA ni facturation réelle. Aucune synchronisation avec le site.
- Ce stockage survit au rechargement, mais pas à l'effacement des données du navigateur ou à la désinstallation de l'app. Essai sur appareils physiques restant à faire.

## Contrôles de cette itération
Le 23 septembre 2026 : `npm run lint`, `npm run typecheck` et `npx expo-doctor` passent (21/21). `npm run test:logic` couvre douze scénarios : première photo offerte et cinq crédits neufs, offre utilisée une seule fois malgré un rechargement, retéléchargement après expiration et réactivation distincte, épuisement des crédits, migration des soldes existants, offre inutilisée sur un ancien espace, refus de métadonnées invalides plafond de sept jours affichés, favori inchangé au téléchargement, original d’exemple gratuit, original importé gratuit même sans solde et conservation de l’échéance quand on revient à l’original. Export final iOS, Android et web dans `dist-verified-2026-09-23-consistent/` (artefact local ignoré par Git). La commande de tests utilise un Node récent compatible avec `--experimental-strip-types`.

La validation de cette itération n’inclut pas d’installation signée ni d’essai caméra sur iPhone/Android. L’aperçu reste l’outil de revue du produit avant ces étapes.


### Alignement de l’offre avec le web
Le format local passe au schéma 2 avec `freeUsed` et `creditsTotal`. La même clé de stockage est conservée. La migration d’un schéma 1 garde son enveloppe historique de trois crédits et ses débits : aucun solde, projet, historique ou date n’est réinitialisé. Une première photo déjà téléchargée est considérée comme l’occasion de bienvenue déjà utilisée ; une ancienne collection sans téléchargement garde son offre disponible. Les nouveaux espaces commencent avec cinq crédits et une première photo offerte en plus.

Vérification réelle dans Chrome : atelier vide, ajout explicite du salon, quatre versions en liste, sélection/garde de Lumière, premier reçu gratuit, cinq crédits inchangés et état conservé après rechargement. La vérification d’import a ensuite été reprise dans le navigateur intégré par la revue principale : la photo de cuisine a bien été ajoutée à l’atelier. L’échec antérieur de l’automatisation de l’import dans Chrome concernait la permission de l’extension ; aucun paramètre du navigateur n’a été modifié.


### Original, téléchargement et favori
L’original d’une photo reste gratuit, qu’il vienne du salon d’exemple ou d’un import personnel : il ne consomme ni crédit ni offre, et n’ouvre pas la période de sept jours. Son reçu explique cette différence sans afficher de fausse échéance. Seul le premier téléchargement d’une version retouchée déclenche l’offre ou le débit et la période de retouche. Les simulations de téléchargement ne choisissent jamais le favori : seul « Garder cette version » le modifie. Les valeurs existantes sont préservées.

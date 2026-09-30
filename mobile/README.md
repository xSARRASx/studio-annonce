# Studio Annonce mobile

Expo SDK 57, React Native et Expo Router. Cibles iOS et Android confirmées par Martin ; aperçu navigateur demandé en premier.

## Lancer
`npm ci`, puis `npm run web -- --localhost --port 8173` dans mobile.
Démarrer également le site Next.js sur 3173 pour le cadre téléphone : http://127.0.0.1:3173/mobile-preview/.
Aperçu direct : http://127.0.0.1:8173/.

## Compte connecté — 29 septembre 2026
Les écrans principaux Mes créations, Retoucher une photo et Mon compte utilisent le même serveur que le site : connexion par code email, profil prénom/nom, logements, import photo, versions, retouches et téléchargement HD. Les soldes, corrections disponibles et limites viennent du serveur ; aucun solde de démonstration n'est envoyé au compte. Les achats s'ouvrent uniquement si le serveur les déclare disponibles, via le checkout Stripe qu'il retourne.

La première génération et une correction sont incluses. Une correction supplémentaire demande une confirmation explicite à un crédit. La limite photo bloque les nouvelles créations mais laisse accessibles les HD achetées et la reprise payante autorisée par le serveur. Les aperçus non acquis portent un filigrane au premier plan, en plus du fichier d'aperçu protégé par le serveur. La photo offerte reste sans filigrane. Les vidéos restent des brouillons, sans appel à une génération inexistante.

La session native utilise SecureStore ; l'aperçu web conserve une session séparée dans sessionStorage. Les brouillons historiques restent accessibles dans `/local`, avec leur propre stockage de démonstration. Ils ne sont pas convertis en crédits réels et ne sont pas synchronisés automatiquement.

## Export connecté
Définir `EXPO_PUBLIC_API_URL` avant l'export. Valeur de production : `https://studioannonce.fr/api`. Ce paramètre public contient uniquement l'adresse du serveur, jamais une clé fournisseur.

```sh
EXPO_BASE_URL=/mobile EXPO_PUBLIC_API_URL=https://studioannonce.fr/api CI=1 npx expo export --platform web --output-dir /tmp/studio-mobile-production
```

Servir le contenu exporté sous `/mobile/`. Le cadre Next reste `/mobile-preview/` avec `NEXT_PUBLIC_MOBILE_URL=https://studioannonce.fr/mobile`. Les dépendances natives ajoutées (SecureStore et Sharing) nécessitent un build natif compatible avant installation.

## Vérifications du 29 septembre 2026
TypeScript, lint et 22 tests de logique réussis. Exports web, iOS et Android réussis ; les bundles natifs ne sont pas des binaires signés installables. Parcours navigateur à 390 × 844 vérifié avec un serveur de test isolé : connexion, bibliothèque, éditeur, confirmation d'une correction payante au plafond30, remise à zéro puis incrément du compteur, HD récupérable même au plafond et support. Aucun débordement horizontal observé. Aucun email réel, appel IA payant ni paiement effectué pendant ces contrôles.

Pas de test iPhone/Android physique effectué. Caméra, partage natif et stockage sécurisé restent à vérifier sur appareil. Icônes de lancement issues du modèle Expo restent à remplacer avant distribution. npm rapporte des vulnérabilités modérées dans les dépendances : audit à traiter avant livraison de production.

## Suite
Essai physique selon le flux Expo compatible. Aucun compte Expo/Apple/Google configuré ni publication sur les stores dans cette itération. L'activation effective de la retouche et du paiement dépend de la configuration du serveur.

## Historique du prototype local (avant connexion)
Les sections suivantes décrivent le fonctionnement de démonstration conservé dans les brouillons locaux, pas les règles du compte connecté.

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

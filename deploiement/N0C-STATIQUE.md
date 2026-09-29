# Studio Annonce sur N0C — état vérifié le 29 septembre 2026

Le site Next.js statique est servi sur `https://studioannonce.fr/`, et FastAPI par Python 3.11 / Passenger sur `/api`, dans `~/studioapi` hors de `public_html`. L'aperçu Expo est sous `/mobile/`. L'accueil donne accès au compte réel et à la démonstration. La démonstration `/demo/` et l'aperçu mobile conservent leurs données dans le navigateur ; ils ne synchronisent pas leurs projets avec le compte serveur.

## Interface du studio connecté

`/app/` réutilise maintenant les composants du studio conçu dans `/demo/` : accueil des créations, menu latéral, quatre outils de création, assistant de demande, exemples et comparaison des versions. Le logo porte verte et la favicon sont communs au site et au compte. Les pages profil, facturation et éditeur photo suivent cette même présentation claire. Les données du compte viennent de l'API, sans crédits fictifs ni copie automatique de la bibliothèque locale de démonstration.

Les photos importées et leurs versions sont enregistrées côté serveur. L'API fournit désormais une URL signée distincte pour l'original, sans dériver celle-ci de la vignette. Les brouillons des assistants image et vidéo restent locaux et sont séparés par compte ; ces outils préparent les consignes, sans moteur de génération connecté.

Recette Chrome sur le site publié : navigation entre les quatre outils, retour à Mes créations, ouverture et fermeture de l'exemple photo, pages compte et facturation, conservation du profil Martin Moré et de la photo offerte. Contrôle à 390 × 844 : menu et cartes accessibles, aucun débordement horizontal, puis retour à la taille normale. Aucun import réel, essai IA ou paiement n'a été effectué pendant cette recette d'interface. Captures conservées dans `SAAS/verification-studio-annonce/studio-connecte-accueil-20260929.png` et `studio-connecte-mobile-20260929.png`.

## Comptes et connexion

Le parcours `/connexion/` demande prénom, nom et email. Le code reçu par email valide l'adresse, puis le profil est enregistré en base. Un ancien compte incomplet doit compléter son profil avant les opérations photo. L'email est normalisé ; une reconnexion ne redonne pas l'offre gratuite. La limite porte sur le compte, pas sur une personne possédant plusieurs adresses.

La boîte `no-reply@studioannonce.fr` est créée chez N0C. SMTP authentifié avec TLS et validation de certificat fonctionne. Le test réel dans Chrome a reçu un code sur Gmail puis ouvert `/app/` ; Gmail a classé ce premier message dans le spam. Gmail affiche le domaine expéditeur et la signature `studioannonce.fr` avec TLS. Le texte du message a ensuite été enrichi avec le contexte de connexion. Cela ne prouve pas encore un meilleur classement : la délivrabilité reste à surveiller avant lancement.

Les profils restent privés ; `python -m scripts.export_comptes` permet un export CSV depuis le serveur. Ne jamais placer cet export sous `public_html`. L'inscription ne constitue pas une inscription à des emails publicitaires.

## Administration privée

L’espace `/app/admin/` reprend le studio clair existant. Le menu Administration apparaît pour le propriétaire et les administrateurs, mais la protection réelle se fait sur chaque route `/api/admin/*` avec la session et les droits enregistrés en base. Les réponses de compte et d’administration portent `Cache-Control: private, no-store`.

Le compte existant et vérifié `martinmorebkk@gmail.com` a reçu le rôle propriétaire le 29 septembre 2026. Il reste le seul propriétaire. L’activation initiale passe uniquement par le script serveur `python -m scripts.initialiser_admin --email martinmorebkk@gmail.com` ; aucune route publique ne permet cette attribution. Le script refuse de créer un compte, d’utiliser un email non validé ou de remplacer un propriétaire déjà configuré.

L’administration permet de rechercher les comptes, consulter prénom/nom/email, crédits, nombres de photos et logements, sessions et dernières connexions ; créer un compte client sans envoi d’email ; modifier son prénom et son nom ; suspendre/réactiver l’accès ; fermer les sessions ; supprimer de manière récupérable et restaurer. Une suppression conserve les données, les crédits et l’état de l’offre gratuite : ce n’est pas une purge. Une restauration rend uniquement le rôle client. La modification de l’adresse email, l’usurpation de connexion et la purge définitive ne sont pas proposées.

Seul le propriétaire peut nommer ou retirer un administrateur depuis la fiche d’un autre compte actif, au profil complet et à l’email déjà validé. Un administrateur peut gérer les clients, jamais un autre administrateur ni le propriétaire. Le propre accès de l’acteur et le propriétaire sont protégés. Les changements d’accès révoquent les sessions et les codes inutilisés. La déconnexion normale ferme également la session côté serveur. La confirmation de l’email est exigée pour la suppression et les changements de rôle dans l’interface ; une révision côté serveur refuse les actions effectuées sur une fiche périmée.

Les actions sont consignées dans `journal_admin` sans codes de connexion ni clés. Les connexions réussies sont enregistrées à partir de l’activation du suivi. Les dates anciennes peuvent être reprises des sessions existantes pour la fiche, mais ne sont pas transformées en événements historiques fictifs.

Sauvegarde préalable du code API, de la base SQLite cohérente et de l’ancien `/app/` : `~/sauvegardes-studio/administration-20260929T102549Z/`. La migration ajoute les champs de rôle/état/révision et de dates aux comptes, ainsi que les tables du journal et des connexions. Elle n’accorde aucun droit administrateur par défaut.

Validation : 53 tests API passent ensemble, puis les deux tests de migration passent après ajout du scénario des anciennes sessions (54 tests API au total). Les cas couvrent notamment les accès anonymes/clients refusés, la protection du propriétaire, la délégation, la concurrence, la révocation des sessions/codes et la conservation des données après suppression/restauration. Les mutations de recette utilisent une base isolée, sans modifier de comptes clients de production. Build web et 42 tests web réussis ; lint sans erreur (quatre avertissements `<img>` préexistants).

Recette publiée : accès propriétaire observé dans Chrome, fiche de Martin protégée, recherche répétée, filtres, liste des administrateurs, événement d’activation dans le journal, formulaire de création et menu mobile vérifiés. L’appel anonyme à `/api/admin/vue-ensemble` renvoie 401 et `Cache-Control: private, no-store` (préfixe Passenger pris en compte). Le contrôle mobile a révélé un débordement du libellé accessible du tableau ; la correction de son conteneur a été compilée et publiée, mais sa dernière vérification visuelle reste à refaire.

Blocage survenu en fin de recette le 29 septembre vers 10:32 UTC : Chrome affiche « Site dangereux » sur `https://studioannonce.fr/app/admin`, après les vérifications réussies. Aucun contournement de l’avertissement n’a été effectué. Le serveur répond toujours 200 sur `/app/admin/`, ce qui ne résout pas le signalement du navigateur. La cause et un éventuel classement Google Safe Browsing ne sont pas confirmés indépendamment ; la page du rapport de transparence n’a pas été accessible avec l’outil de recherche. Capture : `SAAS/verification-studio-annonce/avertissement-chrome-admin-20260929.png`. Ne pas présenter l’accès Chrome final comme débloqué.

## Retouche et coûts

La clé OpenAI est installée dans le `.env` privé du serveur. L'accès à la liste des modèles fonctionne, mais l'essai de génération a été refusé pour absence de crédit. `IA_ACTIVE=false` reste en vigueur. Aucun résultat IA réel n'est validé. Les visiteurs sont informés de l'indisponibilité ; les actions IA sont bloquées côté serveur.

Les réponses fournisseur alimentent un registre privé des tokens par opération et modèle, sans prompt, photo ni identité. `python -m app.couts` établit un total estimé à partir de l'usage mesuré, à rapprocher des factures fournisseur. Un usage absent ou inconnu n'est pas traité comme gratuit. Voir [les coûts et simulations](../COUTS-PHOTOS-2026-09-29.md). La vidéo IA n'a pas de moteur connecté.

## Paiement

Stripe Checkout est implémenté : packs fixés côté serveur, achat associé au compte, reprise d'une même demande sans double création et crédits accordés seulement après confirmation signée. Le serveur vérifie montant, devise, compte, mode réel/test et session. Une confirmation répétée ne crédite pas deux fois. Le retour navigateur ne prouve jamais le paiement.

Aucune clé Stripe n'est configurée et aucune session Checkout externe n'a été testée. `PAIEMENT_ACTIF=false` demeure. L'ouverture dépend aussi de l'IA disponible. Les anciens packs du prototype sont affichés comme provisoires et non achetables ; Martin doit décider les prix après mesure des coûts.

La future configuration utilise `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `URL_PUBLIQUE_SITE=https://studioannonce.fr` et l'endpoint `https://studioannonce.fr/api/paiements/webhook`. Événements traités : `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `checkout.session.async_payment_failed`. Tester d'abord Checkout en mode test avec la configuration IA de recette. Les remboursements et litiges ne déclenchent pas encore de reprise automatique des crédits : définir et implémenter ce traitement avant ouverture commerciale. Les obligations commerciales et fiscales dépendent de l'entité d'encaissement à confirmer.

## Vérifications et déploiement

Les 41 tests API passent dans un dossier de recette isolé sur le serveur. Ils couvrent le profil requis, les codes invalides et réutilisés, la normalisation de l'email, la migration des comptes existants, les montants imposés par le serveur, la signature des confirmations, les accès entre comptes, les confirmations répétées, l'accès distinct à l'original sans débit et les calculs de coût. Les tests Stripe utilisent une simulation ; ne pas les confondre avec une recette fournisseur. Le build web et 42 tests web passent. Lint : zéro erreur, quatre avertissements `<img>`. Dans Chrome, le profil Martin Moré et l'offre disponible sont conservés après rechargement de `/app/compte/`.

La correction d'interface a été déployée sans migration de données et sans suppression des fichiers du serveur. Sauvegarde de l'ancien `/app/`, de la route API photo et de la favicon sous `~/sauvegardes-studio/interface-20260929/`.

Sauvegarde avant migration : `~/sauvegardes-studio/comptes-paiements-20260929T081751Z/` contient une sauvegarde SQLite cohérente et l'ancien code API. Aucune donnée historique n'a été effacée. La migration additive peut être rejouée :

```bash
cd ~/studioapi
/home/vzbbtadpbm/virtualenv/studioapi/3.11/bin/python -m app.migrations
touch tmp/restart.txt
```

Exécuter la migration avant le redémarrage Passenger. Elle crée les tables d'achats et d'usage ainsi que les champs de profil manquants. Conserver `.env`, base, fichiers clients et sauvegardes hors de la racine publique. Ne jamais publier les clés dans l'export Next.js.

Pour reproduire le frontend :

```bash
cd web
NEXT_PUBLIC_BASE_PATH='' NEXT_PUBLIC_MOBILE_URL=/mobile NEXT_PUBLIC_API_URL=/api npm run build
```

Transférer `web/out/` dans `public_html/` en conservant `.htaccess`. L'export Expo déjà installé reste sous `/mobile/`. Les pages Expo `.html` disposent aussi d'un `index.html` par route pour les URL avec barre finale. Un ancien aperçu subsiste sous `/apercu/` avec `noindex, nofollow`.

La recette Docker/Caddy ne s'applique pas au mutualisé ; voir la [documentation Python N0C](https://kb.n0c.com/en/knowledge-base/python-application-management/). La branche de travail reste `codex-travail` ; aucun merge dans `main` n'a été effectué.

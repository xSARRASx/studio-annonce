# Studio Annonce sur N0C — état vérifié le 30 septembre 2026

Le site Next.js statique est servi sur `https://studioannonce.fr/`, et FastAPI par Python 3.11 / Passenger sur `/api`, dans `~/studioapi` hors de `public_html`. L'aperçu Expo est sous `/mobile/`, présenté dans `/mobile-preview/`. L'accueil donne accès au compte réel et à la démonstration. La démonstration `/demo/` et les anciens brouillons mobiles restent locaux. La nouvelle entrée mobile utilise le compte serveur ; les données de démonstration ne sont pas transférées en crédits réels.

## Publication du 30 septembre : tarif et notifications

Le pack confirmé est désormais **10 crédits photo pour 9,99 €**, sans abonnement. L'identifiant `photo10-999` évite de modifier le sens d'une ancienne commande. Le tarif est identique dans la page publique, le compte web, la démonstration et le compte mobile. Les achats restent indisponibles jusqu'à la validation des fournisseurs.

L'administration dispose de l'onglet Notifications. Les comptes actifs ayant atteint 30 résultats photo, ou le seuil vidéo préparé de 10, y apparaissent avec identité, compteur et explication. Les réservations en cours et les échecs ne déclenchent pas l'alerte. La liste est paginée et actualisée toutes les minutes lorsque l'écran est actif. Le mobile connecté affiche les mêmes alertes et permet le même déblocage avec confirmation de l'email. Le contrôle serveur des rôles et la journalisation s'appliquent aux deux interfaces. Un achat ou un déblocage résout l'alerte ; aucune notification push ou email d'alerte n'est envoyée.

Livraison `prix-alertes-20260930T0503Z` publiée à **05:11:28 UTC** sur le compte N0C `vzbbtadpbm`, domaine `studioannonce.fr` : 120 fichiers écrits, 196 empreintes vérifiées, 27 fichiers protégés conservés. Seuls deux fichiers API ont changé (`app/routes/admin.py` et `app/paiements.py`). Aucune migration, suppression de données ou modification du `.env`. Sauvegarde vérifiée : `~/sauvegardes-studio/prix-alertes-20260930T0503Z/fichiers-avant.tar.gz`, SHA-256 `f3e1251e3427cbb274343941709dc872b4dbee6a81ee40063701345c24119745`.

Les 54 fichiers HTML/JS/CSS modifiés ont été récupérés par HTTP et correspondent exactement à l'export. `/api/sante` répond 200 ; `/api/compte`, `/api/admin/alertes` et `/api/admin/vue-ensemble` refusent l'accès anonyme avec 401 et `private, no-store`. Le contrôle HTTP avec une session existante du propriétaire confirme le catalogue à 999 centimes, l'accès aux alertes et un administrateur actif. Aucun compte client n'a été modifié pour la recette en production.

Recette isolée : 75 tests API, 49 tests web, 22 tests de logique mobile ; exports web/mobile, TypeScript et lint réussis (quatre avertissements web `<img>` préexistants). Le déblocage depuis le mobile fait disparaître l'alerte sur le web sans changer les crédits. La page publique des tarifs et l'entrée mobile ont été observées sur le site publié. Les interactions de déblocage ont été testées sur des comptes fictifs, pas sur la production. Voir [le rapport de vérification](../VERIFICATION-PRIX-ALERTES-2026-09-30.md).

**Blocages actuels :** la clé OpenAI est reconnue, mais le solde API est à 0,00 $ et l'appel de contrôle est refusé pour `credit_balance_exhausted` / `insufficient_quota`. Aucune clé Stripe ni secret de webhook n'est configuré. `IA_ACTIVE=false` et `PAIEMENT_ACTIF=false` sont donc conservés. Il faut le budget de recharge OpenAI et le compte Stripe d'encaissement, puis une recette réelle avant ouverture. Le moteur vidéo reste hors périmètre. L'aperçu mobile publié est une application web Expo ; aucune distribution native signée n'est revendiquée.

Les sections datées du 29 septembre ci-dessous conservent l'historique ; le tarif confirmé ci-dessus remplace leurs anciens prix provisoires. Le contrôle visuel du 30 septembre dans le navigateur intégré ne constitue pas une preuve de résolution du signalement historique Chrome.

## Livraison des règles de création du 29 septembre

Les [règles détaillées](../REGLES-CREATIONS-2026-09-29.md) remplacent les anciennes limites : génération initiale et une correction incluse, puis une correction par crédit ; photo offerte propre ; aperçus non acquis protégés ; 30 créations photo et 10 créations vidéo depuis le dernier achat du type concerné, avec réservation des places en cours et contrôle serveur.

Le seuil suspend les nouvelles créations, sans retirer les fichiers acquis. L'administration dispose d'une réinitialisation des essais journalisée. Les notifications Stripe répétées, les téléchargements gratuits ou répétés et les changements d'appareil ne réinitialisent pas les compteurs. Une suspension administrative pendant une génération empêche sa finalisation et tout nouveau débit.

Support configuré dans N0C : `contact@studioannonce.fr` redirige vers `contact@guestlucky.com`, sans copie locale. Il s'agit d'une adresse de réception et de transfert, pas d'une boîte de connexion autonome. Le bouton « Contacter le support » ouvre `https://wa.me/33634972693` et le numéro affiché est `06 34 97 26 93`. La configuration du transfert a été vérifiée ; aucun email de test externe n'a été envoyé.

Validation serveur : 69 tests réussis localement et avec Python 3.11 sur l'hébergement, dans une copie isolée sans `.env` de production. Validation web : 49 tests et export de production réussis. Sauvegarde préalable du code, du site complet et de SQLite avec contrôle d'intégrité sous `~/sauvegardes-studio/regles-20260929T1140/`. Préparation sous `~/livraisons-studio/regles-20260929T1140/`.

Recette web sur données fictives : aperçu payant filigrané, comparaison découpée, offert propre, blocage au seuil de 30, téléchargement d'une photo acquise effectivement récupéré, aucun débordement à 390 px et aucune erreur navigateur. Les preuves sont dans `SAAS/verification-studio-annonce/regles-web-20260929/`. Recette Expo web à 390 px : connexion, bibliothèque, éditeur, correction supplémentaire au seuil de 30 après confirmation, solde 4 → 3 et compteur remis à 1 après réussite, téléchargement acquis toujours accessible. TypeScript, lint et 22 tests de logique mobile réussis. Aucun appel fournisseur ou paiement réel pendant ces recettes.

L'export Expo est généré avec `EXPO_PUBLIC_API_URL=https://studioannonce.fr/api EXPO_BASE_URL=/mobile npx expo export --platform web --output-dir /tmp/studio-mobile-production`. La page `/mobile-preview/` ouvre sa racine connectée, et non l'ancien atelier local. Sur Apache, chaque page exportée `route.html` est également copiée dans `route/index.html` pour les liens avec barre finale.

Publication effectuée le 29 septembre vers 11:42 UTC : API et migration additive, export Next et export Expo `/mobile/` transférés, puis Passenger redémarré. Aucun ancien fichier du site ni donnée client n'a été supprimé. La vérification HTTP authentifiée confirme les limites 30/10 et les contacts dans le vrai compte et l'administration, le refus 401 de l'administration anonyme et le maintien des réponses privées sans cache. Les lignes historiques des comptes, crédits, photos et versions sont conservées par rapport à la sauvegarde. Le service répond sain, connexion disponible, retouche et paiement toujours désactivés.

Les exports iOS et Android compilent aussi ; ce ne sont pas des binaires signés installés. Captures de recette mobile conservées dans `SAAS/verification-studio-annonce/regles-mobile-20260929/`. Les contrôles de fichiers publiés sont dans `SAAS/verification-studio-annonce/regles-production-20260929.json`.

L'onglet Chrome de production porte encore le titre « Erreur liée à la sécurité » lors de la vérification de cette livraison. Aucun avertissement n'a été contourné ; la recette visuelle utilise une copie locale avec des données fictives. Une réponse HTTP correcte ne signifie pas que le classement de sécurité Chrome est résolu.

Le module de limites vidéo est prêt et testé, mais aucun moteur de génération vidéo n'est relié. La retouche réelle et les achats restent désactivés. Les nouveaux tarifs ne sont pas fixés par cette livraison. La compilation Expo et la recette web ne prouvent pas une installation ou une recette sur iPhone/Android physique.

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

Après recharge du compte OpenAI, effectuer une première recette isolée avant de modifier `IA_ACTIVE`. La commande ci-dessous valide la source avant l'appel, refuse d'écraser une sortie existante, vérifie l'image reçue, journalise l'usage et affiche le coût estimé de cet appel. La source et la sortie doivent rester dans un dossier privé, jamais sous `public_html` :

```bash
cd ~/studioapi
mkdir -p ~/recettes-studio
/home/vzbbtadpbm/virtualenv/studioapi/3.11/bin/python -m scripts.recette_retouche_openai \
  --source ~/recettes-studio/source.jpg \
  --sortie ~/recettes-studio/resultat-apercu.jpg \
  --consigne "Nettoyer la pièce et retirer les objets personnels, sans modifier sa géométrie ni ses ouvertures."
```

Contrôler visuellement la fidélité de la pièce et rapprocher le coût affiché du tableau fournisseur. Une recette réussie n'active rien à elle seule : conserver `IA_ACTIVE=false` tant que la qualité et le coût n'ont pas été validés.

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

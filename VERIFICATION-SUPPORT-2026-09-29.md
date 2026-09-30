# Support web et mobile — 29 septembre 2026

## État actuel — publication du 30 septembre 2026

Publication effectuée à **04:16:19 UTC** après l’accord explicite de Martin « bah publier mon lapin ». Les sections suivantes conservent l’historique des contrôles locaux et des difficultés d’accès, désormais dépassées pour cette livraison.

- Destination confirmée dans le panneau et le terminal : `studioannonce.fr`, compte `vzbbtadpbm`, racine `/home/vzbbtadpbm/public_html`. Aucun accès au terminal VériFoncier.
- Livraison des interfaces web et Expo web seulement : **172 fichiers écrits**, **184 empreintes vérifiées**. Les 12 fichiers volumineux déjà identiques ont été conservés. Les fichiers d’hébergement protégés et l’API sont inchangés ; aucun fichier existant n’a été supprimé.
- Sauvegarde complète avant publication : `/home/vzbbtadpbm/sauvegardes-studio/support-20260930T040433Z/public_html.tar.gz`, SHA-256 `ee813d1890a44ca03020623e6940efa4086c82697e72a5600ea6e26c9ab96724`.
- Archive incrémentale : SHA-256 `2be6428e9df6ccf3ebc0b3e8ea57a1617a9737ffafa8c750d614a0e393b0db6f`. Le script a vérifié les chemins, le manifeste, la sauvegarde et les empreintes avant écriture, puis revérifié la livraison.
- Vérification HTTPS après publication : **51 réponses HTTP 200**, toutes identiques aux fichiers de la livraison (pages principales, scripts et styles). `/api/sante` répond 200 ; connexion disponible, retouche et paiement indisponibles. Les accès anonymes `/api/compte` et `/api/admin/vue-ensemble` répondent 401.
- Vérification dans Chrome : connexion existante de Martin reconnue, Mon compte et Administration affichés ; coordonnées WhatsApp et email correctes ; facturation sans prix provisoires ni achat actif ; compteurs photo 0/30 et vidéo 0/10 visibles. Sur `/mobile/`, formulaire de connexion chargé et panneau « Aide et contact » ouvert avec les deux coordonnées. Aucun nouveau code email, paiement, message de support ou appel de génération n’a été envoyé.
- Il s’agit de la version mobile **accessible dans le navigateur** ; cette livraison ne publie pas d’application dans les boutiques Apple ou Google.
- Google Transparence affiche désormais **« Aucune donnée disponible »** pour le domaine. Les pages contrôlées s’ouvrent dans Chrome sans alerte pendant cette recette ; cela ne confirme pas une levée officielle du signalement observé le 29 septembre.

Preuves conservées dans `/Users/more/Documents/ChatGPT/SAAS/verification-studio-annonce/` : `publication-serveur-20260930.png`, `publication-public-20260930.json`, `support-mobile-public-20260930.png`, `support-web-public-20260930.png`, `facturation-public-20260930.png`, `admin-public-20260930.png` et `google-securite-20260930.png`.

## Historique — modification locale avant publication

Le contact support est désormais disponible sans attendre le blocage des essais :

- Site : encart « Besoin d’aide ? » dans Mon compte et Facturation.
- Mobile : panneau repliable « Aide et contact » dans les écrans connectés, accessible aussi avant la connexion.
- WhatsApp : https://wa.me/33634972693, numéro affiché 06 34 97 26 93.
- Email : contact@studioannonce.fr.
- Les valeurs fournies par le compte restent prioritaires ; les coordonnées confirmées servent de repli.

Fichiers concernés : `web/components/creation-limits.tsx`, `web/components/account-page.tsx`, `mobile/src/components/ConnectedStudio.tsx`. Les nombreuses autres modifications présentes dans le dépôt précèdent cette reprise et ont été conservées.

## Vérifications effectuées

- Web : lint sans erreur (4 avertissements existants sur les images), compilation et TypeScript réussis.
- Mobile : TypeScript et lint réussis ; export Expo web réussi.
- Contrôle visuel dans le navigateur intégré, sans groupe Chrome : mobile 390 × 844, site 1366 × 900.
- Coordonnées et liens du site vérifiés dans l’interface. Ouverture et fermeture du panneau mobile vérifiées. Aucun message WhatsApp/email envoyé et aucune application externe lancée pour tester les liens.
- Connexion de test uniquement sur une API factice locale. Cette fixture, conçue pour le mobile, ne fournit pas `cree_le` pour les logements : la page d’accueil web rencontre une erreur de date avec cette fixture. La page Mon compte a été contrôlée directement ; cela ne constitue pas une nouvelle validation intégrale de l’authentification en production.
- `git diff --check` réussi.

Exports préparés avec les paramètres de production : `web/out` (API `/api`, mobile `/mobile`) et `/tmp/studio-mobile-production` (base `/mobile`, API `https://studioannonce.fr/api`). Ils n’ont pas été transférés à l’hébergeur pendant cette reprise.

Captures :

- `/Users/more/Documents/ChatGPT/SAAS/verification-studio-annonce/support-mobile-20260929.png`
- `/Users/more/Documents/ChatGPT/SAAS/verification-studio-annonce/support-web-20260929.png`

## État externe constaté pendant cette reprise

L’API publique de santé répond : connexion disponible, retouche indisponible, paiement indisponible. Aucune génération payante ni achat lancé.

Le rapport Google Safe Browsing de `studioannonce.fr` affiche « Certaines pages de ce site sont suspectes ». L’alerte navigateur n’a pas été contournée. La cause exacte, les URL concernées et une éventuelle demande de réexamen restent à traiter à partir du rapport Sécurité de Search Console et de l’inspection des fichiers publiés. Ne pas qualifier le signalement de faux positif sans ces vérifications.

Le raccourci SSH `n0c` ouvre un autre compte que Studio Annonce ; la connexion SSH explicite au compte Studio n’a pas abouti. Le panneau N0C authentifié affichait bien `vzbbtadpbm` et `studioannonce.fr`, mais aucun fichier n’y a été modifié pendant cette reprise.

## Préférence impérative

Ne plus créer de groupes d’onglets Chrome. Le nouvel onglet Terminal ajouté par l’outil a été fermé et la disparition du groupe « Studio Annonce » a été constatée. Utiliser le navigateur intégré pour les vérifications locales ; ne pas reprendre un flux Chrome qui recrée automatiquement le groupe.

## Reprise du 30 septembre 2026

État final de cette reprise : modifications locales vérifiées, archive préparée, **aucun transfert en production**.

- Les prix provisoires sont maintenant masqués dans les écrans de compte et de facturation lorsque les achats sont fermés, sur le site et dans Expo. Le parcours actif conserve les packs fournis par le serveur. La page de démonstration garde ses tarifs explicitement présentés comme exemples.
- Les contacts web ont des boutons de 44 px minimum, un focus clavier visible et une disposition verticale sur petits écrans. Le panneau mobile reste regroupé et repliable.
- Web : lint réussi avec les mêmes 4 avertissements images, TypeScript et nouvel export de production réussis après la dernière modification CSS. Mobile : typecheck, lint et export web réussis.
- Recette sur API locale factice : connexion mobile, solde, compteurs 29/30 et 0/10, absence de tarifs et d’achat, ouverture du support et coordonnées vérifiés. Facturation web : mêmes compteurs, tarifs masqués, liens WhatsApp/email et navigation clavier vérifiés. Aucun message ou paiement envoyé. La date manquante a été ajoutée à la fixture de logements.
- Capture mobile : `/Users/more/Documents/ChatGPT/SAAS/verification-studio-annonce/support-mobile-20260930.png`. La dernière retouche CSS de l’espacement web a été compilée ; la capture web précédente montre déjà les boutons et le focus.
- Archive frontend uniquement : `/Users/more/Documents/ChatGPT/SAAS/livraisons/support-20260930.tar.gz`, 184 fichiers contrôlés, SHA-256 `3c9f9309449ab1b09af2cec60e9d627fa6cde4729240eace77bc452d0ae2d5f8`. Un manifeste et les précautions de publication sont inclus. L’archive ne contient ni `.env`, ni SQLite, ni `.htaccess`, ni URL de l’API factice.

**Blocage externe actuel :** les GET HTTPS anonymes de `/` et `/api/sante` répondent tous deux HTTP 403, serveur LiteSpeed, « You don’t have permission to access this resource ». Cela remplace, pour ces contrôles précis, le statut sain observé le 29 septembre ; cela ne permet pas d’en déterminer la cause ou l’étendue. Aucun réglage du serveur n’a été modifié pendant cette reprise. Le contrôle natif de Chrome retourne une image grise et un arbre d’accessibilité figé après actualisation, remontée de fenêtre et navigation dans l’onglet N0C existant. Martin a été invité à confirmer/déverrouiller le Mac ; pas de réponse reçue au moment de ce compte rendu. Aucun groupe Chrome créé et aucun avertissement contourné.

Prochaine action : retrouver une session N0C utilisable, examiner les permissions/journaux/règles et tout statut de suspension pour expliquer le 403 ; ne pas désactiver une protection au hasard. Vérifier aussi le signalement Google. Sauvegarder puis publier les exports seulement une fois le diagnostic et l’accès rétablis.

La reprise automatique prévue le 4 octobre a été supprimée : Martin a renouvelé manuellement sa limite et demandé de reprendre dès maintenant.

### Contrôle complémentaire du 30 septembre, 03:47–03:49 UTC

Martin a réservé une fenêtre Chrome distincte au panneau Studio Annonce. Le panneau a confirmé `vzbbtadpbm`, `studioannonce.fr`, `/home/vzbbtadpbm` et `199.16.129.248`. Le lien Terminal de ce panneau ouvre bien `/terminal/vzbbtadpbm` ; aucun accès au terminal VériFoncier `/terminal/vkjtuxnp` n'a été utilisé. Aucun groupe Chrome n'a été créé.

Les nouvelles mesures nuancent le diagnostic HTTP précédent : la résolution publique renvoie `199.16.129.248`. Avec le User-Agent explicite `StudioAnnonce-status-check/1.0`, `/` et `/api/sante` répondent HTTP 200. Le service déclare `ok=true`, connexion disponible, retouche et paiement indisponibles. Sur deux requêtes rapprochées vers `/api/sante`, le User-Agent Python par défaut reçoit 403, puis le User-Agent Studio reçoit 200. Cela montre une différence de traitement selon la requête ; la règle exacte et son emplacement restent inconnus. Aucune protection n'a été désactivée. Le signalement Google est un sujet distinct et n'est pas considéré comme résolu.

Preuves JSON : `SAAS/verification-studio-annonce/etat-public-20260930-reprise.json` et `SAAS/verification-studio-annonce/requetes-public-20260930.json`. L'empreinte de l'archive de livraison a été revérifiée et reste inchangée.

Le contrôle natif parvient à ouvrir les liens et modifier l'onglet actif, mais le contenu des pages reste gris ou figé. Le terminal affiche dans l'accessibilité le titre `vzbbtadpbm@hc-dulycaringmartin-ca:~`, sans sortie de commande vérifiable. Seules des commandes de lecture et de changement de répertoire de session ont été tentées ; aucun transfert, changement de permissions, activation de service ou déploiement n'a été exécuté. L'ouverture puis l'actualisation du journal WAF n'ont pas donné de contenu lisible. Une question est en attente pour savoir si Martin voit lui aussi la fenêtre grise. La livraison reste préparée localement et non publiée.

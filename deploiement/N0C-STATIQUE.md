# Studio Annonce sur N0C — état vérifié le 29 septembre 2026

Le site Next.js statique est servi sur `https://studioannonce.fr/`, et FastAPI par Python 3.11 / Passenger sur `/api`, dans `~/studioapi` hors de `public_html`. L'aperçu Expo est sous `/mobile/`. L'accueil donne accès au compte réel et à la démonstration. La démonstration `/demo/` et l'aperçu mobile conservent leurs données dans le navigateur ; ils ne synchronisent pas leurs projets avec le compte serveur.

## Comptes et connexion

Le parcours `/connexion/` demande prénom, nom et email. Le code reçu par email valide l'adresse, puis le profil est enregistré en base. Un ancien compte incomplet doit compléter son profil avant les opérations photo. L'email est normalisé ; une reconnexion ne redonne pas l'offre gratuite. La limite porte sur le compte, pas sur une personne possédant plusieurs adresses.

La boîte `no-reply@studioannonce.fr` est créée chez N0C. SMTP authentifié avec TLS et validation de certificat fonctionne. Le test réel dans Chrome a reçu un code sur Gmail puis ouvert `/app/` ; Gmail a classé ce premier message dans le spam. Gmail affiche le domaine expéditeur et la signature `studioannonce.fr` avec TLS. Le texte du message a ensuite été enrichi avec le contexte de connexion. Cela ne prouve pas encore un meilleur classement : la délivrabilité reste à surveiller avant lancement.

Les profils restent privés ; `python -m scripts.export_comptes` permet un export CSV depuis le serveur. Ne jamais placer cet export sous `public_html`. L'inscription ne constitue pas une inscription à des emails publicitaires.

## Retouche et coûts

La clé OpenAI est installée dans le `.env` privé du serveur. L'accès à la liste des modèles fonctionne, mais l'essai de génération a été refusé pour absence de crédit. `IA_ACTIVE=false` reste en vigueur. Aucun résultat IA réel n'est validé. Les visiteurs sont informés de l'indisponibilité ; les actions IA sont bloquées côté serveur.

Les réponses fournisseur alimentent un registre privé des tokens par opération et modèle, sans prompt, photo ni identité. `python -m app.couts` établit un total estimé à partir de l'usage mesuré, à rapprocher des factures fournisseur. Un usage absent ou inconnu n'est pas traité comme gratuit. Voir [les coûts et simulations](../COUTS-PHOTOS-2026-09-29.md). La vidéo IA n'a pas de moteur connecté.

## Paiement

Stripe Checkout est implémenté : packs fixés côté serveur, achat associé au compte, reprise d'une même demande sans double création et crédits accordés seulement après confirmation signée. Le serveur vérifie montant, devise, compte, mode réel/test et session. Une confirmation répétée ne crédite pas deux fois. Le retour navigateur ne prouve jamais le paiement.

Aucune clé Stripe n'est configurée et aucune session Checkout externe n'a été testée. `PAIEMENT_ACTIF=false` demeure. L'ouverture dépend aussi de l'IA disponible. Les anciens packs du prototype sont affichés comme provisoires et non achetables ; Martin doit décider les prix après mesure des coûts.

La future configuration utilise `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `URL_PUBLIQUE_SITE=https://studioannonce.fr` et l'endpoint `https://studioannonce.fr/api/paiements/webhook`. Événements traités : `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `checkout.session.async_payment_failed`. Tester d'abord Checkout en mode test avec la configuration IA de recette. Les remboursements et litiges ne déclenchent pas encore de reprise automatique des crédits : définir et implémenter ce traitement avant ouverture commerciale. Les obligations commerciales et fiscales dépendent de l'entité d'encaissement à confirmer.

## Vérifications et déploiement

Les 40 tests API passent dans un dossier de recette isolé sur le serveur. Ils couvrent le profil requis, les codes invalides et réutilisés, la normalisation de l'email, la migration des comptes existants, les montants imposés par le serveur, la signature des confirmations, les accès entre comptes, les confirmations répétées et les calculs de coût. Les tests Stripe utilisent une simulation ; ne pas les confondre avec une recette fournisseur. Le build web et 42 tests web passent. Lint : zéro erreur, cinq avertissements `<img>` préexistants. Dans Chrome, le profil Martin Moré et l'offre disponible sont conservés après rechargement de `/app/compte/`.

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

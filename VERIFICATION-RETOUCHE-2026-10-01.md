# Retouche réelle et consignes photo — 1er octobre 2026

## État vérifié

Le serveur Studio Annonce contient la clé OpenAI, avec `FOURNISSEUR_IMAGE=openai`. Le contrôle de disponibilité de l'API OpenAI renvoie HTTP 429, code `credit_balance_exhausted`, type `insufficient_quota`, et indique qu'aucun crédit API n'est disponible. Identifiant de diagnostic : `req_d1e8d7979041496a951fbae886085deb`.

`IA_ACTIVE=false` est conservé. Aucune nouvelle image réelle n'a été produite ou validée pendant cette intervention, et aucun achat de crédits n'a été effectué. L'activation nécessite une recharge API puis la recette photo isolée documentée dans `deploiement/N0C-STATIQUE.md`, avant vérification du parcours connecté sur ordinateur et mobile.

## Règles intégrées

Le module `api/app/consignes_photo.py` est maintenant partagé par OpenAI et Gemini, pour les appels provenant du web et du mobile connecté. Il distingue :

- La mise en valeur fidèle : lumière, rangement et présentation sans remplacement spontané de la décoration.
- La rénovation virtuelle demandée : peinture, revêtements, couleurs, remplacement de quelques meubles ou de tout le mobilier.
- Les invariants : volumes, proportions, portes, fenêtres, radiateurs et équipements fixes.
- Le point de vue : conservé par défaut ; changement explicite seulement s'il reste fondé sur les références, sans inventer les zones cachées.
- La qualité photographique : matières, lumière et reflets réalistes ; pas de filigrane dans l'image générée. La protection des aperçus reste séparée.

La demande originale du client est transmise intégralement avec la reformulation : les préférences ne dépendent plus uniquement d'une synthèse en trois phrases. Les résultats restent à vérifier visuellement avec le vrai fournisseur ; les tests de code ne garantissent pas la fidélité de chaque génération.

## Abonnement ChatGPT et service du site

Documentation officielle consultée le 1er octobre 2026 :

- [Facturation ChatGPT et API](https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform) : facturations distinctes.
- [Utiliser un abonnement dans d'autres applications](https://help.openai.com/en/articles/20001542-using-your-chatgpt-plan-in-other-apps-and-sites) : option pour les applications participantes, sans accès automatique aux conversations ou souvenirs.
- [Limites de Sign in with ChatGPT](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations) : la génération d'images n'est pas prise en charge par ce parcours à cette date.
- [Intégrations commerciales](https://developers.openai.com/siwc/token-sharing-open-source) : une application payante ou hébergée à distance doit passer par la demande d'accès partenaire.

Ne pas présenter l'abonnement personnel comme une API d'images gratuite pour tous les clients. Les exemples peuvent être préparés dans la conversation, mais les générations automatiques du site restent dépendantes du fournisseur configuré.

## Vérification et publication

- 89 tests API passent localement dans un dossier temporaire sans `.env` de production.
- 11 tests de contrat fournisseur passent sur Python 3.11 dans une copie isolée du code serveur, avec fournisseurs simulés.
- Les tests vérifient notamment que les demandes complètes et les règles communes arrivent bien aux deux fournisseurs, même lorsqu'une reformulation omet des détails.
- Quatre modules API publiés après comparaison avec leurs versions Git d'origine et contrôle SHA-256. Aucune modification de base de données, de clés ou de tarifs.
- Sauvegarde serveur : `/home/vzbbtadpbm/sauvegardes-studio/consignes-photo-20261001T030112Z`.
- Redémarrage Passenger demandé ; disponibilité publique contrôlée après publication.

Le parcours `/demo/` reste une démonstration locale. Le vrai compte utilise `/connexion/` puis `/app/` sur le web, et le mode compte du mobile.
